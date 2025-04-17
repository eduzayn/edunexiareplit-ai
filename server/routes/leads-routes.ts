import { Router } from 'express';

/**
 * Este arquivo está sendo mantido temporariamente para evitar problemas de importação
 * Todo o módulo de leads foi removido como solicitado pelo cliente
 * Data: 17/04/2025
 */

const router = Router();

// Middleware apenas para responder a requisições informando que o módulo foi removido
router.use((req, res) => {
  res.status(410).json({
    message: "O módulo de leads foi removido do sistema",
    info: "Este recurso não está mais disponível. Por favor, utilize o módulo CRM"
  });
});

export default router;