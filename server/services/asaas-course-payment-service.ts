import axios from 'axios';
import { courses } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// Tipos para o serviço ASAAS
interface AsaasPaymentLinkResponse {
  id: string;
  url: string;
  success: boolean;
  errors?: Array<{
    code: string;
    description: string;
  }>;
}

interface AsaasCreatePaymentLinkData {
  billingType?: string;
  name: string; 
  description?: string;
  value: number;
  endDate?: string;
  dueDateLimitDays?: number;
  maxInstallments?: number | null;
  chargeType?: string;
  notificationEnabled?: boolean;
  subscriptionCycle?: string | null;
  allowCreditCard?: boolean;
  allowBoleto?: boolean;
  allowPix?: boolean;
  callback?: {
    autoRedirect: boolean;
    successUrl: string;
    autoRedirectUrl: string;
  };
}

// Interface para opções de pagamento customizadas
export interface CoursePaymentOption {
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentType: string;
  name: string;
  description: string;
  value: number;
  installments: number;
  installmentValue?: number;
  billingType: string;
}

// Interface para dados necessários para criar um link de pagamento
export interface CoursePaymentLinkData {
  courseId: number;
  courseName: string;
  courseCode: string;
  description: string;
  value: number;
  billingType: string;
  maxInstallments?: number;
  paymentType: string;
  notificationEnabled?: boolean;
  dueDateLimitDays?: number;
  endDate?: string;
}

/**
 * Serviço para gerar links de pagamento para cursos usando a API ASAAS
 */
export interface AsaasImageUploadResponse {
  id: string;
  fileName: string;
  mimeType: string;
  success: boolean;
  errors?: Array<{
    code: string;
    description: string;
  }>;
}

export class AsaasCoursePaymentService {
  private apiUrl: string;
  private accessToken: string;

  constructor() {
    // Usar a nova chave de API de produção fornecida
    const accessToken = process.env.ASAAS_PRODUCTION_KEY || process.env.ASAAS_ZAYN_KEY;
    
    // Forçar o uso do ambiente de produção, independentemente do token
    // A determinação do ambiente baseada no prefixo do token não está funcionando como esperado
    const apiUrl = 'https://api.asaas.com/v3'; // Ambiente de produção com prefixo /v3 conforme documentação
    
    // Mantemos esta variável apenas para logging
    const isProductionToken = accessToken?.startsWith('$aact_prod');

    if (!accessToken) {
      // Log informativo para debug
      console.log('[COURSE PAYMENT SERVICE] Erro: ASAAS_ZAYN_KEY não encontrada');
      console.log('[COURSE PAYMENT SERVICE] Variáveis de ambiente disponíveis:', 
        Object.keys(process.env)
          .filter(k => k.includes('ASAAS'))
          .map(k => `${k}: ${process.env[k] ? '✅ Definida' : '❌ Não definida'}`));
      
      throw new Error('Chave de API Asaas (ASAAS_ZAYN_KEY) não encontrada. Esta chave é necessária para gerar links de pagamento.');
    }

    // Log detalhado para debug
    const tokenSource = process.env.ASAAS_PRODUCTION_KEY ? 'ASAAS_PRODUCTION_KEY' : 'ASAAS_ZAYN_KEY';
    console.log(`[COURSE PAYMENT SERVICE] Utilizando ambiente Asaas ${isProductionToken ? 'produção' : 'sandbox'}:`, apiUrl);
    console.log(`[COURSE PAYMENT SERVICE] Usando token ${tokenSource}:`, accessToken.substring(0, 10) + '...');
    console.log(`[COURSE PAYMENT SERVICE] Verificação do token: ${accessToken?.startsWith('$aact_prod') ? 'Token de produção detectado' : 'Token sandbox detectado'}`);
    

    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
  }

  /**
   * Retorna o token de API utilizado para as requisições à API Asaas
   * @returns O token de acesso utilizado pelo serviço
   */
  getApiToken(): string {
    return this.accessToken;
  }

  /**
   * Gera um link de pagamento para um curso específico
   */
  async generatePaymentLinkForCourse(courseId: number): Promise<{ paymentLinkId: string; paymentLinkUrl: string }> {
    try {
      // Buscar dados do curso no banco
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });

      if (!course) {
        throw new Error(`Curso com ID ${courseId} não encontrado`);
      }

