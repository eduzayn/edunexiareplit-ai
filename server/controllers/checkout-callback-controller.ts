/**
 * Controladores para callbacks do Asaas Checkout
 * Esses endpoints são chamados após o usuário interagir com o link de checkout
 * 
 * Atualização: O módulo de leads foi removido. Este arquivo mantém algumas 
 * funcionalidades para compatibilidade com o checkout do Asaas, agora
 * operando diretamente com clientes.
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { AsaasService } from '../services/asaas-service';
import { asaasCheckoutService } from '../services/asaas-checkout-service';

/**
 * Callback de sucesso do checkout - chamado após o usuário preencher o formulário
 * Importante: Este endpoint é chamado independentemente do pagamento ter sido confirmado.
 * Ele é acionado quando o usuário preenche seus dados e finaliza o processo de checkout.
 * 
 * Atualização: O módulo de leads foi removido. Este callback agora usa apenas clientes.
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
      // Verificar se o cliente já existe com o mesmo email
      const existingClient = await db.execute(sql`
        SELECT * FROM clients WHERE email = ${asaasCheckoutStatus.customer.email}
      `);

      let clientId;

      if (!existingClient.rows.length) {
        // Criar cliente no Asaas
        let asaasCustomerId = null;
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

        // Criar cliente local
        const newClient = await db.execute(sql`
          INSERT INTO clients (
            name, email, phone, document, status, segment, 
            asaas_id, created_at
          ) VALUES (
            ${asaasCheckoutStatus.customer.name},
            ${asaasCheckoutStatus.customer.email},
            ${asaasCheckoutStatus.customer.phone || null},
            ${asaasCheckoutStatus.customer.document || null},
            ${'active'},
            ${'default'},
            ${asaasCustomerId || null},
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
            ${'new_checkout'},
            ${'Cliente criado a partir de checkout'},
            ${JSON.stringify({
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

    // Se o checkout está vinculado a um cliente, buscar e processar pagamentos
    if (checkoutData.client_id) {
      try {
        console.log(`Buscando pagamentos do checkout ${checkoutId} no Asaas...`);
        
        // Usar o serviço para buscar pagamentos associados ao checkout
        const asaasPayments = await asaasCheckoutService.getCheckoutPayments(String(checkoutId));
        
        if (asaasPayments && asaasPayments.length > 0) {
          console.log(`Encontrados ${asaasPayments.length} pagamentos para o checkout ${checkoutId}`);
          
          // Registrar pagamentos na tabela de pagamentos
          for (const payment of asaasPayments) {
            // Processar somente se tiver dados básicos
            if (payment && payment.id && payment.value) {
              // Verificar se o pagamento já existe
              const existingPayment = await db.execute(sql`
                SELECT * FROM payments WHERE asaas_id = ${payment.id}
              `);
              
              if (existingPayment.rows.length === 0) {
                // Criar uma fatura para o pagamento
                const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
                
                // Verificar se já existe uma fatura para este checkout
                const existingInvoice = await db.execute(sql`
                  SELECT * FROM invoices 
                  WHERE client_id = ${checkoutData.client_id}
                  AND description LIKE ${'%' + checkoutId + '%'}
                `);
                
                let invoiceId;
                
                if (existingInvoice.rows.length === 0) {
                  // Criar uma nova fatura
                  const invoice = await db.execute(sql`
                    INSERT INTO invoices (
                      client_id, total_amount, status, 
                      due_date, description, created_at
                    ) VALUES (
                      ${checkoutData.client_id}, 
                      ${payment.value}, 
                      ${'paid'}, 
                      ${payment.dueDate || new Date().toISOString().split('T')[0]}, 
                      ${'Fatura gerada automaticamente a partir do checkout ' + checkoutId}, 
                      NOW()
                    )
                    RETURNING *
                  `);
                  
                  invoiceId = invoice.rows[0].id;
                } else {
                  // Usar a fatura existente
                  invoiceId = existingInvoice.rows[0].id;
                }
                
                // Determinar o status do pagamento
                let paymentStatus = 'pending';
                if (['CONFIRMED', 'RECEIVED', 'PAID'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'completed';
                } else if (['OVERDUE'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'pending';
                } else if (['CANCELED', 'DECLINED', 'FAILED'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'failed';
                } else if (['REFUNDED'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'refunded';
                }
                
                // Registrar o pagamento
                await db.execute(sql`
                  INSERT INTO payments (
                    invoice_id, amount, method, payment_date, status,
                    transaction_id, notes, asaas_id, payment_url,
                    created_at
                  ) VALUES (
                    ${invoiceId},
                    ${payment.value},
                    ${'credit_card'}, 
                    ${paymentDate.toISOString()},
                    ${paymentStatus},
                    ${payment.id},
                    ${'Pagamento via Asaas Checkout'},
                    ${payment.id},
                    ${payment.invoiceUrl || null},
                    NOW()
                  )
                `);
                
                console.log(`Pagamento ${payment.id} registrado com sucesso para o cliente ${checkoutData.client_id}`);
              } else {
                // Atualizar status do pagamento existente
                let paymentStatus = 'pending';
                
                if (['CONFIRMED', 'RECEIVED', 'PAID'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'completed';
                } else if (['OVERDUE'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'pending';
                } else if (['CANCELED', 'DECLINED', 'FAILED'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'failed';
                } else if (['REFUNDED'].includes(payment.status.toUpperCase())) {
                  paymentStatus = 'refunded';
                }
                
                await db.execute(sql`
                  UPDATE payments
                  SET status = ${paymentStatus}, updated_at = NOW()
                  WHERE id = ${existingPayment.rows[0].id}
                `);
                
                console.log(`Pagamento ${payment.id} atualizado com sucesso`);
              }
            }
          }
        } else {
          console.log(`Nenhum pagamento encontrado para o checkout ${checkoutId}`);
        }
      } catch (paymentError) {
        console.error('Erro ao processar pagamentos do checkout:', paymentError);
        // Não interrompe o fluxo, apenas registra o erro
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
 * Função legado para converter leads
 * Substituída por nova abordagem direta com clientes
 * Mantida apenas para compatibilidade com endpoints existentes
 */
