/**
 * Middleware para verificação de permissões
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { permissions, userRoles, roles, rolePermissions } from '../../shared/schema';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Middleware para verificar se o usuário tem a permissão especificada
 * @param permissionCode Código da permissão necessária (ex: 'matricula:ler')
 * @returns Middleware do Express
 */
export function hasPermission(permissionCode: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar autenticação
      if (!req.isAuthenticated() || !req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado'
        });
      }
      
      const userId = req.user.id;
      
      // Para super_admin, sempre concede acesso
      if (req.user.username === 'admin' || req.user.role === 'super_admin') {
        console.log(`Usuário ${userId} é super_admin, acesso garantido para ${permissionCode}`);
        return next();
      }
      
      // Verificar se o usuário possui papéis (roles)
      const userRolesList = await db
        .select({
          roleId: userRoles.roleId
        })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      
      if (!userRolesList.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuário não possui papéis (roles) atribuídos'
        });
      }
      
      // Extrair IDs dos papéis do usuário
      const roleIds = userRolesList.map(ur => ur.roleId);
      
      // Verificar se algum dos papéis possui a permissão necessária
      const permissionQuery = await db
        .select({
          permissionId: permissions.id,
          permissionCode: permissions.code
        })
        .from(permissions)
        .where(eq(permissions.code, permissionCode));
      
      if (!permissionQuery.length) {
        console.warn(`A permissão "${permissionCode}" não existe no sistema`);
        return res.status(403).json({ 
          success: false, 
          message: `Permissão "${permissionCode}" não encontrada no sistema`
        });
      }
      
      const permissionId = permissionQuery[0].permissionId;
      
      // Buscar nas permissões de papel
      const rolePermissionExists = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            inArray(rolePermissions.roleId, roleIds),
            eq(rolePermissions.permissionId, permissionId)
          )
        )
        .limit(1);
      
      if (rolePermissionExists.length) {
        return next();
      }
      
      // Se chegou aqui, o usuário não tem a permissão necessária
      return res.status(403).json({ 
        success: false, 
        message: `Acesso negado: permissão "${permissionCode}" requerida`
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao verificar permissões do usuário'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário tem alguma das permissões especificadas
 * @param permissionCodes Lista de códigos de permissão (ex: ['matricula:ler', 'matricula:criar'])
 * @returns Middleware do Express
 */
export function hasAnyPermission(permissionCodes: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar autenticação
      if (!req.isAuthenticated() || !req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado'
        });
      }
      
      const userId = req.user.id;
      
      // Para super_admin, sempre concede acesso
      if (req.user.username === 'admin' || req.user.role === 'super_admin') {
        console.log(`Usuário ${userId} é super_admin, acesso garantido para qualquer permissão`);
        return next();
      }
      
      // Verificar se o usuário possui papéis (roles)
      const userRolesList = await db
        .select({
          roleId: userRoles.roleId
        })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      
      if (!userRolesList.length) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuário não possui papéis (roles) atribuídos'
        });
      }
      
      // Extrair IDs dos papéis do usuário
      const roleIds = userRolesList.map(ur => ur.roleId);
      
      // Verificar se algum dos papéis possui alguma das permissões necessárias
      const permissionQuery = await db
        .select({
          permissionId: permissions.id,
          permissionCode: permissions.code
        })
        .from(permissions)
        .where(inArray(permissions.code, permissionCodes));
      
      if (!permissionQuery.length) {
        console.warn(`Nenhuma das permissões necessárias existe no sistema`);
        return res.status(403).json({ 
          success: false, 
          message: `Permissões necessárias não encontradas no sistema`
        });
      }
      
      const permissionIds = permissionQuery.map(p => p.permissionId);
      
      // Buscar nas permissões de papel
      const rolePermissionExists = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            inArray(rolePermissions.roleId, roleIds),
            inArray(rolePermissions.permissionId, permissionIds)
          )
        )
        .limit(1);
      
      if (rolePermissionExists.length) {
        return next();
      }
      
      // Se chegou aqui, o usuário não tem nenhuma das permissões necessárias
      return res.status(403).json({ 
        success: false, 
        message: `Acesso negado: uma das permissões [${permissionCodes.join(', ')}] é requerida`
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao verificar permissões do usuário'
      });
    }
  };
}

/**
 * Middleware para verificar se o usuário é um administrador
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user || req.user.portalType !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a administradores'
    });
  }
  
  next();
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Não autorizado'
    });
  }
  
  next();
}