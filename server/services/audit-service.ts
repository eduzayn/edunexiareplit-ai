import { db } from "../db";
import { 
  enrollmentAudits, 
  enrollmentStatusHistory, 
  insertEnrollmentAuditSchema, 
  insertEnrollmentStatusHistorySchema,
  type InsertEnrollmentAudit,
  type InsertEnrollmentStatusHistory
} from "@shared/schema";
import { Request } from "express";

/**
 * Registra uma ação de auditoria relacionada a matrículas
 * 
 * @param req Requisição Express
 * @param enrollmentId ID da matrícula
 * @param actionType Tipo da ação (create, update, status_change, payment_update)
 * @param performedByType Tipo do agente que realizou a ação (admin, polo, system, student)
 * @param details Detalhes específicos da ação
 * @param beforeState Estado antes da alteração (opcional)
 * @param afterState Estado após a alteração (opcional)
 * @param poloId ID do polo (opcional)
 */
export async function logEnrollmentAudit(
  req: Request,
  enrollmentId: number,
  actionType: string,
  performedByType: string,
  details: any,
  beforeState?: any,
  afterState?: any,
  poloId?: number
) {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    
    const auditData: InsertEnrollmentAudit = {
      enrollmentId,
      actionType,
      performedById: userId,
      performedByType,
      poloId,
      ipAddress,
      userAgent,
      details,
      beforeState: beforeState ? beforeState : null,
      afterState: afterState ? afterState : null,
    };
    
    // Validar dados com o schema
    const validatedData = insertEnrollmentAuditSchema.parse(auditData);
    
    // Inserir registro de auditoria
    await db.insert(enrollmentAudits).values(validatedData);
    
    console.log(`[Audit] ${actionType} enrollment #${enrollmentId} by ${performedByType}${userId ? ` (User #${userId})` : ''}`);
  } catch (error) {
    console.error("Error logging enrollment audit:", error);
    // Não propagamos o erro para evitar interromper a operação principal
  }
}

/**
 * Registra uma mudança de status em uma matrícula
 * 
 * @param req Requisição Express
 * @param enrollmentId ID da matrícula
 * @param previousStatus Status anterior
 * @param newStatus Novo status
 * @param changeReason Motivo da mudança
 * @param metadata Metadados adicionais (opcional)
 * @param poloId ID do polo (opcional)
 * @param sourceChannel Canal de origem da alteração (opcional)
 */
export async function logStatusChange(
  req: Request,
  enrollmentId: number,
  previousStatus: string | null,
  newStatus: string,
  changeReason: string,
  metadata?: any,
  poloId?: number,
  sourceChannel?: string
) {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    
    const statusData: InsertEnrollmentStatusHistory = {
      enrollmentId,
      previousStatus: previousStatus as any, // Tipagem
      newStatus: newStatus as any, // Tipagem
      changeDate: new Date(),
      changeReason,
      changedById: userId,
      metadata,
      poloId,
      sourceChannel: sourceChannel || "system",
      ipAddress,
      userAgent
    };
    
    // Validar dados com o schema
    const validatedData = insertEnrollmentStatusHistorySchema.parse(statusData);
    
    // Inserir histórico de status
    await db.insert(enrollmentStatusHistory).values(validatedData);
    
    // Também registra no log de auditoria geral
    await logEnrollmentAudit(
      req,
      enrollmentId,
      "status_change",
      userId ? (req.user?.portalType || "system") : "system",
      { reason: changeReason },
      { status: previousStatus },
      { status: newStatus },
      poloId
    );
    
    console.log(`[Status Change] Enrollment #${enrollmentId}: ${previousStatus || 'N/A'} -> ${newStatus} by ${userId ? `User #${userId}` : 'System'}`);
  } catch (error) {
    console.error("Error logging status change:", error);
    // Não propagamos o erro para evitar interromper a operação principal
  }
}

/**
 * Obtem informações adicionais para auditoria a partir da requisição
 */
export function getAuditInfo(req: Request) {
  return {
    userId: req.user?.id,
    userType: req.user?.portalType,
    poloId: req.user?.portalType === 'polo' ? req.user.poloId : undefined,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  };
}

/**
 * Obtém a origem (canal) com base na requisição
 */
export function getSourceChannel(req: Request): string {
  if (req.user?.portalType === 'admin') {
    return 'admin_portal';
  } else if (req.user?.portalType === 'polo') {
    return 'polo_portal';
  } else if (req.user?.portalType === 'student') {
    return 'student_portal';
  } else {
    return req.get('X-Source-Channel') || 'api';
  }
}