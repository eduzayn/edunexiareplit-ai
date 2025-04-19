/**
 * Middleware para autenticação
 */

import { Request, Response, NextFunction } from 'express';

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

/**
 * Middleware para verificar se o usuário é um administrador
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  console.log('⚠️ [Auth Debug] isAuthenticated:', req.isAuthenticated());
  console.log('⚠️ [Auth Debug] req.user:', req.user);
  console.log('⚠️ [Auth Debug] cookies:', req.headers.cookie);
  
  if (!req.isAuthenticated() || !req.user || req.user.portalType !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a administradores',
      debug: {
        isAuthenticated: req.isAuthenticated(),
        user: req.user || 'Nenhum usuário na sessão',
        cookies: req.headers.cookie || 'Nenhum cookie encontrado'
      }
    });
  }
  
  console.log('⚠️ [Auth Debug] Acesso admin autorizado para:', req.user.username);
  next();
}

/**
 * Middleware para verificar se o usuário é um estudante
 */
export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user || req.user.portalType !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a estudantes'
    });
  }
  
  next();
}

/**
 * Middleware para verificar se o usuário é um parceiro
 */
export function requirePartner(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user || req.user.portalType !== 'partner') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a parceiros'
    });
  }
  
  next();
}

/**
 * Middleware para verificar se o usuário é um polo
 */
export function requirePolo(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user || req.user.portalType !== 'polo') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso restrito a polos'
    });
  }
  
  next();
}