      if (!course.price) {
        throw new Error(`Curso com ID ${courseId} não possui preço definido`);
      }

      // Formatando de acordo com a documentação oficial da Asaas
      // https://docs.asaas.com/reference/criar-um-link-de-pagamentos
      
      // Gerar um ExternalReference padronizado no formato EDU-{courseId}-{timestamp}
      // Usamos um timestamp como placeholder até termos o ID do link de pagamento
      const timestamp = new Date().getTime();
      const externalReference = `EDU-${courseId}-${timestamp}`;
      
      const data = {
        name: `Matrícula para o curso ${course.name}`,
        description: `Inscrição no curso ${course.name}`,
        endDate: (() => {
          // Calcular data de expiração (1 ano a partir de agora)
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          return expirationDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
        })(),
        value: course.price,
        // Usando os 3 parâmetros de forma explícita para permitir todos os métodos de pagamento
        allowBoleto: true,
        allowPix: true, 
        allowCreditCard: true,
        chargeType: 'DETACHED', // Link independente (não associado a um cliente específico)
        dueDateLimitDays: 30, // Pagamento expira após 30 dias
        subscriptionCycle: null,
        maxInstallments: 12,
        notificationEnabled: true,
        externalReference: externalReference, // Referência externa padronizada para rastreamento
        callback: {
          autoRedirect: true,
          successUrl: `${process.env.REPLIT_DEV_DOMAIN || 'https://app.edu.ai'}/payment-success`,
          autoRedirectUrl: `${process.env.REPLIT_DEV_DOMAIN || 'https://app.edu.ai'}/payment-success`
        }
      };

      console.log('Gerando link de pagamento para o curso:', {
        courseId,
        courseName: course.name,
        price: course.price
      });

      // Fazer requisição para a API do Asaas
      console.log(`[DEBUG] URL completa da requisição: ${this.apiUrl}/paymentLinks`);
      console.log(`[DEBUG] Headers da requisição:`, {
        'Content-Type': 'application/json',
        'access_token': this.accessToken.substring(0, 10) + '...'
      });
      console.log(`[DEBUG] Dados da requisição:`, JSON.stringify(data, null, 2));
      
