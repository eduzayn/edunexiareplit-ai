import axios from 'axios';
import { Client, InsertClient } from '../../shared/schema';

// Configurações da API do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.asaas.com/api/v3'
  : 'https://sandbox.asaas.com/api/v3';

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interfaces para as requisições e respostas da API do Asaas
interface AsaasCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string; // Bairro
  externalReference?: string; // Referência ao ID no nosso sistema
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  company?: string;
}

interface AsaasCustomerResponse {
  id: string;
  dateCreated: string;
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  cpfCnpj: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  externalReference: string;
  notificationDisabled: boolean;
  additionalEmails: string;
  municipalInscription: string;
  stateInscription: string;
  observations: string;
  groupName: string;
  company: string;
  deleted: boolean;
}

/**
 * Converte um cliente do nosso sistema para o formato da API do Asaas
 */
function mapClientToAsaasCustomer(client: Partial<Client> | InsertClient, clientId?: number): AsaasCustomerRequest {
  // Criando objeto de cliente do Asaas com dados obrigatórios
  const customerData: AsaasCustomerRequest = {
    name: client.name,
    cpfCnpj: client.cpfCnpj,
  };

  // Adicionando campos opcionais se existirem
  if (client.email) customerData.email = client.email;
  if (client.phone) customerData.mobilePhone = client.phone;
  if (client.zipCode) customerData.postalCode = client.zipCode;
  if (client.street) customerData.address = client.street;
  if (client.streetNumber) customerData.addressNumber = client.streetNumber;
  if (client.complement) customerData.complement = client.complement;
  if (client.neighborhood) customerData.province = client.neighborhood;
  
  // Adicionando informações extras
  if (client.notes) customerData.observations = client.notes;
  if (client.website) customerData.additionalEmails = client.website; // Não é o uso correto, mas para armazenar a informação
  if (client.company) customerData.company = client.company;
  
  // Adicionando referência externa
  if (clientId) {
    customerData.externalReference = `client_${clientId}`;
  }

  return customerData;
}

/**
 * Serviço para integração com a API do Asaas
 */
export const AsaasService = {
  /**
   * Cria um cliente no Asaas
   */
  async createCustomer(client: InsertClient, clientId?: number): Promise<{ id: string }> {
    try {
      const customerData = mapClientToAsaasCustomer(client, clientId);
      const response = await asaasClient.post('/customers', customerData);
      return { id: response.data.id };
    } catch (error) {
      console.error('Erro ao criar cliente no Asaas:', error);
      throw error;
    }
  },

  /**
   * Atualiza um cliente no Asaas
   */
  async updateCustomer(asaasId: string, client: Partial<Client>): Promise<{ id: string }> {
    try {
      const customerData = mapClientToAsaasCustomer(client);
      const response = await asaasClient.post(`/customers/${asaasId}`, customerData);
      return { id: response.data.id };
    } catch (error) {
      console.error(`Erro ao atualizar cliente no Asaas (ID: ${asaasId}):`, error);
      throw error;
    }
  },

  /**
   * Exclui um cliente no Asaas
   */
  async deleteCustomer(asaasId: string): Promise<boolean> {
    try {
      await asaasClient.delete(`/customers/${asaasId}`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir cliente no Asaas (ID: ${asaasId}):`, error);
      throw error;
    }
  },

  /**
   * Busca um cliente no Asaas pelo ID
   */
  async getCustomerById(asaasId: string): Promise<AsaasCustomerResponse> {
    try {
      const response = await asaasClient.get(`/customers/${asaasId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar cliente no Asaas (ID: ${asaasId}):`, error);
      throw error;
    }
  },

  /**
   * Busca um cliente no Asaas pelo CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
    try {
      // Removendo caracteres especiais do CPF/CNPJ para garantir o formato correto
      const formattedCpfCnpj = cpfCnpj.replace(/[^\d]+/g, '');
      
      // Buscando clientes pelo CPF/CNPJ
      const response = await asaasClient.get('/customers', {
        params: { cpfCnpj: formattedCpfCnpj }
      });
      
      // Se encontrou algum resultado
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0]; // Retorna o primeiro cliente encontrado
      }
      
      return null; // Nenhum cliente encontrado
    } catch (error) {
      console.error(`Erro ao buscar cliente por CPF/CNPJ no Asaas (${cpfCnpj}):`, error);
      throw error;
    }
  }
};