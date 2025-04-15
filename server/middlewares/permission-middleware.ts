/**
 * Middleware para verificação de permissões
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Verifica se o usuário tem uma permissão específica
 * @param req Request do Express
 * @param resource Nome do recurso
 * @param action Ação a ser verificada
 * @returns Promise<boolean>
 */
export async function hasPermission(req: Request, resource: string, action: string): Promise<boolean> {
  if (!req.user || !req.user.id) {
    return false;
  }

  // Verificar se o usuário é super_admin (tem todas as permissões)
  const superAdminCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, req.user.id),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdminCheck.length > 0) {
    return true;
  }

  // Consulta para verificar se o usuário tem a permissão específica através de seus papéis
  const permissionCheck = await db.select({
    permissionId: schema.rolePermissions.permissionId
  })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.userRoles.userId, req.user.id),
        eq(schema.permissions.resource, resource),
        eq(schema.permissions.action, action)
      )
    );

  // Verificar também se o usuário tem a permissão 'manage' para o recurso
  const managePermissionCheck = await db.select({
    permissionId: schema.rolePermissions.permissionId
  })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.userRoles.userId, req.user.id),
        eq(schema.permissions.resource, resource),
        eq(schema.permissions.action, 'manage')
      )
    );

  return permissionCheck.length > 0 || managePermissionCheck.length > 0;
}

/**
 * Middleware que verifica se o usuário tem a permissão necessária
 * @param resource Nome do recurso
 * @param action Ação requerida
 * @returns Middleware do Express
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const hasAccess = await hasPermission(req, resource, action);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado', 
          message: `Você não tem permissão para ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Verifica se o usuário tem pelo menos um dos papéis especificados
 * @param req Request do Express
 * @param roleNames Nomes dos papéis a verificar
 * @returns Promise<boolean>
 */
export async function hasRole(req: Request, roleNames: string[]): Promise<boolean> {
  if (!req.user || !req.user.id) {
    return false;
  }

  const rolesCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, req.user.id),
        sql`${schema.roles.name} IN (${roleNames.join(',')})`
      )
    );

  return rolesCheck.length > 0;
}

/**
 * Middleware que verifica se o usuário tem pelo menos um dos papéis especificados
 * @param roleNames Nomes dos papéis necessários
 * @returns Middleware do Express
 */
export function requireRole(roleNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const hasAccess = await hasRole(req, roleNames);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado', 
          message: `Você precisa ter um dos seguintes papéis: ${roleNames.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar papel:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware que verifica se o usuário é owner da instituição ou tem um papel de instituição
 * @param checkOwner Verificar se é proprietário da instituição
 * @returns Middleware do Express
 */
export function requireInstitutionAccess(checkOwner = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se é super_admin (tem acesso global)
      const isSuperAdmin = await hasRole(req, ['super_admin']);
      
      if (isSuperAdmin) {
        return next();
      }
      
      const institutionId = parseInt(req.params.institutionId || req.body.institutionId);
      
      if (!institutionId) {
        return res.status(400).json({ error: 'ID da instituição não fornecido' });
      }
      
      // Verificar se é proprietário da instituição
      if (checkOwner) {
        const institutionOwnerCheck = await db.select({ id: schema.institutions.id })
          .from(schema.institutions)
          .where(
            and(
              eq(schema.institutions.id, institutionId),
              eq(schema.institutions.ownerId, req.user.id)
            )
          );
        
        if (institutionOwnerCheck.length > 0) {
          return next();
        }
      }
      
      // Verificar se tem papel de instituição
      const institutionRoleCheck = await db.select({ id: schema.userRoles.id })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoles.userId, req.user.id),
            eq(schema.userRoles.institutionId, institutionId),
            eq(schema.roles.scope, 'institution')
          )
        );
      
      if (institutionRoleCheck.length > 0) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem acesso a esta instituição'
      });
      
    } catch (error) {
      console.error('Erro ao verificar acesso à instituição:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

/**
 * Middleware que verifica se o usuário tem acesso ao polo
 * @returns Middleware do Express
 */
export function requirePoloAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se é super_admin (tem acesso global)
      const isSuperAdmin = await hasRole(req, ['super_admin']);
      
      if (isSuperAdmin) {
        return next();
      }
      
      const poloId = parseInt(req.params.poloId || req.body.poloId);
      
      if (!poloId) {
        return res.status(400).json({ error: 'ID do polo não fornecido' });
      }
      
      // Verificar se tem papel no polo
      const poloRoleCheck = await db.select({ id: schema.userRoles.id })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoles.userId, req.user.id),
            eq(schema.userRoles.poloId, poloId),
            eq(schema.roles.scope, 'polo')
          )
        );
      
      if (poloRoleCheck.length > 0) {
        return next();
      }
      
      // Verificar se tem acesso à instituição deste polo
      const poloData = await db.select({ institutionId: schema.polos.institutionId })
        .from(schema.polos)
        .where(eq(schema.polos.id, poloId));
      
      if (poloData.length > 0) {
        const institutionId = poloData[0].institutionId;
        
        const institutionRoleCheck = await db.select({ id: schema.userRoles.id })
          .from(schema.userRoles)
          .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
          .where(
            and(
              eq(schema.userRoles.userId, req.user.id),
              eq(schema.userRoles.institutionId, institutionId),
              eq(schema.roles.scope, 'institution')
            )
          );
        
        if (institutionRoleCheck.length > 0) {
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado', 
        message: 'Você não tem acesso a este polo'
      });
      
    } catch (error) {
      console.error('Erro ao verificar acesso ao polo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}