      const response = await axios.post<AsaasPaymentLinkResponse>(
        `${this.apiUrl}/paymentLinks`, 
        data, 
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.accessToken
          }
        }
      );

      // Verificar se houve erros
      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(`Erro ao gerar link de pagamento: ${response.data.errors[0].description}`);
      }

      if (!response.data.id || !response.data.url) {
        throw new Error('Resposta inválida da API Asaas');
      }

      // Atualizar o curso com o link gerado
      await db.update(courses)
        .set({
          paymentLinkId: response.data.id,
          paymentLinkUrl: response.data.url,
          updatedAt: new Date()
        })
        .where(eq(courses.id, courseId));

      console.log('Link de pagamento gerado com sucesso:', {
        courseId,
        paymentLinkId: response.data.id,
        paymentLinkUrl: response.data.url
      });

      return {
        paymentLinkId: response.data.id,
        paymentLinkUrl: response.data.url
      };
    } catch (error) {
      console.error('Erro ao gerar link de pagamento para curso:', error);
      throw error;
    }
  }

  /**
   * Obtém um link de pagamento para um curso, gerando um novo se necessário
   */
  async getOrCreatePaymentLinkForCourse(courseId: number): Promise<{ paymentLinkId: string; paymentLinkUrl: string }> {
    try {
      // Buscar dados do curso
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });

      if (!course) {
        throw new Error(`Curso com ID ${courseId} não encontrado`);
      }

      // Se já existe um link de pagamento, retornar
      if (course.paymentLinkId && course.paymentLinkUrl) {
        return {
          paymentLinkId: course.paymentLinkId,
          paymentLinkUrl: course.paymentLinkUrl
        };
      }

      // Caso contrário, gerar um novo link
      return this.generatePaymentLinkForCourse(courseId);
    } catch (error) {
      console.error('Erro ao obter ou criar link de pagamento:', error);
      throw error;
    }
  }

  /**
   * Cria um link de pagamento personalizado com as configurações especificadas
   * @param paymentData Dados para criação do link de pagamento
   */
  async createCustomPaymentLink(paymentData: CoursePaymentLinkData): Promise<{ paymentLinkId: string; paymentLinkUrl: string }> {
    try {
      console.log('Criando link de pagamento personalizado:', paymentData);

      // Formatando de acordo com a documentação oficial da Asaas
      // https://docs.asaas.com/reference/criar-um-link-de-pagamentos
      
      // Configurar os permite métodos de pagamento com base no billingType
      let allowBoleto = true;
      let allowPix = true;
      let allowCreditCard = false;
      
      // Se billingType está definido, configurar os allow* com base nele
      if (paymentData.billingType) {
        if (paymentData.billingType === 'CREDIT_CARD') {
          allowBoleto = false;
          allowPix = false;
          allowCreditCard = true;
        } else if (paymentData.billingType === 'BOLETO') {
          allowBoleto = true;
          allowPix = false;
          allowCreditCard = false;
        } else if (paymentData.billingType === 'PIX') {
          allowBoleto = false;
          allowPix = true;
          allowCreditCard = false;
        } else if (paymentData.billingType === 'BOLETO,PIX' || paymentData.billingType.includes('BOLETO') && paymentData.billingType.includes('PIX')) {
          allowBoleto = true;
          allowPix = true;
          allowCreditCard = false;
        }
      }
      
      // Gerar um ExternalReference padronizado no formato EDU-{courseId}-{timestamp}
      // Usamos um timestamp como placeholder até termos o ID do link de pagamento
      const timestamp = new Date().getTime();
      const externalReference = `EDU-${paymentData.courseId}-${timestamp}`;
      
      const data = {
        name: `${paymentData.paymentType} - ${paymentData.courseName}`,
        description: paymentData.description,
        endDate: (() => {
          // Calcular data de expiração (1 ano a partir de agora)
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
          return expirationDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
        })(),
        value: paymentData.value,
        // Usar os flags ao invés do billingType
        allowBoleto,
        allowPix,
        allowCreditCard,
        chargeType: 'DETACHED', // Link independente (não associado a um cliente específico)
        dueDateLimitDays: 30, // Pagamento expira após 30 dias
        subscriptionCycle: null,
        maxInstallments: paymentData.maxInstallments || null,
        notificationEnabled: true,
        externalReference: externalReference // Referência externa padronizada para rastreamento
      };

      console.log('[DEBUG] Enviando requisição para Asaas:', {
        url: `${this.apiUrl}/paymentLinks`,
        token: this.accessToken.substring(0, 10) + '...',
        data
      });

      // Fazer requisição para a API do Asaas
      try {
        const response = await axios.post<AsaasPaymentLinkResponse>(
          `${this.apiUrl}/paymentLinks`, 
          data, 
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': this.accessToken
            }
          }
        );

        console.log('[DEBUG] Resposta da API Asaas:', {
          status: response.status,
          data: response.data
        });

        // Verificar se houve erros
        if (response.data.errors && response.data.errors.length > 0) {
          throw new Error(`Erro ao gerar link de pagamento: ${response.data.errors[0].description}`);
        }

        if (!response.data.id || !response.data.url) {
          throw new Error('Resposta inválida da API Asaas');
        }

        console.log('Link de pagamento personalizado gerado com sucesso:', {
          courseId: paymentData.courseId,
          paymentType: paymentData.paymentType,
          paymentLinkId: response.data.id,
          paymentLinkUrl: response.data.url
        });

        return {
          paymentLinkId: response.data.id,
          paymentLinkUrl: response.data.url
        };
      } catch (axiosError) {
        console.error('[DEBUG] Erro na requisição Axios:', {
          message: axiosError.message,
          response: axiosError.response ? {
            status: axiosError.response.status,
            data: axiosError.response.data
          } : 'Sem resposta',
          request: axiosError.request ? 'Request enviado' : 'Erro antes da requisição'
        });
        throw axiosError;
      }
    } catch (error) {
      console.error('Erro ao gerar link de pagamento personalizado:', error);
      throw error;
    }
  }

  /**
   * Gera três links de pagamento padrão para cursos de pós-graduação:
   * 1. Boleto/PIX parcelado: R$ 1.118,40 em 16x de R$ 69,90
   * 2. Cartão de Crédito: R$ 899,00 em até 10x sem juros
   * 3. Boleto/PIX à vista: R$ 799,00
   */
  async generateStandardPostGradPaymentLinks(courseId: number): Promise<CoursePaymentOption[]> {
    try {
      console.log(`[DEBUG] Iniciando geração de links de pagamento padrão para curso ID ${courseId}`);
      
      // Buscar dados do curso
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });

      if (!course) {
        throw new Error(`Curso com ID ${courseId} não encontrado`);
      }

      console.log(`[DEBUG] Dados do curso encontrados:`, {
        id: course.id,
        code: course.code,
        name: course.name
      });

      const paymentOptions: CoursePaymentOption[] = [];

      try {
        console.log('[DEBUG] Gerando link para Boleto/PIX parcelado...');
        // 1. Boleto/PIX parcelado: R$ 1.118,40 em 16x de R$ 69,90
        const boletoInstallmentLink = await this.createCustomPaymentLink({
          courseId,
          courseCode: course.code,
          courseName: course.name,
          description: `Matrícula no curso ${course.name} via boleto ou PIX em até 16x de R$ 69,90`,
          value: 1118.40,
          billingType: '', // Vazio para usar os parâmetros allow*
          maxInstallments: 16,
          paymentType: 'Parcelado Boleto/PIX'
        });

        paymentOptions.push({
          paymentLinkId: boletoInstallmentLink.paymentLinkId,
          paymentLinkUrl: boletoInstallmentLink.paymentLinkUrl,
          paymentType: 'Parcelado Boleto/PIX',
          name: `Boleto/PIX - ${course.name}`,
          description: 'Pagamento parcelado em até 16x',
          value: 1118.40,
          installments: 16,
          installmentValue: 69.90,
          billingType: 'BOLETO,PIX'
        });
      } catch (error) {
        console.error('[DEBUG] Erro ao gerar link para Boleto/PIX parcelado:', error);
        // Continuar com as outras opções mesmo se esta falhar
      }

      try {
        console.log('[DEBUG] Gerando link para Cartão de Crédito...');
        // 2. Cartão de Crédito: R$ 899,00 em até 10x sem juros
        const creditCardLink = await this.createCustomPaymentLink({
          courseId,
          courseCode: course.code,
          courseName: course.name,
          description: `Matrícula no curso ${course.name} via cartão de crédito em até 10x sem juros`,
          value: 899.00,
          billingType: 'CREDIT_CARD',
          maxInstallments: 10,
          paymentType: 'Cartão de Crédito'
        });

        paymentOptions.push({
          paymentLinkId: creditCardLink.paymentLinkId,
          paymentLinkUrl: creditCardLink.paymentLinkUrl,
          paymentType: 'Cartão de Crédito',
          name: `Cartão de Crédito - ${course.name}`,
          description: 'Pagamento em até 10x sem juros',
          value: 899.00,
          installments: 10,
          billingType: 'CREDIT_CARD'
        });
      } catch (error) {
        console.error('[DEBUG] Erro ao gerar link para Cartão de Crédito:', error);
        // Continuar com as outras opções mesmo se esta falhar
      }

      try {
        console.log('[DEBUG] Gerando link para Boleto/PIX à vista...');
        // 3. Boleto/PIX à vista: R$ 799,00
        const boletoSingleLink = await this.createCustomPaymentLink({
          courseId,
          courseCode: course.code,
          courseName: course.name,
          description: `Matrícula no curso ${course.name} com desconto via boleto ou PIX à vista`,
          value: 799.00,
          billingType: '', // Vazio para usar os parâmetros allow*
          paymentType: 'À Vista Boleto/PIX'
        });

        paymentOptions.push({
          paymentLinkId: boletoSingleLink.paymentLinkId,
          paymentLinkUrl: boletoSingleLink.paymentLinkUrl,
          paymentType: 'À Vista Boleto/PIX',
          name: `Boleto/PIX à Vista - ${course.name}`,
          description: 'Pagamento com desconto à vista',
          value: 799.00,
          installments: 1,
          billingType: 'BOLETO,PIX'
        });
      } catch (error) {
        console.error('[DEBUG] Erro ao gerar link para Boleto/PIX à vista:', error);
        // Continuar com as outras opções mesmo se esta falhar
      }

      // Só atualiza o banco se conseguiu gerar pelo menos um link
      if (paymentOptions.length > 0) {
        console.log(`[DEBUG] Atualizando banco de dados com ${paymentOptions.length} links gerados`);
        
        // Atualizar o curso com todas as opções de pagamento
        await db.update(courses)
          .set({
            paymentOptions: JSON.stringify(paymentOptions),
            updatedAt: new Date()
          })
          .where(eq(courses.id, courseId));

        console.log(`${paymentOptions.length} links de pagamento gerados com sucesso para o curso ID ${courseId}`);
      } else {
        console.error(`Nenhum link de pagamento foi gerado com sucesso para o curso ID ${courseId}`);
      }

      return paymentOptions;
    } catch (error) {
      console.error('Erro ao gerar links de pagamento padrão:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma imagem a um link de pagamento
   * @param paymentLinkId ID do link de pagamento
   * @param imageBuffer Buffer da imagem a ser enviada
   * @param filename Nome original do arquivo
   * @param mimeType Tipo MIME da imagem
   */
  async addImageToPaymentLink(
    paymentLinkId: string, 
    imageBuffer: Buffer, 
    filename: string, 
    mimeType: string
  ): Promise<{ success: boolean; id?: string; message?: string }> {
    try {
      if (!paymentLinkId) {
        throw new Error('ID do link de pagamento é obrigatório');
      }
      
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Imagem inválida');
      }
      
      // Verificar se o tipo MIME é suportado (apenas imagens)
      if (!mimeType.match(/^image\/(jpeg|jpg|png)$/)) {
        throw new Error('Tipo de arquivo não suportado. Apenas imagens JPG e PNG são aceitas.');
      }
      
      console.log('[DEBUG] Iniciando upload de imagem para o link de pagamento:', {
        paymentLinkId,
        filename,
        mimeType,
        imageSize: imageBuffer.length
      });
      
      // Criar um FormData para enviar o arquivo
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename,
        contentType: mimeType
      });
      
      // Enviar requisição para a API Asaas
      // Endpoint de acordo com a documentação: https://docs.asaas.com/reference/adicionar-uma-imagem-a-um-link-de-pagamentos
      const response = await axios.post<AsaasImageUploadResponse>(
        `${this.apiUrl}/paymentLinks/${paymentLinkId}/images`,
        form,
        {
          headers: {
            'access_token': this.accessToken,
            ...form.getHeaders()
          }
        }
      );
      
      // Verificar se houve erros
      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(`Erro ao adicionar imagem: ${response.data.errors[0].description}`);
      }
      
      if (!response.data.id) {
        throw new Error('Resposta inválida da API Asaas');
      }
      
      console.log('[DEBUG] Imagem adicionada com sucesso:', {
        paymentLinkId,
        imageId: response.data.id
      });
      
      return {
        success: true,
        id: response.data.id
      };
    } catch (error) {
      console.error('[DEBUG] Erro ao adicionar imagem ao link de pagamento:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao adicionar imagem'
      };
    }
  }
  
  /**
   * Remove um link de pagamento
   * @param paymentLinkId ID do link de pagamento a ser removido
   */
  async deletePaymentLink(paymentLinkId: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!paymentLinkId) {
        throw new Error('ID do link de pagamento é obrigatório');
      }
      
      console.log('[DEBUG] Iniciando remoção do link de pagamento:', paymentLinkId);
      
      // Enviar requisição para a API Asaas
      // Endpoint de acordo com a documentação: https://docs.asaas.com/reference/remover-um-link-de-pagamentos
      const response = await axios.delete(
        `${this.apiUrl}/paymentLinks/${paymentLinkId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.accessToken
          }
        }
      );
      
      console.log('[DEBUG] Link de pagamento removido com sucesso:', {
        paymentLinkId,
        status: response.status
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('[DEBUG] Erro ao remover link de pagamento:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao remover link de pagamento'
      };
    }
  }
  
  /**
   * Obtém as opções de pagamento armazenadas para um curso
   */
  async getPaymentOptions(courseId: number): Promise<CoursePaymentOption[]> {
    try {
      // Buscar dados do curso
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId)
      });

      if (!course) {
        throw new Error(`Curso com ID ${courseId} não encontrado`);
      }

      // Se tiver opções de pagamento, retornar
      if (course.paymentOptions) {
        try {
          const options = JSON.parse(course.paymentOptions);
          return Array.isArray(options) ? options : [];
        } catch (e) {
          console.error('Erro ao fazer parse das opções de pagamento:', e);
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('Erro ao obter opções de pagamento:', error);
      return [];
    }
  }
}

// Exportar uma instância única do serviço
export const asaasCoursePaymentService = new AsaasCoursePaymentService();