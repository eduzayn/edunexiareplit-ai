import { Request, Response, NextFunction } from "express";

/**
 * Middleware para verificar se o usuário está autenticado
 * @param req Requisição Express
 * @param res Resposta Express
 * @param next Função next
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Se não estiver autenticado, retorna erro 401
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Não autorizado. Faça login para continuar."
    });
  }
  
  next();
};

/**
 * Middleware para verificar se o usuário é um estudante
 * @param req Requisição Express
 * @param res Resposta Express
 * @param next Função next
 */
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  // Primeiro verifica se está autenticado
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Não autorizado. Faça login para continuar."
    });
  }
  
  // Verifica se é um estudante
  if (!req.user || req.user.portalType !== 'aluno') {
    return res.status(403).json({
      error: "Acesso negado. Apenas estudantes podem acessar este recurso."
    });
  }
  
  next();
};

export default {
  requireAuth,
  requireStudent
};