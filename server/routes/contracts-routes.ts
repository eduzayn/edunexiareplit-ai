/**
 * Rotas para o módulo de Contratos
 * Gerencia templates de contrato e contratos
 */

import { Router } from 'express';
import { z } from 'zod';
import * as contractService from '../services/contract-service';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middleware/auth';
import {
  insertContractTemplateSchema,
  insertContractSchema
} from '@shared/schema';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// ==================== ROTAS PARA TEMPLATES DE CONTRATO ====================

/**
 * Obtém todos os templates de contrato
 * @route GET /api/contracts/templates
 */
router.get('/templates', requirePermission('contrato', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const courseTypeId = req.query.courseTypeId ? parseInt(req.query.courseTypeId.toString()) : undefined;
    const institutionId = req.query.institutionId ? parseInt(req.query.institutionId.toString()) : undefined;
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    const templates = await contractService.getContractTemplates(search, courseTypeId, institutionId, limit, offset);
    res.json({ templates });
  } catch (error) {
    console.error('Erro ao obter templates de contrato:', error);
    res.status(500).json({ error: 'Erro ao obter templates de contrato' });
  }
});

/**
 * Obtém um template de contrato específico
 * @route GET /api/contracts/templates/:id
 */
router.get('/templates/:id', requirePermission('contrato', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const template = await contractService.getContractTemplate(id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template de contrato não encontrado' });
    }
    
    res.json({ template });
  } catch (error) {
    console.error('Erro ao obter template de contrato:', error);
    res.status(500).json({ error: 'Erro ao obter template de contrato' });
  }
});

/**
 * Cria um novo template de contrato
 * @route POST /api/contracts/templates
 */
