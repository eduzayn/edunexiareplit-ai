/**
 * Rotas para o módulo de cobranças do aluno
 */

import express from 'express';
import { requireAuth } from '../middleware/auth';
import { requirePortalType } from '../middlewares/permission-middleware';
import studentChargesController from '../controllers/student-charges-controller';

const router = express.Router();

// Rotas protegidas por autenticação
router.use(requireAuth);

// Middleware para verificar se o usuário é aluno
const studentPortalMiddleware = requirePortalType('student');

// Rotas específicas para alunos
router.get('/', studentPortalMiddleware, studentChargesController.getStudentCharges);

export default router;