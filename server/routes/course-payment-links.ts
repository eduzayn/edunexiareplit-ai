import express from 'express';
import { CoursePaymentLinkController } from '../controllers/course-payment-link-controller';
import { requireAdmin } from '../middleware/auth';
import { debugAuth } from '../middleware/debug-auth';
import axios from 'axios';
import multer from 'multer';
import { db } from '../db';
import { courses, eq, like, or } from '../../shared/schema';
import { asaasCoursePaymentService } from '../services/asaas-course-payment-service';

// Router para gerenciamento de links de pagamento de cursos
const router = express.Router();

// Rota pública de teste
router.get('/test-api', async (req, res) => {
  try {
    console.log('[DEBUG] Testando conexão com a API Asaas');
    // Usar a nova chave de API de produção fornecida
    const accessToken = process.env.ASAAS_PRODUCTION_KEY || process.env.ASAAS_ZAYN_KEY;
    
    // Forçar o uso do ambiente de produção, independentemente do token
    // A determinação do ambiente baseada no prefixo do token não está funcionando como esperado
    const apiUrl = 'https://api.asaas.com/v3'; // URL de produção com o prefixo /v3 conforme documentação
    
    // Mantemos esta variável apenas para logging
    const isProductionToken = accessToken?.startsWith('$aact_prod');
      
    const tokenSource = process.env.ASAAS_PRODUCTION_KEY ? 'ASAAS_PRODUCTION_KEY' : 'ASAAS_ZAYN_KEY';
      
    console.log(`[DEBUG] Token indica ambiente ${isProductionToken ? 'de produção' : 'sandbox'}`);
    
    
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API Asaas não encontrada (ASAAS_ZAYN_KEY)'
      });
    }
    
    console.log('[DEBUG] Tentando conexão com:', apiUrl);
    console.log('[DEBUG] Usando token:', accessToken.substring(0, 10) + '...');
    
    // Simples requisição para verificar conexão (buscar informações da conta)
    const response = await axios.get(`${apiUrl}/myAccount`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': accessToken
      }
    });
    
    // No Asaas, o ambiente está capitalizado como 'SANDBOX' ou 'PROD'
    const isSandbox = response.data.environment === 'SANDBOX';
    const environmentMessage = isSandbox 
      ? '⚠️ A conta está em modo Sandbox, mesmo usando token/URL de produção. É necessário verificar junto ao Asaas para ativar o ambiente de produção.'
      : 'Ambiente de produção confirmado.';
      
    return res.json({
      success: true,
      message: 'Conexão com a API Asaas estabelecida com sucesso',
      accountInfo: {
        name: response.data.name,
        email: response.data.email,
        apiVersion: response.data.apiVersion,
        environment: response.data.environment === 'PROD' ? 'Produção' : 'Sandbox',
        usingProductionUrl: true,
        usingProductionToken: isProductionToken,
        environmentMessage: response.data.environment === 'SANDBOX' || response.data.environment === 'Sandbox'
          ? '⚠️ A conta está em modo Sandbox, mesmo usando token/URL de produção. É necessário verificar junto ao Asaas para ativar o ambiente de produção.'
          : 'Ambiente de produção confirmado.'
      }
    });
  } catch (error) {
    console.error('[DEBUG] Erro ao testar conexão com a API Asaas:', error);
    
    // Informações detalhadas sobre o erro para debugging
    let errorDetails = {};
    if (error.response) {
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      errorDetails = {
        message: 'Requisição enviada, mas sem resposta do servidor',
        request: 'Requisição feita'
      };
    } else {
      errorDetails = {
        message: error.message,
        stack: error.stack
      };
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao conectar com a API Asaas',
      error: error.message,
      details: errorDetails
    });
  }
});

// Rota de teste para criação de link de pagamento simples
router.post('/test-create', async (req, res) => {
  try {
    console.log('[DEBUG] Testando criação de link de pagamento simples');
    
    const { name, description, value, billingType } = req.body;
    
    // Valores padrão caso não sejam fornecidos
    const data = {
      name: name || 'Teste API',
      description: description || 'Link de pagamento de teste',
      value: value || 10.0,
      billingType: billingType || 'UNDEFINED',
      chargeType: 'DETACHED',
      dueDateLimitDays: 30,
      maxInstallments: 1,
      notificationEnabled: true,
      endDate: (() => {
        // Calcular data de expiração (1 ano a partir de agora)
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        return expirationDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
      })()
    };
    
    console.log('[DEBUG] Dados para criação de link:', data);
    
    // Testar a criação do link
    const response = await axios.post(
      `${asaasCoursePaymentService['apiUrl']}/paymentLinks`, 
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasCoursePaymentService.getApiToken()
        }
      }
    );
    
    console.log('[DEBUG] Link de pagamento criado com sucesso:', response.data);
    
    return res.json({
      success: true,
      message: 'Link de pagamento criado com sucesso',
      paymentLink: response.data
    });
  } catch (error) {
    console.error('[DEBUG] Erro ao criar link de pagamento:', error);
    
    // Informações detalhadas sobre o erro para debugging
    let errorDetails = {};
    if (error.response) {
      errorDetails = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      errorDetails = {
        message: 'Requisição enviada, mas sem resposta do servidor',
        request: 'Requisição feita'
      };
    } else {
      errorDetails = {
        message: error.message,
        stack: error.stack
      };
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar link de pagamento',
      error: error.message,
      details: errorDetails
    });
  }
});

