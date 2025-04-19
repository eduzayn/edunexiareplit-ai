/**
 * Middleware para verificação de permissões
 */

import { Request, Response, NextFunction } from 'express';
import { checkUserPermission } from '../services/permission-service';
import { PortalType, portalTypes } from '../../shared/schema';

/**
 * Mapeamento de recursos alternativos para verificação
 * Contém equivalências entre nomes em português/inglês e singular/plural
 */
const RESOURCE_ALTERNATIVES: Record<string, string[]> = {
  'cliente': ['clients'],     // cliente (pt) <-> clients (en)
  'clients': ['cliente'],     // clients (en) <-> cliente (pt)
  'lead': ['leads'],          // lead (singular) <-> leads (plural)
  'leads': ['lead'],          // leads (plural) <-> lead (singular)
  'contato': ['contacts'],    // contato (pt) <-> contacts (en)
  'contacts': ['contato'],    // contacts (en) <-> contato (pt)
  'matricula': ['enrollments'],  // matricula (pt) <-> enrollments (en)
  'enrollments': ['matricula']   // enrollments (en) <-> matricula (pt)
};

/**
 * Mapeamento de ações alternativas para verificação
 * Contém equivalências entre nomes em português/inglês
 */
const ACTION_ALTERNATIVES: Record<string, string[]> = {
  'ler': ['read'],            // ler (pt) <-> read (en)
  'read': ['ler'],            // read (en) <-> ler (pt)
  'criar': ['create'],        // criar (pt) <-> create (en)
  'create': ['criar'],        // create (en) <-> criar (pt)
  'atualizar': ['update'],    // atualizar (pt) <-> update (en)
  'update': ['atualizar'],    // update (en) <-> atualizar (pt)
  'deletar': ['delete'],      // deletar (pt) <-> delete (en)
  'delete': ['deletar']       // delete (en) <-> deletar (pt)
};

/**
 * Middleware para exigir permissão específica
 * Verifica múltiplas variações do recurso e ação
 * 
 * @param resource Nome do recurso (ex: "users", "institutions", "cliente", etc)
 * @param action Ação desejada (ex: "read", "create", "ler", "criar", etc)
 * @returns Middleware Express
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Autenticação necessária' });
      }

      // Lista de recursos para verificar (o original + alternativas)
      const resourcesToCheck = [resource];
      if (RESOURCE_ALTERNATIVES[resource]) {
        resourcesToCheck.push(...RESOURCE_ALTERNATIVES[resource]);
      }
      
      // Lista de ações para verificar (a original + alternativas)
      const actionsToCheck = [action];
      if (ACTION_ALTERNATIVES[action]) {
        actionsToCheck.push(...ACTION_ALTERNATIVES[action]);
      }
      
      // Verifica todas as combinações possíveis
      let hasPermission = false;
      for (const res of resourcesToCheck) {
        for (const act of actionsToCheck) {
          // Tenta cada combinação de recurso e ação
          const result = await checkUserPermission(req.user.id, res, act);
          if (result) {
            hasPermission = true;
            break;
          }
        }
        if (hasPermission) break;
      }
      
      // Se nenhuma permissão foi encontrada
      if (!hasPermission) {
        console.log(`Acesso negado: Usuário ${req.user.username} (${req.user.id}) tentou acessar recurso "${resource}" com ação "${action}"`);
        return res.status(403).json({
          error: 'Acesso negado',
          message: `Você não tem permissão para ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
  };
}

/**
 * Middleware para adicionar permissões do usuário no request
 * Útil para verificar permissões no frontend
 */
