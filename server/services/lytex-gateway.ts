import axios from 'axios';
import type { AxiosError } from 'axios';

// Estruturas de tipos para API Lytex
interface LytexAuthResponse {
  accessToken: string;
  refreshToken: string;
  expireAt: string;
}

interface LytexClient {
  _id: string;
  name: string;
  type: 'pf' | 'pj'; // pf = pessoa física, pj = pessoa jurídica
  treatmentPronoun?: 'you' | 'mr' | 'lady';
  cpfCnpj: string;
  email: string;
  cellphone?: string;
}

interface LytexItem {
  name: string;
  description?: string;
  quantity: number;
  value: number; // em centavos
}

interface LytexPaymentMethods {
  pix?: { 
    enable: boolean;
  };
  boleto?: { 
    enable: boolean;
    dueDateDays?: number;
  };
  creditCard: { 
    enable: boolean;
    maxParcels?: number;
    isRatesToPayer?: boolean;
  };
}

interface LytexCreateInvoiceRequest {
  client: {
    _id: string | null;
    name?: string;
    type?: 'pf' | 'pj';
    treatmentPronoun?: 'you' | 'mr' | 'lady';
    cpfCnpj?: string;
    email?: string;
    cellphone?: string;
  };
  items: LytexItem[];
  dueDate: string; // formato: YYYY-MM-DD
  paymentMethods: LytexPaymentMethods;
  externalReference?: string;
}

interface LytexInvoice {
  _id: string;
  _clientId: string;
  client: LytexClient;
  dueDate: string;
  items: LytexItem[];
  totalValue: number;
  status: string;
  linkCheckout?: string;
  linkBoleto?: string;
  paymentData?: any;
  createdAt: string;
}

/**
 * Gateway de integração com a API Lytex para processamento de pagamentos
 */
class LytexGateway {
  private baseUrl: string = 'https://api-pay.lytex.com.br';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {
    if (!clientId || !clientSecret) {
      throw new Error('Credenciais da API Lytex não configuradas');
    }
  }

