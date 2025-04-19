/**
 * Serviço para gerenciamento de links de pagamento do Asaas
 * Implementa funcionalidades como criação, atualização e deleção de links
 */
import axios, { AxiosError } from 'axios';
import { logger } from './logger';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { edunexaPaymentLinks } from '../../shared/schema';

// Logger específico para este serviço
const log = logger.forService('AsaasPaymentLink');

/**
 * Interfaces para representar as requisições e respostas da API do Asaas
 */
export interface AsaasPaymentLinkCreateRequest {
  name: string;
  description?: string;
  billingType?: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  chargeType?: 'DETACHED' | 'RECURRENT';
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  notificationEnabled?: boolean;
  externalReference?: string;
  value?: number;
  
  // Propriedades adicionais para configuração de descontos
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  
  // Propriedades adicionais para configuração de multa e juros
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'PERCENTAGE';
  };
  
  // Propriedades para controlar as formas de pagamento permitidas
  allowBoleto?: boolean;
  allowCreditCard?: boolean;
  allowPix?: boolean;
  
  // Propriedades para pré-preenchimento de dados do pagador
  payerName?: string;
  payerCpfCnpj?: string;
  payerEmail?: string;
  payerPhone?: string;
}

export interface AsaasPaymentLinkResponse {
  id: string;
  name: string;
  url: string;
  description?: string;
  billingType?: string;
  chargeType?: string;
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  notificationEnabled: boolean;
  externalReference?: string;
  value?: number;
  status: 'ACTIVE' | 'INACTIVE';
  dateCreated: string;
  deleted: boolean;
  
  // Campos adicionais
  discount?: any;
  fine?: any;
  interest?: any;
}

/**
 * Classe principal do serviço de links de pagamento do Asaas
 */
export class AsaasPaymentLinkService {
  private apiUrl: string;
  private apiKey: string;
  
  constructor() {
    // Sempre usamos o ambiente de produção do Asaas conforme padrão do sistema
    this.apiUrl = 'https://api.asaas.com/v3';
    
    // Usar a chave dedicada para este módulo
    this.apiKey = process.env.ASAAS_ZAYN_KEY || process.env.ASAAS_API_KEY || '';
    
    if (!this.apiKey) {
      log.error('API key do Asaas não configurada!');
      throw new Error('ASAAS_ZAYN_KEY ou ASAAS_API_KEY não configurada!');
    }
    
    log.info(`Serviço inicializado com URL: ${this.apiUrl}`);
  }
  
