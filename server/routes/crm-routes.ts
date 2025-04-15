/**
 * Rotas para o módulo CRM - TEMPORARIAMENTE INDISPONÍVEL
 * Este módulo está sendo reconstruído e não está disponível no momento.
 */

import { Router } from 'express';
import { requirePermission } from '../middlewares/permission-middleware';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

// Middleware de autenticação em todas as rotas
router.use(requireAuth);

// ==================== ROTAS PARA LEADS, CLIENTES E CONTATOS ====================

/**
 * Mensagem de indisponibilidade temporária para todas as rotas CRM
 */
const temporaryUnavailableMessage = {
  error: "CRM em reconstrução - Módulo temporariamente indisponível",
  details: "Este módulo está sendo completamente reconstruído e estará disponível em breve.",
  status: "maintenance",
  timestamp: new Date().toISOString()
};

/**
 * Handler para todas as rotas temporariamente indisponíveis
 */
const handleTemporaryUnavailable = (req, res) => {
  console.log(`[CRM INDISPONÍVEL] Tentativa de acesso à rota: ${req.method} ${req.originalUrl}`);
  res.status(503).json(temporaryUnavailableMessage);
};

// Rotas para leads - indisponíveis temporariamente
router.get('/leads', requirePermission('lead', 'ler'), handleTemporaryUnavailable);
router.get('/leads/:id', requirePermission('lead', 'ler'), handleTemporaryUnavailable);
router.post('/leads', requirePermission('lead', 'criar'), handleTemporaryUnavailable);
router.put('/leads/:id', requirePermission('lead', 'atualizar'), handleTemporaryUnavailable);
router.delete('/leads/:id', requirePermission('lead', 'deletar'), handleTemporaryUnavailable);
router.post('/leads/:id/convert', requirePermission('lead', 'atualizar'), handleTemporaryUnavailable);

// Rotas para clientes - indisponíveis temporariamente
router.get('/clients', requirePermission('cliente', 'ler'), handleTemporaryUnavailable);
router.get('/clients/:id', requirePermission('cliente', 'ler'), handleTemporaryUnavailable);
router.post('/clients', requirePermission('cliente', 'criar'), handleTemporaryUnavailable);
router.put('/clients/:id', requirePermission('cliente', 'atualizar'), handleTemporaryUnavailable);
router.delete('/clients/:id', requirePermission('cliente', 'deletar'), handleTemporaryUnavailable);

// Rotas para contatos - indisponíveis temporariamente
router.get('/contacts', requirePermission('contato', 'ler'), handleTemporaryUnavailable);
router.get('/contacts/:id', requirePermission('contato', 'ler'), handleTemporaryUnavailable);
router.post('/contacts', requirePermission('contato', 'criar'), handleTemporaryUnavailable);
router.put('/contacts/:id', requirePermission('contato', 'atualizar'), handleTemporaryUnavailable);
router.delete('/contacts/:id', requirePermission('contato', 'deletar'), handleTemporaryUnavailable);

export default router;