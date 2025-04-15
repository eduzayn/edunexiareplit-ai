/**
 * Rotas para gerenciamento de permissões e papéis
 */

import { Router } from 'express';
import { z } from 'zod';
import * as permissionService from '../services/permission-service';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

/**
 * Obtém todas as permissões
 * @route GET /api/permissions
 */
router.get('/', requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    res.json({ permissions });
  } catch (error) {
    console.error('Erro ao obter permissões:', error);
    res.status(500).json({ error: 'Erro ao obter permissões' });
  }
});

/**
 * Obtém todos os papéis
 * @route GET /api/permissions/roles
 */
router.get('/roles', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roles = await permissionService.getAllRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Erro ao obter papéis:', error);
    res.status(500).json({ error: 'Erro ao obter papéis' });
  }
});

/**
 * Obtém os papéis de um usuário
 * @route GET /api/permissions/user/:userId/roles
 */
router.get('/user/:userId/roles', requirePermission('users', 'read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }

    const roles = await permissionService.getUserRoles(userId);
    res.json({ roles });
  } catch (error) {
    console.error('Erro ao obter papéis do usuário:', error);
    res.status(500).json({ error: 'Erro ao obter papéis do usuário' });
  }
});

/**
 * Obtém as permissões de um papel
 * @route GET /api/permissions/role/:roleId/permissions
 */
router.get('/role/:roleId/permissions', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }

    const permissions = await permissionService.getRolePermissions(roleId);
    res.json({ permissions });
  } catch (error) {
    console.error('Erro ao obter permissões do papel:', error);
    res.status(500).json({ error: 'Erro ao obter permissões do papel' });
  }
});

/**
 * Cria um novo papel
 * @route POST /api/permissions/roles
 */
router.post('/roles', requirePermission('roles', 'create'), async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(3).max(50),
      description: z.string().min(3).max(255),
      scope: z.enum(['global', 'institution', 'polo'])
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const role = await permissionService.createRole(result.data);
    res.status(201).json({ role });
  } catch (error) {
    console.error('Erro ao criar papel:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar papel';
    res.status(500).json({ error: message });
  }
});

/**
 * Atualiza um papel
 * @route PUT /api/permissions/role/:roleId
 */
router.put('/role/:roleId', requirePermission('roles', 'update'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }

    const schema = z.object({
      description: z.string().min(3).max(255).optional(),
      scope: z.enum(['global', 'institution', 'polo']).optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const role = await permissionService.updateRole(roleId, result.data);
    res.json({ role });
  } catch (error) {
    console.error('Erro ao atualizar papel:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar papel';
    res.status(500).json({ error: message });
  }
});

/**
 * Exclui um papel
 * @route DELETE /api/permissions/role/:roleId
 */
router.delete('/role/:roleId', requirePermission('roles', 'delete'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }

    const result = await permissionService.deleteRole(roleId);
    res.json({ success: result });
  } catch (error) {
    console.error('Erro ao excluir papel:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir papel';
    res.status(500).json({ error: message });
  }
});

/**
 * Atribui um papel a um usuário
 * @route POST /api/permissions/user/:userId/roles
 */