export async function attachPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    // Lista de permissões a serem verificadas e adicionadas ao request
    // Adicione aqui as permissões mais comuns usadas no frontend
    const permissionsToCheck = [
      { resource: 'users', action: 'manage' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      
      { resource: 'roles', action: 'manage' },
      { resource: 'roles', action: 'read' },
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'update' },
      { resource: 'roles', action: 'delete' },
      
      { resource: 'institutions', action: 'manage' },
      { resource: 'institutions', action: 'read' },
      { resource: 'institutions', action: 'create' },
      { resource: 'institutions', action: 'update' },
      { resource: 'institutions', action: 'delete' },
      
      { resource: 'polos', action: 'manage' },
      { resource: 'polos', action: 'read' },
      { resource: 'polos', action: 'create' },
      { resource: 'polos', action: 'update' },
      { resource: 'polos', action: 'delete' },
      
      { resource: 'courses', action: 'manage' },
      { resource: 'courses', action: 'read' },
      { resource: 'courses', action: 'create' },
      { resource: 'courses', action: 'update' },
      { resource: 'courses', action: 'delete' },
      
      { resource: 'enrollments', action: 'manage' },
      { resource: 'enrollments', action: 'read' },
      { resource: 'enrollments', action: 'create' },
      { resource: 'enrollments', action: 'update' },
      { resource: 'enrollments', action: 'delete' },
      
      { resource: 'financial_transactions', action: 'manage' },
      { resource: 'financial_transactions', action: 'read' },
      { resource: 'financial_transactions', action: 'create' },
      { resource: 'financial_transactions', action: 'update' },
      { resource: 'financial_transactions', action: 'delete' },
      
      { resource: 'leads', action: 'manage' },
      { resource: 'leads', action: 'read' },
      { resource: 'leads', action: 'create' },
      { resource: 'leads', action: 'update' },
      { resource: 'leads', action: 'delete' },
      
      { resource: 'clients', action: 'manage' },
      { resource: 'clients', action: 'read' },
      { resource: 'clients', action: 'create' },
      { resource: 'clients', action: 'update' },
      { resource: 'clients', action: 'delete' },
      
      { resource: 'invoices', action: 'manage' },
      { resource: 'invoices', action: 'read' },
      { resource: 'invoices', action: 'create' },
      { resource: 'invoices', action: 'update' },
      { resource: 'invoices', action: 'delete' },
      
      { resource: 'payments', action: 'manage' },
      { resource: 'payments', action: 'read' },
      { resource: 'payments', action: 'create' },
      { resource: 'payments', action: 'update' },
      { resource: 'payments', action: 'delete' },
      
      { resource: 'reports', action: 'manage' },
      { resource: 'reports', action: 'read' },
      
      { resource: 'settings', action: 'manage' },
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' },
    ];

    const userPermissions: Record<string, boolean> = {};

    // Verifica cada permissão
    for (const { resource, action } of permissionsToCheck) {
      const key = `${resource}:${action}`;
      
      // Verifica a permissão principal
      let hasPermission = await checkUserPermission(req.user.id, resource, action);
      
      // Se não encontrou a permissão principal, verifica alternativas
      if (!hasPermission) {
        // Verificar recursos alternativos
        if (RESOURCE_ALTERNATIVES[resource]) {
          for (const altResource of RESOURCE_ALTERNATIVES[resource]) {
            if (ACTION_ALTERNATIVES[action]) {
              // Verificar todas as combinações de recursos e ações alternativas
              for (const altAction of ACTION_ALTERNATIVES[action]) {
                hasPermission = await checkUserPermission(req.user.id, altResource, altAction);
                if (hasPermission) break;
              }
            } else {
              // Verificar apenas recursos alternativos com a ação original
              hasPermission = await checkUserPermission(req.user.id, altResource, action);
            }
            if (hasPermission) break;
          }
        }
        // Verificar ações alternativas com o recurso original
        else if (ACTION_ALTERNATIVES[action]) {
          for (const altAction of ACTION_ALTERNATIVES[action]) {
            hasPermission = await checkUserPermission(req.user.id, resource, altAction);
            if (hasPermission) break;
          }
        }
      }
      
      userPermissions[key] = hasPermission;
    }

    // Adiciona as permissões verificadas ao request para uso nas rotas
    req.userPermissions = userPermissions;

    next();
  } catch (error) {
    console.error('Erro ao anexar permissões:', error);
    next();
  }
}

/**
 * Middleware para verificar se o usuário pertence a um determinado tipo de portal
 * @param portalType Tipo de portal exigido (student, admin, partner, polo)
 * @returns Middleware Express
 */
export function requirePortalType(portalType: PortalType) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    // Verificar se o usuário tem o tipo de portal correto
    if (req.user.portalType !== portalType) {
      console.log(`Acesso negado: Usuário ${req.user.username} (${req.user.id}) tentou acessar portal ${portalType}, mas é do tipo ${req.user.portalType}`);
      return res.status(403).json({
        error: 'Acesso negado',
        message: `Você não tem acesso a este portal`
      });
    }

    next();
  };
}

// Adiciona tipos ao Express Request
declare global {
  namespace Express {
    interface Request {
      userPermissions?: Record<string, boolean>;
    }
  }
}