// Rotas protegidas (apenas para admin)
// Links de pagamento único (legado)
router.get('/courses/:courseId/payment-link', requireAdmin, CoursePaymentLinkController.getPaymentLink);
router.post('/courses/:courseId/payment-link', requireAdmin, CoursePaymentLinkController.generatePaymentLink);

// Múltiplos links de pagamento (novo)
router.get('/courses/:courseId/payment-options', debugAuth, requireAdmin, CoursePaymentLinkController.getPaymentOptions);
router.post('/courses/:courseId/payment-options/standard', debugAuth, requireAdmin, CoursePaymentLinkController.generateStandardPostGradPaymentLinks);


// Rotas para a nova interface de links de pagamento
router.post('/courses/:courseId/custom-payment-link', requireAdmin, CoursePaymentLinkController.createCustomPaymentLink);
router.delete('/:paymentLinkId', requireAdmin, CoursePaymentLinkController.deletePaymentLink);

// Configuração do multer para upload de imagens
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Máximo 1 arquivo por vez
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      return cb(new Error('Apenas imagens nos formatos JPG e PNG são permitidas'), false);
    }
    cb(null, true);
  }
});

router.post('/:paymentLinkId/images', requireAdmin, upload.single('image'), CoursePaymentLinkController.addImageToPaymentLink);

// Rota para gerar links em massa (para todos os cursos de pós-graduação)
router.post('/courses/bulk/post-graduation/payment-links', requireAdmin, async (req, res) => {
  try {
    console.log('[DEBUG] Iniciando geração em massa de links para cursos de pós-graduação');
    
    // Buscar todos os cursos de pós-graduação (que contenham "Pós-Graduação" no nome ou categoria "pos")
    const postGradCourses = await db.query.courses.findMany({
      where: (courses, { or, like, eq }) => or(
        like(courses.name, '%Pós-Graduação%'),
        like(courses.name, '%Pós Graduação%'),
        eq(courses.category, 'pos')
      )
    });
    
    console.log(`[DEBUG] Encontrados ${postGradCourses.length} cursos de pós-graduação`);
    
    // Estatísticas para reportar ao final
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    const results = [];
    
    // Para evitar timeout na requisição HTTP, vamos processar apenas 5 cursos 
    // e retornar para o cliente. O restante pode ser processado em um job em background
    // ou em chamadas subsequentes.
    const coursesToProcess = postGradCourses.slice(0, 5);
    
    // Processar os cursos em sequência para não sobrecarregar a API
    for (const course of coursesToProcess) {
      totalProcessed++;
      console.log(`[DEBUG] Processando curso ${totalProcessed}/${coursesToProcess.length}: ${course.name}`);
      
      try {
        const paymentOptions = await asaasCoursePaymentService.generateStandardPostGradPaymentLinks(course.id);
        
        if (paymentOptions && paymentOptions.length > 0) {
          totalSuccess++;
          results.push({
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code,
            status: 'success',
            paymentOptions: paymentOptions.map(option => ({
              type: option.paymentType,
              url: option.paymentLinkUrl
            }))
          });
        } else {
          totalFailed++;
          results.push({
            courseId: course.id,
            courseName: course.name,
            courseCode: course.code,
            status: 'error',
            message: 'Falha ao gerar links de pagamento'
          });
        }
      } catch (error) {
        totalFailed++;
        results.push({
          courseId: course.id,
          courseName: course.name,
          courseCode: course.code,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      // Aguardar um pequeno intervalo entre as requisições para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return res.json({
      success: true,
      message: `Processamento concluído: ${totalSuccess} sucesso, ${totalFailed} falhas`,
      stats: {
        totalCourses: postGradCourses.length,
        processed: totalProcessed,
        success: totalSuccess,
        failed: totalFailed,
        remaining: postGradCourses.length - totalProcessed
      },
      results
    });
  } catch (error) {
    console.error('[DEBUG] Erro ao processar links em massa:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido durante o processamento em massa',
    });
  }
});

export default router;