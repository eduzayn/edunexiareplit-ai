/**
 * Controlador para matrículas simplificadas
 */

import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertSimplifiedEnrollmentSchema } from '@shared/schema';
import { z } from 'zod';
import { SimplifiedEnrollmentService } from '../services/simplified-enrollment-service';

// Interface para a estrutura do webhook do Asaas
interface AsaasWebhookPayload {
  event: string;
  payment?: any;
  paymentLink?: any;
  // Outros campos possíveis dependendo do evento
}

/**
 * Cria uma nova matrícula simplificada
 */
export async function createSimplifiedEnrollment(req: Request, res: Response) {
  try {
    // Validar os dados de entrada
    const validationResult = insertSimplifiedEnrollmentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      console.log('Erro de validação na matrícula simplificada:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos para matrícula simplificada',
        errors
      });
    }
    
    // Gerar uma referência externa se não foi fornecida
    const enrollmentData = validationResult.data;
    if (!enrollmentData.externalReference) {
      enrollmentData.externalReference = SimplifiedEnrollmentService.generateExternalReference();
    }
    
    // Definir o ID do usuário criador se não estiver presente
    if (!enrollmentData.createdById && req.user?.id) {
      enrollmentData.createdById = req.user.id;
    }
    
    // Se a origem for polo_portal, precisamos definir o polo do usuário
    if (enrollmentData.sourceChannel === 'polo_portal' && !enrollmentData.poloId && req.user?.id) {
      // Buscar o polo do usuário atual
      const polo = await storage.getPoloByUserId(req.user.id);
      if (polo) {
        enrollmentData.poloId = polo.id;
        // Se não foi definida uma instituição, usar a instituição do polo
        if (!enrollmentData.institutionId) {
          enrollmentData.institutionId = polo.institutionId;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Usuário não está associado a nenhum polo'
        });
      }
    }
    
    // Verificar se o curso existe e obter seu preço
    const course = await storage.getCourse(enrollmentData.courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: `Curso não encontrado: ${enrollmentData.courseId}`
      });
    }
    
    // Definir o valor da matrícula como o preço do curso se não foi informado
    if (!enrollmentData.amount && course.price) {
      enrollmentData.amount = course.price;
      console.log(`Definindo o valor da matrícula para o preço do curso: ${course.price}`);
    } else if (!enrollmentData.amount) {
      return res.status(400).json({
        success: false,
        message: 'Valor da matrícula (amount) não informado e curso não possui preço definido'
      });
    }
    
    // Criar a matrícula simplificada
    const newEnrollment = await storage.createSimplifiedEnrollment(enrollmentData);
    
    return res.status(201).json({
      success: true,
      data: newEnrollment
    });
  } catch (error) {
    console.error('Erro ao criar matrícula simplificada:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao criar matrícula simplificada: ${error.message}`
    });
  }
}

/**
 * Obtém uma matrícula simplificada pelo ID
 */
export async function getSimplifiedEnrollment(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    const enrollment = await storage.getSimplifiedEnrollment(id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: `Matrícula simplificada não encontrada: ${id}`
      });
    }
    
    return res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error(`Erro ao buscar matrícula simplificada:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao buscar matrícula simplificada: ${error.message}`
    });
  }
}

/**
 * Lista matrículas simplificadas com filtros opcionais
 */
export async function listSimplifiedEnrollments(req: Request, res: Response) {
  try {
    const { 
      status, 
      courseId, 
      poloId, 
      institutionId,
      limit = 50,
      offset = 0
    } = req.query;
    
    // Converter parâmetros numéricos
    const parsedCourseId = courseId ? parseInt(courseId as string, 10) : undefined;
    const parsedPoloId = poloId ? parseInt(poloId as string, 10) : undefined;
    const parsedInstitutionId = institutionId ? parseInt(institutionId as string, 10) : undefined;
    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);
    
    // Buscar matrículas com filtros
    const enrollments = await storage.getSimplifiedEnrollments(
      status as string,
      parsedCourseId,
      parsedPoloId,
      parsedInstitutionId,
      parsedLimit,
      parsedOffset
    );
    
    return res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Erro ao listar matrículas simplificadas:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao listar matrículas simplificadas: ${error.message}`
    });
  }
}

/**
 * Processa webhook do Asaas para matrículas simplificadas
 */
export async function processWebhook(req: Request, res: Response) {
  try {
    // Validar payload do webhook
    const webhookPayload = req.body as AsaasWebhookPayload;
    
    if (!webhookPayload || !webhookPayload.event) {
      return res.status(400).json({
        success: false,
        message: 'Payload de webhook inválido'
      });
    }
    
    console.log(`Recebido webhook do Asaas - Evento: ${webhookPayload.event}`);
    
    // Processar webhook no serviço
    await SimplifiedEnrollmentService.processWebhook(webhookPayload);
    
    // Sempre retornar sucesso para o Asaas (recomendado)
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar webhook do Asaas:', error);
    
    // Ainda retornamos 200 para o Asaas não reenviar o webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook recebido, mas ocorreu um erro no processamento'
    });
  }
}

/**
 * Finaliza uma matrícula simplificada manualmente
 */
export async function processEnrollment(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    // Obter a matrícula simplificada
    const enrollment = await storage.getSimplifiedEnrollment(id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: `Matrícula simplificada não encontrada: ${id}`
      });
    }
    
    // Verificar se já foi processada
    if (enrollment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Esta matrícula já foi processada'
      });
    }
    
    // TODO: Implementar lógica para criar a matrícula oficial
    // Isso envolve criar um usuário (se não existir) e uma matrícula
    
    // Por enquanto, apenas atualizamos o status
    const processedEnrollment = await storage.updateSimplifiedEnrollmentStatus(
      id,
      'completed',
      req.user?.id
    );
    
    return res.json({
      success: true,
      data: processedEnrollment,
      message: 'Matrícula processada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar matrícula simplificada:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao processar matrícula simplificada: ${error.message}`
    });
  }
}

