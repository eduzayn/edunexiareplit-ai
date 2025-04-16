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
router.post('/checkout/links', checkoutController.createCheckoutLink);
router.post('/checkout/links/:leadId', checkoutController.createCheckoutLink);

// Rota para verificar status de checkout
router.get('/checkout/status/:checkoutId', checkoutController.checkCheckoutStatus);

// Rota para cancelar link de checkout
router.post('/checkout/links/:checkoutId/cancel', checkoutController.cancelCheckoutLink);

// Rota para listar links de checkout de um cliente
router.get('/clients/:clientId/checkout-links', checkoutController.getClientCheckoutLinks);

export default router;