export async function checkAndConvertPendingLeads(req: Request, res: Response) {
  try {
    console.log('Aviso: A função de conversão de leads está desativada pois o módulo de leads foi removido.');
    
    // Responder com sucesso mas sem processamento
    return res.status(200).json({
      success: true,
      message: 'O módulo de leads foi removido. Utilize o módulo CRM para gerenciar clientes diretamente.',
      count: 0,
      leads: []
    });
    
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
        
        // MODIFICAÇÃO: Vamos converter mesmo sem customer no Asaas, usando os dados do lead
        // Se tem customer no Asaas, usamos esse dado. Caso contrário, usamos os dados do lead
        console.log(`Convertendo lead ${leadData.id} (${leadData.name}) para cliente...`);
        
        // Dados do cliente - prioriza dados do checkout, se existirem
        const customerName = asaasCheckoutStatus.customer?.name || leadData.name;
        const customerEmail = asaasCheckoutStatus.customer?.email || leadData.email;
        const customerPhone = asaasCheckoutStatus.customer?.phone || leadData.phone;
        const customerDocument = asaasCheckoutStatus.customer?.document || null;
        
        // Verificar se o cliente já existe com o mesmo email
        const existingClient = await db.execute(sql`
          SELECT * FROM clients WHERE email = ${customerEmail}
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
                name: customerName,
                email: customerEmail,
                phone: customerPhone || null,
                document: customerDocument || null,
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
              ${customerName},
              ${customerEmail},
              ${customerPhone || null},
              ${customerDocument || null},
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
          
          // Tabela client_activities não existe ainda, precisamos registrar de outra forma
          console.log(`Cliente ${clientId} criado a partir do lead ${leadData.id}`);
          
          // TODO: Criar a tabela client_activities em uma migração futura
          // por enquanto, vamos pular este registro para não gerar erros
        } else {
          // Usar cliente existente
          clientId = existingClient.rows[0].id;
          isNewClient = false;
        }
        
        // Atualizar lead para "won" (indicando conversão bem-sucedida)
        await db.execute(sql`
          UPDATE leads
          SET status = ${'won'}, converted_to_client_id = ${clientId}, updated_at = NOW()
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
        const checkoutStatus = asaasCheckoutStatus.status || 'pending';
        await db.execute(sql`
          UPDATE checkout_links
          SET 
            client_id = ${clientId},
            status = ${checkoutStatus},
            updated_at = NOW()
          WHERE id = ${leadData.checkout_id}
        `);
        
        // Buscar informações de pagamentos no Asaas
        try {
          if (leadData.asaas_checkout_id) {
            console.log(`Buscando pagamentos do checkout ${leadData.asaas_checkout_id} no Asaas...`);
            
            // Usar o serviço para buscar pagamentos associados ao checkout
            const asaasPayments = await asaasCheckoutService.getCheckoutPayments(leadData.asaas_checkout_id);
            
            if (asaasPayments && asaasPayments.length > 0) {
              console.log(`Encontrados ${asaasPayments.length} pagamentos para o checkout ${leadData.asaas_checkout_id}`);
              
              // Registrar pagamentos na tabela de pagamentos
              for (const payment of asaasPayments) {
                // Processar somente se tiver dados básicos
                if (payment && payment.id && payment.value) {
                  // Verificar se o pagamento já existe
                  const existingPayment = await db.execute(sql`
                    SELECT * FROM payments WHERE asaas_id = ${payment.id}
                  `);
                  
                  if (existingPayment.rows.length === 0) {
                    // TODO: Esta parte precisará criar uma fatura (invoice) primeiro,
                    // mas por enquanto só vamos registrar o pagamento
                    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
                    
                    // Criar uma fatura temporária para vincular o pagamento
                    const invoice = await db.execute(sql`
                      INSERT INTO invoices (
                        client_id, total_amount, status, 
                        due_date, description, created_at
                      ) VALUES (
                        ${clientId}, 
                        ${payment.value}, 
                        ${'paid'}, 
                        ${payment.dueDate || new Date().toISOString().split('T')[0]}, 
                        ${'Fatura gerada automaticamente a partir de checkout'}, 
                        NOW()
                      )
                      RETURNING *
                    `);
                    
                    const invoiceId = invoice.rows[0].id;
                    
                    // Registrar o pagamento
                    await db.execute(sql`
                      INSERT INTO payments (
                        invoice_id, amount, method, payment_date, status,
                        transaction_id, notes, asaas_id, payment_url,
                        created_at
                      ) VALUES (
                        ${invoiceId},
                        ${payment.value},
                        ${'credit_card'}, 
                        ${paymentDate.toISOString()},
                        ${payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? 'completed' : 'pending'},
                        ${payment.id},
                        ${'Pagamento do Asaas'},
                        ${payment.id},
                        ${payment.invoiceUrl || null},
                        NOW()
                      )
                    `);
                    
                    console.log(`Pagamento ${payment.id} registrado com sucesso para o cliente ${clientId}`);
                  } else {
                    console.log(`Pagamento ${payment.id} já existente no sistema`);
                  }
                }
              }
            } else {
              console.log(`Nenhum pagamento encontrado para o checkout ${leadData.asaas_checkout_id}`);
            }
          }
        } catch (paymentError) {
          console.error('Erro ao processar pagamentos do checkout:', paymentError);
          // Não interrompe o fluxo, apenas registra o erro
        }
        
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
            status: checkoutStatus
          }
        });
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