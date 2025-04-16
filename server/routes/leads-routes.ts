import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware';
import { requirePermission } from '../middleware/permission-middleware';
import * as leadsController from '../controllers/leads-controller';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Verificar se incluímos middleware para permissões
router.use(requirePermission('leads', 'manage')); // Permissão geral para gerenciar leads

// Rotas para gerenciamento de leads
router.get('/', leadsController.getLeads);
router.get('/:id', leadsController.getLeadById);
router.post('/', leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.post('/:leadId/activities', leadsController.addLeadActivity);

export default router;