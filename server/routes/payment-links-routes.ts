/**
 * Rotas para gerenciamento de links de pagamento personalizados com imagem
 */
import express from 'express';
import multer from 'multer';
import { paymentLinkImageService } from '../services/payment-link-image-service';
import { insertEdunexaPaymentLinkSchema, edunexaPaymentLinks, courses } from '../../shared/schema';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
router.post('/', requireAuth, async (req, res) => {
  try {
    const validationResult = insertEdunexaPaymentLinkSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.format() 
      });
    }
    
    // Usuário autenticado deve ser o generatingConsultantId
    if (req.user && req.user.id) {
      // Se não foi fornecido um generatingConsultantId, usa o ID do usuário autenticado
      if (!validationResult.data.generatingConsultantId) {
        validationResult.data.generatingConsultantId = req.user.id;
      }
    } else {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Criar o link de pagamento no banco de dados
    const [paymentLink] = await db.insert(edunexaPaymentLinks)
      .values({
        ...validationResult.data,
        internalStatus: 'ImageError' // Inicialmente sem imagem
      })
      .returning();
    
    // Tentar gerar uma imagem automaticamente usando AI
    try {
      // Buscar o nome do curso
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, validationResult.data.courseId));
      
      const courseName = course?.name || 'Curso';
      
      // Iniciar geração de imagem em segundo plano
      setTimeout(async () => {
        try {
          console.log(`Iniciando geração de imagem para o link ${paymentLink.id} (curso: ${courseName})`);
          
          // Gerar imagem
          const imagePath = await paymentLinkImageService.generateImageForPaymentLink(
            validationResult.data.courseId,
            courseName
          );
          
          if (imagePath) {
            // Fazer upload da imagem gerada para o Asaas
            await paymentLinkImageService.uploadImageToPaymentLink(paymentLink.id, imagePath);
            console.log(`Imagem gerada e enviada com sucesso para o link ${paymentLink.id}`);
          }
        } catch (error) {
          console.error(`Erro na geração automática de imagem para link ${paymentLink.id}:`, error);
        }
      }, 0);
    } catch (error) {
      console.error('Erro ao iniciar geração automática de imagem:', error);
      // Continua o fluxo normal, mesmo sem gerar a imagem
    }
    
    res.status(201).json(paymentLink);
  } catch (error: any) {
    console.error('Erro ao criar link de pagamento:', error);
    res.status(500).json({ error: 'Erro ao criar link de pagamento', message: error.message });
  }
});

/**
 * Listar links de pagamento por curso
 * GET /api/payment-links/course/:courseId
 */
router.get('/course/:courseId', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'ID do curso inválido' });
    }
    
    // Buscar links de pagamento pelo ID do curso
    const links = await db
      .select()
      .from(edunexaPaymentLinks)
      .where(eq(edunexaPaymentLinks.courseId, courseId));
    
    res.json(links);
  } catch (error: any) {
    console.error('Erro ao listar links de pagamento:', error);
    res.status(500).json({ error: 'Erro ao listar links de pagamento', message: error.message });
  }
});

/**
 * Obter um link de pagamento específico
 * GET /api/payment-links/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar o link de pagamento pelo ID
    const [paymentLink] = await db
      .select()
      .from(edunexaPaymentLinks)
      .where(eq(edunexaPaymentLinks.id, id));
    
    if (!paymentLink) {
      return res.status(404).json({ error: 'Link de pagamento não encontrado' });
    }
    
    res.json(paymentLink);
  } catch (error: any) {
    console.error('Erro ao obter link de pagamento:', error);
    res.status(500).json({ error: 'Erro ao obter link de pagamento', message: error.message });
  }
});

/**
 * Upload de imagem para um link de pagamento existente
 * POST /api/payment-links/:id/image
 */
router.post('/:id/image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar o link de pagamento pelo ID
    const [paymentLink] = await db
      .select()
      .from(edunexaPaymentLinks)
      .where(eq(edunexaPaymentLinks.id, id));
    
    if (!paymentLink) {
      return res.status(404).json({ error: 'Link de pagamento não encontrado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    // Salvar o arquivo temporariamente no disco
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, req.file.originalname);
    fs.writeFileSync(tempFilePath, req.file.buffer);
    
    try {
      // Upload da imagem para o Asaas
      const imageResponse = await paymentLinkImageService.uploadImageToPaymentLink(
        id,
        tempFilePath
      );
    
      // Atualizar o registro do link para refletir que a imagem foi adicionada
      await db.update(edunexaPaymentLinks)
        .set({ internalStatus: 'Active' as any })
        .where(eq(edunexaPaymentLinks.id, id))
        .execute();
      
      // Remover o arquivo temporário
      fs.unlinkSync(tempFilePath);
      
      res.status(200).json({
        success: true,
        message: 'Imagem adicionada com sucesso',
        imageId: imageResponse.id,
        imageUrl: imageResponse.url
      });
    } catch (error) {
      // Garantir que o arquivo temporário seja removido mesmo em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao fazer upload de imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload de imagem', message: error.message });
  }
});

/**
 * Atualizar um link de pagamento
 * PATCH /api/payment-links/:id
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    // Buscar o link de pagamento pelo ID
    const [paymentLink] = await db
      .select()
      .from(edunexaPaymentLinks)
      .where(eq(edunexaPaymentLinks.id, id));
    
    if (!paymentLink) {
      return res.status(404).json({ error: 'Link de pagamento não encontrado' });
    }
    
    // Atualizar o link no Asaas
    const updateData = req.body;
    
    // Remover campos que não podem ser atualizados diretamente
    delete updateData.id;
    delete updateData.asaasPaymentLinkId;
    delete updateData.courseId;
    delete updateData.createdAt;
    
    // Atualizar os campos relevantes no banco de dados
    await db.update(edunexaPaymentLinks)
      .set(updateData)
      .where(eq(edunexaPaymentLinks.id, id))
      .execute();
    
    // Obter o link atualizado do banco
    const [refreshedLink] = await db
      .select()
      .from(edunexaPaymentLinks)
      .where(eq(edunexaPaymentLinks.id, id));
    
    res.status(200).json(refreshedLink);
  } catch (error: any) {
    console.error('Erro ao atualizar link de pagamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar link de pagamento', message: error.message });
  }
});

export default router;