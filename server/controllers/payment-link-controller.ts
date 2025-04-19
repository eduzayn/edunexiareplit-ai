/**
 * Controlador para gerenciamento de links de pagamento
 * Implementa funções para manipulação de links de pagamento com melhor tratamento de erros
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { edunexaPaymentLinks, courses } from '../../shared/schema';
import { asaasPaymentLinkService } from '../services/asaas-payment-link-service';
import { paymentLinkImageService } from '../services/payment-link-image-service';
import { logger } from '../services/logger';

// Logger específico para este controlador
const log = logger.forService('PaymentLinkController');

/**
 * Interface de resposta de erro padronizada
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  code?: string;
}

/**
 * Prepara os dados para criação de um link de pagamento
 */
const preparePaymentLinkData = (requestData: any, course: any) => {
  const data: any = {
    name: requestData.linkName,
    description: requestData.description,
    notificationEnabled: requestData.notificationEnabled || false,
  };
  
  // Configurar valor se fornecido
  if (requestData.amount) {
    data.value = requestData.amount;
  }
  
  // Configurar métodos de pagamento permitidos
  data.allowBoleto = requestData.allowBoleto || false;
  data.allowCreditCard = requestData.allowCreditCard || false;
  data.allowPix = requestData.allowPix || false;
  
  // Verificar se pelo menos um método de pagamento está habilitado
  if (!data.allowBoleto && !data.allowCreditCard && !data.allowPix) {
    // Se nenhum método especificado, habilitar todos
    data.allowBoleto = true;
    data.allowCreditCard = true;
    data.allowPix = true;
  }
  
  // Configurar parcelamento máximo
  if (requestData.maxInstallments) {
    data.maxInstallmentCount = requestData.maxInstallments;
  }
  
  // Configurar prazo de vencimento
  if (requestData.dueDateLimitDays) {
    data.dueDateLimitDays = requestData.dueDateLimitDays;
  }
  
  // Configurar dados do pagador
  if (requestData.payerName) data.payerName = requestData.payerName;
  if (requestData.payerEmail) data.payerEmail = requestData.payerEmail;
  if (requestData.payerCpf) data.payerCpfCnpj = requestData.payerCpf;
  
  // Configurar desconto se habilitado
  if (requestData.discountEnabled && requestData.discountValue) {
    data.discount = {
      value: requestData.discountValue,
      dueDateLimitDays: requestData.discountDueDateLimitDays || 0,
      type: 'PERCENTAGE'
    };
  }
  
  // Configurar multa se habilitada
  if (requestData.fineEnabled && requestData.fineValue) {
    data.fine = {
      value: requestData.fineValue,
      type: 'PERCENTAGE'
    };
  }
  
  // Configurar juros se habilitados
  if (requestData.interestEnabled && requestData.interestValue) {
    data.interest = {
      value: requestData.interestValue,
      type: 'PERCENTAGE'
    };
  }
  
  // Configurar referência externa (para rastreamento no sistema)
  const timestamp = Date.now();
  data.externalReference = `EDU-${course.id}-${timestamp}`;
  
  return data;
};

/**
 * Prepara os dados para atualização de um link de pagamento
 */
