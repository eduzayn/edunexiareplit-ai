import { db } from "../db";
import { permissionAudit } from "../../shared/audit-schema";
import { InsertPermissionAudit } from "../../shared/audit-schema";
import { Request } from "express";
import { eq, desc, gte, lte, count, and } from 'drizzle-orm';

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
    data: {
      userId: number;
      actionType: ActionType;
      entityType: EntityType;
      entityId: number | null;
      description?: string;
      detail?: string;
      sourceIp?: string;
      metadata?: any;
      oldValue?: any;
      newValue?: any;
    }, 
    req?: Request
  ) {
    try {
      // Extrair informações do request se disponível
      const ipAddress = data.sourceIp || req?.ip || null;
      const userAgent = req?.headers['user-agent'] || null;
      
      // Criar registro de auditoria
      const auditEntry = await db.insert(permissionAudit).values({
        userId: data.userId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description || '',
        detail: data.detail || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
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
   * Método específico para registrar alterações em permissões
   * Registra os detalhes das alterações com informações sobre o que mudou
   */
  async logPermissionChange({
    userId,
    entityType,
    entityId,
    action,
    oldPermissions,
    newPermissions,
    description,
    resourceType,
    req
  }: {
    userId: number;
    entityType: string;
    entityId: number;
    action: string;
    oldPermissions: any;
    newPermissions: any;
    description: string;
    resourceType?: string;
    req?: Request;
  }) {
    try {
      // Calcular diferenças entre permissões antigas e novas
      const changes = this.calculatePermissionChanges(oldPermissions, newPermissions);
      
      // Preparar metadados com as mudanças detalhadas
      const metadata = {
        changes,
        changedFields: Object.keys(changes),
        totalChanges: Object.keys(changes).length
      };
      
      // Formatar descrição detalhada baseada nas mudanças
      const detailedDescription = this.formatPermissionChangeDescription(
        description,
        changes,
        entityType
      );
      
      // Registrar a entrada de auditoria
      return this.logPermissionAction({
        userId,
        actionType: action as any,
        entityType: entityType as any,
        entityId,
        resourceType,
        description: detailedDescription,
        oldValue: oldPermissions,
        newValue: newPermissions,
        metadata,
      }, req);
    } catch (error) {
      console.error("Erro ao registrar mudança de permissão:", error);
      return null;
    }
  }
  
  /**
   * Calcula as diferenças entre as permissões antigas e novas
   * @private
   */
  private calculatePermissionChanges(oldData: any, newData: any) {
    if (!oldData) return { addedAll: true };
    if (!newData) return { removedAll: true };
    
    const changes: Record<string, { old: any, new: any }> = {};
    
    // Identificar todas as chaves em ambos os objetos
    const allKeys = new Set([
      ...Object.keys(oldData), 
      ...Object.keys(newData)
    ]);
    
    // Comparar valores para cada chave
    allKeys.forEach(key => {
      const oldValue = oldData[key];
      const newValue = newData[key];
      
      // Se os valores são diferentes, registrar a mudança
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue
        };
      }
    });
    
    return changes;
  }
  
  /**
   * Formata uma descrição detalhada das mudanças de permissão
   * @private
   */
  private formatPermissionChangeDescription(
    baseDescription: string,
    changes: Record<string, any>,
    entityType: string
  ) {
    const changeCount = Object.keys(changes).length;
    if (changeCount === 0) {
      return `${baseDescription} (Nenhuma alteração detectada)`;
    }
    
    // Criar descrição detalhada para diferentes tipos de entidades
    let detailedChanges = '';
    
    if (entityType === 'permission' || entityType === 'role_permission') {
      detailedChanges = Object.entries(changes)
        .map(([field, values]: [string, any]) => {
          if (field === 'isActive') {
            return `${values.new ? 'Ativou' : 'Desativou'} permissão`;
          } else if (field === 'resource') {
            return `Alterou recurso: ${values.old} → ${values.new}`;
          } else if (field === 'action') {
            return `Alterou ação: ${values.old} → ${values.new}`;
          } else {
            return `Alterou ${field}: ${JSON.stringify(values.old)} → ${JSON.stringify(values.new)}`;
          }
        })
        .join('; ');
    } else if (entityType === 'role' || entityType === 'user_role') {
      detailedChanges = Object.entries(changes)
        .map(([field, values]: [string, any]) => {
          if (field === 'permissions') {
            const added = values.new?.filter((p: any) => !values.old?.includes(p)) || [];
            const removed = values.old?.filter((p: any) => !values.new?.includes(p)) || [];
            
            return [
              added.length > 0 ? `Adicionou ${added.length} permissões` : '',
              removed.length > 0 ? `Removeu ${removed.length} permissões` : ''
            ].filter(Boolean).join('; ');
          } else {
            return `Alterou ${field}: ${JSON.stringify(values.old)} → ${JSON.stringify(values.new)}`;
          }
        })
        .join('; ');
    }
    
    return `${baseDescription}${detailedChanges ? ` (${detailedChanges})` : ''}`;
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
    // Remover limites para exportar todos os registros correspondentes aos filtros
    const allFilters = { ...filters };
    delete allFilters.limit;
    delete allFilters.offset;
    
    const logs = await this.getAuditLogs(allFilters);
    
    if (format === 'csv') {
      // Definir cabeçalhos do CSV
      const headers = [
        'ID', 
        'Usuário ID', 
        'Nome do Usuário',
        'Ação', 
        'Entidade', 
        'ID Entidade', 
        'Recurso', 
        'Descrição', 
        'Alterações',
        'IP de Origem',
        'Navegador',
        'Data/Hora'
      ];
      
      // Preparar linhas de dados
      const rows = logs.map(log => {
        // Preparar campo de alterações
        let changesFormatted = '';
        if (log.oldValue && log.newValue) {
          try {
            const oldValue = typeof log.oldValue === 'string' ? JSON.parse(log.oldValue) : log.oldValue;
            const newValue = typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue;
            
            // Identificar campos alterados
            const changes = this.calculatePermissionChanges(oldValue, newValue);
            const changeList = Object.entries(changes)
              .map(([field, change]: [string, any]) => {
                const oldVal = change.old === undefined ? 'não definido' : 
                               typeof change.old === 'object' ? JSON.stringify(change.old) : change.old;
                const newVal = change.new === undefined ? 'não definido' : 
                               typeof change.new === 'object' ? JSON.stringify(change.new) : change.new;
                return `${field}: ${oldVal} → ${newVal}`;
              })
              .join('; ');
            
            changesFormatted = changeList;
          } catch (err) {
            changesFormatted = 'Erro ao processar alterações';
          }
        }
        
        // Tratar valores com vírgulas para evitar problemas no CSV
        const escapeCSV = (value: any) => {
          if (value === null || value === undefined) return '';
          const str = String(value);
          // Se contém vírgulas, aspas ou quebras de linha, envolve em aspas duplas
          // e escapa as aspas duplas internas
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        // Dados da linha
        return [
          escapeCSV(log.id),
          escapeCSV(log.userId),
          escapeCSV(log.userName),
          escapeCSV(log.actionType),
          escapeCSV(log.entityType),
          escapeCSV(log.entityId),
          escapeCSV(log.resourceType),
          escapeCSV(log.description),
          escapeCSV(changesFormatted),
          escapeCSV(log.ipAddress),
          escapeCSV(log.userAgent),
          escapeCSV(new Date(log.createdAt).toLocaleString('pt-BR'))
        ];
      });
      
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

// Exportar função logPermissionAction para facilitar uso nas rotas
export const logPermissionAction = auditService.logPermissionAction.bind(auditService);