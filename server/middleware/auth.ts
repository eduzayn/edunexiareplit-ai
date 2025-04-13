import { Request, Response, NextFunction } from "express";

// Middleware para garantir que o usuário esteja autenticado
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
};

// Middleware para garantir que o usuário seja um administrador
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user?.portalType !== "admin") {
    return res.status(403).json({ message: "Acesso restrito a administradores" });
  }
  next();
};

// Middleware para garantir que o usuário seja um estudante
export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user?.portalType !== "student") {
    return res.status(403).json({ message: "Acesso restrito a alunos" });
  }
  next();
};

// Middleware para garantir que o usuário seja um parceiro
export const requirePartner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user?.portalType !== "partner") {
    return res.status(403).json({ message: "Acesso restrito a parceiros" });
  }
  next();
};

// Middleware para garantir que o usuário seja um polo
export const requirePolo = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || req.user?.portalType !== "polo") {
    return res.status(403).json({ message: "Acesso restrito a polos" });
  }
  next();
};