const preparePaymentLinkUpdateData = (requestData: any) => {
  // Similar ao método preparePaymentLinkData, mas para atualizações
  const data: any = {};
  
  // Atualizar apenas os campos fornecidos
  if (requestData.linkName) data.name = requestData.linkName;
  if (requestData.description !== undefined) data.description = requestData.description;
  if (requestData.notificationEnabled !== undefined) data.notificationEnabled = requestData.notificationEnabled;
  if (requestData.amount) data.value = requestData.amount;
  
  // Configurar métodos de pagamento permitidos
  if (requestData.allowBoleto !== undefined) data.allowBoleto = requestData.allowBoleto;
  if (requestData.allowCreditCard !== undefined) data.allowCreditCard = requestData.allowCreditCard;
  if (requestData.allowPix !== undefined) data.allowPix = requestData.allowPix;
  
  // Configurar parcelamento máximo
  if (requestData.maxInstallments !== undefined) {
    data.maxInstallmentCount = requestData.maxInstallments;
  }
  
  // Configurar prazo de vencimento
  if (requestData.dueDateLimitDays !== undefined) {
    data.dueDateLimitDays = requestData.dueDateLimitDays;
  }
  
  // Configurar dados do pagador
  if (requestData.payerName !== undefined) data.payerName = requestData.payerName;
  if (requestData.payerEmail !== undefined) data.payerEmail = requestData.payerEmail;
  if (requestData.payerCpf !== undefined) data.payerCpfCnpj = requestData.payerCpf;
  
  // Configurar desconto
  if (requestData.discountEnabled !== undefined) {
    if (requestData.discountEnabled && requestData.discountValue) {
      data.discount = {
        value: requestData.discountValue,
        dueDateLimitDays: requestData.discountDueDateLimitDays || 0,
        type: 'PERCENTAGE'
      };
    } else {
      // Se desconto foi desabilitado, enviar valor 0 para remover
      data.discount = {
        value: 0,
        dueDateLimitDays: 0,
        type: 'PERCENTAGE'
      };
    }
  }
  
  // Configurar multa
  if (requestData.fineEnabled !== undefined) {
    if (requestData.fineEnabled && requestData.fineValue) {
      data.fine = {
        value: requestData.fineValue,
        type: 'PERCENTAGE'
      };
    } else {
      // Se multa foi desabilitada, enviar valor 0 para remover
      data.fine = {
        value: 0,
        type: 'PERCENTAGE'
      };
    }
  }
  
  // Configurar juros
  if (requestData.interestEnabled !== undefined) {
    if (requestData.interestEnabled && requestData.interestValue) {
      data.interest = {
        value: requestData.interestValue,
        type: 'PERCENTAGE'
      };
    } else {
      // Se juros foram desabilitados, enviar valor 0 para remover
      data.interest = {
        value: 0,
        type: 'PERCENTAGE'
      };
    }
  }
  
  return data;
};

/**
 * Inicia um processo de geração de imagem em segundo plano
 */
const generateImageForLink = (linkId: number, course: any) => {
  // Executar em segundo plano (não aguarda conclusão)
  setTimeout(async () => {
    try {
      log.info(`Iniciando geração de imagem para link ${linkId} (curso: ${course.name})`);
      
      // Buscar detalhes do link de pagamento
      const [link] = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.id, linkId));
        
      if (!link) {
        log.error(`Link de pagamento ${linkId} não encontrado para geração de imagem`);
        return;
      }
      
      try {
        // Gerar imagem personalizada com base nos dados do curso
        const imageResult = await paymentLinkImageService.generatePaymentLinkImage({
          title: course.name,
          subtitle: link.description || 'Faça sua matrícula agora',
          courseName: course.name,
          courseType: course.type || 'Curso',
          courseLevel: course.level || 'Pós-Graduação',
          amount: link.amount ? `R$ ${link.amount.toFixed(2).replace('.', ',')}` : 'Consulte',
          courseImageUrl: course.imageUrl || null,
        });
        
        if (!imageResult.success) {
          log.error(`Falha na geração de imagem para link ${linkId}`, imageResult.error);
          return;
        }
        
        // Enviar imagem para o Asaas
        const uploadResult = await asaasPaymentLinkService.uploadLinkImage(
          link.asaasPaymentLinkId, 
          imageResult.imageBase64
        );
        
        if (uploadResult.success) {
          log.info(`Imagem para link ${linkId} gerada e enviada com sucesso`);
          
          // Atualizar o link para marcar que tem imagem
          await db
            .update(edunexaPaymentLinks)
            .set({ hasCustomImage: true })
            .where(eq(edunexaPaymentLinks.id, linkId));
        } else {
          log.error(`Falha no envio de imagem para link ${linkId} no Asaas`, uploadResult.error);
        }
      } catch (imageError: any) {
        log.error(`Erro na geração/envio de imagem para link ${linkId}`, imageError);
      }
    } catch (error: any) {
      log.error(`Erro no processo de geração de imagem para link ${linkId}`, error);
    }
  }, 0);
};

