import express from 'express';
import { requireAuth } from '../auth';
import { requirePermission, requireSuperAdmin } from '../middlewares/permission-middleware';
import { db } from '../db';
import { 
  permissions, 
  roles, 
  rolePermissions, 
  userRoles
} from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  assignRoleToUser, 
  getUserPermissions, 
  getUserRoles, 
  removeRoleFromUser 
} from '../services/permission-service';

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

/**
 * Obter todas as permissões disponíveis no sistema
 * Requer: permissão 'read:permissions'
 */
router.get(
  '/permissions',
  requirePermission('permissions', 'read'),
  async (req, res) => {
    try {
      const allPermissions = await db.query.permissions.findMany({
        orderBy: (permissions, { asc }) => [
          asc(permissions.resource),
          asc(permissions.action)
        ]
      });

      res.json({
        success: true,
        data: allPermissions
      });
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar permissões'
      });
    }
  }
);

/**
 * Obter todos os papéis (roles) disponíveis
 * Requer: permissão 'read:roles'
 */
router.get(
  '/roles',
  requirePermission('roles', 'read'),
  async (req, res) => {
    try {
      const { institutionId } = req.query;
      
      let query = db.query.roles.findMany({
        orderBy: (roles, { asc }) => [
          asc(roles.name)
        ]
      });

      // Filtrar por instituição, se especificado
      if (institutionId) {
        query = db.query.roles.findMany({
          where: (roles, { eq, or, isNull }) => or(
            eq(roles.institutionId, Number(institutionId)),
            isNull(roles.institutionId) // Também incluir papéis do sistema
          ),
          orderBy: (roles, { asc }) => [
            asc(roles.name)
          ]
        });
      }

      const allRoles = await query;

      res.json({
        success: true,
        data: allRoles
      });
    } catch (error) {
      console.error('Erro ao buscar papéis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar papéis'
      });
    }
  }
);

/**
 * Obter um papel (role) específico e suas permissões
 * Requer: permissão 'read:roles'
 */
router.get(
  '/roles/:id',
  requirePermission('roles', 'read'),
  async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      
      // Buscar o papel
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Papel não encontrado'
        });
      }

      // Buscar permissões associadas ao papel
      const rolePerms = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action
        })
        .from(permissions)
        .innerJoin(
          rolePermissions,
          eq(permissions.id, rolePermissions.permissionId)
        )
        .where(eq(rolePermissions.roleId, roleId));

      res.json({
        success: true,
        data: {
          ...role,
          permissions: rolePerms
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do papel:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar detalhes do papel'
      });
    }
  }
);

/**
 * Criar um novo papel (role)
 * Requer: permissão 'create:roles'
 */
router.post(
  '/roles',
  requirePermission('roles', 'create'),
  async (req, res) => {
    try {
      const { name, description, institutionId, permissionIds } = req.body;

      // Validação de dados
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Nome e descrição são obrigatórios'
        });
      }

      // Verificar nome duplicado
      const existingRole = await db.query.roles.findFirst({
        where: and(
          eq(roles.name, name),
          institutionId 
            ? eq(roles.institutionId, institutionId)
            : undefined
        )
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um papel com este nome'
        });
      }

      // Criar o papel
      const result = await db.insert(roles).values({
        name,
        description,
        institutionId: institutionId ? Number(institutionId) : undefined,
        isSystem: false,
        createdById: req.user?.id
      }).returning();

      const newRole = result[0];

      // Se foram fornecidos IDs de permissões, associá-los ao papel
      if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
        // Verificar se todas as permissões existem
        const validPermissions = await db.query.permissions.findMany({
          where: inArray(permissions.id, permissionIds)
        });

        if (validPermissions.length !== permissionIds.length) {
          // Algumas permissões não existem, mas vamos continuar com as válidas
          console.warn('Algumas permissões especificadas não existem');
        }

        // Associar as permissões válidas ao papel
        const validPermissionIds = validPermissions.map(p => p.id);
        
        if (validPermissionIds.length > 0) {
          await db.insert(rolePermissions).values(
            validPermissionIds.map(permId => ({
              roleId: newRole.id,
              permissionId: permId,
              createdById: req.user?.id
            }))
          );
        }
      }

      res.status(201).json({
        success: true,
        data: newRole,
        message: 'Papel criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar papel:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar papel'
      });
    }
  }
);

/**
 * Atualizar um papel (role)
 * Requer: permissão 'update:roles'
 */
router.put(
  '/roles/:id',
  requirePermission('roles', 'update'),
  async (req, res) => {
    try {
      const roleId = Number(req.params.id);
      const { name, description, permissionIds } = req.body;

      // Buscar o papel
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Papel não encontrado'
        });
      }

      // Verificar se é um papel do sistema
      if (existingRole.isSystem && !req.user?.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Papéis do sistema só podem ser modificados por superadministradores'
        });
      }

      // Atualizar o papel
      if (name || description) {
        await db.update(roles)
          .set({
            name: name || existingRole.name,
            description: description || existingRole.description,
            updatedAt: new Date()
          })
          .where(eq(roles.id, roleId));
      }

      // Se foram fornecidos IDs de permissões, atualizar as associações
      if (permissionIds && Array.isArray(permissionIds)) {
        // Remover associações existentes
        await db.delete(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));

        // Se houver novas permissões, adicioná-las
        if (permissionIds.length > 0) {
          // Verificar se todas as permissões existem
          const validPermissions = await db.query.permissions.findMany({
            where: inArray(permissions.id, permissionIds)
          });

          // Associar as permissões válidas ao papel
          const validPermissionIds = validPermissions.map(p => p.id);
          
          if (validPermissionIds.length > 0) {
            await db.insert(rolePermissions).values(
              validPermissionIds.map(permId => ({
                roleId: roleId,
                permissionId: permId,
                createdById: req.user?.id
              }))
            );
          }
        }
      }

      res.json({
        success: true,
        message: 'Papel atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar papel'
      });
    }
  }
);