router.post('/user/:userId/roles', requirePermission('users', 'update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }

    const schema = z.object({
      roleId: z.number().int().positive(),
      institutionId: z.number().int().positive().optional(),
      poloId: z.number().int().positive().optional()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const success = await permissionService.assignRoleToUser(
      userId,
      result.data.roleId,
      result.data.institutionId,
      result.data.poloId
    );

    res.json({ success });
  } catch (error) {
    console.error('Erro ao atribuir papel ao usuário:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atribuir papel ao usuário';
    res.status(500).json({ error: message });
  }
});

/**
 * Remove um papel de um usuário
 * @route DELETE /api/permissions/user/:userId/role/:roleId
 */
router.delete('/user/:userId/role/:roleId', requirePermission('users', 'update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const roleId = parseInt(req.params.roleId, 10);
    
    if (isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Parâmetros opcionais de instituição e polo
    const institutionId = req.query.institutionId ? parseInt(req.query.institutionId as string) : undefined;
    const poloId = req.query.poloId ? parseInt(req.query.poloId as string) : undefined;

    const success = await permissionService.removeRoleFromUser(userId, roleId, institutionId, poloId);
    res.json({ success });
  } catch (error) {
    console.error('Erro ao remover papel do usuário:', error);
    const message = error instanceof Error ? error.message : 'Erro ao remover papel do usuário';
    res.status(500).json({ error: message });
  }
});

/**
 * Adiciona uma permissão a um papel
 * @route POST /api/permissions/role/:roleId/permissions
 */
router.post('/role/:roleId/permissions', requirePermission('roles', 'update'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }

    const schema = z.object({
      permissionId: z.number().int().positive()
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const success = await permissionService.addPermissionToRole(roleId, result.data.permissionId);
    res.json({ success });
  } catch (error) {
    console.error('Erro ao adicionar permissão ao papel:', error);
    const message = error instanceof Error ? error.message : 'Erro ao adicionar permissão ao papel';
    res.status(500).json({ error: message });
  }
});

/**
 * Remove uma permissão de um papel
 * @route DELETE /api/permissions/role/:roleId/permission/:permissionId
 */
router.delete('/role/:roleId/permission/:permissionId', requirePermission('roles', 'update'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const permissionId = parseInt(req.params.permissionId, 10);
    
    if (isNaN(roleId) || isNaN(permissionId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const success = await permissionService.removePermissionFromRole(roleId, permissionId);
    res.json({ success });
  } catch (error) {
    console.error('Erro ao remover permissão do papel:', error);
    const message = error instanceof Error ? error.message : 'Erro ao remover permissão do papel';
    res.status(500).json({ error: message });
  }
});

/**
 * Verifica se o usuário atual tem uma permissão específica
 * @route GET /api/permissions/check
 */
router.get('/check', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    const resource = req.query.resource as string;
    const action = req.query.action as string;

    if (!resource || !action) {
      return res.status(400).json({ error: 'Parâmetros resource e action são obrigatórios' });
    }

    const hasAccess = await permissionService.checkUserPermission(req.user.id, resource, action);
    res.json({ hasAccess });
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
});

/**
 * Verifica se o usuário atual tem permissão para acessar uma instituição
 * @route GET /api/permissions/check-institution/:institutionId
 */
router.get('/check-institution/:institutionId', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    const institutionId = parseInt(req.params.institutionId, 10);
    if (isNaN(institutionId)) {
      return res.status(400).json({ error: 'ID de instituição inválido' });
    }

    const hasAccess = await permissionService.checkInstitutionAccess(req.user.id, institutionId);
    res.json({ hasAccess });
  } catch (error) {
    console.error('Erro ao verificar acesso à instituição:', error);
    res.status(500).json({ error: 'Erro ao verificar acesso à instituição' });
  }
});

/**
 * Verifica se o usuário atual tem permissão para acessar um polo
 * @route GET /api/permissions/check-polo/:poloId
 */
router.get('/check-polo/:poloId', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    const poloId = parseInt(req.params.poloId, 10);
    if (isNaN(poloId)) {
      return res.status(400).json({ error: 'ID de polo inválido' });
    }

    const hasAccess = await permissionService.checkPoloAccess(req.user.id, poloId);
    res.json({ hasAccess });
  } catch (error) {
    console.error('Erro ao verificar acesso ao polo:', error);
    res.status(500).json({ error: 'Erro ao verificar acesso ao polo' });
  }
});

/**
 * Obtém as permissões diretas de um usuário
 * @route GET /api/permissions/user/:userId/permissions
 */
router.get('/user/:userId/permissions', requirePermission('users', 'read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }

    const permissions = await permissionService.getUserPermissions(userId);
    res.json({ permissions });
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    res.status(500).json({ error: 'Erro ao obter permissões do usuário' });
  }
});

/**
 * Adiciona uma permissão direta a um usuário
 * @route POST /api/permissions/user/:userId/permissions
 */
router.post('/user/:userId/permissions', requirePermission('users', 'update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }

    const schema = z.object({
      permissionId: z.number().int().positive(),
      institutionId: z.number().int().positive().optional(),
      poloId: z.number().int().positive().optional(),
      expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined)
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: result.error.format() });
    }

    const success = await permissionService.addPermissionToUser(
      userId,
      result.data.permissionId,
      result.data.institutionId,
      result.data.poloId,
      result.data.expiresAt
    );

    res.json({ success });
  } catch (error) {
    console.error('Erro ao adicionar permissão ao usuário:', error);
    const message = error instanceof Error ? error.message : 'Erro ao adicionar permissão ao usuário';
    res.status(500).json({ error: message });
  }
});

/**
 * Remove uma permissão direta de um usuário
 * @route DELETE /api/permissions/user/:userId/permission/:permissionId
 */
router.delete('/user/:userId/permission/:permissionId', requirePermission('users', 'update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const permissionId = parseInt(req.params.permissionId, 10);
    
    if (isNaN(userId) || isNaN(permissionId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    // Parâmetros opcionais de instituição e polo
    const institutionId = req.query.institutionId ? parseInt(req.query.institutionId as string) : undefined;
    const poloId = req.query.poloId ? parseInt(req.query.poloId as string) : undefined;

    const success = await permissionService.removePermissionFromUser(userId, permissionId, institutionId, poloId);
    res.json({ success });
  } catch (error) {
    console.error('Erro ao remover permissão do usuário:', error);
    const message = error instanceof Error ? error.message : 'Erro ao remover permissão do usuário';
    res.status(500).json({ error: message });
  }
});

export default router;