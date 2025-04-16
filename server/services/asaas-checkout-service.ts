/**
 * Serviço para integração com o Asaas Checkout
 */

import axios from 'axios';

// Interface para criação de link de checkout
interface CheckoutLinkData {
  name: string;
  email: string;
  phone?: string;
  value: number;
  dueDate: string; // Formato: YYYY-MM-DD
  description: string;
  expirationTime?: number; // Tempo de expiração em minutos
  successUrl?: string;
  notificationUrl?: string;
  additionalInfo?: string;
}

// Interface para resposta de criação de checkout
interface CheckoutResponse {
  id: string;
  url: string;
  status: string;
  expirationDate: string;
}

// Interface para status de checkout
interface CheckoutStatus {
  id: string;
  status: string;
  value: number;
  description: string;
  billingType?: string;
  dueDate: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  payment?: {
    id: string;
    status: string;
    value: number;
    netValue: number;
    description: string;
    billingType: string;
    dueDate: string;
    paymentDate?: string;
  };
}

class AsaasCheckoutService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Utiliza a chave da Zayn, conforme padronizado
    this.apiKey = process.env.ASAAS_ZAYN_KEY || '';
    
    // Determina o ambiente (sandbox ou produção)
    const useSandbox = process.env.ASAAS_SANDBOX === 'true';
    this.baseUrl = useSandbox 
      ? 'https://sandbox.asaas.com/v3'
      : 'https://api.asaas.com/v3';
    
    if (!this.apiKey) {
      console.error('AVISO: Chave da API Asaas (ASAAS_ZAYN_KEY) não configurada!');
    }
  }

  /**
   * Cria um link de checkout para pagamento único
   */
  async createCheckoutLink(data: CheckoutLinkData): Promise<CheckoutResponse> {
    try {
      console.log('Criando link de checkout no Asaas:', JSON.stringify(data, null, 2));
      
      // Formata os dados para a API do Asaas exatamente conforme a documentação do Checkout
      const payload = {
        name: `Pagamento - ${data.description || 'Matrícula'}`,
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined
        },
        value: data.value,
        billingType: "UNDEFINED", // Permite que o cliente escolha
        chargeType: "DETACHED", // Conforme documentação para checkout
        dueDateLimitDays: 5,
        dueDate: data.dueDate,
        description: data.description || 'Pagamento via Checkout',
        externalReference: `lead_${data.leadId || 'novo'}`,
        maxInstallmentCount: 1,
        showPaymentTypes: [
          "BOLETO", 
          "CREDIT_CARD", 
          "PIX"
        ],
        expirationTime: data.expirationTime || 60,
        callbackUrl: data.notificationUrl || undefined,
        returnUrl: data.successUrl || undefined
      };

      const response = await axios.post(
        `${this.baseUrl}/paymentLinks`, 
        payload,
        {
          headers: {
            'access-token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Link de checkout criado com sucesso:', JSON.stringify(response.data, null, 2));
      
      return {
        id: response.data.id,
        url: response.data.url,
        status: response.data.status,
        expirationDate: response.data.expirationDate
      };
    } catch (error) {
      console.error('Erro ao criar link de checkout no Asaas:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Erro com resposta do servidor
          console.error(`[Asaas Checkout] Erro HTTP ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
          console.error(`[Asaas Checkout] Headers:`, JSON.stringify(error.response.headers, null, 2));
          throw new Error(`Erro Asaas: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          // Requisição feita mas sem resposta
          console.error('[Asaas Checkout] Erro sem resposta (timeout ou rede):', error.request);
          throw new Error('Erro de conexão com o Asaas: sem resposta do servidor');
        }
      }
      
      // Para outros tipos de erro
      console.error('[Asaas Checkout] Erro inesperado:', error);
      throw error;
    }
  }

  /**
   * Obtém o status de um link de checkout
   */
  async getCheckoutStatus(checkoutId: string): Promise<CheckoutStatus> {
    try {
      console.log(`Consultando status do checkout ${checkoutId} no Asaas`);
      
      const response = await axios.get(
        `${this.baseUrl}/paymentLinks/${checkoutId}`,
        {
          headers: {
            'access-token': this.apiKey
          }
        }
      );

      console.log('Status do checkout obtido com sucesso:', JSON.stringify(response.data, null, 2));
      
      return {
        id: response.data.id,
        status: response.data.status,
        value: response.data.value,
        description: response.data.description,
        billingType: response.data.billingType,
        dueDate: response.data.dueDate,
        customer: response.data.customer,
        payment: response.data.payment
      };
    } catch (error) {
      console.error(`Erro ao consultar status do checkout ${checkoutId}:`, error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Detalhes da resposta do Asaas:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`Erro Asaas: ${JSON.stringify(error.response.data)}`);
      }
      
      throw error;
    }
  }

  /**
   * Cancela um link de checkout ativo
   */
  async cancelCheckoutLink(checkoutId: string): Promise<boolean> {
    try {
      console.log(`Cancelando checkout ${checkoutId} no Asaas`);
      
      const response = await axios.delete(
        `${this.baseUrl}/paymentLinks/${checkoutId}`,
        {
          headers: {
            'access-token': this.apiKey
          }
        }
      );

      console.log('Link de checkout cancelado com sucesso');
      return true;
    } catch (error) {
      console.error(`Erro ao cancelar checkout ${checkoutId}:`, error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Detalhes da resposta do Asaas:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`Erro Asaas: ${JSON.stringify(error.response.data)}`);
      }
      
      throw error;
    }
  }
}

// Cria instância única do serviço
export const asaasCheckoutService = new AsaasCheckoutService();
// Exporta a classe também para tipos
export { AsaasCheckoutService };