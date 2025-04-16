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
  leadId?: number; // ID do lead para referência
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
  active?: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: string;
  } | null;
  payment?: {
    id: string;
    status: string;
    value: number;
    netValue: number;
    description: string;
    billingType: string;
    dueDate: string;
    paymentDate?: string;
  } | null;
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
      console.log('URL base Asaas:', this.baseUrl);
      console.log('Token API (começo):', this.apiKey?.substring(0, 10) + '...');
      
      // Payload simplificado - testado e confirmado por curl direto
      const payload = {
        name: "Pagamento - Matrícula", // Nome fixo para evitar problemas
        customer: {
          name: data.name,
          email: data.email
        },
        value: data.value,
        billingType: "UNDEFINED",
        chargeType: "DETACHED",
        dueDateLimitDays: 5,
        maxInstallmentCount: 1,
        showPaymentTypes: ["BOLETO", "CREDIT_CARD", "PIX"]
      };
      
      console.log('Payload a ser enviado ao Asaas:', JSON.stringify(payload, null, 2));

      // Cria uma instância do axios específica para este request
      const axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'access-token': this.apiKey,
          'Content-Type': 'application/json'
        },
        // Desabilita transformações que podem causar problemas
        transformRequest: [(data) => {
          return JSON.stringify(data);
        }]
      });
      
      // Configura interceptores para log detalhado
      axiosInstance.interceptors.request.use(request => {
        console.log('Iniciando request para:', request.url);
        console.log('Headers:', JSON.stringify(request.headers, null, 2));
        console.log('Método:', request.method?.toUpperCase());
        console.log('Payload completo:', request.data);
        return request;
      });
      
      const response = await axiosInstance.post('/paymentLinks', payload);

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
      
      // Mapeamos a resposta do Asaas para nossa interface
      // A API do Asaas pode retornar diferentes estruturas dependendo do tipo de checkout
      return {
        id: response.data.id,
        status: response.data.status || (response.data.active ? 'active' : 'inactive'),
        value: response.data.value,
        description: response.data.description || response.data.name || '',
        billingType: response.data.billingType || 'UNDEFINED',
        dueDate: response.data.dueDate || '',
        customer: response.data.customer || null,
        payment: response.data.payment || null,
        // Incluímos o campo active que pode ser usado para determinar o status
        active: response.data.active
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
   * Obtém as cobranças associadas a um link de checkout
   * Isso é importante para obter os pagamentos criados via checkout
   */
  async getCheckoutPayments(checkoutId: string): Promise<any[]> {
    try {
      console.log(`Buscando cobranças associadas ao checkout ${checkoutId}`);
      
      // Configuração com timeout para evitar que a requisição fique pendente por muito tempo
      const axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'access-token': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 segundos de timeout
      });
      
      // Primeiro obtemos os detalhes do checkout para verificar se há um pagamento
      console.log(`Consultando status do checkout ${checkoutId} com timeout definido`);
      
      try {
        const checkoutResponse = await axiosInstance.get(`/paymentLinks/${checkoutId}`);
        const checkoutStatus = checkoutResponse.data;
        
        console.log(`Status do checkout ${checkoutId} obtido com sucesso`);
        
        // Verifica se existe um pagamento associado ao checkout
        if (checkoutStatus.payment && checkoutStatus.payment.id) {
          console.log(`Checkout ${checkoutId} tem um pagamento associado: ${checkoutStatus.payment.id}`);
          
          // Se encontrou um pagamento associado, obtém os detalhes completos
          try {
            const paymentResponse = await axiosInstance.get(`/payments/${checkoutStatus.payment.id}`);
            
            console.log(`Detalhes do pagamento ${checkoutStatus.payment.id} obtidos com sucesso`);
            
            return [paymentResponse.data];
          } catch (paymentError) {
            console.error(`Erro ao obter detalhes do pagamento ${checkoutStatus.payment.id}:`, paymentError);
            // Mesmo com erro, retornamos o pagamento básico que temos
            return [checkoutStatus.payment];
          }
        }
        
        console.log(`Checkout ${checkoutId} não tem pagamentos associados`);
        return [];
      } catch (checkoutError) {
        console.error(`Erro ao consultar status do checkout ${checkoutId}:`, checkoutError);
        
        if (axios.isAxiosError(checkoutError) && checkoutError.code === 'ECONNABORTED') {
          console.error(`Timeout na consulta do checkout ${checkoutId}`);
          throw new Error(`Timeout na consulta do checkout ${checkoutId}`);
        }
        
        return [];
      }
    } catch (error) {
      console.error(`Erro ao buscar cobranças do checkout ${checkoutId}:`, error);
      return [];
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