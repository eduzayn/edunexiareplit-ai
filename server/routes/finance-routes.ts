/**
 * Rotas para o módulo Financeiro
 * Gerencia produtos, faturas, itens de faturas, pagamentos e cobranças
 */

import { Router } from 'express';
import { z } from 'zod';
import * as financeService from '../services/finance-service';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';
import chargesRoutes from './finance-charges-routes';
import {
  insertProductSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema
} from '@shared/schema';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// ==================== ROTAS PARA PRODUTOS ====================

/**
 * Obtém todos os produtos
 * @route GET /api/finance/products
 */
router.get('/products', requirePermission('produto', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const active = req.query.active ? req.query.active === 'true' : undefined;
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    const products = await financeService.getProducts(search, active, limit, offset);
    res.json({ products });
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

/**
 * Obtém um produto específico
 * @route GET /api/finance/products/:id
 */
router.get('/products/:id', requirePermission('produto', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const product = await financeService.getProduct(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

/**
 * Cria um novo produto
 * @route POST /api/finance/products
 */
router.post('/products', requirePermission('produto', 'criar'), async (req, res) => {
  try {
    const schema = insertProductSchema.extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      code: z.string().min(1, 'Código é obrigatório'),
      type: z.string(), // course ou service
      category: z.string(),
      description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
      price: z.number().min(0, 'Preço não pode ser negativo'),
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

    const product = await financeService.createProduct(validationResult.data);
    res.status(201).json({ product });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar produto';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um produto
 * @route PUT /api/finance/products/:id
 */
router.put('/products/:id', requirePermission('produto', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o produto existe
    const existingProduct = await financeService.getProduct(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const schema = insertProductSchema.partial().extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      code: z.string().min(1, 'Código é obrigatório').optional(),
      price: z.number().min(0, 'Preço não pode ser negativo').optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const product = await financeService.updateProduct(id, validationResult.data);
    res.json({ product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar produto';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um produto
 * @route DELETE /api/finance/products/:id
 */
router.delete('/products/:id', requirePermission('produto', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const success = await financeService.deleteProduct(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Produto não encontrado ou não pode ser excluído' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir produto';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA FATURAS ====================

/**
 * Obtém todas as faturas
 * @route GET /api/finance/invoices
 */
router.get('/invoices', requirePermission('fatura', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const status = req.query.status?.toString();
    const clientId = req.query.clientId ? parseInt(req.query.clientId.toString()) : undefined;
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    // Se não for admin, filtrar por criador (usuário logado)
    const userId = req.user.portalType === 'admin' ? undefined : req.user.id;
    
    const invoices = await financeService.getInvoices(search, status, clientId, userId, limit, offset);
    res.json({ invoices });
  } catch (error) {
    console.error('Erro ao obter faturas:', error);
    res.status(500).json({ error: 'Erro ao obter faturas' });
  }
});

/**
 * Obtém uma fatura específica
 * @route GET /api/finance/invoices/:id
 */
router.get('/invoices/:id', requirePermission('fatura', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const invoice = await financeService.getInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Verificar permissão para faturas de outros usuários
    if (req.user.portalType !== 'admin' && invoice.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar esta fatura' });
    }
    
    res.json({ invoice });
  } catch (error) {
    console.error('Erro ao obter fatura:', error);
    res.status(500).json({ error: 'Erro ao obter fatura' });
  }
});

/**
 * Cria uma nova fatura
 * @route POST /api/finance/invoices
 */
router.post('/invoices', requirePermission('fatura', 'criar'), async (req, res) => {
  try {
    const invoiceSchema = z.object({
      clientId: z.number().int().positive(),
      contractId: z.number().int().positive().optional(),
      dueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Data de vencimento inválida'
      }),
      status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled', 'partial']).default('draft'),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
        discount: z.number().min(0).default(0),
        tax: z.number().min(0).default(0)
      })).optional()
    });

    const validationResult = invoiceSchema.safeParse({
      ...req.body,
      createdById: req.user.id
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const { items, ...invoiceData } = validationResult.data;
    
    // Converter dueDate para objeto Date
    const parsedInvoiceData = {
      ...invoiceData,
      dueDate: new Date(invoiceData.dueDate)
    };
    
    const invoice = await financeService.createInvoice(parsedInvoiceData, items);
    res.status(201).json({ invoice });
  } catch (error) {
    console.error('Erro ao criar fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar fatura';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza uma fatura
 * @route PUT /api/finance/invoices/:id
 */
router.put('/invoices/:id', requirePermission('fatura', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se a fatura existe
    const existingInvoice = await financeService.getInvoice(id);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Verificar permissão para faturas de outros usuários
    if (req.user.portalType !== 'admin' && existingInvoice.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para atualizar esta fatura' });
    }
    
    // Não permitir alterações em faturas que não estão em rascunho (exceto status)
    if (existingInvoice.status !== 'draft' && Object.keys(req.body).some(key => key !== 'status')) {
      return res.status(403).json({ error: 'Somente o status pode ser alterado em faturas que não estão em rascunho' });
    }
    
    const schema = insertInvoiceSchema.partial().extend({
      dueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Data de vencimento inválida'
      }).optional(),
      status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled', 'partial']).optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const updateData = validationResult.data;
    
    // Converter dueDate para objeto Date se fornecido
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    
    const invoice = await financeService.updateInvoice(id, updateData);
    res.json({ invoice });
  } catch (error) {
    console.error('Erro ao atualizar fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar fatura';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui uma fatura
 * @route DELETE /api/finance/invoices/:id
 */
router.delete('/invoices/:id', requirePermission('fatura', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se a fatura existe
    const existingInvoice = await financeService.getInvoice(id);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Verificar permissão para faturas de outros usuários
    if (req.user.portalType !== 'admin' && existingInvoice.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para excluir esta fatura' });
    }
    
    const success = await financeService.deleteInvoice(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Fatura não encontrada ou não pode ser excluída' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir fatura';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA ITENS DE FATURA ====================

/**
 * Adiciona um item a uma fatura
 * @route POST /api/finance/invoices/:invoiceId/items
 */
router.post('/invoices/:invoiceId/items', requirePermission('fatura', 'atualizar'), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'ID de fatura inválido' });
    }
    
    // Verificar se a fatura existe
    const existingInvoice = await financeService.getInvoice(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Verificar permissão para faturas de outros usuários
    if (req.user.portalType !== 'admin' && existingInvoice.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para adicionar itens a esta fatura' });
    }
    
    const schema = insertInvoiceItemSchema.extend({
      productId: z.number().int().positive(),
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
      discount: z.number().min(0).default(0),
      tax: z.number().min(0).default(0)
    });

    const validationResult = schema.safeParse({
      ...req.body,
      invoiceId
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    try {
      const item = await financeService.addInvoiceItem(validationResult.data);
      res.status(201).json({ item });
    } catch (error) {
      if (error instanceof Error && error.message.includes('rascunho')) {
        return res.status(403).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao adicionar item à fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao adicionar item à fatura';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um item de fatura
 * @route PUT /api/finance/invoice-items/:id
 */
router.put('/invoice-items/:id', requirePermission('fatura', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const schema = insertInvoiceItemSchema.partial().extend({
      description: z.string().optional(),
      quantity: z.number().positive().optional(),
      unitPrice: z.number().min(0).optional(),
      discount: z.number().min(0).optional(),
      tax: z.number().min(0).optional()
    }).omit({ invoiceId: true }); // Não permitir alteração da fatura

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    try {
      const item = await financeService.updateInvoiceItem(id, validationResult.data);
      res.json({ item });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Item não encontrado')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('rascunho')) {
          return res.status(403).json({ error: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar item de fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar item de fatura';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um item de fatura
 * @route DELETE /api/finance/invoice-items/:id
 */
router.delete('/invoice-items/:id', requirePermission('fatura', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    try {
      const success = await financeService.deleteInvoiceItem(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Item não encontrado ou não pode ser excluído' });
      }
      
      res.status(204).end();
    } catch (error) {
      if (error instanceof Error && error.message.includes('rascunho')) {
        return res.status(403).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao excluir item de fatura:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir item de fatura';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA PAGAMENTOS ====================

/**
 * Obtém pagamentos de uma fatura
 * @route GET /api/finance/invoices/:invoiceId/payments
 */
router.get('/invoices/:invoiceId/payments', requirePermission('pagamento', 'ler'), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'ID de fatura inválido' });
    }
    
    // Verificar se a fatura existe
    const existingInvoice = await financeService.getInvoice(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    // Verificar permissão para faturas de outros usuários
    if (req.user.portalType !== 'admin' && existingInvoice.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Permissão negada para acessar pagamentos desta fatura' });
    }
    
    const payments = await financeService.getInvoicePayments(invoiceId);
    res.json({ payments });
  } catch (error) {
    console.error('Erro ao obter pagamentos:', error);
    res.status(500).json({ error: 'Erro ao obter pagamentos' });
  }
});

/**
 * Registra um novo pagamento
 * @route POST /api/finance/invoices/:invoiceId/payments
 */
router.post('/invoices/:invoiceId/payments', requirePermission('pagamento', 'confirmar'), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'ID de fatura inválido' });
    }
    
    // Verificar se a fatura existe
    const existingInvoice = await financeService.getInvoice(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }
    
    const schema = insertPaymentSchema.extend({
      amount: z.number().positive('Valor deve ser positivo'),
      method: z.enum(['credit_card', 'debit_card', 'bank_slip', 'bank_transfer', 'pix', 'cash', 'other']),
      paymentDate: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Data de pagamento inválida'
      }),
      status: z.enum(['completed', 'pending', 'failed', 'refunded']).default('completed'),
      transactionId: z.string().optional(),
      notes: z.string().optional()
    });

    const validationResult = schema.safeParse({
      ...req.body,
      invoiceId,
      createdById: req.user.id
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    // Converter paymentDate para objeto Date
    const paymentData = {
      ...validationResult.data,
      paymentDate: new Date(validationResult.data.paymentDate)
    };
    
    const payment = await financeService.createPayment(paymentData);
    res.status(201).json({ payment });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao registrar pagamento';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um pagamento
 * @route PUT /api/finance/payments/:id
 */
router.put('/payments/:id', requirePermission('pagamento', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const schema = insertPaymentSchema.partial().extend({
      amount: z.number().positive('Valor deve ser positivo').optional(),
      method: z.enum(['credit_card', 'debit_card', 'bank_slip', 'bank_transfer', 'pix', 'cash', 'other']).optional(),
      paymentDate: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Data de pagamento inválida'
      }).optional(),
      status: z.enum(['completed', 'pending', 'failed', 'refunded']).optional(),
    }).omit({ invoiceId: true }); // Não permitir alteração da fatura

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const updateData = { ...validationResult.data };
    
    // Converter paymentDate para objeto Date se fornecido
    if (updateData.paymentDate) {
      updateData.paymentDate = new Date(updateData.paymentDate);
    }
    
    const payment = await financeService.updatePayment(id, updateData);
    res.json({ payment });
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar pagamento';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um pagamento
 * @route DELETE /api/finance/payments/:id
 */
router.delete('/payments/:id', requirePermission('pagamento', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const success = await financeService.deletePayment(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Pagamento não encontrado ou não pode ser excluído' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir pagamento';
    res.status(500).json({ error: message });
  }
});

export default router;