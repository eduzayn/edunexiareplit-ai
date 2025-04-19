/**
 * Serviço para gerenciamento de matrículas simplificadas com integração Asaas
 */

import axios from 'axios';
import crypto from 'crypto';
import { 
  InsertSimplifiedEnrollment, 
  SimplifiedEnrollment,
  simplifiedEnrollmentStatusEnum
} from '../../shared/schema';

// Configurações da API do Asaas
/**
 * IMPORTANTE: Sistema utiliza duas chaves diferentes para o Asaas:
 * 
 * 1. ASAAS_ZAYN_KEY - Usada EXCLUSIVAMENTE para matrículas de alunos no sistema CRM
 *    Esta chave é utilizada aqui em simplified-enrollment-service.ts e em asaas-service.ts
 * 
 * 2. ASAAS_API_KEY - Usada para cadastro de instituições nas páginas públicas do site principal
 *    NÃO deve ser usada para operações no CRM
 * 
 * Não altere o código - no CRM o correto é usar ASAAS_ZAYN_KEY
 */
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
const ASAAS_API_URL = 'https://api.asaas.com/v3';

// Log para rastrear qual ambiente está sendo usado
console.log(`[SIMPLIFIED ENROLLMENT] Utilizando API Asaas: ${ASAAS_API_URL}`);
console.log(`[SIMPLIFIED ENROLLMENT] Token da API (ASAAS_ZAYN_KEY): ${ASAAS_API_KEY?.substring(0, 10)}...`);

// Configuração do cliente Axios
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access-token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Interfaces para a API Asaas
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
  city?: string;
  state?: string;
  postalCode?: string;
  deleted?: boolean;
}

interface AsaasPaymentLinkRequest {
  name: string;            // Nome do link de pagamento
  description?: string;    // Descrição opcional
  billingType: string;     // Tipo de cobrança (BOLETO, CREDIT_CARD, PIX, etc)
  chargeType: string;      // Tipo de cobrança (DETACHED ou RECURRENT)
  value: number;           // Valor da cobrança
  dueDateLimitDays?: number; // Limite de dias para pagamento após acesso
  subscriptionCycle?: string; // Ciclo de assinatura (para recorrentes)
  maxInstallmentCount?: number; // Número máximo de parcelas
  notificationEnabled?: boolean; // Habilitar notificações
  externalReference?: string;    // Referência externa
  endDate?: string;        // Data final do link (formato YYYY-MM-DD)
  ccBrands?: string[];     // Bandeiras de cartão permitidas
  showDescription?: boolean; // Mostrar descrição no link
  showPaymentTypes?: string[]; // Tipos de pagamento a serem mostrados
  fine?: {                 // Configuração de multa
    value: number;
  };
  interest?: {             // Configuração de juros
    value: number;
  };
  discount?: {             // Configuração de desconto
    value: number;
    dueDateLimitDays: number;
    type: string;          // FIXED ou PERCENTAGE
  };
  split?: {                // Configurações de split de pagamento
    walletId: string;      // ID da carteira para receber o split
    fixedValue?: number;   // Valor fixo para o split
    percentualValue?: number; // Valor percentual para o split
  }[];
  callback?: {
    autoRedirect: boolean, // Redirecionar automaticamente após pagamento
    successUrl: string,    // URL para redirecionar em caso de sucesso
    autoRedirectUrl?: string // URL alternativa para redirecionamento
  };
}

interface AsaasPaymentLinkResponse {
  id: string;              // ID do link de pagamento
  url: string;             // URL para acesso ao link de pagamento
  name: string;            // Nome do link
  description?: string;    // Descrição
  billingType: string;     // Tipo de cobrança
  chargeType: string;      // Tipo de cobrança (DETACHED ou RECURRENT)
  value: number;           // Valor
  dueDateLimitDays?: number; // Limite de dias para pagamento
  deleted: boolean;        // Se está deletado
  paymentId?: string;      // ID do pagamento (quando usar método alternativo)
  mainImageUrl?: string;   // URL da imagem principal
  pendingPaymentId?: string; // ID de pagamento pendente
  apiUrl?: string;         // URL da API
  status?: string;         // Status do link (ACTIVE, INACTIVE)
}

