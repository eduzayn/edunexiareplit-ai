import axios from 'axios';
import { Client, InsertClient } from '../../shared/schema';

// Configurações da API do Asaas
/**
 * IMPORTANTE: Sistema utiliza duas chaves diferentes para o Asaas:
 * 
 * 1. ASAAS_ZAYN_KEY - Usada EXCLUSIVAMENTE para matrículas de alunos no sistema CRM
 *    Esta chave é utilizada nos serviços simplified-enrollment-service.ts e aqui
 * 
 * 2. ASAAS_API_KEY - Usada para cadastro de instituições nas páginas públicas do site principal
 *    NÃO deve ser usada para operações no CRM
 */
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
// Forçamos o uso do ambiente de produção conforme orientação
const ASAAS_API_URL = 'https://api.asaas.com/v3';
// Verificamos se a API key está presente
const isValidToken = ASAAS_API_KEY && ASAAS_API_KEY.startsWith('$aact_');

// Log para rastrear qual ambiente está sendo usado
console.log(`[ASAAS SERVICE] Utilizando ambiente: Produção - ${ASAAS_API_URL}`);
console.log(`[ASAAS SERVICE] Token da API (ASAAS_API_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);
console.log(`[ASAAS SERVICE] ⚠️ Atenção: Configuração atualizada com a chave correta do Asaas`);

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access-token': ASAAS_API_KEY,
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
  // Validação para garantir que os campos obrigatórios existam
  if (!client.name || !client.document) {
    throw new Error('Nome e CPF/CNPJ são campos obrigatórios para criar um cliente no Asaas');
  }

  // Criando objeto de cliente do Asaas com dados obrigatórios
  const customerData: AsaasCustomerRequest = {
    name: client.name,
    cpfCnpj: client.document,
  };

  // Adicionando campos opcionais se existirem
  if (client.email) customerData.email = client.email;
  if (client.phone) customerData.mobilePhone = client.phone;
  
  // Campos de endereço
  if (client.zipCode) customerData.postalCode = client.zipCode;
  if (client.address) customerData.address = client.address;
  
  // Adicionando informações extras
  if (client.notes) customerData.observations = client.notes;
  
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
      console.log(`[Asaas] Iniciando cadastro do cliente ${client.name} com CPF/CNPJ ${client.document} no Asaas...`);
      
      // Verificar se o cliente já existe no Asaas pelo CPF/CNPJ para evitar duplicação
      if (client.document) {
        try {
          console.log(`[Asaas] Verificando se o cliente já existe no Asaas com CPF/CNPJ ${client.document}...`);
          const existingCustomer = await this.getCustomerByCpfCnpj(client.document);
          
          if (existingCustomer) {
            console.log(`[Asaas] Cliente já existe no Asaas com ID ${existingCustomer.id}`);
            return { id: existingCustomer.id };
          }
          console.log(`[Asaas] Cliente não encontrado no Asaas, prosseguindo com cadastro.`);
        } catch (searchError) {
          console.log(`[Asaas] Erro ao verificar se cliente já existe, prosseguindo com cadastro:`, searchError);
        }
      }
      
      // Mapear os dados do cliente para o formato do Asaas
      const customerData = mapClientToAsaasCustomer(client, clientId);
      console.log(`[Asaas] Dados para cadastro no Asaas:`, JSON.stringify(customerData));
      
      // Registrar informações sobre o ambiente da API em uso
      console.log(`[Asaas] Usando API URL: ${ASAAS_API_URL}`);
      console.log(`[Asaas] Ambiente: Produção`);
      
      // Criar o cliente no Asaas
      const response = await asaasClient.post('/customers', customerData);
      console.log(`[Asaas] Cliente cadastrado com sucesso no Asaas com ID ${response.data.id}`);
      
      return { id: response.data.id };
    } catch (error: any) {
      // Exibir detalhes sobre o erro da API
      if (error.response) {
        console.error(`[Asaas] Erro na resposta da API (Status: ${error.response.status}):`, 
          error.response.data);
      } else if (error.request) {
        console.error('[Asaas] Erro na requisição (sem resposta):', error.request);
      } else {
        console.error('[Asaas] Erro ao criar cliente no Asaas:', error.message);
      }
      throw error;
    }
  },

  /**
   * Atualiza um cliente no Asaas
   */
  async updateCustomer(asaasId: string, client: Partial<Client>): Promise<{ id: string }> {
    try {
      console.log(`[Asaas] Iniciando atualização do cliente ${client.name} (ID: ${asaasId}) no Asaas...`);
      
      // Verificar se o cliente existe no Asaas
      try {
        console.log(`[Asaas] Verificando se o cliente existe no Asaas com ID ${asaasId}...`);
        await this.getCustomerById(asaasId);
        console.log(`[Asaas] Cliente encontrado no Asaas, prosseguindo com atualização.`);
      } catch (searchError) {
        console.error(`[Asaas] Cliente não encontrado no Asaas com ID ${asaasId}.`);
        
        // Se o cliente tem documento, tentar encontrar pelo CPF/CNPJ
        if (client.document) {
          console.log(`[Asaas] Tentando encontrar cliente pelo CPF/CNPJ ${client.document}...`);
          try {
            const existingCustomer = await this.getCustomerByCpfCnpj(client.document);
            
            if (existingCustomer) {
              console.log(`[Asaas] Cliente encontrado pelo CPF/CNPJ com ID ${existingCustomer.id}`);
              asaasId = existingCustomer.id;
            } else {
              console.log(`[Asaas] Cliente não encontrado pelo CPF/CNPJ, será criado um novo cliente.`);
              // Criar um novo cliente no Asaas
              const newCustomer = await this.createCustomer(client as InsertClient);
              return newCustomer;
            }
          } catch (cpfSearchError) {
            console.error(`[Asaas] Erro ao buscar cliente por CPF/CNPJ:`, cpfSearchError);
            // Criar um novo cliente no Asaas
            const newCustomer = await this.createCustomer(client as InsertClient);
            return newCustomer;
          }
        } else {
          console.error(`[Asaas] Cliente não tem CPF/CNPJ, não é possível buscar ou criar cliente.`);
          throw new Error('Cliente não encontrado no Asaas e não tem CPF/CNPJ para criar um novo');
        }
      }
      
      // Mapear os dados do cliente para o formato do Asaas
      const customerData = mapClientToAsaasCustomer(client);
      console.log(`[Asaas] Dados para atualização no Asaas:`, JSON.stringify(customerData));
      
      // Atualizar o cliente no Asaas
      const response = await asaasClient.post(`/customers/${asaasId}`, customerData);
      console.log(`[Asaas] Cliente atualizado com sucesso no Asaas com ID ${response.data.id}`);
      
      return { id: response.data.id };
    } catch (error: any) {
      // Exibir detalhes sobre o erro da API
      if (error.response) {
        console.error(`[Asaas] Erro na resposta da API de atualização (Status: ${error.response.status}):`, 
          error.response.data);
      } else if (error.request) {
        console.error('[Asaas] Erro na requisição de atualização (sem resposta):', error.request);
      } else {
        console.error(`[Asaas] Erro ao atualizar cliente no Asaas (ID: ${asaasId}):`, error.message);
      }
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
      
      console.log(`[Asaas] DEBUG - Buscando cliente pelo CPF/CNPJ: ${formattedCpfCnpj}`);
      console.log(`[Asaas] DEBUG - Usando API URL: ${ASAAS_API_URL}`);
      console.log(`[Asaas] DEBUG - Token de API presente: ${Boolean(ASAAS_API_KEY)}`);
      
      // ABORDAGEM 1: Tentando acessar diretamente o endpoint específico de busca por CPF/CNPJ
      try {
        console.log(`[Asaas] DEBUG - Tentando endpoint específico primeiro: /customers/findByCpfCnpj/${formattedCpfCnpj}`);
        
        const searchResponse = await asaasClient.get(`/customers/findByCpfCnpj/${formattedCpfCnpj}`);
        
        console.log(`[Asaas] DEBUG - Resposta da API específica recebida com status: ${searchResponse.status}`);
        console.log(`[Asaas] DEBUG - Resposta da API específica:`, JSON.stringify(searchResponse.data));
        
        if (searchResponse.data && !searchResponse.data.deleted) {
          console.log(`[Asaas] Cliente encontrado pelo endpoint específico: ${searchResponse.data.id}`);
          return searchResponse.data;
        }
      } catch (searchError: any) {
        // A API retorna 404 se não encontrar, o que é esperado e não um erro real
        const statusCode = searchError.response?.status;
        console.log(`[Asaas] DEBUG - Erro no endpoint específico com status: ${statusCode}`);
        
        if (searchError.response) {
          console.log(`[Asaas] DEBUG - Detalhes da resposta de erro:`, 
            JSON.stringify(searchError.response.data));
        }
        
        if (searchError.response && searchError.response.status !== 404) {
          console.error(`[Asaas] Erro na busca específica: ${searchError.message}`);
        } else if (searchError.response && searchError.response.status === 404) {
          console.log(`[Asaas] Cliente não encontrado no endpoint específico (404)`);
        }
      }
      
      // ABORDAGEM 2: Se não encontrou pelo endpoint específico, vamos tentar usando o endpoint de listagem
      try {
        console.log(`[Asaas] DEBUG - Tentando busca por listagem: /customers?cpfCnpj=${formattedCpfCnpj}`);
        
        // Buscando clientes pelo CPF/CNPJ usando o endpoint de listagem
        const response = await asaasClient.get('/customers', {
          params: { cpfCnpj: formattedCpfCnpj }
        });
        
        console.log(`[Asaas] DEBUG - Resposta da API de listagem recebida com status: ${response.status}`);
        console.log(`[Asaas] DEBUG - Resposta da API de listagem:`, JSON.stringify(response.data));
        
        // Se encontrou algum resultado
        if (response.data.data && response.data.data.length > 0) {
          // Filtra para encontrar clientes não deletados
          const activeCustomers = response.data.data.filter((customer: AsaasCustomerResponse) => !customer.deleted);
          
          if (activeCustomers.length > 0) {
            console.log(`[Asaas] Cliente encontrado na listagem pelo CPF/CNPJ: ${activeCustomers[0].id}`);
            return activeCustomers[0]; // Retorna o primeiro cliente ativo encontrado
          }
        }
        
        console.log(`[Asaas] Nenhum cliente ativo encontrado na listagem`);
      } catch (listError: any) {
        const statusCode = listError.response?.status;
        console.log(`[Asaas] DEBUG - Erro na busca por listagem com status: ${statusCode}`);
        
        if (listError.response) {
          console.log(`[Asaas] DEBUG - Detalhes da resposta de erro na listagem:`, 
            JSON.stringify(listError.response.data));
        }
        
        console.error(`[Asaas] Erro na busca por listagem: ${listError.message}`);
      }
      
      // ABORDAGEM 3: Implementação direta com axios
      try {
        console.log(`[Asaas] DEBUG - Tentando implementação direta com axios`);
        
        const axios = require('axios');
        const directResponse = await axios.get(`${ASAAS_API_URL}/customers/findByCpfCnpj/${formattedCpfCnpj}`, {
          headers: {
            'access-token': ASAAS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[Asaas] DEBUG - Resposta direta recebida com status: ${directResponse.status}`);
        console.log(`[Asaas] DEBUG - Resposta direta:`, JSON.stringify(directResponse.data));
        
        if (directResponse.data && !directResponse.data.deleted) {
          console.log(`[Asaas] Cliente encontrado pela implementação direta: ${directResponse.data.id}`);
          return directResponse.data;
        }
      } catch (directError: any) {
        const statusCode = directError.response?.status;
        console.log(`[Asaas] DEBUG - Erro na implementação direta com status: ${statusCode}`);
        
        if (directError.response && directError.response.status !== 404) {
          console.error(`[Asaas] Erro na implementação direta: ${directError.message}`);
        }
      }
      
      console.log(`[Asaas] Nenhum cliente encontrado com o CPF/CNPJ: ${formattedCpfCnpj} após todas as tentativas`);
      return null; // Nenhum cliente encontrado em nenhuma das abordagens
    } catch (error: any) {
      console.error(`[Asaas] Erro geral ao buscar cliente por CPF/CNPJ (${cpfCnpj}):`, error);
      console.error(`[Asaas] Stack trace:`, error.stack);
      throw error;
    }
  }
};