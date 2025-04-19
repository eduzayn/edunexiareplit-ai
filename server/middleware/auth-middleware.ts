import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
    portalType?: string;
    institutionId?: number;
    poloId?: number;
    cpf?: string;
    profileId?: number;
    metadata?: any;
  };
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
      return res.status(401).json({ success: false, message: 'Autenticação necessária' });
    }
    
    if (!req.user) {
      logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
      return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
    }
    
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
 * Middleware para verificar se o usuário tem uma determinada role
 * @param roles Lista de roles permitidas
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.debug('Acesso não autorizado: Usuário não está logado');
      return res.status(401).json({ message: 'Acesso não autorizado' });
    }

    // Verifica se o usuário tem uma das roles especificadas
    if (!roles.includes(req.user.role || '')) {
      logger.debug(`Acesso negado: Usuário ${req.user.id} não tem permissão. Role atual: ${req.user.role}, Roles necessárias: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
    }
    next();
  };
};

/**
 * Middleware para verificar se o usuário é um administrador
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
    return res.status(401).json({ success: false, message: 'Autenticação necessária' });
  }
  
  if (!req.user) {
    logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
    return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
  }
  
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
 * Middleware para verificar se o usuário está no portal do estudante
 */
export const requireStudentPortal = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.debug('Acesso não autorizado: Usuário não está logado');
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // Verifica se o usuário está acessando o portal estudante
  if (req.user.portalType !== 'student') {
    logger.debug(`Acesso negado: Usuário ${req.user.id} não está no portal do estudante. Portal atual: ${req.user.portalType}`);
    return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário é um estudante
 */
export const requireStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    logger.warn('[Auth Middleware] Acesso não autenticado rejeitado');
    return res.status(401).json({ success: false, message: 'Autenticação necessária' });
  }
  
  if (!req.user) {
    logger.error('[Auth Middleware] Sessão autenticada mas sem dados do usuário');
    return res.status(401).json({ success: false, message: 'Dados de usuário não encontrados' });
  }
  
  if (req.user.portalType !== 'student') {
    logger.warn(`[Auth Middleware] Acesso negado para usuário do portal ${req.user.portalType} tentando acessar rota de estudante`);
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso não autorizado. Esta funcionalidade é exclusiva para estudantes.' 
    });
  }
  next();
};

/**
 * Middleware para verificar se o usuário está no portal do polo
 */
export const requirePoloPortal = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.debug('Acesso não autorizado: Usuário não está logado');
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // Verifica se o usuário está acessando o portal do polo
  if (req.user.portalType !== 'polo') {
    logger.debug(`Acesso negado: Usuário ${req.user.id} não está no portal do polo. Portal atual: ${req.user.portalType}`);
    return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário está no portal admin
 */
export const requireAdminPortal = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.debug('Acesso não autorizado: Usuário não está logado');
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // Verifica se o usuário está acessando o portal admin
  if (req.user.portalType !== 'admin') {
    logger.debug(`Acesso negado: Usuário ${req.user.id} não está no portal admin. Portal atual: ${req.user.portalType}`);
    return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário está no portal da instituição
 */
export const requireInstitutionPortal = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.debug('Acesso não autorizado: Usuário não está logado');
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // Verifica se o usuário está acessando o portal da instituição
  if (req.user.portalType !== 'institution') {
    logger.debug(`Acesso negado: Usuário ${req.user.id} não está no portal da instituição. Portal atual: ${req.user.portalType}`);
    return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
  }
  next();
};