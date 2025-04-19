import express from 'express';
import { documentAnalysisController } from '../controllers/document-analysis-controller';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Rota para analisar imagem de documento
router.post(
  '/analyze-image',
  requireAuth,
  documentAnalysisController.analyzeImage
);

// Rota para analisar texto de documento
router.post(
  '/analyze-text',
  requireAuth,
  documentAnalysisController.analyzeText
);

// Rota para validar dados de matrícula
router.post(
  '/validate-enrollment-data',
  requireAuth,
  documentAnalysisController.validateEnrollmentData
);

export default router;