/**
 * Rotas para matrículas simplificadas
 */

import express from 'express';
import {
  createSimplifiedEnrollment,
  getSimplifiedEnrollment,
  listSimplifiedEnrollments,
  processWebhook,
  processEnrollment,
  cancelEnrollment,
  generatePaymentLink
} from '../controllers/simplified-enrollment-controller';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission-middleware';

const router = express.Router();

// Rota pública para webhook do Asaas
router.post('/webhook/asaas', processWebhook);

// Rotas protegidas para gerenciamento de matrículas simplificadas
router.get('/', requireAuth, requirePermission('matricula', 'listar'), listSimplifiedEnrollments);
router.post('/', requireAuth, requirePermission('matricula', 'criar'), createSimplifiedEnrollment);
router.get('/:id', requireAuth, requirePermission('matricula', 'ler'), getSimplifiedEnrollment);
router.post('/:id/process', requireAuth, requirePermission('matricula', 'aprovar'), processEnrollment);
router.post('/:id/cancel', requireAuth, requirePermission('matricula', 'cancelar'), cancelEnrollment);
router.post('/:id/generate-payment-link', requireAuth, requirePermission('matricula', 'editar'), generatePaymentLink);

export default router;