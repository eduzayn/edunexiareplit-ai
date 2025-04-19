/**
 * Serviço otimizado para criação de links de pagamento via Asaas
 * 
 * Este serviço utiliza a API de cobranças do Asaas para gerar links de pagamento
 * completos, contornando problemas de configuração de domínio e aproveitando
 * todas as funcionalidades disponíveis.
 */

import axios from 'axios';

// Configurações da API do Asaas
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
// Verificamos se a API key começa com $aact_prod_ para decidir qual ambiente usar
const isProductionToken = ASAAS_API_KEY?.startsWith('$aact_prod_');
const ASAAS_API_URL = process.env.ASAAS_API_URL || (
  isProductionToken
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'
);

// Log para rastrear qual ambiente está sendo usado
console.log(`[ASAAS DIRECT] Utilizando ambiente: ${isProductionToken ? 'Produção' : 'Sandbox'} - ${ASAAS_API_URL}`);
console.log(`[ASAAS DIRECT] Token da API (ASAAS_ZAYN_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interface para criação de cliente no Asaas
interface AsaasCustomerRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
}

// Interface para resposta de criação/busca de cliente
interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  dateCreated: string;
}

// Interface para criação de cobrança
interface AsaasPaymentRequest {
  customer: string;                 // ID do cliente no Asaas
  billingType: string;              // Tipo de cobrança (BOLETO, CREDIT_CARD, PIX, etc.)
  value: number;                    // Valor da cobrança
  dueDate: string;                  // Data de vencimento (YYYY-MM-DD)
  description?: string;             // Descrição da cobrança
  externalReference?: string;       // Referência externa
  postalService?: boolean;          // Serviço de envio postal
  // Opções avançadas
  installmentCount?: number;        // Número de parcelas
  installmentValue?: number;        // Valor de cada parcela
  discount?: {
    value: number;                  // Valor do desconto
    dueDateLimitDays?: number;      // Limite de dias para o desconto
    type: 'FIXED' | 'PERCENTAGE';   // Tipo de desconto
  };
  interest?: {
    value: number;                  // Valor de juros (%)
  };
  fine?: {
    value: number;                  // Valor da multa (%)
  };
}

// Interface para resposta de criação de cobrança
interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  description?: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  fine?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  creditCard?: {
    creditCardToken?: string;
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  nossoNumero?: string;
  deleted: boolean;
}

// Formatar data para o padrão da API (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Obter uma data futura em formato YYYY-MM-DD
function getFutureDateString(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return formatDate(date);
}

export const AsaasDirectPaymentService = {
  /**
   * Cria ou encontra um cliente no Asaas
   */
  async createOrGetCustomer(
    name: string, 
    email: string, 
    cpf: string
  ): Promise<AsaasCustomerResponse> {
    try {
      // Formata o CPF removendo caracteres não numéricos
      const formattedCpf = cpf.replace(/[^\d]+/g, '');
      
      console.log(`[ASAAS DIRECT] Buscando cliente pelo CPF/CNPJ: ${formattedCpf}`);
      
      // Primeira tentativa: busca por listagem
      try {
        const searchResponse = await asaasClient.get('/customers', {
          params: { cpfCnpj: formattedCpf }
        });
        
        console.log(`[ASAAS DIRECT] Resposta da API de listagem:`, JSON.stringify(searchResponse.data));
        
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          console.log(`[ASAAS DIRECT] Cliente encontrado pelo CPF/CNPJ`);
          return searchResponse.data.data[0];
        }
      } catch (listError) {
        console.log(`[ASAAS DIRECT] Erro na busca por listagem:`, listError);
      }
      
      // Segunda tentativa: busca direta
      try {
        const specificResponse = await asaasClient.get(`/customers?cpfCnpj=${formattedCpf}`);
        
        if (specificResponse.data.data && specificResponse.data.data.length > 0) {
          console.log(`[ASAAS DIRECT] Cliente encontrado por busca direta`);
          return specificResponse.data.data[0];
        }
      } catch (specificError) {
        console.log(`[ASAAS DIRECT] Erro na busca direta:`, specificError);
      }
      
      // Cliente não encontrado, criar um novo
      console.log(`[ASAAS DIRECT] Cliente não encontrado. Criando novo cliente...`);
      
      const createCustomerPayload: AsaasCustomerRequest = {
        name,
        email,
        cpfCnpj: formattedCpf
      };
      
      const createResponse = await asaasClient.post('/customers', createCustomerPayload);
      
      console.log(`[ASAAS DIRECT] Cliente criado com sucesso:`, JSON.stringify(createResponse.data));
      
      return createResponse.data;
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar/buscar cliente no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Cria uma cobrança completa no Asaas com link de pagamento
   */
  async createPaymentWithLink(
    customerId: string,
    value: number,
    description: string,
    externalReference: string
  ): Promise<AsaasPaymentResponse> {
    try {
      // Payload avançado com todas as opções disponíveis
      const paymentPayload: AsaasPaymentRequest = {
        customer: customerId,
        billingType: 'UNDEFINED', // Permite que o cliente escolha o método de pagamento
        value,
        dueDate: getFutureDateString(7), // Vencimento em 7 dias
        description,
        externalReference,
        // Configuração de multa por atraso (2%)
        fine: {
          value: 2
        },
        // Configuração de juros por atraso (1% ao mês)
        interest: {
          value: 1
        },
        // Desconto para pagamento antecipado (5%)
        discount: {
          value: 5,
          dueDateLimitDays: 3, // Até 3 dias antes do vencimento
          type: 'PERCENTAGE' // Valor percentual
        }
      };
      
      console.log('[ASAAS DIRECT] Criando cobrança no Asaas:', JSON.stringify(paymentPayload, null, 2));
      
      const paymentResponse = await asaasClient.post('/payments', paymentPayload);
      
      console.log('[ASAAS DIRECT] Cobrança criada com sucesso:', JSON.stringify(paymentResponse.data, null, 2));
      
      return paymentResponse.data;
    } catch (error) {
      console.error('[ASAAS DIRECT] Erro ao criar cobrança no Asaas:', error);
      throw error;
    }
  },
  
  /**
   * Busca detalhes de uma cobrança
   */
  async getPaymentById(paymentId: string): Promise<AsaasPaymentResponse> {
    try {
      const response = await asaasClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao buscar cobrança (ID: ${paymentId}):`, error);
      throw error;
    }
  },
  
  /**
   * Cancela uma cobrança
   */
  async cancelPayment(paymentId: string): Promise<{ deleted: boolean }> {
    try {
      const response = await asaasClient.delete(`/payments/${paymentId}`);
      return { deleted: response.data.deleted || false };
    } catch (error) {
      console.error(`[ASAAS DIRECT] Erro ao cancelar cobrança (ID: ${paymentId}):`, error);
      throw error;
    }
  }
};