// Serviço de Matrículas Simplificadas
export const SimplifiedEnrollmentService = {
  /**
   * Gera uma referência externa única para rastreamento
   */
  generateExternalReference(): string {
    // Formato: SE-{timestamp}-{random} (Simplified Enrollment)
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `SE-${timestamp}-${random}`;
  },

  /**
   * Cria ou busca um cliente no Asaas para matrícula
   */
  async createOrGetAsaasCustomer(
    name: string, 
    email: string, 
    cpf: string
  ): Promise<AsaasCustomerResponse> {
    try {
      // Primeiro, verifica se o cliente já existe pelo CPF
      const formattedCpf = cpf.replace(/[^\d]+/g, '');
      
      console.log(`[SIMPLIFIED ENROLLMENT] Buscando cliente pelo CPF/CNPJ: ${formattedCpf}`);
      
      // Tentar as duas abordagens de busca
      let existingCustomer = null;
      
      // Primeira abordagem: busca por listagem
      try {
        const searchResponse = await asaasClient.get('/customers', {
          params: { cpfCnpj: formattedCpf }
        });
        
        console.log(`[SIMPLIFIED ENROLLMENT] Resposta da API de listagem:`, JSON.stringify(searchResponse.data));
        
        // Se encontrou algum resultado, retorna o primeiro ativo
        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
          const activeCustomers = searchResponse.data.data.filter(
            (customer: AsaasCustomerResponse) => !customer.deleted
          );
          
          if (activeCustomers.length > 0) {
            console.log(`[SIMPLIFIED ENROLLMENT] Cliente já existe no Asaas com ID ${activeCustomers[0].id}`);
            existingCustomer = activeCustomers[0];
          }
        }
      } catch (listError) {
        console.log(`[SIMPLIFIED ENROLLMENT] Erro na busca por listagem: ${listError.message}`);
      }
      
      // Se não encontrou na primeira abordagem, tenta a segunda
      if (!existingCustomer) {
        try {
          console.log(`[SIMPLIFIED ENROLLMENT] Tentando endpoint específico de busca para CPF ${formattedCpf}`);
          const specificResponse = await asaasClient.get(`/customers/findByCpfCnpj/${formattedCpf}`);
          
          if (specificResponse.data && !specificResponse.data.deleted) {
            console.log(`[SIMPLIFIED ENROLLMENT] Cliente encontrado pelo endpoint específico: ${specificResponse.data.id}`);
            existingCustomer = specificResponse.data;
          }
        } catch (specificError) {
          // A API retorna 404 se não encontrar, o que é esperado
          if (specificError.response && specificError.response.status !== 404) {
            console.error(`[SIMPLIFIED ENROLLMENT] Erro na busca específica: ${specificError.message}`);
          }
        }
      }
      
      // Se encontrou o cliente em alguma das abordagens, retorna
      if (existingCustomer) {
        return existingCustomer;
      }
      
      // Se não encontrou, cria um novo cliente
      console.log(`[SIMPLIFIED ENROLLMENT] Criando novo cliente no Asaas: ${name}, ${email}, ${formattedCpf}`);
      
      const createResponse = await asaasClient.post('/customers', {
        name,
        email,
        cpfCnpj: formattedCpf
      });
      
      console.log(`[SIMPLIFIED ENROLLMENT] Cliente criado com sucesso: ${createResponse.data.id}`);
      return createResponse.data;
    } catch (error) {
      console.error('[SIMPLIFIED ENROLLMENT] Erro ao criar/buscar cliente no Asaas:', error);
      throw error;
    }
  },

  /**
   * Cria um link de pagamento no Asaas aproveitando todos os recursos disponíveis da API
   * 
   * Para contornar o erro de "Não há nenhum domínio configurado em sua conta",
   * implementamos uma solução alternativa utilizando a API de cobrança direta
   * em vez da API de links de pagamento quando necessário.
   */
  async createPaymentLink(
    customerId: string,
    value: number,
    courseName: string,
    externalReference: string
  ): Promise<AsaasPaymentLinkResponse> {
    try {
      // Verifica se estamos em ambiente de desenvolvimento (Replit)
      const isDevEnvironment = process.env.REPLIT_DOMAINS ? true : false;
      const endDate = this.getFutureDateString(30); // Link válido por 30 dias
      
      console.log(`Ambiente de desenvolvimento detectado: ${isDevEnvironment ? 'Sim' : 'Não'}`);
      
      // Método 1: Tenta criar um link de pagamento completo usando todos os recursos disponíveis
      try {
        // Payload completo com todas as opções possíveis
        const payload: AsaasPaymentLinkRequest = {
          name: `Matrícula - ${courseName}`,
          description: `Matrícula para o curso: ${courseName}. \nPagamento da taxa de matrícula.`,
          billingType: 'UNDEFINED', // Permite múltiplos métodos de pagamento
          chargeType: 'DETACHED', // Pagamento único
          value,
          dueDateLimitDays: 7, // 7 dias para pagar após acessar o link
          maxInstallmentCount: 12, // Permite até 12 parcelas
          notificationEnabled: true, // Envia notificações ao cliente
          externalReference,
          endDate, // Data limite para o link (30 dias)
          showDescription: true, // Mostra a descrição no link
          // Tipos de pagamento a serem mostrados
          showPaymentTypes: ['BOLETO', 'CREDIT_CARD', 'PIX'],
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
          },
          // Configuração de callback (redirecionamento após pagamento)
          callback: {
            autoRedirect: true,
            successUrl: `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || ''}/matricula/confirmacao`
          }
        };
        
        console.log('Tentando criar link de pagamento avançado no Asaas:', payload);
        
        const response = await asaasClient.post(`/paymentLinks`, payload);
        console.log('Resposta do Asaas bem-sucedida (Link de pagamento):', response.data);
        
        // Adiciona o ID de pagamento se houver um pendingPayment
        if (response.data.pendingPaymentId) {
          response.data.paymentId = response.data.pendingPaymentId;
        }
        
        return response.data;
      } catch (linkError: any) {
        // Se o erro for relacionado à falta de domínio, tenta o método alternativo
        const isDomainError = linkError.response?.data?.errors?.some((err: any) => 
          err.description?.includes('domínio configurado')
        );
        
        if (isDomainError) {
          console.log('Erro de domínio detectado, tentando método alternativo com cobrança direta...');
          
          // Método 2: Criar uma cobrança direta e usar a URL dela
          try {
            // Criar uma cobrança direta com configurações avançadas
            const paymentPayload = {
              customer: customerId,
              billingType: 'UNDEFINED', // Permite todos os métodos (PIX, cartão, boleto)
              value,
              dueDate: this.getFutureDateString(7), // 7 dias a partir de hoje
              description: `Matrícula no curso: ${courseName}`,
              externalReference,
              postalService: false,
              // Permite parcelamento em até 12x
              installmentCount: 12,
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
            
            console.log('Criando cobrança direta avançada no Asaas:', paymentPayload);
            
            const paymentResponse = await asaasClient.post(`/payments`, paymentPayload);
            console.log('Resposta da cobrança bem-sucedida:', paymentResponse.data);
            
            // Constrói uma resposta compatível com o formato de link de pagamento
            const mockLinkResponse: AsaasPaymentLinkResponse = {
              id: paymentResponse.data.id,
              url: paymentResponse.data.invoiceUrl, // URL de fatura que funciona como link de pagamento
              name: `Matrícula - ${courseName}`,
              description: `Matrícula no curso: ${courseName}`,
              billingType: paymentResponse.data.billingType || 'UNDEFINED',
              chargeType: 'DETACHED',
              value,
              deleted: false,
              paymentId: paymentResponse.data.id, // Salva o ID do pagamento
              status: 'ACTIVE'
            };
            
            return mockLinkResponse;
          } catch (paymentError: any) {
            console.error('Erro ao criar cobrança alternativa:', {
              status: paymentError.response?.status,
              data: paymentError.response?.data
            });
            
            // Tenta um terceiro método ainda mais simplificado se o segundo falhar
            try {
              console.log('Tentando método simplificado de último recurso...');
              
              // Payload mínimo para criação de cobrança
              const minimalPayload = {
                customer: customerId,
                billingType: 'UNDEFINED',
                value,
                dueDate: this.getFutureDateString(7),
                description: `Matrícula: ${courseName}`,
                externalReference
              };
              
              const simpleResponse = await asaasClient.post(`/payments`, minimalPayload);
              console.log('Resposta do método simplificado:', simpleResponse.data);
              
              return {
                id: simpleResponse.data.id,
                url: simpleResponse.data.invoiceUrl,
                name: `Matrícula - ${courseName}`,
                description: `Matrícula: ${courseName}`,
                billingType: 'UNDEFINED',
                chargeType: 'DETACHED',
                value,
                deleted: false,
                paymentId: simpleResponse.data.id
              };
            } catch (finalError: any) {
              console.error('Todos os métodos falharam:', finalError);
              throw new Error(
                `Erro ao gerar qualquer tipo de pagamento: ${
                  finalError.response?.data?.errors?.[0]?.description || 
                  finalError.message || 
                  'Erro desconhecido'
                }`
              );
            }
          }
        } else {
          // Se for outro tipo de erro, relança
          console.error('Erro na chamada da API Asaas:', {
            status: linkError.response?.status,
            statusText: linkError.response?.statusText,
            data: linkError.response?.data,
            errors: linkError.response?.data?.errors
          });
          
          throw new Error(
            `Erro ao gerar link de pagamento: ${
              linkError.response?.data?.errors?.[0]?.description || 
              linkError.message || 
              'Erro desconhecido'
            }`
          );
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar link de pagamento no Asaas:', error.message);
      throw error;
    }
  },
  
  /**
   * Retorna uma data futura formatada como YYYY-MM-DD
   */
  getFutureDateString(daysToAdd: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  },

  /**
   * Processa um webhook do Asaas para pagamento
   */
  async processWebhook(webhookData: any): Promise<void> {
    try {
      // Processar webhook recebido do Asaas
      console.log('Processando webhook do Asaas:', webhookData);
      
      // Implementar lógica com base no tipo do evento
      const event = webhookData.event;
      
      if (event === 'PAYMENT_LINK_PAID') {
        // Pagamento confirmado, criar matrícula oficial
        await this.handlePaymentLinkPaid(webhookData);
      } else if (event === 'PAYMENT_LINK_OPENED') {
        // Link acessado pelo cliente
        await this.handlePaymentLinkOpened(webhookData);
      }
    } catch (error) {
      console.error('Erro ao processar webhook do Asaas:', error);
      throw error;
    }
  },

  /**
   * Processa um pagamento confirmado
   */
  async handlePaymentLinkPaid(webhookData: any): Promise<void> {
    // Implementar lógica para atualizar o status da matrícula simplificada
    // e criar a matrícula oficial quando o pagamento for confirmado
    console.log('Processando pagamento confirmado:', webhookData);
  },

  /**
   * Processa acesso ao link de pagamento
   */
  async handlePaymentLinkOpened(webhookData: any): Promise<void> {
    // Implementar lógica para registrar acesso ao link de pagamento
    console.log('Link de pagamento acessado:', webhookData);
  }
};