import axios from 'axios';
import { Client, InsertClient } from '../../shared/schema';

// Configurações da API do Asaas
// IMPORTANTE: Usamos a nova chave ASAAS_ZAYN_KEY (nos secrets do Replit)
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
// Verificamos se a API key começa com $aact_prod_ para decidir qual ambiente usar
const isProductionToken = ASAAS_API_KEY?.startsWith('$aact_prod_');
const ASAAS_API_URL = process.env.ASAAS_API_URL || (
  isProductionToken
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3'
);

// Log para rastrear qual ambiente está sendo usado
console.log(`[ASAAS SERVICE] Utilizando ambiente: ${isProductionToken ? 'Produção' : 'Sandbox'} - ${ASAAS_API_URL}`);
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
      console.log(`[Asaas] Ambiente: ${isProductionToken ? 'Produção' : 'Sandbox'}`);
      
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
      
      // Buscando clientes pelo CPF/CNPJ
      const response = await asaasClient.get('/customers', {
        params: { cpfCnpj: formattedCpfCnpj }
      });
      
      // Se encontrou algum resultado
      if (response.data.data && response.data.data.length > 0) {
        // Filtra para encontrar clientes não deletados
        const activeCustomers = response.data.data.filter((customer: AsaasCustomerResponse) => !customer.deleted);
        
        if (activeCustomers.length > 0) {
          return activeCustomers[0]; // Retorna o primeiro cliente ativo encontrado
        }
      }
      
      return null; // Nenhum cliente encontrado ou todos deletados
    } catch (error) {
      console.error(`Erro ao buscar cliente por CPF/CNPJ no Asaas (${cpfCnpj}):`, error);
      throw error;
    }
  }
};