router.post('/templates', requirePermission('contrato', 'criar'), async (req, res) => {
  try {
    const schema = insertContractTemplateSchema.extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
      description: z.string().optional(),
      templateContent: z.string().min(10, 'Conteúdo do template deve ter pelo menos 10 caracteres'),
      institutionId: z.number().int().positive(),
      courseTypeId: z.number().int().positive().optional(),
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

    const template = await contractService.createContractTemplate(validationResult.data);
    res.status(201).json({ template });
  } catch (error) {
    console.error('Erro ao criar template de contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar template de contrato';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um template de contrato
 * @route PUT /api/contracts/templates/:id
 */
router.put('/templates/:id', requirePermission('contrato', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o template existe
    const existingTemplate = await contractService.getContractTemplate(id);
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template de contrato não encontrado' });
    }
    
    const schema = insertContractTemplateSchema.partial().extend({
      name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
      templateContent: z.string().min(10, 'Conteúdo do template deve ter pelo menos 10 caracteres').optional(),
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const template = await contractService.updateContractTemplate(id, validationResult.data);
    res.json({ template });
  } catch (error) {
    console.error('Erro ao atualizar template de contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar template de contrato';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um template de contrato
 * @route DELETE /api/contracts/templates/:id
 */
router.delete('/templates/:id', requirePermission('contrato', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    try {
      const success = await contractService.deleteContractTemplate(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Template de contrato não encontrado ou não pode ser excluído' });
      }
      
      res.status(204).end();
    } catch (error) {
      if (error instanceof Error && error.message.includes('não pode ser excluir')) {
        return res.status(403).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao excluir template de contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir template de contrato';
    res.status(500).json({ error: message });
  }
});

// ==================== ROTAS PARA CONTRATOS ====================

/**
 * Obtém todos os contratos
 * @route GET /api/contracts
 */
router.get('/', requirePermission('contrato', 'ler'), async (req, res) => {
  try {
    const search = req.query.search?.toString();
    const status = req.query.status?.toString();
    const studentId = req.query.studentId ? parseInt(req.query.studentId.toString()) : undefined;
    const courseId = req.query.courseId ? parseInt(req.query.courseId.toString()) : undefined;
    const limit = parseInt(req.query.limit?.toString() || '50');
    const offset = parseInt(req.query.offset?.toString() || '0');
    
    const contracts = await contractService.getContracts(search, status, studentId, courseId, limit, offset);
    res.json({ contracts });
  } catch (error) {
    console.error('Erro ao obter contratos:', error);
    res.status(500).json({ error: 'Erro ao obter contratos' });
  }
});

/**
 * Obtém um contrato específico
 * @route GET /api/contracts/:id
 */
router.get('/:id', requirePermission('contrato', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const contract = await contractService.getContract(id);
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    res.json({ contract });
  } catch (error) {
    console.error('Erro ao obter contrato:', error);
    res.status(500).json({ error: 'Erro ao obter contrato' });
  }
});

/**
 * Cria um novo contrato
 * @route POST /api/contracts
 */
router.post('/', requirePermission('contrato', 'criar'), async (req, res) => {
  try {
    const schema = z.object({
      enrollmentId: z.number().int().positive(),
      templateId: z.number().int().positive(),
      studentId: z.number().int().positive(),
      courseId: z.number().int().positive(),
      signatureRequired: z.boolean().optional(),
      additionalNotes: z.string().optional(),
    });

    const validationResult = schema.safeParse({
      ...req.body,
      generatedById: req.user.id
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const contract = await contractService.createContract(validationResult.data);
    res.status(201).json({ contract });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar contrato';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um contrato
 * @route PUT /api/contracts/:id
 */
router.put('/:id', requirePermission('contrato', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contrato existe
    const existingContract = await contractService.getContract(id);
    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    const schema = insertContractSchema.partial().extend({
      status: z.enum(['pending', 'signed', 'cancelled', 'expired']).optional(),
      additionalNotes: z.string().optional(),
    }).omit({ code: true, content: true }); // Não permitir alteração do código e conteúdo

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }

    const contract = await contractService.updateContract(id, validationResult.data);
    res.json({ contract });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar contrato';
    res.status(500).json({ error: message });
  }
});

/**
 * Assina um contrato pelo aluno
 * @route POST /api/contracts/:id/sign/student
 */
router.post('/:id/sign/student', requirePermission('contrato', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contrato existe
    const existingContract = await contractService.getContract(id);
    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    // Verificar se o contrato já está assinado pelo aluno
    if (existingContract.studentSignedAt) {
      return res.status(400).json({ error: 'Contrato já está assinado pelo aluno' });
    }
    
    // Se o usuário é um aluno, verificar se é o dono do contrato
    if (req.user.portalType === 'student' && existingContract.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para assinar este contrato' });
    }
    
    const contract = await contractService.signContractByStudent(id);
    res.json({ contract });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao assinar contrato';
    res.status(500).json({ error: message });
  }
});

/**
 * Assina um contrato pela instituição
 * @route POST /api/contracts/:id/sign/institution
 */
router.post('/:id/sign/institution', requirePermission('contrato', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contrato existe
    const existingContract = await contractService.getContract(id);
    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    // Verificar se o contrato já está assinado pela instituição
    if (existingContract.institutionSignedAt) {
      return res.status(400).json({ error: 'Contrato já está assinado pela instituição' });
    }
    
    // Para assinar pela instituição, o usuário deve ser admin
    if (req.user.portalType !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem assinar contratos pela instituição' });
    }
    
    const contract = await contractService.signContractByInstitution(id);
    res.json({ contract });
  } catch (error) {
    console.error('Erro ao assinar contrato pela instituição:', error);
    const message = error instanceof Error ? error.message : 'Erro ao assinar contrato pela instituição';
    res.status(500).json({ error: message });
  }
});

/**
 * Cancela um contrato
 * @route POST /api/contracts/:id/cancel
 */
router.post('/:id/cancel', requirePermission('contrato', 'cancelar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Verificar se o contrato existe
    const existingContract = await contractService.getContract(id);
    if (!existingContract) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    // Verificar se o contrato já está cancelado
    if (existingContract.status === 'cancelled') {
      return res.status(400).json({ error: 'Contrato já está cancelado' });
    }
    
    const schema = z.object({
      additionalNotes: z.string().optional()
    });

    const validationResult = schema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }
    
    const contract = await contractService.cancelContract(id, validationResult.data.additionalNotes);
    res.json({ contract });
  } catch (error) {
    console.error('Erro ao cancelar contrato:', error);
    const message = error instanceof Error ? error.message : 'Erro ao cancelar contrato';
    res.status(500).json({ error: message });
  }
});

export default router;