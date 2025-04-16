/**
 * Serviço de integração com a API do Asaas para gerenciamento de clientes
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;

// Criar uma instância do axios configurada para o Asaas
const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Interface para os dados de cliente retornados pela API Asaas
 */
export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  postalCode: string;
  cpfCnpj: string;
  personType: 'FISICA' | 'JURIDICA';
  deleted: boolean;
  additionalEmails: string;
  externalReference: string;
  notificationDisabled: boolean;
  city: number;
  state: string;
  country: string;
  observations: string;
}

/**
 * Interface para filtros de busca de clientes
 */
export interface CustomerFilter {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  externalReference?: string;
  limit?: number;
  offset?: number;
}

/**
 * Recupera todos os clientes do Asaas
 */
export async function getAllCustomers(filters?: CustomerFilter) {
  try {
    const params = filters || {};
    logger.info(`[AsaasCustomersService] Buscando clientes com filtros: ${JSON.stringify(params)}`);
    
    const response = await asaasApi.get('/customers', { params });
    
    logger.info(`[AsaasCustomersService] Encontrados ${response.data.data.length} clientes`);
    return response.data.data as AsaasCustomer[];
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao buscar clientes: ${errorMessage}`);
    throw new Error(`Erro ao buscar clientes do Asaas: ${errorMessage}`);
  }
}

/**
 * Recupera um cliente específico pelo ID
 */
export async function getCustomerById(id: string) {
  try {
    logger.info(`[AsaasCustomersService] Buscando cliente com ID: ${id}`);
    
    const response = await asaasApi.get(`/customers/${id}`);
    
    logger.info(`[AsaasCustomersService] Cliente encontrado: ${response.data.id}`);
    return response.data as AsaasCustomer;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao buscar cliente ${id}: ${errorMessage}`);
    throw new Error(`Erro ao buscar cliente do Asaas: ${errorMessage}`);
  }
}

/**
 * Busca um cliente pelo CPF/CNPJ
 */
export async function getCustomerByCpfCnpj(cpfCnpj: string) {
  try {
    logger.info(`[AsaasCustomersService] Buscando cliente com CPF/CNPJ: ${cpfCnpj}`);
    
    const response = await asaasApi.get('/customers', { params: { cpfCnpj } });
    
    if (response.data.data.length > 0) {
      logger.info(`[AsaasCustomersService] Cliente encontrado: ${response.data.data[0].id}`);
      return response.data.data[0] as AsaasCustomer;
    }
    
    logger.info(`[AsaasCustomersService] Nenhum cliente encontrado com CPF/CNPJ: ${cpfCnpj}`);
    return null;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao buscar cliente por CPF/CNPJ ${cpfCnpj}: ${errorMessage}`);
    throw new Error(`Erro ao buscar cliente por CPF/CNPJ no Asaas: ${errorMessage}`);
  }
}

/**
 * Cria um novo cliente no Asaas
 */
export async function createCustomer(customerData: any) {
  try {
    logger.info(`[AsaasCustomersService] Criando novo cliente: ${JSON.stringify(customerData)}`);
    
    const response = await asaasApi.post('/customers', customerData);
    
    logger.info(`[AsaasCustomersService] Cliente criado com sucesso: ${response.data.id}`);
    return response.data as AsaasCustomer;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao criar cliente: ${errorMessage}`);
    throw new Error(`Erro ao criar cliente no Asaas: ${errorMessage}`);
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateCustomer(id: string, customerData: any) {
  try {
    logger.info(`[AsaasCustomersService] Atualizando cliente ${id}: ${JSON.stringify(customerData)}`);
    
    const response = await asaasApi.post(`/customers/${id}`, customerData);
    
    logger.info(`[AsaasCustomersService] Cliente atualizado com sucesso: ${response.data.id}`);
    return response.data as AsaasCustomer;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao atualizar cliente ${id}: ${errorMessage}`);
    throw new Error(`Erro ao atualizar cliente no Asaas: ${errorMessage}`);
  }
}

/**
 * Remove um cliente
 */
export async function deleteCustomer(id: string) {
  try {
    logger.info(`[AsaasCustomersService] Removendo cliente: ${id}`);
    
    const response = await asaasApi.delete(`/customers/${id}`);
    
    logger.info(`[AsaasCustomersService] Cliente removido com sucesso: ${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido';
    logger.error(`[AsaasCustomersService] Erro ao remover cliente ${id}: ${errorMessage}`);
    throw new Error(`Erro ao remover cliente do Asaas: ${errorMessage}`);
  }
}

export default {
  getAllCustomers,
  getCustomerById,
  getCustomerByCpfCnpj,
  createCustomer,
  updateCustomer,
  deleteCustomer
};