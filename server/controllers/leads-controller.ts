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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    // Construindo a consulta
    let query = `
      SELECT * FROM leads
      WHERE 1=1
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM leads
      WHERE 1=1
    `;

    let conditions = '';
    const params: any[] = [];

    // Adicionar filtros se fornecidos
    if (status) {
      conditions += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      conditions += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Executa as consultas
    const [leads, countResult] = await Promise.all([
      db.execute(sql`${sql.raw(query + conditions)} ORDER BY ${sql.raw(sortBy)} ${sql.raw(sortOrder)} LIMIT ${limitNumber} OFFSET ${offset}`),
      db.execute(sql`${sql.raw(countQuery + conditions)}`)
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
    const lead = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ?`,
      [id]
    ));

    if (!lead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Consulta atividades do lead
    const activities = await db.execute(sql.raw(
      `SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC`,
      [id]
    ));

    // Consulta links de checkout associados
    const checkoutLinks = await db.execute(sql.raw(
      `SELECT * FROM checkout_links WHERE lead_id = ? ORDER BY created_at DESC`,
      [id]
    ));

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
    const result = await db.execute(sql.raw(`
      INSERT INTO leads (
        name, email, phone, course, source, notes, status, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      RETURNING *
    `, [
      validatedData.name,
      validatedData.email,
      validatedData.phone || null,
      validatedData.course || null,
      validatedData.source || null,
      validatedData.notes || null,
      validatedData.status,
      req.user?.id
    ]));

    const newLead = result.rows[0];

    // Cria uma atividade inicial para o lead
    await db.execute(sql.raw(`
      INSERT INTO lead_activities (
        lead_id, type, description, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, NOW())
    `, [
      newLead.id,
      'note',
      'Lead criado',
      req.user?.id
    ]));

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
    const existingLead = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ?`,
      [id]
    ));

    if (!existingLead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Constrói a query dinâmica para atualização
    let updateFields = [];
    let params = [];

    // Adiciona campos para atualização
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    // Adiciona updated_at e updated_by_id
    updateFields.push('updated_at = NOW()');
    updateFields.push('updated_by_id = ?');
    params.push(req.user?.id);

    // Adiciona o ID para o WHERE
    params.push(id);

    // Executa a atualização
    const result = await db.execute(sql.raw(`
      UPDATE leads 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
      RETURNING *
    `, params));

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
    const existingLead = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ?`,
      [leadId]
    ));

    if (!existingLead.rows.length) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Insere a atividade
    const result = await db.execute(sql.raw(`
      INSERT INTO lead_activities (
        lead_id, type, description, metadata, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
      RETURNING *
    `, [
      leadId,
      validatedData.type,
      validatedData.description,
      validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      req.user?.id
    ]));

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar atividade:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    return res.status(500).json({ error: 'Erro ao adicionar atividade' });
  }
}