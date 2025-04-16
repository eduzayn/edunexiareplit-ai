/**
 * Serviço de integração com a API do Asaas para gerenciamento de cobranças
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// Criar uma instância do axios configurada para o Asaas
const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Interface para os dados de cobrança retornados pela API Asaas
 */
export interface AsaasCharge {
  id: string;
  dateCreated: string;
  customer: string;
  customerName: string;
  value: number;
  netValue: number;
  status: string;
  dueDate: string;
  description: string | null;
  installment: number | null;
  installmentCount: number | null;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
}

/**
 * Interface para filtros de busca de cobranças
 */
export interface ChargeFilter {
  customer?: string;
  billingType?: string;
  status?: string;
  dueDate?: string;
  installment?: boolean;
  externalReference?: string;
  limit?: number;
  offset?: number;
}

/**
 * Recupera todas as cobranças do Asaas
 */
export async function getAllCharges(filters?: ChargeFilter) {
  try {
    const params = filters || {};
    logger.info(`[AsaasChargesService] Buscando cobranças com filtros: ${JSON.stringify(params)}`);
    
    const response = await asaasApi.get('/payments', { params });
    
    logger.info(`[AsaasChargesService] Encontradas ${response.data.data.length} cobranças`);
    return response.data.data as AsaasCharge[];
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao buscar cobranças: ${errorMessage}`);
    throw new Error(`Erro ao buscar cobranças do Asaas: ${errorMessage}`);
  }
}

/**
 * Recupera uma cobrança específica pelo ID
 */
export async function getChargeById(id: string) {
  try {
    logger.info(`[AsaasChargesService] Buscando cobrança com ID: ${id}`);
    
    const response = await asaasApi.get(`/payments/${id}`);
    
    logger.info(`[AsaasChargesService] Cobrança encontrada: ${response.data.id}`);
    return response.data as AsaasCharge;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao buscar cobrança ${id}: ${errorMessage}`);
    throw new Error(`Erro ao buscar cobrança do Asaas: ${errorMessage}`);
  }
}

/**
 * Cria uma nova cobrança no Asaas
 */
export async function createCharge(chargeData: any) {
  try {
    logger.info(`[AsaasChargesService] Criando nova cobrança: ${JSON.stringify(chargeData)}`);
    
    const response = await asaasApi.post('/payments', chargeData);
    
    logger.info(`[AsaasChargesService] Cobrança criada com sucesso: ${response.data.id}`);
    return response.data as AsaasCharge;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao criar cobrança: ${errorMessage}`);
    throw new Error(`Erro ao criar cobrança no Asaas: ${errorMessage}`);
  }
}

/**
 * Atualiza uma cobrança existente
 */
export async function updateCharge(id: string, chargeData: any) {
  try {
    logger.info(`[AsaasChargesService] Atualizando cobrança ${id}: ${JSON.stringify(chargeData)}`);
    
    const response = await asaasApi.post(`/payments/${id}`, chargeData);
    
    logger.info(`[AsaasChargesService] Cobrança atualizada com sucesso: ${response.data.id}`);
    return response.data as AsaasCharge;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao atualizar cobrança ${id}: ${errorMessage}`);
    throw new Error(`Erro ao atualizar cobrança no Asaas: ${errorMessage}`);
  }
}

/**
 * Remove uma cobrança
 */
export async function deleteCharge(id: string) {
  try {
    logger.info(`[AsaasChargesService] Removendo cobrança: ${id}`);
    
    const response = await asaasApi.delete(`/payments/${id}`);
    
    logger.info(`[AsaasChargesService] Cobrança removida com sucesso: ${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao remover cobrança ${id}: ${errorMessage}`);
    throw new Error(`Erro ao remover cobrança do Asaas: ${errorMessage}`);
  }
}

/**
 * Busca cobranças de um cliente específico
 */
export async function getCustomerCharges(customerId: string, filters?: Omit<ChargeFilter, 'customer'>) {
  try {
    const params = { ...filters, customer: customerId };
    logger.info(`[AsaasChargesService] Buscando cobranças do cliente ${customerId}`);
    
    const response = await asaasApi.get('/payments', { params });
    
    logger.info(`[AsaasChargesService] Encontradas ${response.data.data.length} cobranças para o cliente ${customerId}`);
    return response.data.data as AsaasCharge[];
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao buscar cobranças do cliente ${customerId}: ${errorMessage}`);
    throw new Error(`Erro ao buscar cobranças do cliente no Asaas: ${errorMessage}`);
  }
}

/**
 * Recebe uma cobrança pelo ID (confirma pagamento manual)
 */
export async function receivePayment(id: string, paymentData: any) {
  try {
    logger.info(`[AsaasChargesService] Confirmando pagamento da cobrança ${id}: ${JSON.stringify(paymentData)}`);
    
    const response = await asaasApi.post(`/payments/${id}/receiveInCash`, paymentData);
    
    logger.info(`[AsaasChargesService] Pagamento confirmado com sucesso: ${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasChargesService] Erro ao confirmar pagamento da cobrança ${id}: ${errorMessage}`);
    throw new Error(`Erro ao confirmar pagamento da cobrança no Asaas: ${errorMessage}`);
  }
}

export default {
  getAllCharges,
  getChargeById,
  createCharge,
  updateCharge,
  deleteCharge,
  getCustomerCharges,
  receivePayment
};