/**
 * Middleware de autenticação e autorização para a aplicação
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Interface para estender Request com informações do usuário autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
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
export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acesso não autorizado. Faça login novamente.' 
    });
  }
  req.user = req.session.user;
  next();
};

/**
 * Versão simplificada para rotas que apenas exigem autenticação
 */
export const requireAuth = isAuthenticated;

/**
 * Middleware para verificar se o usuário tem uma determinada role
 * @param role Role necessária para acessar a rota
 */
export const hasRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso não autorizado. Faça login novamente.' 
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Você não tem permissão para acessar este recurso.' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário tem uma determinada role no portal
 * @param portalType Tipo de portal necessário para acessar a rota
 */
export const hasPortalAccess = (portalType: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso não autorizado. Faça login novamente.' 
      });
    }

    if (req.user.portalType !== portalType) {
      return res.status(403).json({ 
        success: false, 
        message: 'Você não tem permissão para acessar este portal.' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é estudante
 */
export const isStudent = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acesso não autorizado. Faça login novamente.' 
    });
  }

  if (req.user.portalType !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso permitido apenas para estudantes.' 
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário é administrador
 */
export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Acesso não autorizado. Faça login novamente.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso permitido apenas para administradores.' 
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário pertence a uma instituição
 */
export const belongsToInstitution = (institutionId: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso não autorizado. Faça login novamente.' 
      });
    }

    if (req.user.institutionId !== institutionId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Você não tem permissão para acessar recursos desta instituição.' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário pertence a um polo
 */
export const belongsToPolo = (poloId: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso não autorizado. Faça login novamente.' 
      });
    }

    if (req.user.poloId !== poloId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Você não tem permissão para acessar recursos deste polo.' 
      });
    }

    next();
  };
};

export default {
  isAuthenticated,
  requireAuth,
  hasRole,
  hasPortalAccess,
  isStudent,
  isAdmin,
  belongsToInstitution,
  belongsToPolo
};