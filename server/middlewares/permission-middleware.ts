/**
 * Middleware para verificação de permissões
 */

import { Request, Response, NextFunction } from 'express';
import * as permissionService from '../services/permission-service';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

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

  return await permissionService.checkUserPermission(req.user.id, resource, action);
}

/**
 * Middleware que verifica se o usuário tem a permissão necessária
 * @param resource Nome do recurso
 * @param action Ação requerida
 * @returns Middleware do Express
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    try {
      const hasAccess = await permissionService.checkUserPermission(req.user.id, resource, action);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado', 
          details: `Você não tem permissão para ${action} em ${resource}`
        });
      }
      
      next();
    } catch (error) {
      console.error(`Erro ao verificar permissão ${action}:${resource}:`, error);
      return res.status(500).json({ error: 'Erro ao verificar permissão' });
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

  const userRoles = await db.select({ name: schema.roles.name })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, req.user.id));

  const userRoleNames = userRoles.map(r => r.name);
  
  // Verificar se o usuário tem algum dos papéis especificados
  return roleNames.some(name => userRoleNames.includes(name));
}

/**
 * Middleware que verifica se o usuário tem pelo menos um dos papéis especificados
 * @param roleNames Nomes dos papéis necessários
 * @returns Middleware do Express
 */
export function requireRole(roleNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    try {
      const hasUserRole = await hasRole(req, roleNames);
      
      if (!hasUserRole) {
        return res.status(403).json({ 
          error: 'Acesso negado', 
          details: `É necessário um dos seguintes papéis: ${roleNames.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      return res.status(500).json({ error: 'Erro ao verificar papel do usuário' });
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    // Obter instituição do parâmetro ou query
    const institutionId = parseInt(req.params.institutionId || req.query.institutionId as string);
    
    if (isNaN(institutionId)) {
      return res.status(400).json({ error: 'ID de instituição inválido' });
    }

    try {
      // Verificar se o usuário é super_admin (acesso a tudo)
      const isSuperAdmin = await hasRole(req, ['super_admin']);
      if (isSuperAdmin) {
        return next();
      }

      // Verificar se o usuário é owner da instituição
      if (checkOwner) {
        const isOwner = await db.select({ id: schema.institutions.id })
          .from(schema.institutions)
          .where(
            and(
              eq(schema.institutions.id, institutionId),
              eq(schema.institutions.ownerId, req.user.id)
            )
          );
          
        if (isOwner.length > 0) {
          return next();
        }
      }

      // Verificar se o usuário tem papel na instituição
      const hasInstitutionRole = await db.select({ id: schema.userRoles.id })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoles.userId, req.user.id),
            eq(schema.userRoles.institutionId, institutionId),
            eq(schema.roles.scope, 'institution')
          )
        );
        
      if (hasInstitutionRole.length > 0) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem acesso a esta instituição'
      });
    } catch (error) {
      console.error('Erro ao verificar acesso à instituição:', error);
      return res.status(500).json({ error: 'Erro ao verificar acesso à instituição' });
    }
  };
}

/**
 * Middleware que verifica se o usuário tem acesso ao polo
 * @returns Middleware do Express
 */
export function requirePoloAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    // Obter polo do parâmetro ou query
    const poloId = parseInt(req.params.poloId || req.query.poloId as string);
    
    if (isNaN(poloId)) {
      return res.status(400).json({ error: 'ID de polo inválido' });
    }

    try {
      // Verificar se o usuário é super_admin (acesso a tudo)
      const isSuperAdmin = await hasRole(req, ['super_admin']);
      if (isSuperAdmin) {
        return next();
      }

      // Verificar se o usuário tem papel no polo
      const hasPoloRole = await db.select({ id: schema.userRoles.id })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(
          and(
            eq(schema.userRoles.userId, req.user.id),
            eq(schema.userRoles.poloId, poloId),
            eq(schema.roles.scope, 'polo')
          )
        );
        
      if (hasPoloRole.length > 0) {
        return next();
      }

      // Verificar se o usuário tem acesso à instituição deste polo
      const poloData = await db.select({ institutionId: schema.polos.institutionId })
        .from(schema.polos)
        .where(eq(schema.polos.id, poloId));

      if (poloData.length > 0) {
        const institutionId = poloData[0].institutionId;

        // Verificar se o usuário é owner da instituição
        const isOwner = await db.select({ id: schema.institutions.id })
          .from(schema.institutions)
          .where(
            and(
              eq(schema.institutions.id, institutionId),
              eq(schema.institutions.ownerId, req.user.id)
            )
          );
          
        if (isOwner.length > 0) {
          return next();
        }

        // Verificar se o usuário tem papel na instituição
        const hasInstitutionRole = await db.select({ id: schema.userRoles.id })
          .from(schema.userRoles)
          .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
          .where(
            and(
              eq(schema.userRoles.userId, req.user.id),
              eq(schema.userRoles.institutionId, institutionId),
              eq(schema.roles.scope, 'institution')
            )
          );
          
        if (hasInstitutionRole.length > 0) {
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Acesso negado', 
        details: 'Você não tem acesso a este polo'
      });
    } catch (error) {
      console.error('Erro ao verificar acesso ao polo:', error);
      return res.status(500).json({ error: 'Erro ao verificar acesso ao polo' });
    }
  };
}