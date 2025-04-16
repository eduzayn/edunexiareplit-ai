import { Request, Response } from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Configurar pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Buscar todos os leads
 */
export async function getLeads(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    
    let query = `
      SELECT l.*, 
             COUNT(c.id) as checkout_count,
             MAX(c.created_at) as last_checkout_date,
             u.name as assigned_to_name
      FROM leads l
      LEFT JOIN checkout_links c ON l.id = c.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
    `;
    
    const whereConditions = [];
    const queryParams = [];
    
    if (search) {
      queryParams.push(`%${search}%`);
      queryParams.push(`%${search}%`);
      queryParams.push(`%${search}%`);
      whereConditions.push(`(l.name ILIKE $${queryParams.length - 2} OR 
                            l.email ILIKE $${queryParams.length - 1} OR 
                            l.phone ILIKE $${queryParams.length})`);
    }
    
    if (status) {
      queryParams.push(status);
      whereConditions.push(`l.status = $${queryParams.length}`);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY l.id, u.name ORDER BY l.created_at DESC`;
    
    const result = await client.query(query, queryParams);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar leads' });
  } finally {
    client.release();
  }
}

/**
 * Buscar lead específico
 */
export async function getLeadById(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    // Buscar o lead
    const leadResult = await client.query(`
      SELECT l.*, u.name as assigned_to_name
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1
    `, [id]);
    
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    const lead = leadResult.rows[0];
    
    // Buscar atividades do lead
    const activitiesResult = await client.query(`
      SELECT a.*, u.name as created_by_name
      FROM lead_activities a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.lead_id = $1
      ORDER BY a.created_at DESC
    `, [id]);
    
    // Buscar checkouts do lead
    const checkoutsResult = await client.query(`
      SELECT c.*, co.name as course_name
      FROM checkout_links c
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE c.lead_id = $1
      ORDER BY c.created_at DESC
    `, [id]);
    
    return res.json({
      ...lead,
      activities: activitiesResult.rows,
      checkouts: checkoutsResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do lead:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes do lead' });
  } finally {
    client.release();
  }
}

/**
 * Criar lead
 */
export async function createLead(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { name, email, phone, origin, source, notes, assignedTo } = req.body;
    const userId = req.user?.id; // ID do usuário logado
    
    // Validações básicas
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Inserir o lead
    const leadResult = await client.query(`
      INSERT INTO leads 
      (name, email, phone, origin, source, notes, assigned_to, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `, [name, email, phone, origin, source, notes, assignedTo]);
    
    const leadId = leadResult.rows[0].id;
    
    // Registrar atividade de criação
    await client.query(`
      INSERT INTO lead_activities
      (lead_id, activity_type, description, created_at, created_by)
      VALUES ($1, $2, $3, NOW(), $4)
    `, [
      leadId,
      'creation',
      'Lead cadastrado no sistema',
      userId
    ]);
    
    await client.query('COMMIT');
    
    return res.status(201).json({ 
      id: leadId,
      message: 'Lead criado com sucesso' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar lead:', error);
    return res.status(500).json({ error: 'Erro interno ao criar lead' });
  } finally {
    client.release();
  }
}

/**
 * Atualizar lead
 */
export async function updateLead(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, email, phone, status, notes, assignedTo } = req.body;
    
    // Validações básicas
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    // Atualizar o lead
    await client.query(`
      UPDATE leads
      SET name = $1, email = $2, phone = $3, status = $4, notes = $5, 
          assigned_to = $6, updated_at = NOW()
      WHERE id = $7
    `, [name, email, phone, status, notes, assignedTo, id]);
    
    return res.json({ message: 'Lead atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar lead' });
  } finally {
    client.release();
  }
}

/**
 * Adicionar atividade ao lead
 */
export async function addLeadActivity(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { leadId } = req.params;
    const { activityType, description } = req.body;
    const userId = req.user?.id; // ID do usuário logado
    
    // Validações básicas
    if (!activityType || !description) {
      return res.status(400).json({ error: 'Tipo de atividade e descrição são obrigatórios' });
    }
    
    // Inserir a atividade
    const result = await client.query(`
      INSERT INTO lead_activities
      (lead_id, activity_type, description, created_at, created_by)
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING id
    `, [leadId, activityType, description, userId]);
    
    // Atualizar data do último contato se for um contato
    if (['call', 'email', 'message'].includes(activityType)) {
      await client.query(`
        UPDATE leads
        SET last_contact_date = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [leadId]);
    }
    
    return res.status(201).json({ 
      id: result.rows[0].id,
      message: 'Atividade registrada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    return res.status(500).json({ error: 'Erro interno ao registrar atividade' });
  } finally {
    client.release();
  }
}