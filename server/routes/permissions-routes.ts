/**
 * Rotas para gerenciamento de permissões e papéis
 */

import express from 'express';
import * as permissionService from '../services/permission-service';
import { requireAuth } from '../middlewares/requireAuth';
import { requirePermission } from '../middlewares/permission-middleware';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { and, eq } from 'drizzle-orm';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os papéis
router.get('/roles', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roles = await db.select({
      id: schema.roles.id,
      name: schema.roles.name,
      description: schema.roles.description,
      scope: schema.roles.scope,
      isSystem: schema.roles.isSystem,
      institutionId: schema.roles.institutionId,
      createdAt: schema.roles.createdAt,
      updatedAt: schema.roles.updatedAt
    }).from(schema.roles);

    return res.json(roles);
  } catch (error) {
    console.error('Erro ao listar papéis:', error);
    return res.status(500).json({ error: 'Erro ao listar papéis' });
  }
});

// Obter papel por ID
router.get('/roles/:id', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }
    
    const role = await db.select({
      id: schema.roles.id,
      name: schema.roles.name,
      description: schema.roles.description,
      scope: schema.roles.scope,
      isSystem: schema.roles.isSystem,
      institutionId: schema.roles.institutionId,
      createdAt: schema.roles.createdAt,
      updatedAt: schema.roles.updatedAt
    })
    .from(schema.roles)
    .where(eq(schema.roles.id, roleId));
    
    if (role.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    return res.json(role[0]);
  } catch (error) {
    console.error('Erro ao obter papel:', error);
    return res.status(500).json({ error: 'Erro ao obter papel' });
  }
});

// Criar novo papel (apenas admin)
router.post('/roles', requirePermission('roles', 'create'), async (req, res) => {
  try {
    const { name, description, scope, institutionId } = req.body;
    
    if (!name || !description || !scope) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar se scope é válido
    if (!['global', 'institution', 'polo'].includes(scope)) {
      return res.status(400).json({ error: 'Escopo inválido' });
    }
    
    // Verificar se já existe papel com este nome
    const existingRole = await db.select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.name, name));
    
    if (existingRole.length > 0) {
      return res.status(409).json({ error: 'Já existe um papel com este nome' });
    }
    
    // Inserir o papel
    const [newRole] = await db.insert(schema.roles)
      .values({
        name,
        description,
        scope,
        isSystem: false,
        institutionId: institutionId || null,
        createdById: req.user?.id || null
      })
      .returning({
        id: schema.roles.id,
        name: schema.roles.name,
        description: schema.roles.description,
        scope: schema.roles.scope
      });
    
    return res.status(201).json(newRole);
  } catch (error) {
    console.error('Erro ao criar papel:', error);
    return res.status(500).json({ error: 'Erro ao criar papel' });
  }
});

// Atualizar papel por ID (apenas admin)
router.put('/roles/:id', requirePermission('roles', 'update'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, description } = req.body;
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar se o papel existe
    const existingRole = await db.select({ id: schema.roles.id, isSystem: schema.roles.isSystem })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Não permitir alterar papéis do sistema
    if (existingRole[0].isSystem) {
      return res.status(403).json({ error: 'Não é possível alterar papéis do sistema' });
    }
    
    // Atualizar o papel
    const [updatedRole] = await db.update(schema.roles)
      .set({
        name,
        description,
        updatedAt: new Date()
      })
      .where(eq(schema.roles.id, roleId))
      .returning({
        id: schema.roles.id,
        name: schema.roles.name,
        description: schema.roles.description,
        scope: schema.roles.scope
      });
    
    return res.json(updatedRole);
  } catch (error) {
    console.error('Erro ao atualizar papel:', error);
    return res.status(500).json({ error: 'Erro ao atualizar papel' });
  }
});

// Remover papel por ID (apenas admin)
router.delete('/roles/:id', requirePermission('roles', 'delete'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }
    
    // Verificar se o papel existe
    const existingRole = await db.select({ id: schema.roles.id, isSystem: schema.roles.isSystem })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Não permitir remover papéis do sistema
    if (existingRole[0].isSystem) {
      return res.status(403).json({ error: 'Não é possível remover papéis do sistema' });
    }
    
    // Remover associações do papel com permissões
    await db.delete(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));
    
    // Remover associações do papel com usuários
    await db.delete(schema.userRoles)
      .where(eq(schema.userRoles.roleId, roleId));
    
    // Remover o papel
    await db.delete(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    return res.json({ success: true, message: 'Papel removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover papel:', error);
    return res.status(500).json({ error: 'Erro ao remover papel' });
  }
});

// Listar permissões de um papel
router.get('/roles/:id/permissions', requirePermission('roles', 'read'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }
    
    // Verificar se o papel existe
    const existingRole = await db.select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Buscar permissões do papel
    const permissions = await db.select({
      id: schema.permissions.id,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
      description: schema.permissions.description
    })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.rolePermissions.roleId, roleId));
    
    return res.json(permissions);
  } catch (error) {
    console.error('Erro ao listar permissões do papel:', error);
    return res.status(500).json({ error: 'Erro ao listar permissões do papel' });
  }
});

