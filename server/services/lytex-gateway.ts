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
  creditCard?: { 
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
      console.log('[LYTEX] Tentando obter token de acesso...');
      
      // Primeiro, tente com a API V2
      try {
        console.log('[LYTEX] Tentando autenticação com API V2...');
        const responseV2 = await axios.post(`${this.baseUrl}/v2/auth/obtain_token`, {
          grantType: 'clientCredentials',
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (responseV2.data && responseV2.data.accessToken) {
          console.log('[LYTEX] Token obtido com sucesso via API V2');
          this.accessToken = responseV2.data.accessToken;
          
          // Definir data de expiração (se disponível)
          if (responseV2.data.expireAt) {
            this.tokenExpiry = new Date(responseV2.data.expireAt);
          } else {
            // Padrão: 1 hora
            this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
          }

          return this.accessToken;
        }
      } catch (v2Error) {
        console.log(`[LYTEX] Falha na autenticação V2: ${(v2Error as Error).message}. Tentando V1...`);
      }
      
      // Se V2 falhar, tente com a API V1
      console.log('[LYTEX] Tentando autenticação com API V1...');
      const responseV1 = await axios.post(`${this.baseUrl}/v1/auth/obtain_token`, {
        clientId: this.clientId,
        clientSecret: this.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (responseV1.data && responseV1.data.accessToken) {
        console.log('[LYTEX] Token obtido com sucesso via API V1');
        this.accessToken = responseV1.data.accessToken;
        
        // Definir data de expiração (se disponível)
        if (responseV1.data.expireAt) {
          this.tokenExpiry = new Date(responseV1.data.expireAt);
        } else {
          // Padrão: 1 hora
          this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
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
        return response.data.results[0];
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          return null;
        }
        throw new Error(`Erro ao buscar cliente: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      }
      throw new Error(`Falha ao buscar cliente: ${error.message}`);
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
          
          // Atualizar o objeto de requisição
          invoiceData.client = { _id: clientId };
        } catch (clientError) {
          console.error('[LYTEX] Erro ao criar cliente:', clientError);
          
          // Se falhar ao criar cliente, preenchemos apenas o ID como null (API vai validar)
          // Mas mantemos todos os dados do cliente para que a API possa criar implicitamente
          invoiceData.client._id = null;
        }
      }

      // Garantir que todos os campos obrigatórios estão presentes de acordo com a documentação v1
      // https://docs-pay.lytex.com.br/documentacao/v1#tag/Fatura/operation/InvoiceController_create
      
      console.log(`[LYTEX] Enviando dados para API: ${JSON.stringify(invoiceData, null, 2)}`);
      
      const response = await axios.post(`${this.baseUrl}/v1/invoices`, invoiceData, {
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