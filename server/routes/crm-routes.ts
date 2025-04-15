/**
 * Rotas para o módulo CRM
 * Gerencia leads, clientes e contatos
 */

import { Router } from 'express';
import { z } from 'zod';
import * as crmService from '../services/crm-service';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';
import {
  insertLeadSchema,
  insertClientSchema,
  insertContactSchema
} from '@shared/schema';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// ==================== ROTAS PARA LEADS ====================

/**
 * Obtém todos os leads
 * @route GET /api/crm/leads
 */
router.get('/leads', requirePermission('lead', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const status = req.query.status?.toString();
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    // Se não for admin, filtrar por criador (usuário logado)
    const userId = req.user.portalType === 'admin' ? undefined : req.user.id;
    
    const leads = await crmService.getLeads(search, status, userId, limit, offset);
    res.json({ leads });
  } catch (error) {
    console.error('Erro ao obter leads:', error);
    res.status(500).json({ error: 'Erro ao obter leads' });
  }
});

/**
 * Obtém um lead específico
 * @route GET /api/crm/leads/:id
 */
router.get('/leads/:id', requirePermission('lead', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const lead = await crmService.getLead(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Verificar permissão para leads de outros usuários
    if (req.user.portalType !== 'admin' && lead.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar este lead' });
    }
    
    res.json({ lead });
  } catch (error) {
    console.error('Erro ao obter lead:', error);
    res.status(500).json({ error: 'Erro ao obter lead' });
  }
});

/**
 * Cria um novo lead
 * @route POST /api/crm/leads
 */
