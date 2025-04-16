/**
 * Controladores para callbacks do Asaas Checkout
 * Esses endpoints são chamados após o usuário interagir com o link de checkout
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { AsaasService } from '../services/asaas-service';
import { asaasCheckoutService } from '../services/asaas-checkout-service';
import { Lead } from '../../shared/schema';

/**
 * Callback de sucesso do checkout - chamado após o usuário preencher o formulário
 * Importante: Este endpoint é chamado independentemente do pagamento ter sido confirmado.
 * Ele é acionado quando o usuário preenche seus dados e finaliza o processo de checkout.
 */
export async function checkoutSuccessCallback(req: Request, res: Response) {
  try {
    console.log('Callback de sucesso do checkout recebido:', JSON.stringify(req.body, null, 2));
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    
    // O Asaas envia o ID do link de checkout como checkoutId na query
    const { checkoutId } = req.query;
    
    if (!checkoutId) {
      return res.status(400).json({ error: 'ID do checkout não fornecido' });
    }

    // Buscar informações do checkout no banco de dados
    const checkout = await db.execute(sql`
      SELECT * FROM checkout_links WHERE asaas_checkout_id = ${String(checkoutId)}
    `);

    if (!checkout.rows.length) {
      console.error(`Checkout ${checkoutId} não encontrado no banco de dados`);
      return res.status(404).json({ error: 'Checkout não encontrado' });
    }

    const checkoutData = checkout.rows[0];
    console.log('Dados do checkout recuperados:', JSON.stringify(checkoutData, null, 2));
    
    // Buscar informações atualizadas do checkout no Asaas
    const asaasCheckoutStatus = await asaasCheckoutService.getCheckoutStatus(String(checkoutId));
    console.log('Status do checkout no Asaas:', JSON.stringify(asaasCheckoutStatus, null, 2));

    // Verificar se o checkout tem customer preenchido (significa que o form foi preenchido)
    if (asaasCheckoutStatus.customer) {
      // Buscar o lead associado a este checkout
      const lead = await db.execute(sql`
        SELECT * FROM leads WHERE id = ${checkoutData.lead_id}
      `);

      if (!lead.rows.length) {
        console.error(`Lead ${checkoutData.lead_id} não encontrado`);
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      const leadData = lead.rows[0];
      console.log('Dados do lead recuperados:', JSON.stringify(leadData, null, 2));

      // Atualizar os dados do lead com as informações do customer
      // (caso o usuário tenha modificado seus dados no form do Asaas)
      await db.execute(sql`
        UPDATE leads
        SET 
          name = ${asaasCheckoutStatus.customer.name},
          email = ${asaasCheckoutStatus.customer.email},
          phone = ${asaasCheckoutStatus.customer.phone || leadData.phone},
          document = ${asaasCheckoutStatus.customer.document || leadData.document},
          updated_at = NOW()
        WHERE id = ${leadData.id}
      `);

      // Verificar se o cliente já existe com o mesmo email
      const existingClient = await db.execute(sql`
        SELECT * FROM clients WHERE email = ${asaasCheckoutStatus.customer.email}
      `);

      let clientId;

      if (!existingClient.rows.length) {
        // Criar cliente no Asaas se não existir um ID do Asaas no lead
        let asaasCustomerId = leadData.asaas_id;
        
        if (!asaasCustomerId) {
          try {
            // Criar cliente no Asaas
            const asaasCustomer = await AsaasService.createCustomer({
              name: asaasCheckoutStatus.customer.name,
              email: asaasCheckoutStatus.customer.email,
              phone: asaasCheckoutStatus.customer.phone || null,
              document: asaasCheckoutStatus.customer.document || null,
              status: 'active',
            });
            asaasCustomerId = asaasCustomer.id;
          } catch (asaasError) {
            console.error('Erro ao criar cliente no Asaas:', asaasError);
            // Continua sem o ID do Asaas, não é crítico neste momento
          }
        }

        // Criar cliente local
        const newClient = await db.execute(sql`
          INSERT INTO clients (
            name, email, phone, document, status, segment, 
            asaas_id, created_from_lead_id, created_at
          ) VALUES (
            ${asaasCheckoutStatus.customer.name},
            ${asaasCheckoutStatus.customer.email},
            ${asaasCheckoutStatus.customer.phone || null},
            ${asaasCheckoutStatus.customer.document || null},
            ${'active'},
            ${leadData.segment || 'default'},
            ${asaasCustomerId || null},
            ${leadData.id},
            NOW()
          )
          RETURNING *
        `);

        clientId = newClient.rows[0].id;
        
        // Registrar atividade para o cliente
        await db.execute(sql`
          INSERT INTO client_activities (
            client_id, type, description, metadata, created_at
          ) VALUES (
            ${clientId},
            ${'conversion'},
            ${'Cliente criado a partir de lead'},
            ${JSON.stringify({
              leadId: leadData.id,
              checkoutId: checkoutData.id,
              asaasCheckoutId: checkoutId
            })},
            NOW()
          )
        `);
      } else {
        // Usar cliente existente
        clientId = existingClient.rows[0].id;
      }

      // Atualizar lead para "converted" se ainda não foi convertido
      if (leadData.status !== 'converted') {
        await db.execute(sql`
          UPDATE leads
          SET status = ${'converted'}, converted_to_client_id = ${clientId}, updated_at = NOW()
          WHERE id = ${leadData.id}
        `);
        
        // Registrar atividade para o lead
        await db.execute(sql`
          INSERT INTO lead_activities (
            lead_id, type, description, metadata, created_at
          ) VALUES (
            ${leadData.id},
            ${'conversion'},
            ${'Lead convertido para cliente'},
            ${JSON.stringify({
              clientId,
              checkoutId: checkoutData.id,
              asaasCheckoutId: checkoutId
            })},
            NOW()
          )
        `);
      }

      // Atualizar o checkout para vincular ao cliente
      await db.execute(sql`
        UPDATE checkout_links
        SET 
          client_id = ${clientId},
          status = ${asaasCheckoutStatus.status},
          updated_at = NOW()
        WHERE id = ${checkoutData.id}
      `);

      // Redirecionar para a página de sucesso
      return res.redirect('/sucesso');
    } else {
      // Se não tem customer, provavelmente é uma chamada direta ao endpoint
      return res.status(400).json({
        error: 'Formulário de checkout não foi preenchido',
        checkoutStatus: asaasCheckoutStatus
      });
    }
  } catch (error) {
    console.error('Erro no callback de sucesso do checkout:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar callback de sucesso',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Callback de notificação do checkout - chamado pelo Asaas para atualizar o status
 */
export async function checkoutNotificationCallback(req: Request, res: Response) {
  try {
    console.log('Notificação do checkout recebida:', JSON.stringify(req.body, null, 2));
    
    const { checkoutId, event } = req.body;
    
    if (!checkoutId) {
      return res.status(400).json({ error: 'ID do checkout não fornecido' });
    }

    // Buscar informações do checkout no banco de dados
    const checkout = await db.execute(sql`
      SELECT * FROM checkout_links WHERE asaas_checkout_id = ${String(checkoutId)}
    `);

    if (!checkout.rows.length) {
      console.error(`Checkout ${checkoutId} não encontrado no banco de dados`);
      return res.status(404).json({ error: 'Checkout não encontrado' });
    }

    const checkoutData = checkout.rows[0];
    
    // Buscar informações atualizadas do checkout no Asaas
    const asaasCheckoutStatus = await asaasCheckoutService.getCheckoutStatus(String(checkoutId));
    
    // Atualizar o status do checkout local
    await db.execute(sql`
      UPDATE checkout_links
      SET status = ${asaasCheckoutStatus.status}, updated_at = NOW()
      WHERE id = ${checkoutData.id}
    `);

    // Se o checkout está vinculado a um cliente, verificar se deve criar o pagamento
    if (checkoutData.client_id && asaasCheckoutStatus.payment) {
      // Verificar se já existe um pagamento para este checkout
      const existingPayment = await db.execute(sql`
        SELECT * FROM payments WHERE external_id = ${asaasCheckoutStatus.payment.id}
      `);

      if (!existingPayment.rows.length && ['CONFIRMED', 'RECEIVED', 'PAID'].includes(asaasCheckoutStatus.payment.status.toUpperCase())) {
        // Criar pagamento no sistema
        await db.execute(sql`
          INSERT INTO payments (
            client_id, type, status, value, payment_method,
            external_id, external_data, description, created_at
          ) VALUES (
            ${checkoutData.client_id},
            ${'payment'},
            ${'completed'},
            ${asaasCheckoutStatus.payment.value},
            ${asaasCheckoutStatus.payment.billingType},
            ${asaasCheckoutStatus.payment.id},
            ${JSON.stringify(asaasCheckoutStatus.payment)},
            ${asaasCheckoutStatus.payment.description || `Pagamento via Checkout ${checkoutId}`},
            NOW()
          )
        `);
      } else if (existingPayment.rows.length) {
        // Atualizar status do pagamento existente
        let paymentStatus = 'pending';
        
        if (['CONFIRMED', 'RECEIVED', 'PAID'].includes(asaasCheckoutStatus.payment.status.toUpperCase())) {
          paymentStatus = 'completed';
        } else if (['OVERDUE'].includes(asaasCheckoutStatus.payment.status.toUpperCase())) {
          paymentStatus = 'pending';
        } else if (['CANCELED', 'DECLINED', 'FAILED'].includes(asaasCheckoutStatus.payment.status.toUpperCase())) {
          paymentStatus = 'failed';
        } else if (['REFUNDED'].includes(asaasCheckoutStatus.payment.status.toUpperCase())) {
          paymentStatus = 'refunded';
        }
        
        await db.execute(sql`
          UPDATE payments
          SET status = ${paymentStatus}, updated_at = NOW()
          WHERE id = ${existingPayment.rows[0].id}
        `);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notificação processada com sucesso'
    });
  } catch (error) {
    console.error('Erro no callback de notificação do checkout:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar notificação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Verifica e converte leads com checkouts pendentes para clientes
 * Útil para processar leads que já preencheram o formulário do checkout mas não foram convertidos automaticamente
 */
export async function checkAndConvertPendingLeads(req: Request, res: Response) {
  try {
    console.log('Verificando leads com checkouts pendentes...');
    
    // Buscar todos os leads com checkout links associados
    const leadsWithCheckouts = await db.execute(sql`
      SELECT l.*, c.id as checkout_id, c.asaas_checkout_id, c.status as checkout_status, c.client_id
      FROM leads l
      JOIN checkout_links c ON l.id = c.lead_id
      WHERE l.status != 'converted' 
      AND c.status != 'canceled'
      AND c.client_id IS NULL
      ORDER BY l.id
    `);
    
    console.log(`Encontrados ${leadsWithCheckouts.rows.length} leads com checkouts pendentes`);
    
    if (!leadsWithCheckouts.rows.length) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum lead com checkout pendente encontrado',
        count: 0,
        leads: []
      });
    }
    
    // Armazenar os resultados das conversões
    const conversionResults = [];
    
    // Processar cada lead
    for (const leadData of leadsWithCheckouts.rows) {
      try {
        console.log(`Processando lead ${leadData.id} (${leadData.name}) com checkout ${leadData.asaas_checkout_id}...`);
        
        // Verificar o status do checkout no Asaas
        const asaasCheckoutStatus = await asaasCheckoutService.getCheckoutStatus(String(leadData.asaas_checkout_id));
        
        // Se o checkout tem customer, significa que o formulário foi preenchido
        if (asaasCheckoutStatus.customer) {
          console.log(`Checkout ${leadData.asaas_checkout_id} tem dados de cliente preenchidos, convertendo lead...`);
          
          // Verificar se o cliente já existe com o mesmo email
          const existingClient = await db.execute(sql`
            SELECT * FROM clients WHERE email = ${asaasCheckoutStatus.customer.email}
          `);
          
          let clientId;
          let isNewClient = false;
          
          if (!existingClient.rows.length) {
            // Criar cliente no Asaas se não existir um ID do Asaas no lead
            let asaasCustomerId = leadData.asaas_id;
            
            if (!asaasCustomerId) {
              try {
                // Criar cliente no Asaas
                const asaasCustomer = await AsaasService.createCustomer({
                  name: asaasCheckoutStatus.customer.name,
                  email: asaasCheckoutStatus.customer.email,
                  phone: asaasCheckoutStatus.customer.phone || null,
                  document: asaasCheckoutStatus.customer.document || null,
                  status: 'active',
                });
                asaasCustomerId = asaasCustomer.id;
              } catch (asaasError) {
                console.error('Erro ao criar cliente no Asaas:', asaasError);
                // Continua sem o ID do Asaas, não é crítico neste momento
              }
            }
            
            // Criar cliente local
            const newClient = await db.execute(sql`
              INSERT INTO clients (
                name, email, phone, document, status, segment, 
                asaas_id, created_from_lead_id, created_at
              ) VALUES (
                ${asaasCheckoutStatus.customer.name},
                ${asaasCheckoutStatus.customer.email},
                ${asaasCheckoutStatus.customer.phone || null},
                ${asaasCheckoutStatus.customer.document || null},
                ${'active'},
                ${leadData.segment || 'default'},
                ${asaasCustomerId || null},
                ${leadData.id},
                NOW()
              )
              RETURNING *
            `);
            
            clientId = newClient.rows[0].id;
            isNewClient = true;
            
            // Registrar atividade para o cliente
            await db.execute(sql`
              INSERT INTO client_activities (
                client_id, type, description, metadata, created_at
              ) VALUES (
                ${clientId},
                ${'conversion'},
                ${'Cliente criado a partir de lead'},
                ${JSON.stringify({
                  leadId: leadData.id,
                  checkoutId: leadData.checkout_id,
                  asaasCheckoutId: leadData.asaas_checkout_id,
                  manual: true
                })},
                NOW()
              )
            `);
          } else {
            // Usar cliente existente
            clientId = existingClient.rows[0].id;
            isNewClient = false;
          }
          
          // Atualizar lead para "converted"
          await db.execute(sql`
            UPDATE leads
            SET status = ${'converted'}, converted_to_client_id = ${clientId}, updated_at = NOW()
            WHERE id = ${leadData.id}
          `);
          
          // Registrar atividade para o lead
          await db.execute(sql`
            INSERT INTO lead_activities (
              lead_id, type, description, metadata, created_at
            ) VALUES (
              ${leadData.id},
              ${'conversion'},
              ${'Lead convertido para cliente (manual)'},
              ${JSON.stringify({
                clientId,
                checkoutId: leadData.checkout_id,
                asaasCheckoutId: leadData.asaas_checkout_id,
                isNewClient
              })},
              NOW()
            )
          `);
          
          // Atualizar o checkout para vincular ao cliente
          await db.execute(sql`
            UPDATE checkout_links
            SET 
              client_id = ${clientId},
              status = ${asaasCheckoutStatus.status},
              updated_at = NOW()
            WHERE id = ${leadData.checkout_id}
          `);
          
          // Adicionar ao resultado
          conversionResults.push({
            leadId: leadData.id,
            leadName: leadData.name,
            leadEmail: leadData.email,
            clientId,
            isNewClient,
            checkout: {
              id: leadData.checkout_id,
              asaasId: leadData.asaas_checkout_id,
              status: asaasCheckoutStatus.status
            }
          });
        } else {
          console.log(`Checkout ${leadData.asaas_checkout_id} não tem dados de cliente preenchidos, ignorando...`);
        }
      } catch (leadError) {
        console.error(`Erro ao processar lead ${leadData.id}:`, leadError);
        // Continua para o próximo lead
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${conversionResults.length} leads convertidos para clientes`,
      count: conversionResults.length,
      conversions: conversionResults
    });
  } catch (error) {
    console.error('Erro ao verificar leads pendentes:', error);
    return res.status(500).json({ 
      error: 'Erro ao verificar leads pendentes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}