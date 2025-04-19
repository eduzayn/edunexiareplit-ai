/**
 * Middleware auxiliar para debug de autenticação
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Este middleware imprime informações de autenticação no console
 * e continua a execução da requisição normalmente
 */
export function debugAuth(req: Request, res: Response, next: NextFunction) {
  console.log('--------------------------------');
  console.log('🔍 [DebugAuth] Request para:', req.originalUrl);
  console.log('🔍 [DebugAuth] Método:', req.method);
  console.log('🔍 [DebugAuth] isAuthenticated:', req.isAuthenticated());
  
  if (req.user) {
    console.log('🔍 [DebugAuth] User ID:', req.user.id);
    console.log('🔍 [DebugAuth] Username:', req.user.username);
    console.log('🔍 [DebugAuth] Portal Type:', req.user.portalType);
  } else {
    console.log('🔍 [DebugAuth] Usuário não disponível na sessão');
  }
  
  console.log('🔍 [DebugAuth] Cookie Header:', req.headers.cookie);
  console.log('🔍 [DebugAuth] Session ID:', req.sessionID);
  console.log('--------------------------------');
  
  next();
}