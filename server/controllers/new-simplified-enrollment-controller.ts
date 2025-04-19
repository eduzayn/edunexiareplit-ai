/**
 * Controlador para o módulo de Matrículas Simplificadas
 * Versão 2.0 - Refatorado e otimizado para utilizar a API do Asaas corretamente
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { 
  simplifiedEnrollments, 
  courses, 
  polos,
  institutions
} from '../../shared/schema';
import { AsaasDirectPaymentService } from '../services/asaas-direct-payment-service';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Tipos de status de matrícula simplificada
export type EnrollmentStatus = 
  | 'pending'           // Aguardando geração de link de pagamento
  | 'waiting_payment'   // Link gerado, aguardando pagamento
  | 'payment_confirmed' // Pagamento confirmado
  | 'completed'         // Matrícula concluída
  | 'cancelled'         // Matrícula cancelada
  | 'failed';           // Falha no processamento

// Interface para criação de matrícula simplificada
interface CreateSimplifiedEnrollmentData {
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  courseId: number;
  institutionId: number;
  sourceChannel: string;
  poloId?: number | null;
  amount?: number;
  externalReference?: string;
  createdById?: number;
}

// Gerador de referência externa única
function generateExternalReference(): string {
  // Formato: EDX-{timestamp}-{random} (Edunexia)
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `EDX-${timestamp}-${random}`;
}

// Formatador de data para API (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const NewSimplifiedEnrollmentController = {
  /**
   * Lista todas as matrículas simplificadas
   */
  async getAll(req: Request, res: Response) {
    try {
      // Obter parâmetros de paginação e filtros
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      // Query base
      let query = db
        .select({
          id: simplifiedEnrollments.id,
          studentName: simplifiedEnrollments.studentName,
          studentEmail: simplifiedEnrollments.studentEmail,
          studentCpf: simplifiedEnrollments.studentCpf,
          status: simplifiedEnrollments.status,
          createdAt: simplifiedEnrollments.createdAt,
          updatedAt: simplifiedEnrollments.updatedAt,
          courseName: courses.name,
          poloName: polos.name,
          institutionName: institutions.name,
          amount: simplifiedEnrollments.amount,
          paymentLinkUrl: simplifiedEnrollments.paymentLinkUrl,
          externalReference: simplifiedEnrollments.externalReference
        })
        .from(simplifiedEnrollments)
        .leftJoin(courses, eq(simplifiedEnrollments.courseId, courses.id))
        .leftJoin(polos, eq(simplifiedEnrollments.poloId, polos.id))
        .leftJoin(institutions, eq(simplifiedEnrollments.institutionId, institutions.id))
        .orderBy(sql`${simplifiedEnrollments.id} DESC`);
      
      // Executar a query
      const enrollments = await query.limit(limit).offset(offset);
      
      // Contar total para paginação
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(simplifiedEnrollments);
      
      const total = Number(countResult[0].count);
      
      res.status(200).json({
        success: true,
        data: enrollments,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao listar matrículas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar matrículas simplificadas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  },
  
  /**
   * Obtém detalhes de uma matrícula específica
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      // Buscar matrícula com dados relacionados
      const enrollment = await db
        .select({
          id: simplifiedEnrollments.id,
          studentName: simplifiedEnrollments.studentName,
          studentEmail: simplifiedEnrollments.studentEmail,
          studentCpf: simplifiedEnrollments.studentCpf,
          courseId: simplifiedEnrollments.courseId,
          courseName: courses.name,
          poloId: simplifiedEnrollments.poloId,
          poloName: polos.name,
          institutionId: simplifiedEnrollments.institutionId,
          institutionName: institutions.name,
          status: simplifiedEnrollments.status,
          externalReference: simplifiedEnrollments.externalReference,
          createdAt: simplifiedEnrollments.createdAt,
          updatedAt: simplifiedEnrollments.updatedAt,
          sourceChannel: simplifiedEnrollments.sourceChannel,
          amount: simplifiedEnrollments.amount,
          paymentLinkId: simplifiedEnrollments.paymentLinkId,
          paymentLinkUrl: simplifiedEnrollments.paymentLinkUrl,
          paymentId: simplifiedEnrollments.paymentId,
          asaasCustomerId: simplifiedEnrollments.asaasCustomerId,
          errorDetails: simplifiedEnrollments.errorDetails,
          processedAt: simplifiedEnrollments.processedAt,
          createdBy: simplifiedEnrollments.createdById,
          updatedBy: simplifiedEnrollments.updatedById
        })
        .from(simplifiedEnrollments)
        .leftJoin(courses, eq(simplifiedEnrollments.courseId, courses.id))
        .leftJoin(polos, eq(simplifiedEnrollments.poloId, polos.id))
        .leftJoin(institutions, eq(simplifiedEnrollments.institutionId, institutions.id))
        .where(eq(simplifiedEnrollments.id, id))
        .limit(1);
      
      if (!enrollment.length) {
        return res.status(404).json({
          success: false,
          message: 'Matrícula não encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        data: enrollment[0]
      });
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao buscar matrícula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar matrícula simplificada',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  },
  
  /**
   * Cria uma nova matrícula simplificada
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      const {
        studentName,
        studentEmail,
        studentCpf,
        courseId,
        institutionId,
        sourceChannel,
        poloId,
        amount
      } = req.body as CreateSimplifiedEnrollmentData;
      
      // Validação básica
      if (!studentName || !studentEmail || !studentCpf || !courseId || !institutionId) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para criação da matrícula'
        });
      }
      
      // Gerar referência externa única
      const externalReference = generateExternalReference();
      
      // Criar matrícula no banco
      const result = await db.insert(simplifiedEnrollments).values({
        studentName,
        studentEmail,
        studentCpf,
        courseId,
        institutionId,
        sourceChannel: sourceChannel || 'web',
        poloId,
        status: 'pending',
        externalReference,
        createdAt: new Date(),
        updatedAt: new Date(),
        amount: amount || 0,
        createdById: userId || null
      }).returning();
      
      const enrollment = result[0];
      
      res.status(201).json({
        success: true,
        message: 'Matrícula simplificada criada com sucesso',
        data: enrollment
      });
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao criar matrícula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar matrícula simplificada',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  },
  
  /**
   * Gera um link de pagamento para uma matrícula
   */
  async generatePaymentLink(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      // Buscar a matrícula
      const enrollments = await db
        .select()
        .from(simplifiedEnrollments)
        .where(eq(simplifiedEnrollments.id, id))
        .limit(1);
      
      if (!enrollments.length) {
        return res.status(404).json({
          success: false,
          message: 'Matrícula não encontrada'
        });
      }
      
      const enrollment = enrollments[0];
      
      // Verificar se já existe um link de pagamento ativo
      if (enrollment.status === 'waiting_payment' && enrollment.paymentLinkUrl) {
        return res.status(200).json({
          success: true,
          message: 'Link de pagamento já existe',
          data: {
            paymentLinkId: enrollment.paymentLinkId,
            paymentLinkUrl: enrollment.paymentLinkUrl
          }
        });
      }
      
      // Buscar informações do curso
      const courseResult = await db
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId))
        .limit(1);
      
      if (!courseResult.length) {
        return res.status(404).json({
          success: false,
          message: 'Curso não encontrado'
        });
      }
      
      const course = courseResult[0];
      
      // Determinar o valor correto
      const amount = enrollment.amount || course.price || 0;
      
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor inválido para geração de link de pagamento'
        });
      }
      
      try {
        // 1. Criar ou obter cliente no Asaas
        const customer = await AsaasDirectPaymentService.createOrGetCustomer(
          enrollment.studentName,
          enrollment.studentEmail,
          enrollment.studentCpf
        );
        
        // 2. Criar cobrança com link
        const description = `Matrícula: ${course.name}`;
        const payment = await AsaasDirectPaymentService.createPaymentWithLink(
          customer.id,
          amount,
          description,
          enrollment.externalReference
        );
        
        // 3. Atualizar a matrícula com as informações do pagamento
        await db.update(simplifiedEnrollments)
          .set({
            status: 'waiting_payment',
            paymentLinkId: payment.id,
            paymentLinkUrl: payment.invoiceUrl,
            paymentId: payment.id,
            asaasCustomerId: customer.id,
            updatedAt: new Date(),
            updatedById: userId || null,
            processedAt: new Date(),
            processedById: userId || null
          })
          .where(eq(simplifiedEnrollments.id, id));
        
        // 4. Retornar sucesso com o link
        res.status(200).json({
          success: true,
          message: 'Link de pagamento gerado com sucesso',
          data: {
            paymentLinkId: payment.id,
            paymentLinkUrl: payment.invoiceUrl,
            paymentId: payment.id,
            asaasCustomerId: customer.id
          }
        });
      } catch (asaasError) {
        console.error('[NEW SIMPLIFIED ENROLLMENT] Erro na integração com Asaas:', asaasError);
        
        // Registrar erro na matrícula
        await db.update(simplifiedEnrollments)
          .set({
            status: 'failed',
            errorDetails: asaasError instanceof Error 
              ? asaasError.message 
              : 'Erro desconhecido na integração com Asaas',
            updatedAt: new Date(),
            updatedById: userId || null
          })
          .where(eq(simplifiedEnrollments.id, id));
        
        throw asaasError;
      }
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao gerar link de pagamento:', error);
      
      // Resposta de erro detalhada
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorDetails = error instanceof Error && (error as any).response?.data 
        ? JSON.stringify((error as any).response?.data)
        : 'Sem detalhes adicionais';
      
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar link de pagamento',
        error: errorMessage,
        details: errorDetails
      });
    }
  },
  
  /**
   * Cancela uma matrícula
   */
  async cancel(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      // Buscar a matrícula
      const enrollments = await db
        .select()
        .from(simplifiedEnrollments)
        .where(eq(simplifiedEnrollments.id, id))
        .limit(1);
      
      if (!enrollments.length) {
        return res.status(404).json({
          success: false,
          message: 'Matrícula não encontrada'
        });
      }
      
      const enrollment = enrollments[0];
      
      // Se tiver um link de pagamento, cancelar no Asaas
      if (enrollment.paymentId) {
        try {
          await AsaasDirectPaymentService.cancelPayment(enrollment.paymentId);
        } catch (asaasError) {
          console.warn('[NEW SIMPLIFIED ENROLLMENT] Erro ao cancelar pagamento no Asaas:', asaasError);
          // Continuamos mesmo com erro no Asaas
        }
      }
      
      // Atualizar status na base
      await db.update(simplifiedEnrollments)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
          updatedById: userId || null
        })
        .where(eq(simplifiedEnrollments.id, id));
      
      res.status(200).json({
        success: true,
        message: 'Matrícula cancelada com sucesso'
      });
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao cancelar matrícula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar matrícula simplificada',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  },
  
  /**
   * Atualiza o status de pagamento de uma matrícula
   */
  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      // Buscar a matrícula
      const enrollments = await db
        .select()
        .from(simplifiedEnrollments)
        .where(eq(simplifiedEnrollments.id, id))
        .limit(1);
      
      if (!enrollments.length) {
        return res.status(404).json({
          success: false,
          message: 'Matrícula não encontrada'
        });
      }
      
      const enrollment = enrollments[0];
      
      // Verificar se existe um ID de pagamento
      if (!enrollment.paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Não há pagamento associado a esta matrícula'
        });
      }
      
      // Consultar status no Asaas
      const payment = await AsaasDirectPaymentService.getPaymentById(enrollment.paymentId);
      
      // Mapear status do Asaas para nosso sistema
      let newStatus: EnrollmentStatus = 'waiting_payment';
      
      switch (payment.status) {
        case 'RECEIVED':
        case 'CONFIRMED':
        case 'RECEIVED_IN_CASH':
          newStatus = 'payment_confirmed';
          break;
          
        case 'OVERDUE':
        case 'PENDING':
        case 'AWAITING_RISK_ANALYSIS':
          newStatus = 'waiting_payment';
          break;
          
        case 'REFUNDED':
        case 'REFUND_REQUESTED':
        case 'CHARGEBACK_REQUESTED':
        case 'CHARGEBACK_DISPUTE':
        case 'AWAITING_CHARGEBACK_REVERSAL':
          newStatus = 'cancelled';
          break;
          
        case 'FAILED':
          newStatus = 'failed';
          break;
          
        default:
          newStatus = 'waiting_payment';
      }
      
      // Atualizar no banco
      await db.update(simplifiedEnrollments)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedById: userId || null
        })
        .where(eq(simplifiedEnrollments.id, id));
      
      res.status(200).json({
        success: true,
        message: 'Status de pagamento atualizado com sucesso',
        data: {
          asaasStatus: payment.status,
          newStatus
        }
      });
    } catch (error) {
      console.error('[NEW SIMPLIFIED ENROLLMENT] Erro ao atualizar status de pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
};