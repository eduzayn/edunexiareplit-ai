import { Request, Response } from 'express';
import { CoursePaymentOption, asaasCoursePaymentService } from '../services/asaas-course-payment-service';
import { db } from '../db';
import { courses } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Controlador para gerenciar links de pagamento de cursos
 */
export const CoursePaymentLinkController = {
  /**
   * Cria um link de pagamento personalizado para um curso
   */
  async createCustomPaymentLink(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      const formData = req.body;
      
      console.log('[DEBUG] Recebendo solicitação para criar link personalizado:', {
        courseId,
        formData
      });
      
      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido'
        });
      }
      
      // Verificar se o curso existe
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Curso com ID ${courseId} não encontrado`
        });
      }
      
      // Converter os dados para o formato esperado pelo serviço
      const billingTypes = formData.billingTypes || formData.billingType;
      const billingTypesString = Array.isArray(billingTypes) 
        ? billingTypes.join(',') 
        : billingTypes;
      
      // Preparar os dados do link de pagamento
      const paymentLinkData = {
        courseId,
        courseName: course.name,
        courseCode: course.code,
        name: formData.name,
        description: formData.description,
        value: parseFloat(formData.value),
        billingType: billingTypesString,
        maxInstallments: formData.maxInstallments ? parseInt(formData.maxInstallments) : undefined,
        paymentType: formData.paymentType || 'single',
        notificationEnabled: formData.notificationEnabled === 'true' || formData.notificationEnabled === true,
        dueDateLimitDays: formData.dueDateLimitDays ? parseInt(formData.dueDateLimitDays) : 7,
        endDate: formData.endDate
      };
      
      console.log('[DEBUG] Dados preparados para criação de link:', paymentLinkData);
      
      // Criar o link de pagamento
      const paymentLink = await asaasCoursePaymentService.createCustomPaymentLink(paymentLinkData);
      
      // Preparar a opção de pagamento para salvar no banco
      const paymentOption = {
        paymentLinkId: paymentLink.paymentLinkId,
        paymentLinkUrl: paymentLink.paymentLinkUrl,
        paymentType: paymentLinkData.paymentType,
        name: paymentLinkData.name,
        description: paymentLinkData.description,
        value: paymentLinkData.value,
        installments: paymentLinkData.maxInstallments || 1,
        billingType: paymentLinkData.billingType
      };
      
      // Buscar as opções atuais e adicionar a nova
      let currentOptions = [];
      if (course.paymentOptions) {
        try {
          currentOptions = JSON.parse(course.paymentOptions);
          if (!Array.isArray(currentOptions)) {
            currentOptions = [];
          }
        } catch (e) {
          console.error('Erro ao fazer parse das opções de pagamento:', e);
        }
      }
      
      // Adicionar a nova opção
      currentOptions.push(paymentOption);
      
      // Atualizar o banco de dados
      await db.update(courses)
        .set({
          paymentOptions: JSON.stringify(currentOptions),
          updatedAt: new Date()
        })
        .where(eq(courses.id, courseId));
      
      return res.status(200).json({
        success: true,
        data: paymentOption
      });
    } catch (error) {
      console.error('Erro ao criar link de pagamento personalizado:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar link de pagamento',
      });
    }
  },
  
  /**
   * Adiciona uma imagem a um link de pagamento
   */
  async addImageToPaymentLink(req: Request, res: Response) {
    try {
      const paymentLinkId = req.params.paymentLinkId;
      const file = req.file;
      
      if (!paymentLinkId) {
        return res.status(400).json({
          success: false,
          message: 'ID do link de pagamento inválido'
        });
      }
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem enviada'
        });
      }
      
      console.log('[DEBUG] Recebendo solicitação para adicionar imagem ao link:', {
        paymentLinkId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      });
      
      // Verificar se o tipo MIME é suportado
      if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de arquivo não suportado. Apenas imagens JPG e PNG são aceitas.'
        });
      }
      
      // Enviar a imagem para o Asaas
      const result = await asaasCoursePaymentService.addImageToPaymentLink(
        paymentLinkId,
        file.buffer,
        file.originalname,
        file.mimetype
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Erro ao adicionar imagem ao link de pagamento'
        });
      }
      
      // Atualizar todas as opções de pagamento que usam este link para indicar que tem imagens
      const coursesWithLink = await db.query.courses.findMany();
      
      for (const course of coursesWithLink) {
        if (course.paymentOptions) {
          try {
            let options = JSON.parse(course.paymentOptions);
            if (Array.isArray(options)) {
              let updated = false;
              
              // Atualizar opções de pagamento
              options = options.map((option: any) => {
                if (option.paymentLinkId === paymentLinkId) {
                  updated = true;
                  return {
                    ...option,
                    hasImages: true
                  };
                }
                return option;
              });
              
              // Se alguma opção foi atualizada, salvar no banco
              if (updated) {
                await db.update(courses)
                  .set({
                    paymentOptions: JSON.stringify(options),
                    updatedAt: new Date()
                  })
                  .where(eq(courses.id, course.id));
              }
            }
          } catch (e) {
            console.error(`Erro ao processar opções do curso ${course.id}:`, e);
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Imagem adicionada com sucesso',
        data: {
          imageId: result.id
        }
      });
    } catch (error) {
      console.error('Erro ao adicionar imagem ao link de pagamento:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao adicionar imagem',
      });
    }
  },
  
  /**
   * Remove um link de pagamento
   */
  async deletePaymentLink(req: Request, res: Response) {
    try {
      const paymentLinkId = req.params.paymentLinkId;
      
      if (!paymentLinkId) {
        return res.status(400).json({
          success: false,
          message: 'ID do link de pagamento inválido'
        });
      }
      
      console.log('[DEBUG] Iniciando processo de remoção do link de pagamento:', paymentLinkId);
      
      // Remover o link no Asaas
      const deleteResult = await asaasCoursePaymentService.deletePaymentLink(paymentLinkId);
      
      if (!deleteResult.success) {
        console.warn('[DEBUG] Erro ao remover link no Asaas:', deleteResult.message);
        // Continuamos mesmo com falha no Asaas para garantir limpeza do banco local
      }
      
      // Buscar todos os cursos que possam ter este link nas opções
      const coursesWithLink = await db.query.courses.findMany();
      let updatedCourses = 0;
      
      for (const course of coursesWithLink) {
        if (course.paymentOptions) {
          try {
            let options = JSON.parse(course.paymentOptions);
            if (Array.isArray(options)) {
              // Filtrar para remover a opção com este ID
              const filteredOptions = options.filter(
                (option: any) => option.paymentLinkId !== paymentLinkId
              );
              
              // Se houve alteração, atualizar o curso
              if (filteredOptions.length !== options.length) {
                updatedCourses++;
                await db.update(courses)
                  .set({
                    paymentOptions: JSON.stringify(filteredOptions),
                    updatedAt: new Date()
                  })
                  .where(eq(courses.id, course.id));
              }
            }
          } catch (e) {
            console.error(`Erro ao processar opções do curso ${course.id}:`, e);
          }
        }
        
        // Se este curso tem o link como link principal (legacy), limpar
        if (course.paymentLinkId === paymentLinkId) {
          await db.update(courses)
            .set({
              paymentLinkId: null,
              paymentLinkUrl: null,
              updatedAt: new Date()
            })
            .where(eq(courses.id, course.id));
        }
      }
      
      console.log('[DEBUG] Link removido com sucesso. Cursos atualizados:', updatedCourses);
      
      return res.status(200).json({
        success: true,
        message: 'Link de pagamento removido com sucesso',
        data: {
          updatedCourses
        }
      });
    } catch (error) {
      console.error('Erro ao remover link de pagamento:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao remover link de pagamento',
      });
    }
  },
  
  /**
   * Gera um novo link de pagamento para um curso
   */
  async generatePaymentLink(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido'
        });
      }
      
      // Verificar se o curso existe
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Curso com ID ${courseId} não encontrado`
        });
      }
      
      // Gerar o link de pagamento
      const paymentLink = await asaasCoursePaymentService.generatePaymentLinkForCourse(courseId);
      
      return res.status(200).json({
        success: true,
        data: paymentLink
      });
    } catch (error) {
      console.error('Erro ao gerar link de pagamento para curso:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao gerar link de pagamento',
      });
    }
  },
  
  /**
   * Obtém o link de pagamento de um curso, gerando um novo se necessário
   */
  async getPaymentLink(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido'
        });
      }
      
      // Verificar se o curso existe
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Curso com ID ${courseId} não encontrado`
        });
      }
      
      // Se já existe um link, retornar o existente
      if (course.paymentLinkId && course.paymentLinkUrl) {
        return res.status(200).json({
          success: true,
          data: {
            paymentLinkId: course.paymentLinkId,
            paymentLinkUrl: course.paymentLinkUrl
          }
        });
      }
      
      // Caso contrário, gerar um novo
      const paymentLink = await asaasCoursePaymentService.generatePaymentLinkForCourse(courseId);
      
      return res.status(200).json({
        success: true,
        data: paymentLink
      });
    } catch (error) {
      console.error('Erro ao obter link de pagamento para curso:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao obter link de pagamento',
      });
    }
  },
  
  /**
   * Gera os três links de pagamento padrão para cursos de pós-graduação
   */
  async generateStandardPostGradPaymentLinks(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      
      console.log('[DEBUG] Iniciando geração de links padrão para curso ID:', courseId);
      
      // Testar credenciais da API Asaas
      console.log('[DEBUG] Verificando variáveis de ambiente da API Asaas:');
      console.log('- ASAAS_API_URL:', process.env.ASAAS_API_URL);
      console.log('- ASAAS_API_KEY:', process.env.ASAAS_API_KEY ? '✅ Definida' : '❌ Não definida');
      console.log('- ASAAS_ZAYN_KEY:', process.env.ASAAS_ZAYN_KEY ? '✅ Definida' : '❌ Não definida');
      console.log('- Token usado pelo serviço (primeiros 10 caracteres):', asaasCoursePaymentService.getApiToken().substring(0, 10) + '...');
      console.log('- Comprimento do token usado:', asaasCoursePaymentService.getApiToken().length);
      
      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido'
        });
      }
      
      // Verificar se o curso existe
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Curso com ID ${courseId} não encontrado`
        });
      }
      
      console.log('[DEBUG] Dados do curso encontrados:', { 
        id: course.id, 
        code: course.code, 
        name: course.name 
      });
      
      // Gerar os links de pagamento padrão
      const paymentOptions = await asaasCoursePaymentService.generateStandardPostGradPaymentLinks(courseId);
      
      return res.status(200).json({
        success: true,
        data: paymentOptions
      });
    } catch (error) {
      console.error('Erro ao gerar links de pagamento padrão:', error);
      
      // Extrair detalhes adicionais sobre o erro, se disponíveis
      let errorDetails = '';
      if (error instanceof Error) {
        errorDetails = error.message;
        console.error('[DEBUG] Detalhes do erro:', error.stack);
        
        // Se for um erro de Axios (erro de API)
        if ('isAxiosError' in error && (error as any).isAxiosError) {
          const axiosError = error as any;
          if (axiosError.response) {
            console.error('[DEBUG] Resposta da API Asaas:', {
              status: axiosError.response.status,
              data: axiosError.response.data,
              headers: axiosError.response.headers
            });
            errorDetails = `Status: ${axiosError.response.status}, Dados: ${JSON.stringify(axiosError.response.data)}`;
          } else if (axiosError.request) {
            console.error('[DEBUG] Requisição enviada mas sem resposta');
            errorDetails = 'Requisição enviada mas sem resposta do servidor';
          }
        }
      }
      
      return res.status(500).json({
        success: false,
        message: errorDetails || (error instanceof Error ? error.message : 'Erro ao gerar links de pagamento'),
      });
    }
  },
  
  /**
   * Obtém as opções de pagamento para um curso
   */
  async getPaymentOptions(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de curso inválido'
        });
      }
      
      // Verificar se o curso existe
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Curso com ID ${courseId} não encontrado`
        });
      }
      
      // Buscar opções de pagamento
      const paymentOptions = await asaasCoursePaymentService.getPaymentOptions(courseId);
      
      return res.status(200).json({
        success: true,
        data: paymentOptions
      });
    } catch (error) {
      console.error('Erro ao obter opções de pagamento:', error);
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao obter opções de pagamento',
      });
    }
  }
};