/**
 * Excluir um papel (role)
 * Requer: permissão 'delete:roles'
 */
router.delete(
  '/roles/:id',
  requirePermission('roles', 'delete'),
  async (req, res) => {
    try {
      const roleId = Number(req.params.id);

      // Buscar o papel
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.id, roleId)
      });

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Papel não encontrado'
        });
      }

      // Verificar se é um papel do sistema
      if (existingRole.isSystem && !req.user?.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Papéis do sistema não podem ser excluídos'
        });
      }

      // Verificar se o papel está em uso
      const roleUsage = await db.query.userRoles.findFirst({
        where: eq(userRoles.roleId, roleId)
      });

      if (roleUsage) {
        return res.status(400).json({
          success: false,
          message: 'Este papel está atribuído a usuários e não pode ser excluído'
        });
      }

      // Excluir associações com permissões
      await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // Excluir o papel
      await db.delete(roles)
        .where(eq(roles.id, roleId));

      res.json({
        success: true,
        message: 'Papel excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir papel:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir papel'
      });
    }
  }
);

/**
 * Obter permissões do usuário atual
 * Não requer permissão específica (usuário consulta suas próprias permissões)
 */
router.get(
  '/my-permissions',
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Opcionalmente, filtrar por instituição e polo
      const { institutionId, poloId } = req.query;
      const contextParams: {
        institutionId?: number;
        poloId?: number;
      } = {};

      if (institutionId) {
        contextParams.institutionId = Number(institutionId);
      }

      if (poloId) {
        contextParams.poloId = Number(poloId);
      }

      // Buscar permissões do usuário
      const userPermissions = await getUserPermissions(userId, contextParams);

      res.json({
        success: true,
        data: userPermissions
      });
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar permissões do usuário'
      });
    }
  }
);

/**
 * Obter papéis do usuário atual
 * Não requer permissão específica (usuário consulta seus próprios papéis)
 */
router.get(
  '/my-roles',
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Opcionalmente, filtrar por instituição e polo
      const { institutionId, poloId } = req.query;
      const contextParams: {
        institutionId?: number;
        poloId?: number;
      } = {};

      if (institutionId) {
        contextParams.institutionId = Number(institutionId);
      }

      if (poloId) {
        contextParams.poloId = Number(poloId);
      }

      // Buscar papéis do usuário
      const userRoles = await getUserRoles(userId, contextParams);

      res.json({
        success: true,
        data: userRoles
      });
    } catch (error) {
      console.error('Erro ao buscar papéis do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar papéis do usuário'
      });
    }
  }
);

/**
 * Obter papéis de um usuário específico
 * Requer: permissão 'read:users'
 */
router.get(
  '/users/:userId/roles',
  requirePermission('users', 'read'),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      
      // Opcionalmente, filtrar por instituição e polo
      const { institutionId, poloId } = req.query;
      const contextParams: {
        institutionId?: number;
        poloId?: number;
      } = {};

      if (institutionId) {
        contextParams.institutionId = Number(institutionId);
      }

      if (poloId) {
        contextParams.poloId = Number(poloId);
      }

      // Buscar papéis do usuário
      const userRoles = await getUserRoles(userId, contextParams);

      res.json({
        success: true,
        data: userRoles
      });
    } catch (error) {
      console.error('Erro ao buscar papéis do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar papéis do usuário'
      });
    }
  }
);

/**
 * Atribuir papel a um usuário
 * Requer: permissão 'update:users'
 */
router.post(
  '/users/:userId/roles',
  requirePermission('users', 'update'),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const { roleId, institutionId, poloId } = req.body;

      // Validação de dados
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: 'ID do papel é obrigatório'
        });
      }

      // Atribuir papel ao usuário
      const success = await assignRoleToUser(
        userId,
        Number(roleId),
        {
          institutionId: institutionId ? Number(institutionId) : undefined,
          poloId: poloId ? Number(poloId) : undefined,
          createdById: req.user?.id || 0
        }
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível atribuir o papel ao usuário'
        });
      }

      res.json({
        success: true,
        message: 'Papel atribuído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atribuir papel ao usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atribuir papel ao usuário'
      });
    }
  }
);

/**
 * Remover papel de um usuário
 * Requer: permissão 'update:users'
 */
router.delete(
  '/users/:userId/roles/:roleId',
  requirePermission('users', 'update'),
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const roleId = Number(req.params.roleId);
      const { institutionId, poloId } = req.query;

      // Remover papel do usuário
      const success = await removeRoleFromUser(
        userId,
        roleId,
        {
          institutionId: institutionId ? Number(institutionId) : undefined,
          poloId: poloId ? Number(poloId) : undefined
        }
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível remover o papel do usuário'
        });
      }

      res.json({
        success: true,
        message: 'Papel removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover papel do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover papel do usuário'
      });
    }
  }
);

export default router;