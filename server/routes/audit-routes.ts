import express from "express";
import { auditService } from "../services/audit-service";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = express.Router();

// Schema para validação dos filtros de auditoria
const auditFilterSchema = z.object({
  userId: z.number().optional(),
  actionType: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  format: z.enum(['json', 'csv']).optional().default('json')
});

/**
 * Rota para obter logs de auditoria com filtros
 * GET /api/audit/logs
 */
router.get('/logs', requireAuth, async (req, res) => {
  try {
    // Validar e converter parâmetros de consulta
    const queryParams = {
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      actionType: req.query.actionType as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId ? Number(req.query.entityId) : undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      format: req.query.format as 'json' | 'csv' | undefined
    };

    // Validar parâmetros com zod
    const validatedParams = auditFilterSchema.parse(queryParams);

    // Se formato é CSV, exportar como CSV
    if (validatedParams.format === 'csv') {
      const csvData = await auditService.exportAuditLogs(validatedParams, 'csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      return res.send(csvData);
    }

    // Caso contrário, retornar JSON
    const logs = await auditService.getAuditLogs(validatedParams);
    res.json({ logs });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria' });
  }
});

/**
 * Rota para obter detalhes de um log de auditoria específico
 * GET /api/audit/logs/:id
 */
router.get('/logs/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const log = await auditService.getAuditLogDetail(id);
    if (!log) {
      return res.status(404).json({ error: 'Log de auditoria não encontrado' });
    }

    res.json({ log });
  } catch (error) {
    console.error('Erro ao buscar detalhes do log de auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do log de auditoria' });
  }
});

/**
 * Rota para obter estatísticas de auditoria
 * GET /api/audit/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Implementar lógica para obter estatísticas
    // Por exemplo: número de ações por tipo, por usuário, etc.
    res.json({ 
      message: 'Estatísticas de auditoria ainda não implementadas' 
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de auditoria' });
  }
});

export default router;