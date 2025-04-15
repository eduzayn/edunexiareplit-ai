/**
 * Middleware para verificação de permissões
 */

import { Request, Response, NextFunction } from 'express';
import { checkUserPermission } from '../services/permission-service';

/**
 * Middleware para exigir permissão específica
 * @param resource Nome do recurso (ex: "users", "institutions", etc)
 * @param action Ação desejada (ex: "read", "create", "update", "delete", "manage")
 * @returns Middleware Express
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Autenticação necessária' });
      }

      const hasPermission = await checkUserPermission(req.user.id, resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Você não tem permissão para ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
  };
}

/**
 * Middleware para adicionar permissões do usuário no request
 * Útil para verificar permissões no frontend
 */
export async function attachPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    // Lista de permissões a serem verificadas e adicionadas ao request
    // Adicione aqui as permissões mais comuns usadas no frontend
    const permissionsToCheck = [
      { resource: 'users', action: 'manage' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      
      { resource: 'roles', action: 'manage' },
      { resource: 'roles', action: 'read' },
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'update' },
      { resource: 'roles', action: 'delete' },
      
      { resource: 'institutions', action: 'manage' },
      { resource: 'institutions', action: 'read' },
      { resource: 'institutions', action: 'create' },
      { resource: 'institutions', action: 'update' },
      { resource: 'institutions', action: 'delete' },
      
      { resource: 'polos', action: 'manage' },
      { resource: 'polos', action: 'read' },
      { resource: 'polos', action: 'create' },
      { resource: 'polos', action: 'update' },
      { resource: 'polos', action: 'delete' },
      
      { resource: 'courses', action: 'manage' },
      { resource: 'courses', action: 'read' },
      { resource: 'courses', action: 'create' },
      { resource: 'courses', action: 'update' },
      { resource: 'courses', action: 'delete' },
      
      { resource: 'enrollments', action: 'manage' },
      { resource: 'enrollments', action: 'read' },
      { resource: 'enrollments', action: 'create' },
      { resource: 'enrollments', action: 'update' },
      { resource: 'enrollments', action: 'delete' },
      
      { resource: 'financial_transactions', action: 'manage' },
      { resource: 'financial_transactions', action: 'read' },
      { resource: 'financial_transactions', action: 'create' },
      { resource: 'financial_transactions', action: 'update' },
      { resource: 'financial_transactions', action: 'delete' },
      
      { resource: 'leads', action: 'manage' },
      { resource: 'leads', action: 'read' },
      { resource: 'leads', action: 'create' },
      { resource: 'leads', action: 'update' },
      { resource: 'leads', action: 'delete' },
      
      { resource: 'clients', action: 'manage' },
      { resource: 'clients', action: 'read' },
      { resource: 'clients', action: 'create' },
      { resource: 'clients', action: 'update' },
      { resource: 'clients', action: 'delete' },
      
      { resource: 'invoices', action: 'manage' },
      { resource: 'invoices', action: 'read' },
      { resource: 'invoices', action: 'create' },
      { resource: 'invoices', action: 'update' },
      { resource: 'invoices', action: 'delete' },
      
      { resource: 'payments', action: 'manage' },
      { resource: 'payments', action: 'read' },
      { resource: 'payments', action: 'create' },
      { resource: 'payments', action: 'update' },
      { resource: 'payments', action: 'delete' },
      
      { resource: 'reports', action: 'manage' },
      { resource: 'reports', action: 'read' },
      
      { resource: 'settings', action: 'manage' },
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' },
    ];

    const userPermissions: Record<string, boolean> = {};

    // Verifica cada permissão
    for (const { resource, action } of permissionsToCheck) {
      const key = `${resource}:${action}`;
      userPermissions[key] = await checkUserPermission(req.user.id, resource, action);
    }

    // Adiciona as permissões verificadas ao request para uso nas rotas
    req.userPermissions = userPermissions;

    next();
  } catch (error) {
    console.error('Erro ao anexar permissões:', error);
    next();
  }
}

// Adiciona tipos ao Express Request
declare global {
  namespace Express {
    interface Request {
      userPermissions?: Record<string, boolean>;
    }
  }
}