  /**
   * Obtém o token de acesso para a API Lytex
   * @returns O token de acesso atual ou um novo token
   */
  async getAccessToken(): Promise<string> {
    // Se já temos um token válido, retorna ele
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      console.log('[LYTEX] Obtendo token de acesso...');
      
      // Usar o endpoint correto confirmado pelos testes
      const response = await axios.post(`${this.baseUrl}/v2/auth/obtain_token`, {
        grantType: 'clientCredentials',
        clientId: this.clientId,
        clientSecret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.accessToken) {
        console.log('[LYTEX] Token obtido com sucesso');
        this.accessToken = response.data.accessToken;
        
        // Definir data de expiração (se disponível)
        if (response.data.expireAt) {
          this.tokenExpiry = new Date(response.data.expireAt);
          console.log(`[LYTEX] Token válido até ${response.data.expireAt}`);
        } else {
          // Padrão: 1 hora
          this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
          console.log(`[LYTEX] Token expira em 1 hora`);
        }

        return this.accessToken;
      } else {
        throw new Error('Resposta da API Lytex não contém token');
      }
    } catch (error) {
      console.error('[LYTEX] Erro detalhado na autenticação:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(`[LYTEX] Resposta de erro: Status ${axiosError.response.status}, Dados: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`Erro na autenticação Lytex: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Falha ao obter token de acesso: ${(error as Error).message}`);
    }
  }

  /**
   * Busca cliente por CPF/CNPJ
   * @param cpfCnpj CPF ou CNPJ a ser consultado (apenas números)
   * @returns Cliente encontrado ou null
   */
  async getClientByCpfCnpj(cpfCnpj: string): Promise<LytexClient | null> {
    try {
      const token = await this.getAccessToken();
      
      // Listar todos os clientes e filtrar pelo documento
      console.log(`[LYTEX] Buscando cliente com CPF/CNPJ: ${cpfCnpj}`);
      
      // 1. Primeiro tenta encontrar o cliente pela API padrão
      try {
        const response = await axios.get(`${this.baseUrl}/v1/clients`, {
          params: { 
            cpfCnpj 
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (response.data && response.data.results && response.data.results.length > 0) {
          console.log(`[LYTEX] Cliente encontrado usando parâmetro: ${response.data.results[0]._id}`);
          return response.data.results[0];
        }
      } catch (specificError) {
        // Se falhou, tentamos listar todos e filtrar manualmente
        console.log(`[LYTEX] Busca com parâmetro não funcionou, tentando listar todos.`);
      }
      
      // 2. Se não encontrou, busca na lista completa
      const response = await axios.get(`${this.baseUrl}/v1/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data.data)) {
        console.log(`[LYTEX] Total de clientes retornados: ${response.data.data.length}`);
        
        // Filtrar os resultados para encontrar o cliente com o CPF/CNPJ específico
        const client = response.data.data.find((c: any) => {
          // Limpar formatação para comparação
          const normalizedCpfCnpj = cpfCnpj.replace(/\D/g, '');
          const normalizedClientCpfCnpj = c.cpfCnpj ? c.cpfCnpj.replace(/\D/g, '') : '';
          
          return normalizedClientCpfCnpj === normalizedCpfCnpj;
        });
        
        if (client) {
          console.log(`[LYTEX] Cliente encontrado na lista: ${client._id}`);
          return client as LytexClient;
        }
      }

      console.log(`[LYTEX] Cliente não encontrado com CPF/CNPJ: ${cpfCnpj}`);
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          return null;
        }
        console.error(`[LYTEX] Erro ao buscar cliente: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      } else {
        console.error(`[LYTEX] Falha ao buscar cliente: ${(error as Error).message}`);
      }
      // Em caso de erro na API, retornamos null para poder continuar o fluxo
      return null;
    }
  }

  /**
   * Cria um novo cliente na plataforma Lytex
   * @param clientData Dados do cliente
   * @returns Dados do cliente criado
   */
  async createClient(clientData: Omit<LytexClient, '_id'>): Promise<LytexClient> {
    try {
      // Verificar se o cliente já existe
      const existingClient = await this.getClientByCpfCnpj(clientData.cpfCnpj);
      if (existingClient) {
        return existingClient;
      }

      // Ajustar dados conforme validações conhecidas
      const data = {
        ...clientData,
        treatmentPronoun: clientData.treatmentPronoun || 'you' // padrão: 'you'
      };

      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/v1/clients`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data._id) {
        return response.data;
      }

      throw new Error('Resposta da API não contém dados do cliente criado');
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(`Erro ao criar cliente: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Falha ao criar cliente: ${error.message}`);
    }
  }

  /**
   * Cria uma fatura para pagamento
   * @param invoiceData Dados da fatura
   * @returns Dados da fatura criada
   */
  async createInvoice(invoiceData: LytexCreateInvoiceRequest): Promise<LytexInvoice> {
    try {
      const token = await this.getAccessToken();
      
      // Validações básicas
      this.validateInvoiceData(invoiceData);

      // Tentar primeiro criar um cliente se necessário
      let clientId = invoiceData.client._id;
      let clientData = null;
      
      // Se não temos ID de cliente, tentamos criar um novo
      if (!clientId) {
        console.log('[LYTEX] Não há ID de cliente, tentando criar um novo cliente...');
        
        // Certifique-se de que temos todos os dados do cliente
        if (!invoiceData.client.name || !invoiceData.client.email || !invoiceData.client.cpfCnpj) {
          // Dados mínimos do cliente
          console.log('[LYTEX] Preenchendo dados mínimos do cliente');
          invoiceData.client.name = invoiceData.client.name || 'Cliente';
          invoiceData.client.email = invoiceData.client.email || 'cliente@example.com';
          invoiceData.client.cpfCnpj = invoiceData.client.cpfCnpj || '00000000000';
          invoiceData.client.type = invoiceData.client.type || 'pf';
        }
        
        try {
          // Criar cliente
          const newClient = await this.createClient({
            name: invoiceData.client.name,
            type: invoiceData.client.type,
            cpfCnpj: invoiceData.client.cpfCnpj,
            email: invoiceData.client.email,
            cellphone: invoiceData.client.cellphone
          });
          
          console.log(`[LYTEX] Cliente criado com sucesso, ID: ${newClient._id}`);
          
          // Agora usamos o ID do cliente criado
          clientId = newClient._id;
          clientData = newClient;
        } catch (clientError) {
          console.error('[LYTEX] Erro ao criar cliente:', clientError);
          // Se falhar, mantemos os dados fornecidos
        }
      } else if (clientId) {
        // Se temos um ID, buscar os dados completos do cliente
        try {
          const existingClient = await axios.get(`${this.baseUrl}/v1/clients/${clientId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (existingClient.data && existingClient.data._id) {
            clientData = existingClient.data;
          }
        } catch (getClientError) {
          console.error('[LYTEX] Erro ao buscar dados do cliente:', getClientError);
        }
      }

      // Preparar dados para a API com base nos testes bem-sucedidos
      // Sempre incluir os campos obrigatórios mesmo com o ID do cliente
      const requestData = {
        ...invoiceData,
        client: {
          _id: clientId,
          name: clientData?.name || invoiceData.client.name,
          type: clientData?.type || invoiceData.client.type || 'pf',
          cpfCnpj: clientData?.cpfCnpj || invoiceData.client.cpfCnpj,
          email: clientData?.email || invoiceData.client.email
        },
        paymentMethods: {
          ...invoiceData.paymentMethods,
          // Sempre incluir o objeto creditCard mesmo se desabilitado
          creditCard: invoiceData.paymentMethods.creditCard || { enable: false }
        }
      };
      
      console.log(`[LYTEX] Enviando dados para API: ${JSON.stringify(requestData, null, 2)}`);
      
      const response = await axios.post(`${this.baseUrl}/v1/invoices`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data._id) {
        console.log(`[LYTEX] Fatura criada com sucesso, ID: ${response.data._id}`);
        return response.data;
      }

      throw new Error('Resposta da API não contém dados da fatura criada');
    } catch (error) {
      console.error('[LYTEX] Erro detalhado ao criar fatura:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error(`[LYTEX] Erro na API: Status ${axiosError.response.status}, Resposta: ${JSON.stringify(axiosError.response.data)}`);
        throw new Error(`Erro ao criar fatura: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Falha ao criar fatura: ${(error as Error).message}`);
    }
  }

  /**
   * Busca uma fatura pelo ID
   * @param invoiceId ID da fatura
   * @returns Dados da fatura ou null se não encontrada
   */
  async getInvoice(invoiceId: string): Promise<LytexInvoice | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseUrl}/v1/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data._id) {
        return response.data;
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          return null;
        }
        throw new Error(`Erro ao buscar fatura: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Falha ao buscar fatura: ${error.message}`);
    }
  }