// Atribuir permissão a um papel
router.post('/roles/:id/permissions', requirePermission('roles', 'manage'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { permissionIds } = req.body;
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: 'ID de papel inválido' });
    }
    
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs de permissões inválida' });
    }
    
    // Verificar se o papel existe
    const existingRole = await db.select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Verificar se todas as permissões existem
    const existingPermissions = await db.select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(schema.permissions.id.in(permissionIds));
    
    if (existingPermissions.length !== permissionIds.length) {
      return res.status(400).json({ error: 'Uma ou mais permissões não existem' });
    }
    
    // Buscar permissões já associadas
    const existingAssociations = await db.select({ permissionId: schema.rolePermissions.permissionId })
      .from(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, roleId),
          schema.rolePermissions.permissionId.in(permissionIds)
        )
      );
    
    // Filtrar apenas permissões que ainda não estão associadas
    const existingPermissionIds = existingAssociations.map(a => a.permissionId);
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
    
    // Inserir novas associações
    if (newPermissionIds.length > 0) {
      const valuesToInsert = newPermissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      
      await db.insert(schema.rolePermissions)
        .values(valuesToInsert);
    }
    
    return res.json({ 
      success: true, 
      message: `${newPermissionIds.length} permissões atribuídas ao papel com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao atribuir permissões ao papel:', error);
    return res.status(500).json({ error: 'Erro ao atribuir permissões ao papel' });
  }
});

// Remover permissão de um papel
router.delete('/roles/:roleId/permissions/:permissionId', requirePermission('roles', 'manage'), async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const permissionId = parseInt(req.params.permissionId);
    
    if (isNaN(roleId) || isNaN(permissionId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }
    
    // Verificar se o papel existe
    const existingRole = await db.select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));
    
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Papel não encontrado' });
    }
    
    // Remover a associação
    await db.delete(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, roleId),
          eq(schema.rolePermissions.permissionId, permissionId)
        )
      );
    
    return res.json({ success: true, message: 'Permissão removida do papel com sucesso' });
  } catch (error) {
    console.error('Erro ao remover permissão do papel:', error);
    return res.status(500).json({ error: 'Erro ao remover permissão do papel' });
  }
});

// Listar todas as permissões
router.get('/permissions', requirePermission('permissions', 'read'), async (req, res) => {
  try {
    const permissions = await db.select({
      id: schema.permissions.id,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
      description: schema.permissions.description
    }).from(schema.permissions);
    
    return res.json(permissions);
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    return res.status(500).json({ error: 'Erro ao listar permissões' });
  }
});

// Atribuir papel a um usuário
router.post('/users/:userId/roles', requirePermission('users', 'manage'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roleId, institutionId, poloId } = req.body;
    
    if (isNaN(userId) || !roleId) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    try {
      const userRoleId = await permissionService.assignRoleToUser(
        userId, 
        roleId, 
        institutionId, 
        poloId
      );
      
      return res.status(201).json({ 
        success: true, 
        message: 'Papel atribuído ao usuário com sucesso',
        userRoleId
      });
    } catch (err) {
      if (err instanceof Error) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  } catch (error) {
    console.error('Erro ao atribuir papel ao usuário:', error);
    return res.status(500).json({ error: 'Erro ao atribuir papel ao usuário' });
  }
});

// Remover papel de um usuário
router.delete('/users/:userId/roles/:roleId', requirePermission('users', 'manage'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleId = parseInt(req.params.roleId);
    const { institutionId, poloId } = req.body;
    
    if (isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }
    
    await permissionService.removeRoleFromUser(userId, roleId, institutionId, poloId);
    
    return res.json({ 
      success: true, 
      message: 'Papel removido do usuário com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao remover papel do usuário:', error);
    return res.status(500).json({ error: 'Erro ao remover papel do usuário' });
  }
});

// Listar papéis de um usuário
router.get('/users/:userId/roles', requirePermission('users', 'read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    const userRoles = await permissionService.getUserRoles(userId);
    
    return res.json(userRoles);
  } catch (error) {
    console.error('Erro ao listar papéis do usuário:', error);
    return res.status(500).json({ error: 'Erro ao listar papéis do usuário' });
  }
});

// Listar permissões de um usuário
router.get('/users/:userId/permissions', requirePermission('users', 'read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    const userPermissions = await permissionService.getUserPermissions(userId);
    
    return res.json(userPermissions);
  } catch (error) {
    console.error('Erro ao listar permissões do usuário:', error);
    return res.status(500).json({ error: 'Erro ao listar permissões do usuário' });
  }
});

// Obter informações do usuário atualmente autenticado (self)
router.get('/me/roles', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const userRoles = await permissionService.getUserRoles(userId);
    
    return res.json(userRoles);
  } catch (error) {
    console.error('Erro ao listar papéis do usuário:', error);
    return res.status(500).json({ error: 'Erro ao listar papéis do usuário' });
  }
});

// Obter permissões do usuário atualmente autenticado (self)
router.get('/me/permissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const userPermissions = await permissionService.getUserPermissions(userId);
    
    return res.json(userPermissions);
  } catch (error) {
    console.error('Erro ao listar permissões do usuário:', error);
    return res.status(500).json({ error: 'Erro ao listar permissões do usuário' });
  }
});

// Verificar se o usuário atual tem uma permissão específica
router.get('/me/check-permission', requireAuth, async (req, res) => {
  try {
    const { resource, action } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    if (!resource || !action || typeof resource !== 'string' || typeof action !== 'string') {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    
    const hasPermission = await permissionService.checkUserPermission(userId, resource, action);
    
    return res.json({ hasPermission });
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
});

export default router;