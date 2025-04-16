/**
 * Rotas para o módulo de cobranças
 */

import express from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requirePermission } from '../middlewares/permission-middleware';
import chargesController from '../controllers/charges-controller';

const router = express.Router();

// Rotas protegidas por autenticação
router.use(requireAuth);

// Rotas para administradores
const financePermission = requirePermission('payments', 'manage');

router.get('/', financePermission, chargesController.getAllCharges);
router.get('/:id', financePermission, chargesController.getChargeById);
router.post('/', financePermission, chargesController.createCharge);
router.put('/:id', financePermission, chargesController.updateCharge);
router.delete('/:id', financePermission, chargesController.deleteCharge);
router.get('/customer/:customerId', financePermission, chargesController.getCustomerCharges);
router.post('/:id/receive', financePermission, chargesController.receivePayment);

export default router;