/**
 * Obtém um título descritivo para o erro com base no status HTTP
 */
const getErrorTitle = (status: number): string => {
  switch (status) {
    case 400: return 'Requisição Inválida';
    case 401: return 'Não Autorizado';
    case 403: return 'Acesso Negado';
    case 404: return 'Não Encontrado';
    case 409: return 'Conflito';
    case 422: return 'Erro de Validação';
    case 500: return 'Erro do Servidor';
    default: return 'Erro';
  }
};

/**
 * Envia uma resposta de erro padronizada
 */
const sendError = (res: Response, status: number, message: string, code?: string, details?: any): Response => {
  const errorResponse: ErrorResponse = {
    error: getErrorTitle(status),
    message,
    ...(code && { code }),
    ...(details && { details })
  };
  
  return res.status(status).json(errorResponse);
};

export const PaymentLinkController = {
  /**
   * Cria um novo link de pagamento
   */
  async createPaymentLink(req: Request, res: Response) {
    try {
      log.info('Iniciando criação de link de pagamento', { 
        courseId: req.body.courseId,
        linkName: req.body.linkName
      });
      
      const userId = req.user?.id;
      
      // Verificar se o curso existe
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, req.body.courseId));
        
      if (!course) {
        log.warn(`Curso não encontrado: ${req.body.courseId}`);
        return sendError(res, 404, 'Curso não encontrado', 'COURSE_NOT_FOUND');
      }
      
      // Preparar os dados do link de pagamento para o Asaas
      const paymentLinkData = preparePaymentLinkData(req.body, course);
      
      // Criar o link de pagamento no Asaas
      try {
        log.debug('Enviando dados para API do Asaas', { paymentLinkData });
        const asaasResponse = await asaasPaymentLinkService.createPaymentLink(paymentLinkData);
        
        // Salvar o link no banco de dados
        const [createdLink] = await db.insert(edunexaPaymentLinks)
          .values({
            courseId: req.body.courseId,
            generatingConsultantId: userId || null,
            name: req.body.linkName,
            description: req.body.description || null,
            asaasPaymentLinkId: asaasResponse.id,
            asaasPaymentLinkUrl: asaasResponse.url,
            internalStatus: 'Active', // Começa como ativo, será atualizado se houver erro
            amount: req.body.amount || null,
            allowBoleto: req.body.allowBoleto || false,
            allowCreditCard: req.body.allowCreditCard || false,
            allowPix: req.body.allowPix || false,
            maxInstallments: req.body.maxInstallments || 1,
            discountEnabled: req.body.discountEnabled || false,
            discountValue: req.body.discountValue || null,
            discountDueDateLimitDays: req.body.discountDueDateLimitDays || null,
            fineEnabled: req.body.fineEnabled || false,
            fineValue: req.body.fineValue || null,
            interestEnabled: req.body.interestEnabled || false,
            interestValue: req.body.interestValue || null,
            payerName: req.body.payerName || null,
            payerEmail: req.body.payerEmail || null,
            payerCpf: req.body.payerCpf || null,
            createdAt: new Date()
          })
          .returning();
          
        log.info(`Link de pagamento criado com sucesso: ${createdLink.id}`, {
          asaasLinkId: asaasResponse.id,
          url: asaasResponse.url
        });
        
        // Se imagem deve ser gerada automaticamente, iniciar geração
        if (req.body.generateImage) {
          generateImageForLink(createdLink.id, course);
        }
        
        return res.status(201).json(createdLink);
      } catch (asaasError: any) {
        log.error('Falha na criação do link no Asaas', asaasError);
        return sendError(
          res, 
          500, 
          asaasError.message || 'Erro ao criar link de pagamento no Asaas',
          'ASAAS_API_ERROR',
          asaasError.details
        );
      }
    } catch (error: any) {
      log.error('Erro não tratado na criação de link de pagamento', error);
      return sendError(
        res, 
        500, 
        'Erro ao processar solicitação de criação de link',
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
  
  /**
   * Obtém os links de pagamento para um curso
   */
  async getPaymentLinksByCourse(req: Request, res: Response) {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return sendError(res, 400, 'ID de curso inválido', 'INVALID_COURSE_ID');
      }
      
      // Verificar se o curso existe
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));
        
      if (!course) {
        return sendError(res, 404, 'Curso não encontrado', 'COURSE_NOT_FOUND');
      }
      
      log.info(`Buscando links de pagamento para o curso ${courseId}`);
      
      // Buscar links de pagamento do curso
      const links = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.courseId, courseId));
        
      log.info(`${links.length} links encontrados para o curso ${courseId}`);
      
      return res.json(links);
    } catch (error: any) {
      log.error(`Erro ao buscar links de pagamento por curso: ${req.params.courseId}`, error);
      return sendError(
        res, 
        500, 
        'Erro ao buscar links de pagamento',
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
  
  /**
   * Obtém um link de pagamento pelo ID
   */
  async getPaymentLink(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 400, 'ID inválido', 'INVALID_ID');
      }
      
      log.info(`Buscando link de pagamento ${id}`);
      
      // Buscar o link no banco de dados
      const [link] = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.id, id));
        
      if (!link) {
        log.warn(`Link de pagamento ${id} não encontrado`);
        return sendError(res, 404, 'Link de pagamento não encontrado', 'LINK_NOT_FOUND');
      }
      
      // Tentar buscar informações atualizadas no Asaas
      try {
        const asaasLink = await asaasPaymentLinkService.getPaymentLink(link.asaasPaymentLinkId);
        
        // Combinar dados do banco com dados atualizados do Asaas
        const enrichedLink = {
          ...link,
          asaasDetails: {
            status: asaasLink.status,
            url: asaasLink.url,
            billingType: asaasLink.billingType,
            chargeType: asaasLink.chargeType,
            discount: asaasLink.discount,
            fine: asaasLink.fine,
            interest: asaasLink.interest
          }
        };
        
        return res.json(enrichedLink);
      } catch (asaasError) {
        // Se falhar ao buscar detalhes do Asaas, retorna apenas os dados locais
        log.warn(`Não foi possível obter detalhes atualizados do link ${id} no Asaas`, asaasError);
        return res.json(link);
      }
    } catch (error: any) {
      log.error(`Erro ao buscar link de pagamento ${req.params.id}`, error);
      return sendError(
        res, 
        500, 
        'Erro ao buscar link de pagamento',
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
  
  /**
   * Atualiza um link de pagamento
   */
  async updatePaymentLink(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 400, 'ID inválido', 'INVALID_ID');
      }
      
      log.info(`Atualizando link de pagamento ${id}`);
      
      // Buscar o link no banco de dados
      const [link] = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.id, id));
        
      if (!link) {
        log.warn(`Link de pagamento ${id} não encontrado para atualização`);
        return sendError(res, 404, 'Link de pagamento não encontrado', 'LINK_NOT_FOUND');
      }
      
      // Preparar dados para atualização no Asaas
      const updateData = preparePaymentLinkUpdateData(req.body);
      
      try {
        // Atualizar no Asaas
        await asaasPaymentLinkService.updatePaymentLink(link.asaasPaymentLinkId, updateData);
        
        // Atualizar no banco de dados
        const dataToUpdate = { ...req.body };
        delete dataToUpdate.id;
        delete dataToUpdate.asaasPaymentLinkId;
        delete dataToUpdate.asaasPaymentLinkUrl;
        delete dataToUpdate.courseId;
        delete dataToUpdate.createdAt;
        
        const [updatedLink] = await db
          .update(edunexaPaymentLinks)
          .set(dataToUpdate)
          .where(eq(edunexaPaymentLinks.id, id))
          .returning();
          
        log.info(`Link de pagamento ${id} atualizado com sucesso`);
        
        return res.json(updatedLink);
      } catch (asaasError: any) {
        log.error(`Falha na atualização do link ${id} no Asaas`, asaasError);
        return sendError(
          res, 
          500, 
          asaasError.message || 'Erro ao atualizar link de pagamento no Asaas',
          'ASAAS_API_ERROR',
          asaasError.details
        );
      }
    } catch (error: any) {
      log.error(`Erro não tratado na atualização do link ${req.params.id}`, error);
      return sendError(
        res, 
        500, 
        'Erro ao processar solicitação de atualização de link',
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
  
  /**
   * Exclui um link de pagamento
   */
  async deletePaymentLink(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 400, 'ID inválido', 'INVALID_ID');
      }
      
      log.info(`Excluindo link de pagamento ${id}`);
      
      // Buscar o link no banco de dados
      const [link] = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.id, id));
        
      if (!link) {
        log.warn(`Link de pagamento ${id} não encontrado para exclusão`);
        return sendError(res, 404, 'Link de pagamento não encontrado', 'LINK_NOT_FOUND');
      }
      
      try {
        // Desativar link no Asaas
        await asaasPaymentLinkService.deletePaymentLink(link.asaasPaymentLinkId);
        
        // Excluir ou marcar como excluído no banco de dados
        await db
          .update(edunexaPaymentLinks)
          .set({ internalStatus: 'Disabled' })
          .where(eq(edunexaPaymentLinks.id, id));
          
        log.info(`Link de pagamento ${id} excluído com sucesso`);
        
        return res.json({ success: true, message: 'Link de pagamento excluído com sucesso' });
      } catch (asaasError: any) {
        log.error(`Falha na exclusão do link ${id} no Asaas`, asaasError);
        return sendError(
          res, 
          500, 
          asaasError.message || 'Erro ao excluir link de pagamento no Asaas',
          'ASAAS_API_ERROR',
          asaasError.details
        );
      }
    } catch (error: any) {
      log.error(`Erro não tratado na exclusão do link ${req.params.id}`, error);
      return sendError(
        res, 
        500, 
        'Erro ao processar solicitação de exclusão de link',
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
  
  /**
   * Gera uma imagem para um link de pagamento
   */
  async generateImage(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return sendError(res, 400, 'ID inválido', 'INVALID_ID');
      }
      
      log.info(`Gerando imagem para link de pagamento ${id}`);
      
      // Buscar o link e o curso no banco de dados
      const [link] = await db
        .select()
        .from(edunexaPaymentLinks)
        .where(eq(edunexaPaymentLinks.id, id));
        
      if (!link) {
        log.warn(`Link de pagamento ${id} não encontrado para geração de imagem`);
        return sendError(res, 404, 'Link de pagamento não encontrado', 'LINK_NOT_FOUND');
      }
      
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, link.courseId));
        
      if (!course) {
        log.warn(`Curso ${link.courseId} não encontrado para geração de imagem`);
        return sendError(res, 404, 'Curso não encontrado', 'COURSE_NOT_FOUND');
      }
      
      // Iniciar processo de geração de imagem em segundo plano
      generateImageForLink(id, course);
      
      return res.json({ 
        success: true, 
        message: 'Solicitação de geração de imagem recebida. O processo será executado em segundo plano.' 
      });
    } catch (error: any) {
      log.error(`Erro na solicitação de geração de imagem para link ${req.params.id}`, error);
      return sendError(
        res, 
        500, 
        'Erro ao processar solicitação de geração de imagem',
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
}