router.post('/leads', requirePermission('lead', 'criar'), async (req, res) => {
  try {
    const schema = insertLeadSchema.extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      email: z.string().email('Email inválido'),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.string().optional(),
      interest: z.string().optional(),
      notes: z.string().optional(),
    });

    const validationResult = schema.safeParse({
      ...req.body,
      createdById: req.user.id
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const lead = await crmService.createLead(validationResult.data);
    res.status(201).json({ lead });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar lead';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um lead
 * @route PUT /api/crm/leads/:id
 */
router.put('/leads/:id', requirePermission('lead', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o lead existe
    const existingLead = await crmService.getLead(id);
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Verificar permissão para leads de outros usuários
    if (req.user.portalType !== 'admin' && existingLead.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para atualizar este lead' });
    }
    
    const schema = insertLeadSchema.partial().extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      email: z.string().email('Email inválido').optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const lead = await crmService.updateLead(id, validationResult.data);
    res.json({ lead });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar lead';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um lead
 * @route DELETE /api/crm/leads/:id
 */
router.delete('/leads/:id', requirePermission('lead', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o lead existe
    const existingLead = await crmService.getLead(id);
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Verificar permissão para leads de outros usuários
    if (req.user.portalType !== 'admin' && existingLead.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para excluir este lead' });
    }
    
    const success = await crmService.deleteLead(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Lead não encontrado ou não pode ser excluído' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir lead';
    res.status(500).json({ error: message });
  }
});

/**
 * Converte um lead para cliente
 * @route POST /api/crm/leads/:id/convert
 */
router.post('/leads/:id/convert', requirePermission('lead', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o lead existe
    const existingLead = await crmService.getLead(id);
    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    
    // Verificar permissão para leads de outros usuários
    if (req.user.portalType !== 'admin' && existingLead.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para converter este lead' });
    }
    
    const schema = z.object({
      name: z.string().optional(),
      type: z.enum(['pf', 'pj']).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      cpfCnpj: z.string().optional(),
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    // Converter o lead para cliente
    const { client, contact } = await crmService.convertLeadToClient(id, validationResult.data);
    
    res.status(201).json({ client, contact });
  } catch (error) {
    console.error('Erro ao converter lead:', error);
    const message = error instanceof Error ? error.message : 'Erro ao converter lead';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA CLIENTES ====================

/**
 * Obtém todos os clientes
 * @route GET /api/crm/clients
 */
router.get('/clients', requirePermission('cliente', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const status = req.query.status?.toString();
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    // Se não for admin, filtrar por criador (usuário logado)
    const userId = req.user.portalType === 'admin' ? undefined : req.user.id;
    
    const clients = await crmService.getClients(search, status, userId, limit, offset);
    res.json({ clients });
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    res.status(500).json({ error: 'Erro ao obter clientes' });
  }
});

/**
 * Obtém um cliente específico
 * @route GET /api/crm/clients/:id
 */
router.get('/clients/:id', requirePermission('cliente', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const client = await crmService.getClient(id);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar permissão para clientes de outros usuários
    if (req.user.portalType !== 'admin' && client.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar este cliente' });
    }
    
    res.json({ client });
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro ao obter cliente' });
  }
});

/**
 * Cria um novo cliente
 * @route POST /api/crm/clients
 */
router.post('/clients', requirePermission('cliente', 'criar'), async (req, res) => {
  try {
    const schema = insertClientSchema.extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      email: z.string().email('Email inválido'),
      phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
      cpfCnpj: z.string().min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos'),
    });

    const validationResult = schema.safeParse({
      ...req.body,
      createdById: req.user.id
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    // Verificar se já existe cliente com esse CPF/CNPJ
    const existingClient = await crmService.findClientByCpfCnpj(validationResult.data.cpfCnpj);
    if (existingClient) {
      return res.status(400).json({ error: 'Já existe um cliente cadastrado com este CPF/CNPJ' });
    }

    const client = await crmService.createClient(validationResult.data);
    res.status(201).json({ client });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar cliente';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um cliente
 * @route PUT /api/crm/clients/:id
 */
router.put('/clients/:id', requirePermission('cliente', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o cliente existe
    const existingClient = await crmService.getClient(id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar permissão para clientes de outros usuários
    if (req.user.portalType !== 'admin' && existingClient.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para atualizar este cliente' });
    }
    
    const schema = insertClientSchema.partial().extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      email: z.string().email('Email inválido').optional(),
      phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional(),
      cpfCnpj: z.string().min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos').optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    // Se estiver alterando o CPF/CNPJ, verificar se já existe
    if (validationResult.data.cpfCnpj && validationResult.data.cpfCnpj !== existingClient.cpfCnpj) {
      const existingByCpfCnpj = await crmService.findClientByCpfCnpj(validationResult.data.cpfCnpj);
      if (existingByCpfCnpj) {
        return res.status(400).json({ error: 'Já existe um cliente cadastrado com este CPF/CNPJ' });
      }
    }

    const client = await crmService.updateClient(id, validationResult.data);
    res.json({ client });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar cliente';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um cliente
 * @route DELETE /api/crm/clients/:id
 */
router.delete('/clients/:id', requirePermission('cliente', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o cliente existe
    const existingClient = await crmService.getClient(id);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar permissão para clientes de outros usuários
    if (req.user.portalType !== 'admin' && existingClient.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para excluir este cliente' });
    }
    
    const success = await crmService.deleteClient(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Cliente não encontrado ou não pode ser excluído' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir cliente';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA CONTATOS ====================

/**
 * Obtém todos os contatos de um cliente
 * @route GET /api/crm/clients/:clientId/contacts
 */
router.get('/clients/:clientId/contacts', requirePermission('contato', 'ler'), async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'ID de cliente inválido' });
    }
    
    // Verificar se o cliente existe
    const existingClient = await crmService.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar permissão para clientes de outros usuários
    if (req.user.portalType !== 'admin' && existingClient.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar os contatos deste cliente' });
    }
    
    const contacts = await crmService.getContacts(clientId);
    res.json({ contacts });
  } catch (error) {
    console.error('Erro ao obter contatos:', error);
    res.status(500).json({ error: 'Erro ao obter contatos' });
  }
});

/**
 * Obtém um contato específico
 * @route GET /api/crm/contacts/:id
 */
router.get('/contacts/:id', requirePermission('contato', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const contact = await crmService.getContact(id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    // Verificar permissão para contatos de clientes de outros usuários
    const client = await crmService.getClient(contact.clientId);
    if (req.user.portalType !== 'admin' && client && client.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar este contato' });
    }
    
    res.json({ contact });
  } catch (error) {
    console.error('Erro ao obter contato:', error);
    res.status(500).json({ error: 'Erro ao obter contato' });
  }
});

/**
 * Cria um novo contato
 * @route POST /api/crm/clients/:clientId/contacts
 */
router.post('/clients/:clientId/contacts', requirePermission('contato', 'criar'), async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'ID de cliente inválido' });
    }
    
    // Verificar se o cliente existe
    const existingClient = await crmService.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar permissão para clientes de outros usuários
    if (req.user.portalType !== 'admin' && existingClient.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para adicionar contatos a este cliente' });
    }
    
    const schema = insertContactSchema.extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      email: z.string().email('Email inválido'),
      phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
    });

    const validationResult = schema.safeParse({
      ...req.body,
      clientId
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const contact = await crmService.createContact(validationResult.data);
    res.status(201).json({ contact });
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar contato';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um contato
 * @route PUT /api/crm/contacts/:id
 */
router.put('/contacts/:id', requirePermission('contato', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contato existe
    const existingContact = await crmService.getContact(id);
    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    // Verificar permissão para contatos de clientes de outros usuários
    const client = await crmService.getClient(existingContact.clientId);
    if (req.user.portalType !== 'admin' && client && client.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para atualizar este contato' });
    }
    
    const schema = insertContactSchema.partial().extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      email: z.string().email('Email inválido').optional(),
      phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional(),
    }).omit({ clientId: true }); // Não permitir alteração do cliente

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const contact = await crmService.updateContact(id, validationResult.data);
    res.json({ contact });
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar contato';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um contato
 * @route DELETE /api/crm/contacts/:id
 */
router.delete('/contacts/:id', requirePermission('contato', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contato existe
    const existingContact = await crmService.getContact(id);
    if (!existingContact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    // Verificar permissão para contatos de clientes de outros usuários
    const client = await crmService.getClient(existingContact.clientId);
    if (req.user.portalType !== 'admin' && client && client.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para excluir este contato' });
    }
    
    const success = await crmService.deleteContact(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Contato não encontrado ou não pode ser excluído' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir contato';
    res.status(500).json({ error: message });
  }
});

export default router;