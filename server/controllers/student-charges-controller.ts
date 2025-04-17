/**
 * Controlador para gerenciamento de cobranças do aluno
 * Permite que o aluno visualize suas próprias cobranças
 */

import { Request, Response } from 'express';
import asaasChargesService from '../services/asaas-charges-service';
import asaasCustomersService from '../services/asaas-customers-service';
import { logger } from '../utils/logger';
import { storage } from '../storage';

/**
 * Busca as cobranças do aluno logado
 */
export async function getStudentCharges(req: Request, res: Response) {
  try {
    // Verificar se o usuário está logado e é um aluno
    if (!req.user || req.user.portalType !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    const userId = req.user.id;
    
    logger.info(`[StudentChargesController] Buscando cobranças do aluno: ${userId}`);
    
    // Buscar ou identificar o ID do cliente no Asaas associado ao usuário
    let asaasCustomerId;
    
    // Tenta encontrar o ID do cliente Asaas associado ao usuário através do CPF
    if (req.user.cpf) {
      logger.info(`[StudentChargesController] Buscando cliente Asaas pelo CPF: ${req.user.cpf}`);
      const customerByCpf = await asaasCustomersService.getCustomerByCpfCnpj(req.user.cpf);
      if (customerByCpf) {
        asaasCustomerId = customerByCpf.id;
        logger.info(`[StudentChargesController] Cliente Asaas encontrado pelo CPF: ${asaasCustomerId}`);
      }
    }
    
    // Se não encontrou pelo CPF, tenta buscar pelas matrículas do aluno
    if (!asaasCustomerId) {
      logger.info(`[StudentChargesController] Buscando matrículas do aluno: ${userId}`);
      const enrollments = await storage.getEnrollmentsByStudentId(userId);
      
      // Se encontrou matrículas, tenta obter o paymentExternalId que pode conter o ID do cliente
      if (enrollments && enrollments.length > 0) {
        for (const enrollment of enrollments) {
          if (enrollment.paymentExternalId) {
            // Buscar a cobrança para encontrar o cliente
            try {
              const charge = await asaasChargesService.getChargeById(enrollment.paymentExternalId);
              if (charge && charge.customer) {
                asaasCustomerId = charge.customer;
                logger.info(`[StudentChargesController] Cliente Asaas encontrado pela matrícula: ${asaasCustomerId}`);
                break;
              }
            } catch (error) {
              // Continua tentando com a próxima matrícula
              logger.warn(`[StudentChargesController] Erro ao buscar cobrança: ${enrollment.paymentExternalId}`);
            }
          }
        }
      }
    }
    
    // Se não encontrou o ID do cliente, retorna lista vazia
    if (!asaasCustomerId) {
      logger.warn(`[StudentChargesController] Não foi possível encontrar o ID do cliente Asaas para o usuário: ${userId}`);
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Buscar cobranças do cliente no Asaas
    const charges = await asaasChargesService.getCustomerCharges(asaasCustomerId);
    
    // Mapear para o formato adequado para o frontend
    const mappedCharges = charges.map(charge => {
      // Determinar o status no formato adequado para o frontend
      let status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
      
      switch (charge.status.toUpperCase()) {
        case 'PENDING':
        case 'RECEIVED':
        case 'CONFIRMED':
          status = 'pending';
          break;
        case 'RECEIVED_IN_CASH':
        case 'RECEIVED_IN_CASH_UNDERPAID':
        case 'RECEIVED_IN_CASH_OVERPAID':
        case 'RECEIVED_PARTIALLY':
          status = 'partial';
          break;
        case 'OVERDUE':
        case 'PENDING_OVERDUE':
          status = 'overdue';
          break;
        case 'REFUNDED':
        case 'CHARGEBACK_REQUESTED':
        case 'CHARGEBACK_DISPUTE':
        case 'AWAITING_CHARGEBACK_REVERSAL':
        case 'DUNNING_REQUESTED':
        case 'DUNNING_RECEIVED':
        case 'AWAITING_RISK_ANALYSIS':
        case 'PAYMENT_REQUESTED':
          status = 'pending';
          break;
        case 'PAYMENT_IN_CASH_UNDERPAID':
        case 'PAYMENT_IN_CASH_OVERPAID':
        case 'PAID':
          status = 'paid';
          break;
        case 'CANCELLED':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }
      
      // Determinar o tipo de pagamento
      const paymentTypeMap: Record<string, string> = {
        BOLETO: 'Boleto',
        CREDIT_CARD: 'Cartão de Crédito',
        PIX: 'PIX',
        UNDEFINED: 'Indefinido'
      };
      
      // Mapear para o formato de resposta
      return {
        id: charge.id,
        name: charge.customerName,
        value: charge.value,
        description: charge.description,
        paymentType: paymentTypeMap[charge.billingType] || charge.billingType,
        dueDate: charge.dueDate,
        status,
        installment: charge.installment 
          ? { number: charge.installment, total: charge.installmentCount || 1 }
          : undefined,
        invoiceUrl: charge.invoiceUrl,
        bankSlipUrl: charge.bankSlipUrl,
        externalReference: charge.externalReference
      };
    });
    
    res.json({
      success: true,
      data: mappedCharges
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[StudentChargesController] Erro ao buscar cobranças do aluno: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cobranças',
      error: errorMessage
    });
  }
}

export default {
  getStudentCharges
};