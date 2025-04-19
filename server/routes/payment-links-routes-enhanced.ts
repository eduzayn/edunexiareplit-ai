/**
 * Rotas para gerenciamento de links de pagamento personalizados com imagem
 * Versão aprimorada com melhor tratamento de erros e logging
 */
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { requireAuth } from '../middleware/auth';
import { PaymentLinkController } from '../controllers/payment-link-controller';
import { paymentLinkImageService } from '../services/payment-link-image-service';
import { logger } from '../services/logger';

// Logger específico para as rotas
const log = logger.forService('PaymentLinksRoutes');

// Configuração do multer para armazenamento de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

const router = express.Router();

/**
 * Criar um novo link de pagamento
 * POST /api/payment-links
 */
router.post('/', requireAuth, (req, res) => {
  PaymentLinkController.createPaymentLink(req, res);
});

/**
 * Listar links de pagamento por curso
 * GET /api/payment-links/course/:courseId
 */
router.get('/course/:courseId', requireAuth, (req, res) => {
  PaymentLinkController.getPaymentLinksByCourse(req, res);
});

/**
 * Obter um link de pagamento específico
 * GET /api/payment-links/:id
 */
router.get('/:id', requireAuth, (req, res) => {
  PaymentLinkController.getPaymentLink(req, res);
});

/**
 * Atualizar um link de pagamento
 * PATCH /api/payment-links/:id
 */
router.patch('/:id', requireAuth, (req, res) => {
  PaymentLinkController.updatePaymentLink(req, res);
});

/**
 * Excluir um link de pagamento
 * DELETE /api/payment-links/:id
 */
router.delete('/:id', requireAuth, (req, res) => {
  PaymentLinkController.deletePaymentLink(req, res);
});

/**
 * Gerar uma imagem para um link de pagamento
 * POST /api/payment-links/:id/generate-image
 */
router.post('/:id/generate-image', requireAuth, (req, res) => {
  PaymentLinkController.generateImage(req, res);
});

/**
 * Upload de imagem para um link de pagamento existente
 * POST /api/payment-links/:id/image
 */
router.post('/:id/image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        error: 'Requisição Inválida',
        message: 'ID inválido',
        code: 'INVALID_ID'
      });
    }
    
    log.info(`Recebido upload de imagem para link ${id}`);
    
    if (!req.file) {
      log.warn(`Upload para link ${id} não contém arquivo`);
      return res.status(400).json({ 
        error: 'Requisição Inválida',
        message: 'Nenhuma imagem enviada',
        code: 'NO_IMAGE'
      });
    }
    
    // Salvar o arquivo temporariamente no disco
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, req.file.originalname);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    
    log.debug(`Arquivo temporário salvo em: ${tempFilePath}`);
    
    try {
      // Upload da imagem para o Asaas
      const imageResponse = await paymentLinkImageService.uploadImageToPaymentLink(
        id,
        tempFilePath
      );
      
      log.info(`Imagem enviada com sucesso para o link ${id}`);
      
      // Remover o arquivo temporário
      fs.unlinkSync(tempFilePath);
      
      res.status(200).json({
        success: true,
        message: 'Imagem adicionada com sucesso',
        imageId: imageResponse.id,
        imageUrl: imageResponse.url
      });
    } catch (error: any) {
      // Garantir que o arquivo temporário seja removido mesmo em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      log.error(`Erro ao fazer upload de imagem para link ${id}`, error);
      
      res.status(500).json({ 
        error: 'Erro do Servidor',
        message: 'Erro ao fazer upload de imagem',
        details: error.message
      });
    }
  } catch (error: any) {
    log.error('Erro não tratado no upload de imagem', error);
    res.status(500).json({ 
      error: 'Erro do Servidor',
      message: 'Erro ao processar upload de imagem',
      details: error.message
    });
  }
});

export default router;