  /**
   * Consulta o status de uma fatura
   * @param invoiceId ID da fatura
   * @returns Status da fatura
   */
  async getInvoiceStatus(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error(`Fatura não encontrada: ${invoiceId}`);
    }
    return invoice.status;
  }

  /**
   * Verifica se a fatura possui dados válidos
   * @param data Dados da fatura
   */
  private validateInvoiceData(data: LytexCreateInvoiceRequest): void {
    // Verificar cliente (sem validação rigorosa de _id, já que vamos adicionar os dados se necessário)
    if (!data.client) {
      throw new Error('Campo "client" é obrigatório');
    }

    // Verificar itens
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Campo "items" é obrigatório e deve conter pelo menos um item');
    }

    // Verificar valores dos itens
    let totalValue = 0;
    data.items.forEach(item => {
      if (!item.name || typeof item.quantity !== 'number' || typeof item.value !== 'number') {
        throw new Error('Cada item deve conter nome, quantidade e valor');
      }
      totalValue += item.quantity * item.value;
    });

    // Verificar valor mínimo para cartão de crédito
    if (data.paymentMethods.creditCard?.enable && totalValue < 50000) {
      throw new Error('Valor mínimo para pagamento com cartão é R$ 500,00');
    }

    // Verificar data de vencimento
    if (!data.dueDate) {
      throw new Error('Campo "dueDate" é obrigatório');
    }
  }
}

export {
  LytexGateway,
  LytexClient,
  LytexItem,
  LytexPaymentMethods,
  LytexCreateInvoiceRequest,
  LytexInvoice
};