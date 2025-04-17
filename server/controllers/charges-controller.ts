/**
 * Controlador para gerenciamento de cobranças
 * Integra com o serviço Asaas para buscar e gerenciar cobranças
 */

import { Request, Response } from 'express';
import asaasChargesService, { AsaasCharge } from '../services/asaas-charges-service';
import { logger } from '../utils/logger';
import { storage } from '../storage';

/**
 * Busca todas as cobranças no Asaas e retorna para o cliente
 */
export async function getAllCharges(req: Request, res: Response) {
  try {
    // Extrair os parâmetros de filtro da requisição
    const { customer, billingType, status, dueDate, installment, limit, offset } = req.query;
    
    // Construir o objeto de filtros para a API Asaas
    const filters: any = {};
    if (customer) filters.customer = customer;
    if (billingType) filters.billingType = billingType;
    if (status) filters.status = status;
    if (dueDate) filters.dueDate = dueDate;
    if (installment) filters.installment = installment === 'true';
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);
    
    logger.info(`[ChargesController] Buscando cobranças com filtros: ${JSON.stringify(filters)}`);
    
    // Buscar cobranças do Asaas
    const charges = await asaasChargesService.getAllCharges(filters);
    
    // Para cada cobrança, verificar se temos informações adicionais no nosso banco
    const enhancedCharges = await Promise.all(charges.map(async (charge) => {
      try {
        // Buscar informações adicionais no nosso banco (caso necessário)
        // por exemplo, relação com leads, clientes, etc.
        // isso é só um exemplo, substitua pelo seu modelo real
        const localChargeInfo = await storage.getChargeByExternalId(charge.id);
        
        return {
          ...charge,
          localInfo: localChargeInfo || null
        };
      } catch (error) {
        logger.error(`[ChargesController] Erro ao buscar informações locais da cobrança ${charge.id}: ${error.message}`);
        return charge;
      }
    }));
    
    res.json({
      success: true,
      data: enhancedCharges
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao buscar cobranças: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cobranças',
      error: errorMessage
    });
  }
}

/**
 * Busca uma cobrança específica pelo ID
 */
export async function getChargeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    logger.info(`[ChargesController] Buscando cobrança com ID: ${id}`);
    
    // Buscar a cobrança no Asaas
    const charge = await asaasChargesService.getChargeById(id);
    
    // Buscar informações adicionais no nosso banco
    const localChargeInfo = await storage.getChargeByExternalId(id);
    
    res.json({
      success: true,
      data: {
        ...charge,
        localInfo: localChargeInfo || null
      }
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao buscar cobrança ${req.params.id}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cobrança',
      error: errorMessage
    });
  }
}

/**
 * Cria uma nova cobrança no Asaas
 */
export async function createCharge(req: Request, res: Response) {
  try {
    const chargeData = req.body;
    
    // Validar os dados da cobrança
    if (!chargeData.customer) {
      return res.status(400).json({
        success: false,
        message: 'Cliente (customer) é obrigatório para criar uma cobrança'
      });
    }
    
    if (!chargeData.value || chargeData.value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor (value) deve ser maior que zero'
      });
    }
    
    if (!chargeData.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de vencimento (dueDate) é obrigatória'
      });
    }
    
    logger.info(`[ChargesController] Criando nova cobrança: ${JSON.stringify(chargeData)}`);
    
    // Criar a cobrança no Asaas
    const newCharge = await asaasChargesService.createCharge(chargeData);
    
    // Armazenar informações adicionais no nosso banco (caso necessário)
    // por exemplo, relacionar com um lead ou cliente
    const localChargeInfo = await storage.createCharge({
      externalId: newCharge.id,
      clientId: req.body.clientId, // ID do cliente no nosso sistema
      value: newCharge.value,
      status: newCharge.status,
      dueDate: newCharge.dueDate,
      description: newCharge.description || '',
      createdById: req.user?.id // ID do usuário que está criando a cobrança
    });
    
    res.status(201).json({
      success: true,
      data: {
        ...newCharge,
        localInfo: localChargeInfo
      }
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao criar cobrança: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar cobrança',
      error: errorMessage
    });
  }
}

