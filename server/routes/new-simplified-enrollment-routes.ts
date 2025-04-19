/**
 * Rotas para o módulo de Matrículas Simplificadas (versão melhorada)
 */

import express from 'express';
import { NewSimplifiedEnrollmentController } from '../controllers/new-simplified-enrollment-controller';
import { requireAuth } from '../middleware/auth';
import { hasPermission } from '../middleware/permissions';

const router = express.Router();

// Listar todas as matrículas simplificadas
router.get(
  '/',
  requireAuth,
  hasPermission('matricula:listar'),
  NewSimplifiedEnrollmentController.getAll
);

// Obter detalhes de uma matrícula específica
router.get(
  '/:id',
  requireAuth,
  hasPermission('matricula:ler'),
  NewSimplifiedEnrollmentController.getById
);

// Criar uma nova matrícula simplificada
router.post(
  '/',
  requireAuth,
  hasPermission('matricula:criar'),
  NewSimplifiedEnrollmentController.create
);

// Gerar link de pagamento para uma matrícula
router.post(
  '/:id/generate-payment-link',
  requireAuth,
  hasPermission('matricula:editar'),
  NewSimplifiedEnrollmentController.generatePaymentLink
);

// Cancelar uma matrícula
router.post(
  '/:id/cancel',
  requireAuth,
  hasPermission('matricula:editar'),
  NewSimplifiedEnrollmentController.cancel
);

// Atualizar status de pagamento de uma matrícula
router.post(
  '/:id/update-payment-status',
  requireAuth,
  hasPermission('matricula:editar'),
  NewSimplifiedEnrollmentController.updatePaymentStatus
);

export default router;