/**
 * Middlewares de autenticação e autorização centralizados para o sistema
 * Este arquivo consolida todos os middlewares relacionados à autenticação
 */

import { Request, Response, NextFunction } from "express";

/**
 * Middleware para verificar se o usuário está autenticado
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void ou resposta de erro 401
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false,
      message: "Usuário não autenticado" 
    });
  }
  next();
};

/**
 * Middleware para garantir que o usuário seja um administrador
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void ou resposta de erro 403
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.portalType !== "admin") {
    return res.status(403).json({ 
      success: false,
      message: "Acesso restrito a administradores" 
    });
  }
  next();
};

/**
 * Middleware para garantir que o usuário seja um aluno
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void ou resposta de erro 403
 */
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.portalType !== "student") {
    return res.status(403).json({ 
      success: false,
      message: "Acesso restrito a alunos" 
    });
  }
  next();
};

/**
 * Middleware para garantir que o usuário seja um polo
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void ou resposta de erro 403
 */
export const requirePolo = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.portalType !== "polo") {
    return res.status(403).json({ 
      success: false,
      message: "Acesso restrito a polos" 
    });
  }
  next();
};

/**
 * Middleware para garantir que o usuário seja um parceiro
 * @param req Request do Express
 * @param res Response do Express
 * @param next Função next do Express
 * @returns void ou resposta de erro 403
 */
export const requirePartner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user.portalType !== "partner") {
    return res.status(403).json({ 
      success: false,
      message: "Acesso restrito a parceiros" 
    });
  }
  next();
};