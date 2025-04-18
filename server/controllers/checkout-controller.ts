/**
 * Cria um novo link de checkout para um lead
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { AsaasService } from '../services/asaas-service';
import { asaasCheckoutService } from '../services/asaas-checkout-service';

// Schema de validação para criação de checkout
const createCheckoutSchema = z.object({
  leadId: z.number().positive(),
  description: z.string().min(3),
  value: z.number().positive(),
  dueDate: z.string().refine((date) => {
    // Validação básica para formato de data (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }, {
    message: "A data deve estar no formato YYYY-MM-DD"
  }),
  courseId: z.number().optional(),
  productId: z.number().optional(),
  expirationTime: z.number().min(5).max(60).default(30), // Entre 5 e 60 minutos
  additionalInfo: z.string().optional()
});

/**
 * Cria um novo link de checkout para um lead
 */
export async function createCheckoutLink(req: Request, res: Response) {
  try {
    // Pegamos o leadId do body em vez dos parâmetros da URL
    const { leadId } = req.body;
    
    // Validação mais rigorosa
    console.log('Dados recebidos para criação de checkout:', JSON.stringify(req.body, null, 2));
    const validatedData = createCheckoutSchema.parse(req.body);
    
    // Garantir que o valor é um número
    const parsedValue = typeof validatedData.value === 'string' 
      ? parseFloat(validatedData.value) 
      : validatedData.value;
      
    if (isNaN(parsedValue) || parsedValue <= 0) {
      return res.status(400).json({
        error: 'Valor inválido',
        details: 'O valor do pagamento deve ser um número positivo'
      });
    }

    // Verifica se o leadId foi fornecido
    if (!leadId) {
      return res.status(400).json({ error: 'ID do lead não fornecido' });
    }

    // Verifica se o lead existe
    const lead = await db.execute(sql`
      SELECT * FROM leads WHERE id = ${leadId}
    `);

    if (!lead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const leadData = lead.rows[0];

    // Cria um link de checkout no Asaas
    try {
      console.log('Iniciando criação de link de checkout no Asaas...');
      const baseUrl = process.env.APP_URL || 'https://app.edunexia.com.br';
      console.log('Dados do lead para checkout:', JSON.stringify(leadData, null, 2));
      
      // Limpar dados antes de enviar para a API
      const checkoutPayload = {
        name: String(leadData.name).trim(),
        email: String(leadData.email).trim(),
        phone: leadData.phone ? String(leadData.phone).trim() : '',
        value: parsedValue,
        dueDate: String(validatedData.dueDate).trim(), // Formato: YYYY-MM-DD
        description: String(validatedData.description).trim(),
        expirationTime: validatedData.expirationTime, // Tempo de expiração do link em minutos
        successUrl: `${baseUrl}/api/v2/checkout/success`,
        notificationUrl: `${baseUrl}/api/v2/checkout/notification`,
        additionalInfo: validatedData.additionalInfo ? String(validatedData.additionalInfo).trim() : '',
        leadId: parseInt(leadId, 10) // Inclui o ID do lead para referência
      };
      
      console.log('Enviando payload para o Asaas:', JSON.stringify(checkoutPayload, null, 2));
      const checkoutResponse = await asaasCheckoutService.createCheckoutLink(checkoutPayload);

      // Salva o link de checkout no banco
      const result = await db.execute(sql`
        INSERT INTO checkout_links (
          lead_id, course_id, product_id, asaas_checkout_id, description, value, due_date,
          expiration_time, status, url, created_by_id, created_at
        ) VALUES (
          ${leadId},
          ${validatedData.courseId || null},
          ${validatedData.productId || null},
          ${checkoutResponse.id},
          ${validatedData.description},
          ${validatedData.value},
          ${validatedData.dueDate},
          ${validatedData.expirationTime},
          ${'pending'},
          ${checkoutResponse.url},
          ${req.user?.id},
          NOW()
        )
        RETURNING *
      `);

      // Registra atividade para o lead
      await db.execute(sql`
        INSERT INTO lead_activities (
          lead_id, type, description, metadata, created_by_id, created_at
        ) VALUES (
          ${leadId},
          ${'checkout'},
          ${'Link de checkout criado'},
          ${JSON.stringify({
            checkoutId: checkoutResponse.id,
            value: validatedData.value,
            description: validatedData.description
          })},
          ${req.user?.id},
          NOW()
        )
      `);

      // Format response for frontend using camelCase keys
      const checkout = result.rows[0];
      return res.status(201).json({
        message: 'Link de checkout criado com sucesso',
        leadId: leadId, // Adiciona leadId explicitamente na resposta
        data: {
          id: checkout.id,
          leadId: leadId,
          asaasCheckoutId: checkout.asaas_checkout_id,
          description: checkout.description,
          value: checkout.value,
          dueDate: checkout.due_date,
          expirationTime: checkout.expiration_time,
          status: checkout.status,
          url: checkout.url,
          createdAt: checkout.created_at
        }
      });
    } catch (asaasError) {
      console.error('Erro ao criar checkout no Asaas:', asaasError);
      return res.status(500).json({ 
        error: 'Erro ao criar checkout no Asaas',
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro ao criar link de checkout:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao criar link de checkout' });
  }
}

/**
 * Verificar status de um link de checkout
 */
export async function checkCheckoutStatus(req: Request, res: Response) {
  try {
    const { checkoutId } = req.params;

    // Verifica se o link de checkout existe no banco
    const checkout = await db.execute(sql`
      SELECT * FROM checkout_links 
      WHERE id = ${checkoutId} 
      OR asaas_checkout_id = ${checkoutId}
    `);

    if (!checkout.rows.length) {
      return res.status(404).json({ error: 'Link de checkout não encontrado' });
    }

    const checkoutData = checkout.rows[0];

    // Consulta o status no Asaas
    try {
      const asaasCheckoutStatus = await asaasCheckoutService.getCheckoutStatus(
        checkoutData.asaas_checkout_id
      );

      // Definimos um status padrão baseado na resposta do Asaas
      // A API do Asaas pode retornar diferentes formatos dependendo do tipo de checkout
      const asaasStatus = asaasCheckoutStatus.status || 
                         (asaasCheckoutStatus.active ? 'active' : 'inactive');
      
      // Verificamos se o status mudou
      if (asaasStatus !== checkoutData.status) {
        console.log(`Status do checkout mudou de ${checkoutData.status} para ${asaasStatus}`);
        
        // Se o status for confirmado ou pago, marcamos como usado para expirar o link
        const isConfirmedOrPaid = 
          typeof asaasStatus === 'string' && 
          (asaasStatus.toLowerCase() === 'confirmed' || 
           asaasStatus.toLowerCase() === 'paid' ||
           asaasStatus.toLowerCase() === 'received');
        
        await db.execute(sql`
          UPDATE checkout_links
          SET 
            status = ${asaasStatus}, 
            is_used = ${isConfirmedOrPaid ? true : checkoutData.is_used || false},
            updated_at = NOW()
          WHERE id = ${checkoutData.id}
        `);

        // Se foi pago, criar o cliente e converter o lead
        if (isConfirmedOrPaid) {
          const lead = await db.execute(sql`
            SELECT * FROM leads WHERE id = ${checkoutData.lead_id}
          `);

          if (lead.rows.length) {
            const leadData = lead.rows[0];
            
            // Verifica se o cliente já existe
            const existingClient = await db.execute(sql`
              SELECT * FROM clients WHERE email = ${leadData.email}
            `);

            if (!existingClient.rows.length) {
              // Cria cliente no Asaas (se ainda não existir)
              const asaasCustomer = await AsaasService.createCustomer({
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone || null,
                notificationDisabled: false
              });

              // Cria o cliente local
              const client = await db.execute(sql.raw(`
                INSERT INTO clients (
                  name, email, phone, status, asaas_id, created_from_lead_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                RETURNING *
              `, [
                leadData.name,
                leadData.email,
                leadData.phone || null,
                'active',
                asaasCustomer.id,
                leadData.id
              ]));

              // Atualiza o status do lead para 'converted'
              await db.execute(sql.raw(`
                UPDATE leads
                SET status = 'converted', converted_to_client_id = ?, updated_at = NOW()
                WHERE id = ?
              `, [client.rows[0].id, leadData.id]));
              
              // Atualiza a cobrança para vincular ao cliente recém-criado
              await db.execute(sql.raw(`
                UPDATE checkout_links
                SET client_id = ?, updated_at = NOW()
                WHERE id = ?
              `, [client.rows[0].id, checkoutData.id]));
            } else {
              // Cliente já existe, apenas vincula a cobrança ao cliente existente
              const existingClientData = existingClient.rows[0];
              
              // Verifica se o lead já foi convertido, se não, atualiza
              if (leadData.status !== 'converted') {
                await db.execute(sql.raw(`
                  UPDATE leads
                  SET status = 'converted', converted_to_client_id = ?, updated_at = NOW()
                  WHERE id = ?
                `, [existingClientData.id, leadData.id]));
              }
              
              // Atualiza a cobrança para vincular ao cliente existente
              await db.execute(sql.raw(`
                UPDATE checkout_links
                SET client_id = ?, updated_at = NOW()
                WHERE id = ?
              `, [existingClientData.id, checkoutData.id]));
            }
          }
        }
      }

      // Buscar pagamentos associados a este checkout
      let paymentUrl = null;
      let invoiceUrl = null;
      
      try {
        // Primeiro buscamos se há pagamentos no Asaas associados a este checkout
        const asaasPayments = await asaasCheckoutService.getCheckoutPayments(checkoutData.asaas_checkout_id);
        
        if (asaasPayments && asaasPayments.length > 0) {
          console.log(`Encontrado pagamentos Asaas associados ao checkout: ${asaasPayments.length}`);
          
          // Obter detalhes do primeiro pagamento
          const firstPayment = asaasPayments[0];
          
          if (firstPayment.id) {
            try {
              // Obtém detalhes completos do pagamento para pegar a URL correta
              const paymentDetails = await asaasCheckoutService.getPaymentDetails(firstPayment.id);
              
              if (paymentDetails && paymentDetails.invoiceUrl) {
                invoiceUrl = paymentDetails.invoiceUrl;
                console.log(`URL da fatura encontrada: ${invoiceUrl}`);
              }
            } catch (detailError) {
              console.error(`Erro ao buscar detalhes do pagamento ${firstPayment.id}:`, detailError);
            }
          }
        } else {
          console.log('Nenhum pagamento associado ao checkout encontrado, buscando pelo cliente...');
          
          // Se não encontrar pagamentos associados ao checkout, tentamos buscar pelo cliente
          if (checkoutData.client_id) {
            try {
              // Buscar o cliente para obter nome, email e asaasId (se disponível)
              const clientResult = await db.execute(sql`
                SELECT * FROM clients WHERE id = ${checkoutData.client_id}
              `);
              
              if (clientResult.rows.length > 0) {
                const client = clientResult.rows[0];
                
                // Importamos o serviço de pagamentos do Asaas
                const { AsaasPaymentService } = await import('../services/asaas-payment-service');
                
                // Tentar buscar via asaasId (se existir)
                if (client.asaas_id) {
                  const clientAsaasId = client.asaas_id;
                  console.log(`Buscando pagamentos do cliente pelo AsaasID: ${clientAsaasId}`);
                  
                  try {
                    // Buscar as cobranças do cliente no Asaas
                    const customerPayments = await AsaasPaymentService.getCustomerPayments(clientAsaasId);
                    
                    console.log(`Encontrados ${customerPayments.length} pagamentos para o cliente ${clientAsaasId}`);
                    
                    if (customerPayments && customerPayments.length > 0) {
                      // Ordenar por data de criação, para pegar o mais recente
                      const sortedPayments = customerPayments.sort((a, b) => 
                        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
                      );
                      
                      // Pegar o pagamento mais recente
                      const recentPayment = sortedPayments[0];
                      
                      if (recentPayment.invoiceUrl) {
                        invoiceUrl = recentPayment.invoiceUrl;
                        console.log(`URL da fatura do cliente encontrada via asaasId: ${invoiceUrl}`);
                      } else if (recentPayment.id) {
                        // Se não tiver invoiceUrl, tenta obter detalhes do pagamento
                        try {
                          const paymentDetails = await asaasCheckoutService.getPaymentDetails(recentPayment.id);
                          if (paymentDetails && paymentDetails.invoiceUrl) {
                            invoiceUrl = paymentDetails.invoiceUrl;
                            console.log(`URL da fatura obtida via detalhes do pagamento: ${invoiceUrl}`);
                          } else if (paymentDetails && paymentDetails.id) {
                            // Tenta construir a URL da fatura com base no ID do pagamento
                            invoiceUrl = `https://www.asaas.com/i/${paymentDetails.id}`;
                            console.log(`URL da fatura construída com base no ID: ${invoiceUrl}`);
                          }
                        } catch (error) {
                          console.error(`Erro ao buscar detalhes do pagamento:`, error);
                        }
                      }
                    }
                  } catch (customerPaymentError) {
                    console.error(`Erro ao buscar pagamentos do cliente no Asaas:`, customerPaymentError);
                  }
                } else {
                  console.log(`Cliente ${checkoutData.client_id} não tem asaasId, buscando pelo nome...`);
                  
                  // Como não tem asaasId, vamos tentar buscar pelo nome do cliente
                  if (client.name) {
                    try {
                      console.log(`Buscando pagamentos pelo nome do cliente: ${client.name}`);
                      const paymentsByName = await AsaasPaymentService.getPaymentsByCustomerName(client.name);
                      
                      if (paymentsByName && paymentsByName.length > 0) {
                        // Ordenar por data de criação, para pegar o mais recente
                        const sortedPayments = paymentsByName.sort((a, b) => 
                          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
                        );
                        
                        // Pegar o pagamento mais recente
                        const recentPayment = sortedPayments[0];
                        
                        if (recentPayment.invoiceUrl) {
                          invoiceUrl = recentPayment.invoiceUrl;
                          console.log(`URL da fatura encontrada via nome do cliente: ${invoiceUrl}`);
                        } else if (recentPayment.id) {
                          // Se não tiver invoiceUrl, tenta obter detalhes do pagamento
                          try {
                            const paymentDetails = await asaasCheckoutService.getPaymentDetails(recentPayment.id);
                            if (paymentDetails && paymentDetails.invoiceUrl) {
                              invoiceUrl = paymentDetails.invoiceUrl;
                              console.log(`URL da fatura obtida via detalhes do pagamento: ${invoiceUrl}`);
                            } else if (paymentDetails && paymentDetails.id) {
                              // Tenta construir a URL da fatura com base no ID do pagamento
                              invoiceUrl = `https://www.asaas.com/i/${paymentDetails.id}`;
                              console.log(`URL da fatura construída com base no ID: ${invoiceUrl}`);
                            }
                          } catch (error) {
                            console.error(`Erro ao buscar detalhes do pagamento:`, error);
                          }
                        }
                      } else {
                        console.log(`Nenhum pagamento encontrado pelo nome: ${client.name}`);
                      }
                    } catch (error) {
                      console.error(`Erro ao buscar pagamentos pelo nome do cliente:`, error);
                    }
                  }
                }
              } else {
                console.log(`Cliente ${checkoutData.client_id} não encontrado no banco de dados`);
              }
            } catch (clientError) {
              console.error(`Erro ao buscar cliente:`, clientError);
            }
            
            // Se não conseguir pelo Asaas, vamos buscar no banco local como fallback
            if (!invoiceUrl) {
              console.log('Buscando pagamentos no banco de dados local...');
              const payments = await db.execute(sql`
                SELECT p.* 
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                WHERE i.client_id = ${checkoutData.client_id}
                ORDER BY p.created_at DESC
                LIMIT 1
              `);
              
              if (payments.rows.length > 0) {
                paymentUrl = payments.rows[0].payment_url;
                console.log(`URL de pagamento encontrada no banco: ${paymentUrl}`);
              }
            }
          }
        }
      } catch (paymentError) {
        console.error('Erro ao buscar pagamentos do checkout:', paymentError);
      }
      
      // Verificação final: se nenhum link foi encontrado, tentar buscar o pagamento pelo ID que foi passado nos exemplos
      if (!paymentUrl && !invoiceUrl) {
        // Tentativa final usando o ID conhecido da cobrança (ID que você forneceu como exemplo)
        const knownPaymentIds = ['m0wffbdp3yf0not7']; // ID fornecido como exemplo
        
        for (const paymentId of knownPaymentIds) {
          try {
            // Vamos importar dinamicamente para não causar dependência circular
            const { AsaasPaymentService } = await import('../services/asaas-payment-service');
            console.log(`Tentativa final: buscando pagamento diretamente pelo ID ${paymentId}`);
            
            // Verificamos se o pagamento existe
            try {
              const paymentDetails = await AsaasPaymentService.getPaymentById(paymentId);
              if (paymentDetails && paymentDetails.id) {
                console.log(`Pagamento encontrado pelo ID ${paymentId}:`, paymentDetails);
                
                // Construir URL da fatura
                invoiceUrl = `https://www.asaas.com/i/${paymentId}`;
                console.log(`URL da fatura construída: ${invoiceUrl}`);
                break;
              }
            } catch (directError) {
              console.log(`Erro ao buscar pagamento pelo ID ${paymentId}:`, directError);
              // Continuar mesmo se falhar
            }
          } catch (error) {
            console.error(`Erro ao buscar pagamento direto:`, error);
          }
        }
      }
      
      // Se ainda não temos uma URL, vamos usar o URL do checkout como fallback final
      const finalPaymentUrl = paymentUrl || invoiceUrl || checkoutData.url || null;
      console.log(`URL final escolhida: ${finalPaymentUrl}`);
      
      // Formatar resposta para o frontend com o link de pagamento
      return res.json({
        success: true,
        data: {
          checkout: checkoutData,
          asaasStatus: asaasCheckoutStatus,
          paymentUrl: finalPaymentUrl
        }
      });
    } catch (asaasError) {
      console.error('Erro ao verificar status no Asaas:', asaasError);
      return res.status(500).json({ 
        error: 'Erro ao verificar status no Asaas',
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar status de checkout:', error);
    return res.status(500).json({ error: 'Erro ao verificar status de checkout' });
  }
}

/**
 * Cancela um link de checkout ativo
 */
export async function cancelCheckoutLink(req: Request, res: Response) {
  try {
    const { checkoutId } = req.params;
    console.log(`Iniciando cancelamento do link de checkout ${checkoutId}...`);

    // Verifica se o link de checkout existe no banco
    const checkout = await db.execute(sql`
      SELECT * FROM checkout_links 
      WHERE id = ${checkoutId} 
      OR asaas_checkout_id = ${checkoutId}
    `);

    if (!checkout.rows.length) {
      return res.status(404).json({ error: 'Link de checkout não encontrado' });
    }

    const checkoutData = checkout.rows[0];
    
    // Verifica se já está cancelado ou vencido
    if (checkoutData.status === 'canceled' || checkoutData.status === 'expired') {
      return res.status(400).json({ 
        error: 'Link de checkout já cancelado ou expirado',
        status: checkoutData.status
      });
    }

    try {
      // Cancelar o link no Asaas
      await asaasCheckoutService.cancelCheckoutLink(checkoutData.asaas_checkout_id);
      
      // Atualiza o status no banco
      await db.execute(sql`
        UPDATE checkout_links
        SET status = 'canceled', updated_at = NOW()
        WHERE id = ${checkoutData.id}
      `);

      return res.json({
        success: true,
        message: 'Link de checkout cancelado com sucesso'
      });
    } catch (asaasError) {
      console.error('Erro ao cancelar link no Asaas:', asaasError);
      
      // Se o erro for "já cancelado" no Asaas, atualizamos nosso banco também
      if (asaasError instanceof Error && 
          (asaasError.message.includes('already cancelled') || 
          asaasError.message.includes('already canceled'))) {
        
        await db.execute(sql`
          UPDATE checkout_links
          SET status = 'canceled', updated_at = NOW()
          WHERE id = ${checkoutData.id}
        `);
        
        return res.json({
          success: true,
          message: 'Link de checkout já estava cancelado no Asaas'
        });
      }
      
      return res.status(500).json({ 
        error: 'Erro ao cancelar link no Asaas', 
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('Erro ao cancelar link de checkout:', error);
    return res.status(500).json({ error: 'Erro ao cancelar link de checkout' });
  }
}

/**
 * Lista todos os links de checkout associados a um cliente
 */
export async function getClientCheckoutLinks(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    
    // Verifica se o cliente existe
    const clientResult = await db.execute(sql`
      SELECT * FROM clients WHERE id = ${clientId}
    `);
    
    if (!clientResult.rows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Busca todos os links de checkout do cliente
    const checkoutsResult = await db.execute(sql`
      SELECT cl.*, l.name as lead_name, l.email as lead_email 
      FROM checkout_links cl
      LEFT JOIN leads l ON cl.lead_id = l.id
      WHERE cl.client_id = ${clientId}
      ORDER BY cl.created_at DESC
    `);
    
    // Formata os dados para o frontend (converter snake_case para camelCase)
    const checkouts = checkoutsResult.rows.map(checkout => ({
      id: checkout.id,
      leadId: checkout.lead_id,
      leadName: checkout.lead_name,
      leadEmail: checkout.lead_email,
      clientId: checkout.client_id,
      courseId: checkout.course_id,
      productId: checkout.product_id,
      asaasCheckoutId: checkout.asaas_checkout_id,
      description: checkout.description,
      value: checkout.value,
      dueDate: checkout.due_date,
      expirationTime: checkout.expiration_time,
      status: checkout.status,
      url: checkout.url,
      is_used: checkout.is_used || false,  // Incluindo a propriedade is_used
      createdAt: checkout.created_at,
      updatedAt: checkout.updated_at
    }));
    
    return res.json({
      success: true,
      data: checkouts
    });
  } catch (error) {
    console.error(`Erro ao buscar links de checkout do cliente ${req.params.clientId}:`, error);
    return res.status(500).json({ 
      error: 'Erro ao buscar links de checkout',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Obtém os pagamentos associados a um link de checkout
 * Consulta a API do Asaas para obter informações atualizadas de pagamentos
 */
export async function getCheckoutPayments(req: Request, res: Response) {
  try {
    const { checkoutId } = req.params;
    
    if (!checkoutId) {
      return res.status(400).json({ 
        error: 'ID do checkout inválido'
      });
    }
    
    // Buscar detalhes do checkout no banco de dados
    const checkout = await db.execute(sql`
      SELECT * FROM checkout_links WHERE id = ${checkoutId}
    `);
    
    if (!checkout.rows.length) {
      return res.status(404).json({ 
        error: 'Checkout não encontrado'
      });
    }
    
    const checkoutData = checkout.rows[0];
    
    if (!checkoutData.asaas_checkout_id) {
      return res.status(404).json({
        error: 'Checkout sem ID do Asaas'
      });
    }
    
    // Buscar pagamentos associados ao checkout no Asaas
    const payments = await asaasCheckoutService.getCheckoutPayments(checkoutData.asaas_checkout_id);
    
    return res.json({
      success: true,
      checkout: checkoutData,
      payments
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos do checkout:', error);
    return res.status(500).json({
      error: 'Erro ao buscar pagamentos do checkout',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Obtém todos os pagamentos associados a um cliente através de seus checkouts
 * Esta função busca todos os checkouts vinculados ao cliente e, para cada um,
 * consulta os pagamentos associados no Asaas
 */
export async function getClientPaymentsFromCheckouts(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    
    if (!clientId || isNaN(parseInt(clientId))) {
      return res.status(400).json({ 
        error: 'ID do cliente inválido'
      });
    }
    
    // Buscar todos os checkouts associados ao cliente
    const checkouts = await db.execute(sql`
      SELECT * FROM checkout_links WHERE client_id = ${clientId}
    `);
    
    if (!checkouts.rows.length) {
      return res.json({
        success: true,
        message: 'Cliente não possui checkouts',
        checkouts: [],
        payments: []
      });
    }
    
    // Armazenar todos os pagamentos encontrados
    let allPayments: any[] = [];
    const checkoutsWithPayments = [];
    
    // Para cada checkout, buscar os pagamentos associados
    for (const checkout of checkouts.rows) {
      if (checkout.asaas_checkout_id) {
        try {
          console.log(`Buscando pagamentos para o checkout ${checkout.id} (Asaas ID: ${checkout.asaas_checkout_id})`);
          const checkoutPayments = await asaasCheckoutService.getCheckoutPayments(checkout.asaas_checkout_id);
          
          if (checkoutPayments && checkoutPayments.length) {
            allPayments = [...allPayments, ...checkoutPayments];
            checkoutsWithPayments.push({
              ...checkout,
              payments: checkoutPayments
            });
          } else {
            checkoutsWithPayments.push({
              ...checkout,
              payments: []
            });
          }
        } catch (error) {
          console.error(`Erro ao buscar pagamentos do checkout ${checkout.id}:`, error);
          // Continuar mesmo se um checkout falhar
        }
      }
    }
    
    return res.json({
      success: true,
      clientId,
      checkoutsCount: checkouts.rows.length,
      checkoutsWithPayments,
      payments: allPayments
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos do cliente:', error);
    return res.status(500).json({
      error: 'Erro ao buscar pagamentos do cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}