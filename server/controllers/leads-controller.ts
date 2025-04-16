/**
 * Controlador para gerenciamento de leads com integração Asaas
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Schema de validação para criação de lead
const createLeadSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  course: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified']).default('new')
});

// Schema de validação para atualização de lead
const updateLeadSchema = createLeadSchema.partial();

// Schema para atividade de lead
const leadActivitySchema = z.object({
  type: z.enum(['note', 'contact', 'email', 'checkout']),
  description: z.string(),
  metadata: z.any().optional()
});

/**
 * Obtém todos os leads com paginação e filtros
 */
export async function getLeads(req: Request, res: Response) {
  try {
    const { 
      status, 
      search, 
      page = '1', 
      limit = '20',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    // Construímos os filtros usando SQL para evitar problemas de sintaxe
    let whereClause = sql`WHERE 1=1`;
    
    // Adicionar status se fornecido e diferente de 'all'
    if (status && status !== 'all') {
      whereClause = sql`${whereClause} AND status = ${status}`;
    }

    // Adicionar busca por nome ou email
    if (search) {
      whereClause = sql`${whereClause} AND (name LIKE ${`%${search}%`} OR email LIKE ${`%${search}%`})`;
    }

    // Executa as consultas com SQL template strings seguras
    const [leads, countResult] = await Promise.all([
      db.execute(sql`
        SELECT * FROM leads
        ${whereClause}
        ORDER BY ${sql.raw(sortBy as string)} ${sql.raw(sortOrder as string)}
        LIMIT ${limitNumber} OFFSET ${offset}
      `),
      db.execute(sql`
        SELECT COUNT(*) as total FROM leads
        ${whereClause}
      `)
    ]);

    const total = countResult.rows[0]?.total || 0;

    return res.json({
      data: leads.rows,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return res.status(500).json({ error: 'Erro ao buscar leads' });
  }
}

/**
 * Obtém um lead específico pelo ID com suas atividades
 */
export async function getLeadById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Consulta o lead
    const lead = await db.execute(sql`
      SELECT * FROM leads WHERE id = ${id}
    `);

    if (!lead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Consulta atividades do lead
    const activities = await db.execute(sql`
      SELECT * FROM lead_activities 
      WHERE lead_id = ${id} 
      ORDER BY created_at DESC
    `);

    // Consulta links de checkout associados
    const checkoutLinks = await db.execute(sql`
      SELECT * FROM checkout_links 
      WHERE lead_id = ${id} 
      ORDER BY created_at DESC
    `);

    return res.json({
      lead: lead.rows[0],
      activities: activities.rows,
      checkoutLinks: checkoutLinks.rows
    });
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    return res.status(500).json({ error: 'Erro ao buscar lead' });
  }
}

/**
 * Cria um novo lead
 */
export async function createLead(req: Request, res: Response) {
  try {
    const validatedData = createLeadSchema.parse(req.body);

    // Insere lead no banco
    const result = await db.execute(sql`
      INSERT INTO leads (
        name, email, phone, course, source, notes, status, created_by_id, created_at
      ) VALUES (
        ${validatedData.name},
        ${validatedData.email},
        ${validatedData.phone || null},
        ${validatedData.course || null},
        ${validatedData.source || null},
        ${validatedData.notes || null},
        ${validatedData.status},
        ${req.user?.id || null},
        NOW()
      )
      RETURNING *
    `);

    const newLead = result.rows[0];

    // Cria uma atividade inicial para o lead
    await db.execute(sql`
      INSERT INTO lead_activities (
        lead_id, type, description, created_by_id, created_at
      ) VALUES (
        ${newLead.id},
        ${'note'},
        ${'Lead criado'},
        ${req.user?.id || null},
        NOW()
      )
    `);

    return res.status(201).json(newLead);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao criar lead' });
  }
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = updateLeadSchema.parse(req.body);

    // Verifica se o lead existe
    const existingLead = await db.execute(sql`
      SELECT * FROM leads WHERE id = ${id}
    `);

    if (!existingLead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Construímos os campos a serem atualizados usando um objeto
    const fieldsToUpdate = { ...validatedData };
    
    // Aqui precisamos construir a query SQL de forma dinâmica
    // Primeiro criamos uma array com cada parte do SET
    const updateParts = [];
    const updateValues = {};
    
    // Iteramos sobre os campos a atualizar
    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        updateParts.push(`${key} = ${sql.placeholder(key)}`);
        updateValues[key] = value;
      }
    });
    
    // Adicionamos os campos de sistema
    updateParts.push('updated_at = NOW()');
    updateParts.push(`updated_by_id = ${sql.placeholder('userId')}`);
    updateValues['userId'] = req.user?.id || null;
    
    // Executamos a atualização
    const result = await db.execute(sql`
      UPDATE leads 
      SET ${sql.raw(updateParts.join(', '))}
      WHERE id = ${id}
      RETURNING *
    `.params(updateValues));

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
}

/**
 * Adiciona uma atividade a um lead existente
 */
export async function addLeadActivity(req: Request, res: Response) {
  try {
    const { leadId } = req.params;
    const validatedData = leadActivitySchema.parse(req.body);

    // Verifica se o lead existe
    const existingLead = await db.execute(sql`
      SELECT * FROM leads WHERE id = ${leadId}
    `);

    if (!existingLead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Insere a atividade
    const result = await db.execute(sql`
      INSERT INTO lead_activities (
        lead_id, type, description, metadata, created_by_id, created_at
      ) VALUES (
        ${leadId},
        ${validatedData.type},
        ${validatedData.description},
        ${validatedData.metadata ? JSON.stringify(validatedData.metadata) : null},
        ${req.user?.id || null},
        NOW()
      )
      RETURNING *
    `);

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar atividade:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao adicionar atividade' });
  }
}