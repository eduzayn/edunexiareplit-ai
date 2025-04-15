import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../services/permission-service';
import { PermissionAction, PermissionResource } from '@shared/types';

/**
 * Middleware para verificação de permissões
 * @param resource Recurso que está sendo acessado
 * @param action Ação que está sendo executada
 * @param options Opções adicionais para verificação de permissão
 * @returns Middleware de Express
 */
export function requirePermission(
  resource: PermissionResource,
  action: PermissionAction,
  options: {
    institutionIdParam?: string;
    poloIdParam?: string;
    checkOwnedResource?: boolean;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const userId = req.user.id;
      
      // Determinar parâmetros de contexto
      const contextParams: {
        institutionId?: number;
        poloId?: number;
        ownedResource?: boolean;
      } = {};

      // Obter ID da instituição de parâmetros, query ou do próprio usuário
      if (options.institutionIdParam) {
        const paramValue = 
          req.params[options.institutionIdParam] || 
          req.query[options.institutionIdParam];
        
        if (paramValue) {
          contextParams.institutionId = Number(paramValue);
        } else if (req.user.institutionId) {
          contextParams.institutionId = req.user.institutionId;
        }
      }

      // Obter ID do polo de parâmetros, query ou do próprio usuário
      if (options.poloIdParam) {
        const paramValue = 
          req.params[options.poloIdParam] || 
          req.query[options.poloIdParam];
        
        if (paramValue) {
          contextParams.poloId = Number(paramValue);
        } else if (req.user.poloId) {
          contextParams.poloId = req.user.poloId;
        }
      }

      // Verificar se é um recurso próprio do usuário
      if (options.checkOwnedResource) {
        const resourceUserId = 
          req.params.userId || 
          req.body.userId;
        
        contextParams.ownedResource = resourceUserId === userId.toString();
      }

      // Verificar permissão
      const permitted = await hasPermission(
        userId,
        action,
        resource,
        contextParams
      );

      if (!permitted) {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada'
        });
      }

      // Permissão concedida
      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão'
      });
    }
  };
}

/**
 * Middleware que verifica se o usuário é superadmin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se é superadmin
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Esta ação requer privilégios de superadministrador'
      });
    }

    // Permissão concedida
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de superadmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar permissão'
    });
  }
}