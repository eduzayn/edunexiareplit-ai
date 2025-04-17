import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Verifica se existe uma sessão e se o usuário está logado
  if (!req.session || !req.session.user) {
    logger.debug('Acesso não autorizado: Usuário não está logado');
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // Define o usuário na requisição
  req.user = req.session.user;
  next();
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
    if (!roles.includes(req.user.role)) {
      logger.debug(`Acesso negado: Usuário ${req.user.id} (${req.user.email}) não tem permissão. Role atual: ${req.user.role}, Roles necessárias: ${roles.join(', ')}`);
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para acessar este recurso' });
    }

    next();
  };
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