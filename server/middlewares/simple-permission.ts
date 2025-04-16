/**
 * Middleware simples para verificação de permissões
 * É um substituto temporário para o sistema completo RBAC/ABAC
 * enquanto reconstruímos o módulo de leads.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar permissão em recursos
 * @param resource Nome do recurso a ser acessado
 * @param action Ação a ser executada (read, write, etc.)
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // No modo de reconstrução, apenas verificamos se o usuário é admin
    if (req.user.portalType === 'admin') {
      return next();
    }
    
    return res.status(403).json({
      error: 'Acesso negado',
      message: `Você não tem permissão para ${action} ${resource}`
    });
  };
}