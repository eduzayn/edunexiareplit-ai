import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { requirePermission } from '../middlewares/simple-permission';
import * as checkoutController from '../controllers/checkout-controller';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Permissões para gerenciar checkout
router.use(requirePermission('checkout', 'manage'));

// Rota para criar novo link de checkout
router.post('/leads/:leadId/checkout', checkoutController.createCheckoutLink);

// Rota para verificar status de checkout
router.get('/checkout/:checkoutId', checkoutController.checkCheckoutStatus);

export default router;