import { Router } from 'express';
import { studentChargesController } from '../controllers/student-charges-controller';
import { requireAuth, requireStudent } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/student/charges
 * @desc Obtém as cobranças do aluno autenticado
 * @access Private (Student only)
 */
router.get('/', requireAuth, requireStudent, studentChargesController.getStudentCharges);

export default router;