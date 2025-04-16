import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Configurar pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configurações do Asaas
const ASAAS_API_URL = 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;

/**
 * Cria um novo link de checkout para um lead
 */
export async function createCheckoutLink(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { leadId } = req.params;
    const { 
      amount, 
      description, 
      courseId,
      expirationDays = 7,
      billingType = 'BOLETO',
      installments = 1,
      installmentValue,
      dueDate
    } = req.body;
    
    const userId = req.user?.id; // ID do usuário logado
    
    // Validações básicas
    if (!leadId || !amount || !description) {
      return res.status(400).json({ 
        error: 'ID do lead, valor e descrição são obrigatórios' 
      });
    }
    
    // Verificar se o lead existe
    const leadResult = await client.query(
      'SELECT * FROM leads WHERE id = $1',
      [leadId]
    );
    
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const lead = leadResult.rows[0];
    
    // Criar checkout link no Asaas
    try {
      // Formatar a data de vencimento para o formato esperado pelo Asaas (YYYY-MM-DD)
      let formattedDueDate = dueDate;
      if (!formattedDueDate) {
        // Se não for fornecida, usar data atual + 7 dias
        const date = new Date();
        date.setDate(date.getDate() + 7);
        formattedDueDate = date.toISOString().split('T')[0];
      }
      
      // Determinar o valor das parcelas
      const parcelValue = installmentValue || (amount / installments);
      
      // Criar o objeto de dados para o Asaas Checkout
      const checkoutData = {
        billingType,
        installments: installments > 1 ? installments : undefined,
        installmentValue: installments > 1 ? parcelValue : undefined,
        value: amount,
        dueDate: formattedDueDate,
        description,
        externalReference: `lead_${leadId}`,
        postalService: false,
        split: null
      };
      
      console.log('Enviando dados para Asaas Checkout:', JSON.stringify(checkoutData, null, 2));
      
      // Fazer requisição para API do Asaas
      const response = await axios.post(
        `${ASAAS_API_URL}/checkouts`, 
        checkoutData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        }
      );
      
      const checkoutInfo = response.data;
      console.log('Resposta do Asaas Checkout:', JSON.stringify(checkoutInfo, null, 2));
      
      // Iniciar transação para salvar na base de dados
      await client.query('BEGIN');
      
      // Salvar o link no banco de dados
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const insertResult = await client.query(`
        INSERT INTO checkout_links
        (lead_id, checkout_url, checkout_id, amount, description, course_id, status, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING id
      `, [
        leadId,
        checkoutInfo.url,
        checkoutInfo.id,
        amount,
        description,
        courseId,
        'pending',
        expiresAt.toISOString()
      ]);
      
      const checkoutLinkId = insertResult.rows[0].id;
      
      // Registrar atividade para o lead
      await client.query(`
        INSERT INTO lead_activities
        (lead_id, activity_type, description, created_at, created_by)
        VALUES ($1, $2, $3, NOW(), $4)
      `, [
        leadId,
        'checkout',
        `Link de pagamento criado: ${description} - R$ ${amount.toFixed(2)}`,
        userId
      ]);
      
      // Atualizar status do lead para 'com_checkout' se ainda estiver como 'novo'
      if (lead.status === 'new') {
        await client.query(`
          UPDATE leads
          SET status = 'with_checkout', updated_at = NOW()
          WHERE id = $1
        `, [leadId]);
      }
      
      await client.query('COMMIT');
      
      return res.status(201).json({
        success: true,
        checkoutLink: {
          id: checkoutLinkId,
          url: checkoutInfo.url,
          checkoutId: checkoutInfo.id,
          amount,
          description,
          courseId,
          status: 'pending',
          expiresAt: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        },
        message: 'Link de checkout criado com sucesso'
      });
      
    } catch (apiError: any) {
      console.error('Erro na API do Asaas:', apiError.response?.data || apiError.message);
      return res.status(500).json({ 
        error: 'Erro ao criar link de checkout no Asaas', 
        details: apiError.response?.data || apiError.message 
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar link de checkout:', error);
    return res.status(500).json({ error: 'Erro interno ao criar link de checkout' });
  } finally {
    client.release();
  }
}

/**
 * Verificar status de um link de checkout
 */
export async function checkCheckoutStatus(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { checkoutId } = req.params;
    
    // Buscar o link de checkout no banco de dados
    const checkoutResult = await client.query(`
      SELECT c.*, l.name as lead_name, l.email as lead_email
      FROM checkout_links c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.id = $1
    `, [checkoutId]);
    
    if (checkoutResult.rows.length === 0) {
      return res.status(404).json({ error: 'Link de checkout não encontrado' });
    }
    
    const checkout = checkoutResult.rows[0];
    
    // Consultar status no Asaas
    try {
      const response = await axios.get(
        `${ASAAS_API_URL}/checkouts/${checkout.checkout_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY
          }
        }
      );
      
      const asaasStatus = response.data;
      
      // Atualizar status no banco de dados se necessário
      if (asaasStatus.status !== checkout.status) {
        await client.query(`
          UPDATE checkout_links
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `, [asaasStatus.status, checkoutId]);
        
        // Se o status for 'pago', converter lead para cliente se ainda não for
        if (asaasStatus.status === 'RECEIVED' || asaasStatus.status === 'CONFIRMED') {
          // Verificar se já é cliente
          const clientCheckResult = await client.query(`
            SELECT client_id FROM leads WHERE id = $1
          `, [checkout.lead_id]);
          
          if (!clientCheckResult.rows[0].client_id) {
            // TODO: Implementar lógica de conversão para cliente
            console.log('Checkout pago! Lead deve ser convertido para cliente.');
          }
        }
      }
      
      return res.json({
        success: true,
        checkout: {
          ...checkout,
          asaasStatus: asaasStatus
        }
      });
      
    } catch (apiError: any) {
      console.error('Erro ao consultar status no Asaas:', apiError.response?.data || apiError.message);
      return res.status(500).json({ 
        error: 'Erro ao consultar status no Asaas', 
        details: apiError.response?.data || apiError.message 
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar status do checkout:', error);
    return res.status(500).json({ error: 'Erro interno ao verificar status do checkout' });
  } finally {
    client.release();
  }
}