  /**
   * Cria um novo link de pagamento no Asaas
   */
  async createPaymentLink(data: AsaasPaymentLinkCreateRequest): Promise<AsaasPaymentLinkResponse> {
    try {
      log.info('Iniciando criação de link de pagamento', { data });
      
      // Formato padronizado para referência externa
      if (!data.externalReference && data.externalReference !== '') {
        const timestamp = Date.now();
        data.externalReference = `EDU-${timestamp}`;
        log.debug('Referência externa gerada automaticamente', { externalReference: data.externalReference });
      }
      
      // Verificações e adaptações dos dados
      this.validatePaymentLinkData(data);
      
      // Chamada para a API do Asaas
      const response = await axios.post(
        `${this.apiUrl}/paymentLinks`,
        data,
        {
          headers: {
            'access_token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      log.info('Link de pagamento criado com sucesso', { 
        id: response.data.id,
        url: response.data.url
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error, 'Erro ao criar link de pagamento', data);
      throw this.formatError(error, 'Falha ao criar link de pagamento');
    }
  }
  
  /**
   * Atualiza um link de pagamento existente no Asaas
   */
  async updatePaymentLink(id: string, data: Partial<AsaasPaymentLinkCreateRequest>): Promise<AsaasPaymentLinkResponse> {
    try {
      log.info(`Atualizando link de pagamento ${id}`, { data });
      
      // Verificações e adaptações dos dados
      this.validatePaymentLinkData(data);
      
      // Chamada para a API do Asaas
      const response = await axios.post(
        `${this.apiUrl}/paymentLinks/${id}`,
        data,
        {
          headers: {
            'access_token': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      log.info(`Link de pagamento ${id} atualizado com sucesso`);
      
      return response.data;
    } catch (error) {
      this.handleError(error, `Erro ao atualizar link de pagamento ${id}`, data);
      throw this.formatError(error, 'Falha ao atualizar link de pagamento');
    }
  }
  
  /**
   * Obtém um link de pagamento do Asaas pelo ID
   */
  async getPaymentLink(id: string): Promise<AsaasPaymentLinkResponse> {
    try {
      log.info(`Buscando link de pagamento ${id}`);
      
      const response = await axios.get(
        `${this.apiUrl}/paymentLinks/${id}`,
        {
          headers: {
            'access_token': this.apiKey
          }
        }
      );
      
      log.info(`Link de pagamento ${id} encontrado`);
      
      return response.data;
    } catch (error) {
      this.handleError(error, `Erro ao buscar link de pagamento ${id}`);
      throw this.formatError(error, 'Falha ao buscar link de pagamento');
    }
  }
  
  /**
   * Deleta ou desativa um link de pagamento no Asaas
   */
  async deletePaymentLink(id: string): Promise<boolean> {
    try {
      log.info(`Deletando link de pagamento ${id}`);
      
      await axios.delete(
        `${this.apiUrl}/paymentLinks/${id}`,
        {
          headers: {
            'access_token': this.apiKey
          }
        }
      );
      
      log.info(`Link de pagamento ${id} deletado com sucesso`);
      
      return true;
    } catch (error) {
      this.handleError(error, `Erro ao deletar link de pagamento ${id}`);
      throw this.formatError(error, 'Falha ao deletar link de pagamento');
    }
  }
  
  /**
   * Atualiza o registro local de um link de pagamento no banco de dados
   */
  async updateLocalPaymentLinkStatus(paymentLinkId: number, status: 'Active' | 'Error' | 'Disabled'): Promise<void> {
    try {
      log.info(`Atualizando status do link ${paymentLinkId} para ${status}`);
      
      await db
        .update(edunexaPaymentLinks)
        .set({ internalStatus: status })
        .where(eq(edunexaPaymentLinks.id, paymentLinkId));
        
      log.info(`Status do link ${paymentLinkId} atualizado para ${status}`);
    } catch (error) {
      log.error(`Erro ao atualizar status do link ${paymentLinkId}`, error);
      throw error;
    }
  }
  
  /**
   * Valida e adapta os dados do link de pagamento
   */
  private validatePaymentLinkData(data: Partial<AsaasPaymentLinkCreateRequest>): void {
    // Substituir billingType por flags de métodos de pagamento quando necessário
    if (data.billingType) {
      log.debug(`Mapeando billingType para flags de métodos de pagamento: ${data.billingType}`);
      
      // Remover billingType se estiver usando as flags individuais
      if (data.allowBoleto !== undefined || data.allowCreditCard !== undefined || data.allowPix !== undefined) {
        log.warn('billingType foi ignorado pois as flags de métodos de pagamento foram fornecidas');
        delete data.billingType;
      }
    }
    
    // Validar valores monetários
    if (data.value !== undefined && data.value <= 0) {
      log.warn('Valor inválido para link de pagamento', { value: data.value });
      throw new Error('Valor do link de pagamento deve ser maior que zero');
    }
    
    // Validar desconto
    if (data.discount) {
      if (data.discount.value <= 0) {
        log.warn('Valor de desconto inválido', { discount: data.discount });
        throw new Error('Valor do desconto deve ser maior que zero');
      }
      
      if (data.discount.type === 'PERCENTAGE' && data.discount.value > 100) {
        log.warn('Percentual de desconto inválido', { discount: data.discount });
        throw new Error('Percentual de desconto não pode ser maior que 100%');
      }
    }
  }
  
  /**
   * Trata e registra erros de forma consistente
   */
  private handleError(error: any, message: string, data?: any): void {
    log.error(message, error, data);
    
    // Registro detalhado de erros da API do Asaas
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        log.error(`Resposta de erro da API Asaas (${axiosError.response.status})`, null, axiosError.response.data);
      } else if (axiosError.request) {
        log.error('Sem resposta da API Asaas', null, { request: axiosError.request });
      }
    }
  }
  
  /**
   * Formata o erro para retorno ao usuário
   */
  private formatError(error: any, defaultMessage: string): Error {
    let message = defaultMessage;
    let details = null;
    
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.data) {
        // Extrair mensagem de erro da API do Asaas
        if (typeof axiosError.response.data === 'object' && axiosError.response.data.errors) {
          const asaasErrors = axiosError.response.data.errors;
          
          if (Array.isArray(asaasErrors) && asaasErrors.length > 0) {
            message = asaasErrors.map((e: any) => e.description || e.message).join('; ');
            details = asaasErrors;
          }
        }
      }
    }
    
    const formattedError = new Error(message);
    (formattedError as any).details = details;
    return formattedError;
  }
}

// Exporta uma instância única do serviço
export const asaasPaymentLinkService = new AsaasPaymentLinkService();