/**
 * Rotas para gerenciamento de permissões contextuais (ABAC)
 */

import { Router } from 'express';
import { z } from 'zod';
import * as permissionService from '../services/permission-service';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';
import * as auditService from '../services/audit-service';
import { logPermissionAction } from '../services/audit-service';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

/**
 * Obtém todas as permissões por fase de instituição
 * @route GET /api/permissions/abac/institution-phase
 */
router.get('/institution-phase', requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const permissions = await permissionService.getAllInstitutionPhasePermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao obter permissões por fase:', error);
    res.status(500).json({ error: 'Erro ao obter permissões por fase' });
  }
});

/**
 * Cria uma nova permissão por fase de instituição
 * @route POST /api/permissions/abac/institution-phase
 */
router.post('/institution-phase', requirePermission('permissions', 'create'), async (req, res) => {
  try {
    const schema = z.object({
      resource: z.string().min(1),
      action: z.string().min(1),
      phase: z.string().min(1),
      description: z.string().min(3),
      isActive: z.boolean().default(true)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const permission = await permissionService.createInstitutionPhasePermission(result.data);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'create',
      entityType: 'permission',
      entityId: permission.id,
      detail: {
        type: 'institution_phase_permission',
        resource: permission.resource,
        action: permission.action,
        phase: permission.phase
      }
    });

    res.status(201).json(permission);
  } catch (error) {
    console.error('Erro ao criar permissão por fase:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar permissão por fase';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui uma permissão por fase de instituição
 * @route DELETE /api/permissions/abac/institution-phase/:id
 */
router.delete('/institution-phase/:id', requirePermission('permissions', 'delete'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Obter permissão antes de excluir para registro de auditoria
    const permission = await permissionService.getInstitutionPhasePermissionById(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    const success = await permissionService.deleteInstitutionPhasePermission(id);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'delete',
      entityType: 'permission',
      entityId: id,
      detail: {
        type: 'institution_phase_permission',
        resource: permission.resource,
        action: permission.action,
        phase: permission.phase
      }
    });

    res.json({ success });
  } catch (error) {
    console.error('Erro ao excluir permissão por fase:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir permissão por fase';
    res.status(500).json({ error: message });
  }
});

/**
 * Obtém todas as regras de permissão por período
 * @route GET /api/permissions/abac/period-rules
 */
router.get('/period-rules', requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const rules = await permissionService.getAllPeriodPermissionRules();
    res.json(rules);
  } catch (error) {
    console.error('Erro ao obter regras de período:', error);
    res.status(500).json({ error: 'Erro ao obter regras de período' });
  }
});

/**
 * Cria uma nova regra de permissão por período
 * @route POST /api/permissions/abac/period-rules
 */
router.post('/period-rules', requirePermission('permissions', 'create'), async (req, res) => {
  try {
    const schema = z.object({
      resource: z.string().min(1),
      action: z.string().min(1),
      periodType: z.string().min(1),
      daysBeforeStart: z.number().int().nonnegative(),
      daysAfterEnd: z.number().int().nonnegative(),
      description: z.string().min(3),
      isActive: z.boolean().default(true)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const rule = await permissionService.createPeriodPermissionRule(result.data);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'create',
      entityType: 'permission',
      entityId: rule.id,
      detail: {
        type: 'period_permission_rule',
        resource: rule.resource,
        action: rule.action,
        periodType: rule.periodType
      }
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error('Erro ao criar regra de período:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar regra de período';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui uma regra de permissão por período
 * @route DELETE /api/permissions/abac/period-rules/:id
 */
router.delete('/period-rules/:id', requirePermission('permissions', 'delete'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Obter regra antes de excluir para registro de auditoria
    const rule = await permissionService.getPeriodPermissionRuleById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Regra não encontrada' });
    }

    const success = await permissionService.deletePeriodPermissionRule(id);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'delete',
      entityType: 'permission',
      entityId: id,
      detail: {
        type: 'period_permission_rule',
        resource: rule.resource,
        action: rule.action,
        periodType: rule.periodType
      }
    });

    res.json({ success });
  } catch (error) {
    console.error('Erro ao excluir regra de período:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir regra de período';
    res.status(500).json({ error: message });
  }
});

/**
 * Obtém todas as permissões por status de pagamento
 * @route GET /api/permissions/abac/payment-status
 */
router.get('/payment-status', requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const permissions = await permissionService.getAllPaymentStatusPermissions();
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao obter permissões por status de pagamento:', error);
    res.status(500).json({ error: 'Erro ao obter permissões por status de pagamento' });
  }
});

/**
 * Cria uma nova permissão por status de pagamento
 * @route POST /api/permissions/abac/payment-status
 */
router.post('/payment-status', requirePermission('permissions', 'create'), async (req, res) => {
  try {
    const schema = z.object({
      resource: z.string().min(1),
      action: z.string().min(1),
      paymentStatus: z.string().min(1),
      description: z.string().min(3),
      isActive: z.boolean().default(true)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const permission = await permissionService.createPaymentStatusPermission(result.data);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'create',
      entityType: 'permission',
      entityId: permission.id,
      detail: {
        type: 'payment_status_permission',
        resource: permission.resource,
        action: permission.action,
        paymentStatus: permission.paymentStatus
      }
    });

    res.status(201).json(permission);
  } catch (error) {
    console.error('Erro ao criar permissão por status de pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar permissão por status de pagamento';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui uma permissão por status de pagamento
 * @route DELETE /api/permissions/abac/payment-status/:id
 */
router.delete('/payment-status/:id', requirePermission('permissions', 'delete'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Obter permissão antes de excluir para registro de auditoria
    const permission = await permissionService.getPaymentStatusPermissionById(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    const success = await permissionService.deletePaymentStatusPermission(id);
    
    // Registrar auditoria
    await auditService.logPermissionAction({
      userId: req.user!.id,
      actionType: 'delete',
      entityType: 'permission',
      entityId: id,
      detail: {
        type: 'payment_status_permission',
        resource: permission.resource,
        action: permission.action,
        paymentStatus: permission.paymentStatus
      }
    });

    res.json({ success });
  } catch (error) {
    console.error('Erro ao excluir permissão por status de pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir permissão por status de pagamento';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica permissão contextual (ABAC)
 * @route POST /api/permissions/abac/check
 */
router.post('/check', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      resource: z.string().min(1),
      action: z.string().min(1),
      entityId: z.number().int().positive().optional(),
      institutionId: z.number().int().positive().optional(),
      poloId: z.number().int().positive().optional(),
      subscriptionStatus: z.string().optional(),
      paymentStatus: z.string().optional(),
      institutionPhase: z.string().optional(),
      entityOwnerId: z.number().int().positive().optional(),
      dateRange: z.object({
        start: z.string().transform(val => new Date(val)),
        end: z.string().transform(val => new Date(val))
      }).optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const data = result.data;
    
    // Registrar auditoria da verificação
    await logPermissionAction({
      userId: req.user!.id,
      actionType: 'view',
      entityType: 'permission',
      entityId: 0,
      description: `Verificação de permissão contextual: ${data.resource}:${data.action}`,
      sourceIp: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: { 
        resourceChecked: data.resource,
        actionChecked: data.action,
        entityId: data.entityId, 
        institutionId: data.institutionId,
        requestedBy: req.user!.id 
      }
    });

    const hasPermission = await permissionService.checkContextualPermission({
      userId: data.userId,
      resource: data.resource,
      action: data.action,
      entityId: data.entityId,
      institutionId: data.institutionId,
      poloId: data.poloId,
      subscriptionStatus: data.subscriptionStatus,
      paymentStatus: data.paymentStatus,
      institutionPhase: data.institutionPhase,
      entityOwnerId: data.entityOwnerId,
      dateRange: data.dateRange
    });

    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão contextual:', error);
    const message = error instanceof Error ? error.message : 'Erro ao verificar permissão contextual';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica propriedade de um recurso
 * @route POST /api/permissions/abac/check-ownership
 */
router.post('/check-ownership', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      resourceType: z.string().min(1),
      entityId: z.number().int().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const { userId, resourceType, entityId } = result.data;
    
    // Registrar auditoria da verificação
    await logPermissionAction({
      userId: req.user!.id,
      actionType: 'view',
      entityType: 'permission',
      entityId: 0,
      description: `Verificação de propriedade: ${resourceType}:${entityId}`,
      sourceIp: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: { 
        resourceType,
        entityId,
        requestedBy: req.user!.id 
      }
    });

    const isOwner = await permissionService.isEntityOwner(userId, resourceType, entityId);

    res.json({ isOwner });
  } catch (error) {
    console.error('Erro ao verificar propriedade do recurso:', error);
    const message = error instanceof Error ? error.message : 'Erro ao verificar propriedade do recurso';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica permissão baseada na fase da instituição
 * @route POST /api/permissions/abac/check-institution-phase
 */
router.post('/check-institution-phase', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      resource: z.string().min(1),
      action: z.string().min(1),
      institutionId: z.number().int().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const { userId, resource, action, institutionId } = result.data;
    
    // Registrar auditoria da verificação
    await logPermissionAction({
      userId: req.user!.id,
      actionType: 'view',
      entityType: 'permission',
      entityId: 0,
      description: `Verificação de permissão por fase: ${resource}:${action}`,
      sourceIp: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: { 
        resource,
        action,
        institutionId,
        requestedBy: req.user!.id 
      }
    });

    const hasPermission = await permissionService.checkInstitutionPhaseAccess(
      userId, resource, action, institutionId
    );

    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão por fase da instituição:', error);
    const message = error instanceof Error ? error.message : 'Erro ao verificar permissão por fase da instituição';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica permissão baseada no status do pagamento
 * @route POST /api/permissions/abac/check-payment-status
 */
router.post('/check-payment-status', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      resource: z.string().min(1),
      action: z.string().min(1),
      entityId: z.number().int().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const { userId, resource, action, entityId } = result.data;
    
    // Registrar auditoria da verificação
    await logPermissionAction({
      userId: req.user!.id,
      actionType: 'view',
      entityType: 'permission',
      entityId: 0,
      description: `Verificação de permissão por status de pagamento: ${resource}:${action}`,
      sourceIp: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: { 
        resource,
        action,
        entityId,
        requestedBy: req.user!.id 
      }
    });

    const hasPermission = await permissionService.checkPaymentStatusAccess(
      userId, resource, action, entityId
    );

    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão por status de pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro ao verificar permissão por status de pagamento';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica permissão baseada em período
 * @route POST /api/permissions/abac/check-period
 */
router.post('/check-period', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      resource: z.string().min(1),
      action: z.string().min(1),
      targetDate: z.string().transform(val => new Date(val)),
      institutionId: z.number().int().positive().optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', detail: result.error.format() });
    }

    const { userId, resource, action, targetDate, institutionId } = result.data;
    
    // Registrar auditoria da verificação
    await logPermissionAction({
      userId: req.user!.id,
      actionType: 'view',
      entityType: 'permission',
      entityId: 0,
      description: `Verificação de permissão por período: ${resource}:${action}`,
      sourceIp: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: { 
        resource,
        action,
        targetDate: targetDate.toISOString(),
        institutionId,
        requestedBy: req.user!.id 
      }
    });

    const hasPermission = await permissionService.checkPeriodAccess(
      userId, resource, action, targetDate, institutionId
    );

    res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão por período:', error);
    const message = error instanceof Error ? error.message : 'Erro ao verificar permissão por período';
    res.status(500).json({ error: message });
  }
});

export default router;