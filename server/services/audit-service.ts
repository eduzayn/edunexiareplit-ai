import { db } from "../db";
import { permissionAudit } from "../../shared/audit-schema";
import { InsertPermissionAudit } from "../../shared/audit-schema";
import { Request } from "express";
import { eq, desc, gte, lte, count } from 'drizzle-orm';

/**
 * Extrai o canal de origem de uma requisição
 */
export function getSourceChannel(req: Request): string {
  // Verificar cabeçalhos de origem
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  const userAgent = req.headers['user-agent'] || '';
  
  // Analisar a origem da requisição
  if (referer.includes('/admin')) return 'admin_portal';
  if (referer.includes('/student')) return 'student_portal';
  if (referer.includes('/partner')) return 'partner_portal';
  if (referer.includes('/polo')) return 'polo_portal';
  if (referer.includes('/mobile')) return 'mobile_app';
  if (userAgent.toLowerCase().includes('mobile')) return 'mobile_browser';
  
  // Verificar se é uma API externa
  if (req.headers['x-api-source']) return req.headers['x-api-source'].toString();
  
  // Valor padrão
  return 'web_browser';
}

/**
 * Registra eventos de auditoria para matrículas
 */
export async function logEnrollmentAudit(
  req: Request | null,
  enrollmentId: number,
  action: string,
  userType: string,
  metadata: any,
  oldValue: any,
  newValue: any,
  poloId?: number
) {
  try {
    console.log(`Registrando auditoria de matrícula: ${action} para ID ${enrollmentId}`);
    // Implementação a ser adicionada
    return true;
  } catch (error) {
    console.error('Erro ao registrar auditoria de matrícula:', error);
    return false;
  }
}

/**
 * Registra mudanças de status em matrículas
 */
export async function logStatusChange(
  req: Request | null,
  enrollmentId: number,
  oldStatus: string,
  newStatus: string,
  reason: string,
  metadata: any,
  poloId?: number,
  sourceChannel?: string
) {
  try {
    console.log(`Registrando mudança de status: ${oldStatus} -> ${newStatus} para matrícula ID ${enrollmentId}`);
    // Implementação a ser adicionada
    return true;
  } catch (error) {
    console.error('Erro ao registrar mudança de status:', error);
    return false;
  }
}

/**
 * Obtém informações de auditoria a partir da requisição
 */
export function getAuditInfo(req: Request) {
  return {
    ipAddress: req.ip || null,
    userAgent: req.headers['user-agent'] || null,
    userId: req.user?.id || null,
    timestamp: new Date()
  };
}

/**
 * Serviço para registrar e consultar eventos de auditoria no sistema de permissões
 */
class AuditService {
  /**
   * Registra uma ação de auditoria no sistema
   */
  async logPermissionAction(
    data: Omit<InsertPermissionAudit, 'ipAddress' | 'userAgent'>, 
    req?: Request
  ) {
    try {
      // Extrair informações do request se disponível
      const ipAddress = req?.ip || null;
      const userAgent = req?.headers['user-agent'] || null;
      
      // Criar registro de auditoria
      const auditEntry = await db.insert(permissionAudit).values({
        ...data,
        ipAddress,
        userAgent,
      }).returning();
      
      return auditEntry[0];
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
      // Não lançar erro para evitar interrupção do fluxo principal
      return null;
    }
  }

  /**
   * Busca registros de auditoria com filtros
   */
  async getAuditLogs(filters: {
    userId?: number;
    actionType?: string;
    entityType?: string;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = db.select().from(permissionAudit);
      
      // Aplicar filtros
      if (filters.userId) {
        query = query.where(eq(permissionAudit.userId, filters.userId));
      }
      
      if (filters.actionType) {
        query = query.where(eq(permissionAudit.actionType, filters.actionType as any));
      }
      
      if (filters.entityType) {
        query = query.where(eq(permissionAudit.entityType, filters.entityType as any));
      }
      
      if (filters.entityId) {
        query = query.where(eq(permissionAudit.entityId, filters.entityId));
      }
      
      if (filters.startDate) {
        query = query.where(gte(permissionAudit.createdAt, filters.startDate));
      }
      
      if (filters.endDate) {
        query = query.where(lte(permissionAudit.createdAt, filters.endDate));
      }
      
      // Ordenar por data decrescente (mais recentes primeiro)
      query = query.orderBy(desc(permissionAudit.createdAt));
      
      // Aplicar paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
      
      const logs = await query;
      return logs;
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um registro de auditoria específico
   */
  async getAuditLogDetail(id: number) {
    try {
      const log = await db.select().from(permissionAudit).where(eq(permissionAudit.id, id));
      return log[0] || null;
    } catch (error) {
      console.error("Erro ao buscar detalhe de log de auditoria:", error);
      throw error;
    }
  }

  /**
   * Conta o número total de registros de auditoria com base nos filtros
   */
  async getAuditLogsCount(filters: {
    userId?: number;
    actionType?: string;
    entityType?: string;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      let query = db.select({ count: count() }).from(permissionAudit);
      
      // Aplicar os mesmos filtros usados na busca de logs
      if (filters.userId) {
        query = query.where(eq(permissionAudit.userId, filters.userId));
      }
      
      if (filters.actionType) {
        query = query.where(eq(permissionAudit.actionType, filters.actionType as any));
      }
      
      if (filters.entityType) {
        query = query.where(eq(permissionAudit.entityType, filters.entityType as any));
      }
      
      if (filters.entityId) {
        query = query.where(eq(permissionAudit.entityId, filters.entityId));
      }
      
      if (filters.startDate) {
        query = query.where(gte(permissionAudit.createdAt, filters.startDate));
      }
      
      if (filters.endDate) {
        query = query.where(lte(permissionAudit.createdAt, filters.endDate));
      }
      
      const result = await query;
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Erro ao contar logs de auditoria:", error);
      return 0;
    }
  }

  /**
   * Exporta logs de auditoria para CSV ou JSON
   */
  async exportAuditLogs(filters: any, format: 'csv' | 'json' = 'json') {
    const logs = await this.getAuditLogs(filters);
    
    if (format === 'csv') {
      // Implementar exportação para CSV
      const headers = ['ID', 'Usuário', 'Ação', 'Entidade', 'ID Entidade', 'Recurso', 'Descrição', 'Data'];
      const rows = logs.map(log => [
        log.id,
        log.userId,
        log.actionType,
        log.entityType,
        log.entityId,
        log.resourceType || '',
        log.description,
        new Date(log.createdAt).toISOString()
      ]);
      
      // Converter para CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    }
    
    return logs;
  }
}

// Exportar instância do serviço
export const auditService = new AuditService();