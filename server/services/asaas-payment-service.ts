import axios from 'axios';
import { Invoice, InvoiceItem, Payment } from '../../shared/schema';

// Configurações da API do Asaas
// IMPORTANTE: Usamos a nova chave ASAAS_ZAYN_KEY (nos secrets do Replit)
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
// Verificamos se a API key começa com $aact_prod_ para decidir qual ambiente usar
const isProductionToken = ASAAS_API_KEY?.startsWith('$aact_prod_');
const ASAAS_API_URL = process.env.ASAAS_API_URL || (
  isProductionToken
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'
);

// Log para rastrear qual ambiente está sendo usado
console.log(`[ASAAS PAYMENT] Utilizando ambiente: ${isProductionToken ? 'Produção' : 'Sandbox'} - ${ASAAS_API_URL}`);
console.log(`[ASAAS PAYMENT] Token da API (ASAAS_API_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);
console.log(`[ASAAS PAYMENT] ⚠️ Atenção: Configuração atualizada com a chave correta do Asaas`);

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interfaces para as requisições e respostas da API do Asaas
interface AsaasPaymentRequest {
  customer: string;                 // ID do cliente no Asaas
  billingType: string;              // Tipo de cobrança (BOLETO, CREDIT_CARD, PIX, etc.)
  value: number;                    // Valor da cobrança
  dueDate: string;                  // Data de vencimento (YYYY-MM-DD)
  description?: string;             // Descrição da cobrança
  externalReference?: string;       // Referência externa (nosso ID de Invoice)
  installmentCount?: number;        // Número de parcelas (para cartão)
  installmentValue?: number;        // Valor de cada parcela
  discount?: {
    value: number;                  // Valor do desconto
    dueDateLimitDays?: number;      // Limite de dias antes do vencimento para o desconto
  };
  interest?: {
    value: number;                  // Valor de juros (%)
  };
  fine?: {
    value: number;                  // Valor da multa (%)
  };
  postalService?: boolean;          // Serviço de envio postal
  split?: any[];                    // Para divisão de pagamentos
}

interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  customerName?: string;    // Nome do cliente (presente na resposta da API)
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  dueDate: string;
  description: string;
  externalReference: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  pixQrCodeUrl?: string;
  nossoNumero?: string;
  deleted: boolean;
}

// Formatar data para o padrão da API (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Mapeia tipos de pagamento do nosso sistema para o Asaas
function mapPaymentMethodToAsaasBillingType(method: string): string {
  const methodMapping: Record<string, string> = {
    credit_card: 'CREDIT_CARD',
    bank_slip: 'BOLETO',
    pix: 'PIX',
    bank_transfer: 'TRANSFER',
    cash: 'UNDEFINED', // UNDEFINED para pagamentos em dinheiro ou outros não mapeáveis
    debit_card: 'CREDIT_CARD', // Asaas não tem debit_card específico
    other: 'UNDEFINED'
  };
  
  return methodMapping[method] || 'UNDEFINED';
}

// Mapeia status de pagamento do Asaas para o nosso sistema
function mapAsaasStatusToPaymentStatus(asaasStatus: string): string {
  const statusMapping: Record<string, string> = {
    PENDING: 'pending',
    RECEIVED: 'completed',
    CONFIRMED: 'completed',
    OVERDUE: 'pending',
    REFUNDED: 'refunded',
    RECEIVED_IN_CASH: 'completed',
    REFUND_REQUESTED: 'pending',
    CHARGEBACK_REQUESTED: 'pending',
    CHARGEBACK_DISPUTE: 'pending',
    AWAITING_CHARGEBACK_REVERSAL: 'pending',
    DUNNING_REQUESTED: 'pending',
    DUNNING_RECEIVED: 'completed',
    AWAITING_RISK_ANALYSIS: 'pending',
    FAILED: 'failed'
  };
  
  return statusMapping[asaasStatus] || 'pending';
}

// Serviço de integração com pagamentos do Asaas
export const AsaasPaymentService = {
  /**
   * Cria uma cobrança no Asaas
   * @param asaasCustomerId ID do cliente no Asaas
   * @param invoice Dados da fatura
   * @param invoiceItems Itens da fatura
   * @param method Método de pagamento ('credit_card', 'bank_slip', 'pix', etc.)
   */
  async createPayment(
    asaasCustomerId: string, 
    invoice: Invoice, 
    invoiceItems: InvoiceItem[],
    method: string
  ): Promise<AsaasPaymentResponse> {
    try {
      // Preparar descrição da cobrança com itens
      let description = `Cobrança #${invoice.invoiceNumber}`;
      if (invoiceItems.length > 0) {
        description += ': ';
        description += invoiceItems.map(item => `${item.description} (${item.quantity}x)`).join(', ');
      }
      
      // Limitar o tamanho da descrição, se necessário
      if (description.length > 200) {
        description = description.substring(0, 197) + '...';
      }
      
      // Configuração da cobrança
      const paymentRequest: AsaasPaymentRequest = {
        customer: asaasCustomerId,
        billingType: mapPaymentMethodToAsaasBillingType(method),
        value: invoice.totalAmount,
        dueDate: formatDate(invoice.dueDate),
        description: description,
        externalReference: `charge_${invoice.id}`
      };
      
      // Para cobranças parceladas (cartão de crédito)
      if (method === 'credit_card' && invoiceItems.length > 1) {
        paymentRequest.installmentCount = invoiceItems.length;
        paymentRequest.installmentValue = invoice.totalAmount / invoiceItems.length;
      }
      
      // Enviar solicitação para o Asaas
      const response = await asaasClient.post('/payments', paymentRequest);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cobrança no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Busca uma cobrança no Asaas pelo ID
   */
  async getPaymentById(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar cobrança no Asaas (ID: ${paymentId}):`, error);
      throw error;
    }
  },
  
  /**
   * Cancela uma cobrança no Asaas
   */
  async cancelPayment(paymentId: string): Promise<{ deleted: boolean }> {
    try {
      const response = await asaasClient.delete(`/payments/${paymentId}`);
      return { deleted: response.data.deleted || false };
    } catch (error) {
      console.error(`Erro ao cancelar cobrança no Asaas (ID: ${paymentId}):`, error);
      throw error;
    }
  },
  
  /**
   * Atualiza o status de um pagamento baseado no Asaas
   */
  async updatePaymentStatus(paymentId: string): Promise<{ status: string }> {
    try {
      const asaasPayment = await this.getPaymentById(paymentId);
      const mappedStatus = mapAsaasStatusToPaymentStatus(asaasPayment.status);
      
      return { status: mappedStatus };
    } catch (error) {
      console.error(`Erro ao atualizar status da cobrança (ID: ${paymentId}):`, error);
      throw error;
    }
  },
  
  /**
   * Busca cobranças de um cliente no Asaas pelo ID do cliente
   */
  async getCustomerPayments(asaasCustomerId: string): Promise<AsaasPaymentResponse[]> {
    try {
      const response = await asaasClient.get('/payments', {
        params: { customer: asaasCustomerId }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error(`Erro ao buscar cobranças do cliente (ID: ${asaasCustomerId}):`, error);
      throw error;
    }
  },

  /**
   * Busca cobranças de um cliente no Asaas pelo nome ou email
   * Útil quando não temos o ID do cliente no Asaas
   */
  async getPaymentsByCustomerName(customerName: string): Promise<AsaasPaymentResponse[]> {
    try {
      console.log(`Buscando cobranças pelo nome do cliente: "${customerName}"`);
      
      // Extrai o primeiro nome para busca mais ampla
      const firstName = customerName.split(' ')[0];
      console.log(`Usando primeiro nome para busca mais ampla: "${firstName}"`);
      
      // Primeiro, busca todos os pagamentos (limitado aos últimos 100)
      const response = await asaasClient.get('/payments', {
        params: { 
          limit: 100,
          offset: 0
        }
      });
      
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.log('Nenhum pagamento encontrado na resposta do Asaas');
        return [];
      }
      
      console.log(`Total de pagamentos encontrados no Asaas: ${response.data.data.length}`);
      
      // Vamos imprimir todos os nomes de clientes para debug
      console.log('Lista de todos os clientes com pagamentos:');
      response.data.data.forEach((payment: any) => {
        if (payment.customerName) {
          console.log(`- Cliente: ${payment.customerName} (ID: ${payment.customer})`);
        }
      });
      
      // Filtra os pagamentos pelo nome do cliente (case insensitive)
      // Usa duas estratégias: nome completo ou apenas primeiro nome
      const matchingPayments = response.data.data.filter((payment: AsaasPaymentResponse) => {
        if (!payment.customer || !payment.customerName) return false;
        
        // Verifica se o nome do cliente contém o termo buscado
        const paymentCustomerName = payment.customerName.toLowerCase();
        const searchTermFull = customerName.toLowerCase();
        const searchTermFirst = firstName.toLowerCase();
        
        // Aceita se contém o nome completo OU apenas o primeiro nome
        return paymentCustomerName.includes(searchTermFull) || 
               paymentCustomerName.includes(searchTermFirst);
      });
      
      console.log(`Encontradas ${matchingPayments.length} cobranças para clientes com nome contendo "${firstName}" ou "${customerName}"`);
      
      // Vamos imprimir informações detalhadas dos pagamentos encontrados
      if (matchingPayments.length > 0) {
        matchingPayments.forEach((payment, index) => {
          console.log(`Pagamento ${index + 1}:`);
          console.log(`- ID: ${payment.id}`);
          console.log(`- Cliente: ${payment.customerName}`);
          console.log(`- Valor: ${payment.value}`);
          console.log(`- Status: ${payment.status}`);
          console.log(`- Data: ${payment.dateCreated}`);
          console.log(`- URL da Fatura: ${payment.invoiceUrl || 'Não disponível'}`);
        });
      }
      
      return matchingPayments;
    } catch (error) {
      console.error(`Erro ao buscar cobranças pelo nome do cliente (${customerName}):`, error);
      return [];
    }
  },
  
  /**
   * Gera um QR Code PIX para pagamento
   */
  async generatePixQrCode(paymentId: string): Promise<{ encodedImage: string, payload: string }> {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao gerar QR Code PIX (ID do pagamento: ${paymentId}):`, error);
      throw error;
    }
  }
};