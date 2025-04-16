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
    const { leadId } = req.params;
    const validatedData = createCheckoutSchema.parse(req.body);

    // Verifica se o lead existe
    const lead = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ?`,
      [leadId]
    ));

    if (!lead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const leadData = lead.rows[0];

    // Cria um link de checkout no Asaas
    try {
      console.log('Iniciando criação de link de checkout no Asaas...');
      const baseUrl = process.env.APP_URL || 'https://app.edunexia.com.br';
      console.log('Dados do lead para checkout:', JSON.stringify(leadData, null, 2));
      const checkoutResponse = await asaasCheckoutService.createCheckoutLink({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || '',
        value: validatedData.value,
        dueDate: validatedData.dueDate, // Formato: YYYY-MM-DD
        description: validatedData.description,
        expirationTime: validatedData.expirationTime, // Tempo de expiração do link em minutos
        successUrl: `${baseUrl}/api/v2/checkout/success`,
        notificationUrl: `${baseUrl}/api/v2/checkout/notification`,
        additionalInfo: validatedData.additionalInfo || ''
      });

      // Salva o link de checkout no banco
      const result = await db.execute(sql.raw(`
        INSERT INTO checkout_links (
          lead_id, course_id, product_id, asaas_checkout_id, description, value, due_date,
          expiration_time, status, url, created_by_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        RETURNING *
      `, [
        leadId,
        validatedData.courseId || null,
        validatedData.productId || null,
        checkoutResponse.id,
        validatedData.description,
        validatedData.value,
        validatedData.dueDate,
        validatedData.expirationTime,
        'pending',
        checkoutResponse.url,
        req.user?.id
      ]));

      // Registra atividade para o lead
      await db.execute(sql.raw(`
        INSERT INTO lead_activities (
          lead_id, type, description, metadata, created_by_id, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        leadId,
        'checkout',
        'Link de checkout criado',
        JSON.stringify({
          checkoutId: checkoutResponse.id,
          value: validatedData.value,
          description: validatedData.description
        }),
        req.user?.id
      ]));

      return res.status(201).json({
        message: 'Link de checkout criado com sucesso',
        checkout: result.rows[0]
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
    const checkout = await db.execute(sql.raw(
      `SELECT * FROM checkout_links WHERE id = ? OR asaas_checkout_id = ?`,
      [checkoutId, checkoutId]
    ));

    if (!checkout.rows.length) {
      return res.status(404).json({ error: 'Link de checkout não encontrado' });
    }

    const checkoutData = checkout.rows[0];

    // Consulta o status no Asaas
    try {
      const asaasCheckoutStatus = await asaasCheckoutService.getCheckoutStatus(
        checkoutData.asaas_checkout_id
      );

      // Atualiza o status no banco se mudou
      if (asaasCheckoutStatus.status !== checkoutData.status) {
        await db.execute(sql.raw(`
          UPDATE checkout_links
          SET status = ?, updated_at = NOW()
          WHERE id = ?
        `, [asaasCheckoutStatus.status, checkoutData.id]));

        // Se foi pago, criar o cliente e converter o lead
        if (asaasCheckoutStatus.status === 'confirmed' || asaasCheckoutStatus.status === 'paid') {
          const lead = await db.execute(sql.raw(
            `SELECT * FROM leads WHERE id = ?`,
            [checkoutData.lead_id]
          ));

          if (lead.rows.length) {
            const leadData = lead.rows[0];
            
            // Verifica se o cliente já existe
            const existingClient = await db.execute(sql.raw(
              `SELECT * FROM clients WHERE email = ?`,
              [leadData.email]
            ));

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
            }
          }
        }
      }

      return res.json({
        checkout: checkoutData,
        asaasStatus: asaasCheckoutStatus
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