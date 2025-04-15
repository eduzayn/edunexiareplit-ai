/**
 * Rotas para o módulo CRM
 * Gerencia as operações CRUD para leads, clientes e contatos
 */

import { Router } from 'express';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';
import * as crmService from '../services/crm-service';
import { Request, Response } from 'express';
import { 
  InsertLead, InsertClient, 
  InsertContact, Client, Lead, Contact 
} from '@shared/schema';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// ==================== ROTAS PARA LEADS ====================

/**
 * Obter todos os leads com paginação e filtros
 */
router.get('/leads', requirePermission('lead', 'ler'), async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const leads = await crmService.getLeads(search, status, req.user.id, limit, offset);
    
    res.json({
      success: true,
      data: leads,
      pagination: {
        limit,
        offset,
        total: leads.length // Isto não é preciso para paginação real
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar leads',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Obter um lead específico pelo ID
 */
router.get('/leads/:id', requirePermission('lead', 'ler'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const lead = await crmService.getLead(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error(`Erro ao buscar lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar lead',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Criar um novo lead
 */
router.post('/leads', requirePermission('lead', 'criar'), async (req: Request, res: Response) => {
  try {
    // Adicionar o ID do usuário que está criando o lead
    const leadData: InsertLead = {
      ...req.body,
      createdById: req.user.id
    };
    
    const lead = await crmService.createLead(leadData);
    
    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar lead',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Atualizar um lead existente
 */
router.put('/leads/:id', requirePermission('lead', 'atualizar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const lead = await crmService.updateLead(id, req.body);
    
    res.json({
      success: true,
      data: lead,
      message: 'Lead atualizado com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao atualizar lead ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar lead',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Excluir um lead
 */
router.delete('/leads/:id', requirePermission('lead', 'deletar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const success = await crmService.deleteLead(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado ou não pôde ser excluído'
      });
    }
    
    res.json({
      success: true,
      message: 'Lead excluído com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao excluir lead ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir lead',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Converter um lead para cliente
 */
router.post('/leads/:id/convert', requirePermission('lead', 'atualizar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const { client, contact } = await crmService.convertLeadToClient(id, req.body, req.user.id);
    
    res.json({
      success: true,
      data: { client, contact },
      message: 'Lead convertido para cliente com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao converter lead ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: 'Erro ao converter lead para cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ==================== ROTAS PARA CLIENTES ====================

/**
 * Obter todos os clientes com paginação e filtros
 */
router.get('/clients', requirePermission('cliente', 'ler'), async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const clients = await crmService.getClients(search, status, req.user.id, limit, offset);
    
    res.json({
      success: true,
      data: clients,
      pagination: {
        limit,
        offset,
        total: clients.length // Isto não é preciso para paginação real
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clientes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Obter um cliente específico pelo ID
 */
router.get('/clients/:id', requirePermission('cliente', 'ler'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const { client, contacts } = await crmService.getClient(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { client, contacts }
    });
  } catch (error) {
    console.error(`Erro ao buscar cliente ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Criar um novo cliente
 */
router.post('/clients', requirePermission('cliente', 'criar'), async (req: Request, res: Response) => {
  try {
    // Adicionar o ID do usuário que está criando o cliente
    const clientData: InsertClient = {
      ...req.body,
      createdById: req.user.id
    };
    
    const client = await crmService.createClient(clientData);
    
    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Atualizar um cliente existente
 */
router.put('/clients/:id', requirePermission('cliente', 'atualizar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const client = await crmService.updateClient(id, req.body);
    
    res.json({
      success: true,
      data: client,
      message: 'Cliente atualizado com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao atualizar cliente ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Excluir um cliente
 */
router.delete('/clients/:id', requirePermission('cliente', 'deletar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const success = await crmService.deleteClient(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado ou não pôde ser excluído'
      });
    }
    
    res.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao excluir cliente ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir cliente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ==================== ROTAS PARA CONTATOS ====================

/**
 * Obter contatos de um cliente
 */
router.get('/clients/:clientId/contacts', requirePermission('contato', 'ler'), async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente inválido'
      });
    }
    
    const contacts = await crmService.getContactsByClient(clientId);
    
    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error(`Erro ao buscar contatos do cliente ${req.params.clientId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar contatos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Obter um contato específico pelo ID
 */
router.get('/contacts/:id', requirePermission('contato', 'ler'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const contact = await crmService.getContact(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contato não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error(`Erro ao buscar contato ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar contato',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Criar um novo contato
 */
router.post('/contacts', requirePermission('contato', 'criar'), async (req: Request, res: Response) => {
  try {
    // Adicionar o ID do usuário que está criando o contato
    const contactData: InsertContact = {
      ...req.body,
      createdById: req.user.id
    };
    
    const contact = await crmService.createContact(contactData);
    
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contato criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    res.status(400).json({
      success: false,
      error: 'Erro ao criar contato',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Atualizar um contato existente
 */
router.put('/contacts/:id', requirePermission('contato', 'atualizar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const contact = await crmService.updateContact(id, req.body);
    
    res.json({
      success: true,
      data: contact,
      message: 'Contato atualizado com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao atualizar contato ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: 'Erro ao atualizar contato',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Excluir um contato
 */
router.delete('/contacts/:id', requirePermission('contato', 'deletar'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }
    
    const success = await crmService.deleteContact(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Contato não encontrado ou não pôde ser excluído'
      });
    }
    
    res.json({
      success: true,
      message: 'Contato excluído com sucesso'
    });
  } catch (error) {
    console.error(`Erro ao excluir contato ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir contato',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;