/**
 * Atualiza uma cobrança existente
 */
export async function updateCharge(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const chargeData = req.body;
    
    logger.info(`[ChargesController] Atualizando cobrança ${id}: ${JSON.stringify(chargeData)}`);
    
    // Atualizar a cobrança no Asaas
    const updatedCharge = await asaasChargesService.updateCharge(id, chargeData);
    
    // Atualizar informações adicionais no nosso banco (caso necessário)
    const localChargeInfo = await storage.updateChargeByExternalId(id, {
      status: updatedCharge.status,
      value: updatedCharge.value,
      dueDate: updatedCharge.dueDate,
      description: updatedCharge.description || ''
    });
    
    res.json({
      success: true,
      data: {
        ...updatedCharge,
        localInfo: localChargeInfo
      }
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao atualizar cobrança ${req.params.id}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar cobrança',
      error: errorMessage
    });
  }
}

/**
 * Remove uma cobrança
 */
export async function deleteCharge(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    logger.info(`[ChargesController] Removendo cobrança: ${id}`);
    
    // Remover a cobrança no Asaas
    await asaasChargesService.deleteCharge(id);
    
    // Remover ou marcar como removida no nosso banco
    await storage.deleteChargeByExternalId(id);
    
    res.json({
      success: true,
      message: 'Cobrança removida com sucesso'
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao remover cobrança ${req.params.id}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover cobrança',
      error: errorMessage
    });
  }
}

/**
 * Busca cobranças de um cliente específico
 */
export async function getCustomerCharges(req: Request, res: Response) {
  try {
    const { customerId } = req.params;
    const { status, dueDate } = req.query;
    
    logger.info(`[ChargesController] Buscando cobranças do cliente: ${customerId}`);
    
    // Construir filtros
    const filters: any = {};
    if (status) filters.status = status;
    if (dueDate) filters.dueDate = dueDate;
    
    // Buscar cobranças do cliente no Asaas
    const charges = await asaasChargesService.getCustomerCharges(customerId, filters);
    
    res.json({
      success: true,
      data: charges
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao buscar cobranças do cliente ${req.params.customerId}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cobranças do cliente',
      error: errorMessage
    });
  }
}

/**
 * Recebe uma cobrança pelo ID (confirma pagamento manual)
 */
export async function receivePayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    // Validar dados de pagamento
    if (!paymentData.paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de pagamento (paymentDate) é obrigatória'
      });
    }
    
    if (!paymentData.value && paymentData.value !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor (value) é obrigatório'
      });
    }
    
    logger.info(`[ChargesController] Confirmando pagamento da cobrança ${id}: ${JSON.stringify(paymentData)}`);
    
    // Confirmar pagamento no Asaas
    const payment = await asaasChargesService.receivePayment(id, paymentData);
    
    // Atualizar status no nosso banco
    const localChargeInfo = await storage.updateChargeByExternalId(id, {
      status: 'RECEIVED',
      paidValue: paymentData.value,
      paidDate: paymentData.paymentDate
    });
    
    res.json({
      success: true,
      data: {
        ...payment,
        localInfo: localChargeInfo
      }
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao confirmar pagamento da cobrança ${req.params.id}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar pagamento da cobrança',
      error: errorMessage
    });
  }
}

/**
 * Cancela uma cobrança pelo ID
 */
export async function cancelCharge(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    logger.info(`[ChargesController] Cancelando cobrança: ${id}`);
    
    // Cancelar a cobrança no Asaas
    const result = await asaasChargesService.cancelCharge(id);
    
    // Atualizar status no nosso banco
    await storage.updateChargeByExternalId(id, {
      status: 'CANCELED'
    });
    
    res.json({
      success: true,
      message: 'Cobrança cancelada com sucesso',
      data: result
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[ChargesController] Erro ao cancelar cobrança ${req.params.id}: ${errorMessage}`);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar cobrança',
      error: errorMessage
    });
  }
}

export default {
  getAllCharges,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge,
  getCustomerCharges,
  receivePayment,
  cancelCharge
};