/**
 * Middleware para verificação de autenticação
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar se o usuário está autenticado
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  next();
}