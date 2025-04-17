import { Router } from 'express';
import { studentChargesController } from '../controllers/student-charges-controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

/**
 * @route GET /api/student/charges
 * @desc Obtém as cobranças do aluno autenticado
 * @access Private (Student only)
 */
router.get('/charges', requireAuth, studentChargesController.getStudentCharges);

export default router;