/**
 * Gera manualmente um link de pagamento para uma matrícula
 */
export async function generatePaymentLink(req: Request, res: Response) {
  try {
    const enrollmentId = parseInt(req.params.id);
    
    // Verificar se o ID é válido
    if (isNaN(enrollmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de matrícula inválido'
      });
    }
    
    // Buscar a matrícula no banco
    const enrollment = await storage.getSimplifiedEnrollment(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula não encontrada'
      });
    }
    
    // Verificar se a matrícula já possui um link de pagamento
    if (enrollment.paymentLinkId || enrollment.paymentLinkUrl) {
      return res.status(400).json({
        success: false,
        message: 'Esta matrícula já possui um link de pagamento'
      });
    }
    
    // Verificar se a matrícula está em um estado que permite gerar link
    if (enrollment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Não é possível gerar link para matrículas com status ${enrollment.status}`
      });
    }
    
    // Obter dados do curso para definir o valor
    const course = await storage.getCourse(enrollment.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso não encontrado'
      });
    }
    
    // Verificar se o aluno já existe no Asaas ou criar um novo
    let asaasCustomerId = enrollment.asaasCustomerId;
    if (!asaasCustomerId) {
      try {
        // Buscar cliente por CPF
        // Reutiliza o método existente de criar ou obter cliente do Asaas
        const existingCustomer = await SimplifiedEnrollmentService.createOrGetAsaasCustomer(
          enrollment.studentName,
          enrollment.studentEmail,
          enrollment.studentCpf
        );
        
        // Cliente encontrado ou criado, usar o ID 
        asaasCustomerId = existingCustomer.id;
        
        // Atualizar na nossa base
        await storage.updateSimplifiedEnrollment(enrollmentId, {
          asaasCustomerId: existingCustomer.id
        });
      } catch (customerError) {
        console.error('Erro ao buscar/criar cliente no Asaas:', customerError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar dados do cliente no Asaas'
        });
      }
    }
    
    // Gerar link de pagamento
    try {
      // Se não tiver uma referência externa, gerar uma
      const externalReference = enrollment.externalReference || 
        SimplifiedEnrollmentService.generateExternalReference();
      
      // Criar link de pagamento no Asaas
      const paymentLink = await SimplifiedEnrollmentService.createPaymentLink(
        asaasCustomerId,
        course.price,
        course.name,
        externalReference
      );
      
      // Atualizar a matrícula com os dados do link de pagamento
      await storage.updateSimplifiedEnrollment(enrollmentId, {
        status: 'waiting_payment',
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        externalReference: externalReference,
        amount: course.price
      });
      
      return res.status(200).json({
        success: true,
        message: 'Link de pagamento gerado com sucesso',
        data: {
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.url
        }
      });
    } catch (paymentError) {
      console.error('Erro ao gerar link de pagamento:', paymentError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de pagamento'
      });
    }
  } catch (error) {
    console.error('Erro ao gerar link de pagamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação'
    });
  }
}

export async function cancelEnrollment(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    
    // Obter a matrícula simplificada
    const enrollment = await storage.getSimplifiedEnrollment(id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: `Matrícula simplificada não encontrada: ${id}`
      });
    }
    
    // Verificar se já foi processada ou cancelada
    if (enrollment.status === 'completed' || enrollment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Esta matrícula já foi ${enrollment.status === 'completed' ? 'processada' : 'cancelada'}`
      });
    }
    
    // Atualizar o status para cancelado
    const cancelledEnrollment = await storage.updateSimplifiedEnrollmentStatus(
      id,
      'cancelled',
      req.user?.id
    );
    
    return res.json({
      success: true,
      data: cancelledEnrollment,
      message: 'Matrícula cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar matrícula simplificada:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao cancelar matrícula simplificada: ${error.message}`
    });
  }
}