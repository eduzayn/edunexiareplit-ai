import axios from 'axios';
import { Client, InsertClient } from '@shared/schema';

// Configuração da API Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = 'https://www.asaas.com/api/v3';

// Cliente HTTP para o Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY
  }
});

// Interface para cliente no Asaas
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
  // Verificamos se temos os dados mínimos obrigatórios
  if (!client.name || !client.cpfCnpj) {
    throw new Error('Nome e CPF/CNPJ são campos obrigatórios para criação de cliente no Asaas');
  }

  // Garantimos que nome e cpfCnpj não sejam undefined
  const customerData: AsaasCustomerRequest = {
    name: client.name,
    cpfCnpj: client.cpfCnpj
  };

  // Adicionamos os campos opcionais apenas se eles existirem
  if (client.email && typeof client.email === 'string') customerData.email = client.email;
  if (client.phone && typeof client.phone === 'string') customerData.phone = client.phone;
  if (client.street && typeof client.street === 'string') customerData.address = client.street;
  if (client.zipCode && typeof client.zipCode === 'string') customerData.postalCode = client.zipCode;
  if (client.number && typeof client.number === 'string') customerData.addressNumber = client.number;
  if (client.complement && typeof client.complement === 'string') customerData.complement = client.complement;
  if (client.neighborhood && typeof client.neighborhood === 'string') customerData.province = client.neighborhood;
  if (client.notes && typeof client.notes === 'string') customerData.observations = client.notes;
  if (clientId) customerData.externalReference = clientId.toString();

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
      console.log('Criando cliente no Asaas:', customerData);
      
      const response = await asaasClient.post('/customers', customerData);
      
      if (response.status === 200 || response.status === 201) {
        console.log('Cliente criado com sucesso no Asaas:', response.data);
        return { id: response.data.id };
      } else {
        throw new Error(`Falha ao criar cliente no Asaas: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas');
    }
  },

  /**
   * Atualiza um cliente no Asaas
   */
  async updateCustomer(asaasId: string, client: Partial<Client>): Promise<{ id: string }> {
    try {
      const customerData = mapClientToAsaasCustomer(client);
      console.log(`Atualizando cliente no Asaas (ID: ${asaasId}):`, customerData);
      
      const response = await asaasClient.post(`/customers/${asaasId}`, customerData);
      
      if (response.status === 200) {
        console.log('Cliente atualizado com sucesso no Asaas:', response.data);
        return { id: response.data.id };
      } else {
        throw new Error(`Falha ao atualizar cliente no Asaas: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar cliente no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao atualizar cliente no Asaas');
    }
  },

  /**
   * Busca um cliente no Asaas pelo ID
   */
  async getCustomerById(asaasId: string): Promise<AsaasCustomerResponse> {
    try {
      const response = await asaasClient.get(`/customers/${asaasId}`);
      
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Falha ao buscar cliente no Asaas: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao buscar cliente no Asaas:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar cliente no Asaas');
    }
  },

  /**
   * Busca um cliente no Asaas pelo CPF/CNPJ
   */
  async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
    try {
      // Remove todos os caracteres não numéricos
      const formattedCpfCnpj = cpfCnpj.replace(/\D/g, '');
      
      const response = await asaasClient.get(`/customers?cpfCnpj=${formattedCpfCnpj}`);
      
      if (response.status === 200) {
        // API retorna um objeto com a propriedade 'data' que é um array de clientes
        const customers = response.data.data;
        if (customers && customers.length > 0) {
          return customers[0];
        }
        return null;
      } else {
        throw new Error(`Falha ao buscar cliente no Asaas: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao buscar cliente no Asaas por CPF/CNPJ:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.description || 'Erro ao buscar cliente no Asaas');
    }
  }
};