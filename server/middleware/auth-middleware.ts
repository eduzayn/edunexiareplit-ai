import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para verificar se o usuário está autenticado
 * @param req Requisição Express
 * @param res Resposta Express
 * @param next Função para passar para o próximo middleware
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
    return res.status(401).json({ success: false, message: 'Autenticação necessária' });
  }
  
  if (!req.user) {
    logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
    return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário tem um tipo específico de portal
 * @param portalType Tipo de portal permitido ("admin", "student", "polo", "partner", etc)
 */
export const requirePortalType = (portalType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
      return res.status(401).json({ success: false, message: 'Autenticação necessária' });
    }
    
    if (!req.user) {
      logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
      return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
    }
    
    // @ts-ignore - O TypeScript não reconhece a propriedade portalType, mas ela existe no objeto de usuário
    if (req.user.portalType !== portalType) {
      logger.warn(`[Auth Middleware] Acesso negado para usuário do portal ${req.user.portalType} tentando acessar rota do portal ${portalType}`);
      return res.status(403).json({ 
        success: false, 
        message: `Acesso não autorizado. Esta funcionalidade é exclusiva para o portal ${portalType}.` 
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar se o usuário é um administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
    return res.status(401).json({ success: false, message: 'Autenticação necessária' });
  }
  
  if (!req.user) {
    logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
    return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
  }
  
  // @ts-ignore - O TypeScript não reconhece a propriedade portalType, mas ela existe no objeto de usuário
  if (req.user.portalType !== 'admin') {
    logger.warn(`[Auth Middleware] Acesso negado para usuário do portal ${req.user.portalType} tentando acessar rota de administrador`);
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso não autorizado. Esta funcionalidade é exclusiva para administradores.' 
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário é um estudante
 */
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
    return res.status(401).json({ success: false, message: 'Autenticação necessária' });
  }
  
  if (!req.user) {
    logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
    return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
  }
  
  // @ts-ignore - O TypeScript não reconhece a propriedade portalType, mas ela existe no objeto de usuário
  if (req.user.portalType !== 'student') {
    logger.warn(`[Auth Middleware] Acesso negado para usuário do portal ${req.user.portalType} tentando acessar rota de estudante`);
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso não autorizado. Esta funcionalidade é exclusiva para estudantes.' 
    });
  }
  
  next();
};