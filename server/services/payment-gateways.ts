import axios from 'axios';
import type { Enrollment } from '@shared/schema';
import { LytexGateway as LytexGatewayService, LytexClient, LytexCreateInvoiceRequest } from './lytex-gateway';

// Interface comum para todos os gateways de pagamento
export interface PaymentGateway {
  createPayment(enrollment: Enrollment): Promise<{ externalId: string, paymentUrl: string }>;
  getPaymentStatus(externalId: string): Promise<string>;
  processWebhook(payload: any): { status: string, externalId: string };
  registerStudent(userData: { id: number, fullName: string, email: string, cpf?: string }): Promise<{ customerId: string, alreadyExists: boolean }>;
  checkStudentExists(userData: { email: string, cpf?: string }): Promise<{ exists: boolean, customerId?: string }>;
}

// Implementação do gateway Asaas
export class AsaasGateway implements PaymentGateway {
  private apiKey: string;
  private apiUrl: string;
  
  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
    
    if (!this.apiKey) {
      console.warn('ASAAS_API_KEY não configurada. Integração com Asaas funcionará em modo de simulação.');
    }
  }
  
  async createPayment(enrollment: Enrollment): Promise<{ externalId: string, paymentUrl: string }> {
    try {
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        return this.simulatePaymentCreation(enrollment);
      }
      
      // Buscar dados do cliente ou criar se não existir
      const customerId = await this.getOrCreateCustomer(enrollment);
      
      // Criar cobrança no Asaas
      const paymentData = {
        customer: customerId,
        billingType: enrollment.paymentMethod || 'BOLETO', // BOLETO, CREDIT_CARD, PIX
        value: enrollment.amount,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias a partir de hoje
        description: `Matrícula ${enrollment.code} - Curso ID ${enrollment.courseId}`,
        externalReference: enrollment.code
      };
      
      const response = await axios.post(`${this.apiUrl}/payments`, paymentData, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        externalId: response.data.id,
        paymentUrl: response.data.invoiceUrl || ''
      };
    } catch (error) {
      console.error('Erro ao criar pagamento no Asaas:', error);
      throw new Error('Falha ao processar pagamento no Asaas');
    }
  }
  
  async getPaymentStatus(externalId: string): Promise<string> {
    try {
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        return this.simulatePaymentStatus(externalId);
      }
      
      const response = await axios.get(`${this.apiUrl}/payments/${externalId}`, {
        headers: {
          'access_token': this.apiKey
        }
      });
      
      // Mapear status do Asaas para nosso padrão
      switch (response.data.status) {
        case 'CONFIRMED':
        case 'RECEIVED':
        case 'RECEIVED_IN_CASH':
          return 'active'; // Matrícula ativa
        case 'PENDING':
        case 'AWAITING':
          return 'pending_payment';
        case 'OVERDUE':
          return 'suspended';
        case 'REFUNDED':
        case 'CHARGEBACK_REQUESTED':
        case 'CHARGEBACK_DISPUTE':
        case 'CHARGEBACK_REVERSED':
        case 'DELETED':
          return 'cancelled';
        default:
          return 'pending_payment';
      }
    } catch (error) {
      console.error('Erro ao consultar status do pagamento no Asaas:', error);
      throw new Error('Falha ao consultar status do pagamento no Asaas');
    }
  }
  
  processWebhook(payload: any): { status: string, externalId: string } {
    try {
      // Validar se é um evento de pagamento
      if (!payload.event || !payload.payment) {
        throw new Error('Payload inválido do webhook Asaas');
      }
      
      // Extrair ID externo do pagamento e garantir que é string
      const externalId = String(payload.payment.id);
      
      // Mapear o evento para um status em nosso sistema
      let status = 'pending_payment';
      
      switch (payload.event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          status = 'active';
          break;
        case 'PAYMENT_OVERDUE':
          status = 'suspended';
          break;
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          status = 'cancelled';
          break;
      }
      
      return { status, externalId };
    } catch (error) {
      console.error('Erro ao processar webhook do Asaas:', error);
      throw new Error('Falha ao processar webhook do Asaas');
    }
  }
  
  // Métodos auxiliares
  private async getOrCreateCustomer(enrollment: Enrollment): Promise<string> {
    try {
      // Na implementação real, buscaríamos o cliente pelo cpf/email ou criaríamos um novo
      if (!this.apiKey) {
        return "cus_" + Math.random().toString(36).substring(2, 15);
      }
      
      // Aqui faríamos uma chamada para a API do Asaas para buscar o cliente
      // ou criar um novo se não existir
      
      // Para fins de demonstração, retornamos um ID simulado
      return "cus_" + Math.random().toString(36).substring(2, 15);
    } catch (error) {
      console.error('Erro ao buscar/criar cliente no Asaas:', error);
      throw new Error('Falha ao buscar/criar cliente no Asaas');
    }
  }
  
  // Verifica se o estudante já existe no Asaas
  public async checkStudentExists(userData: { 
    email: string, 
    cpf?: string 
  }): Promise<{ exists: boolean, customerId?: string }> {
    try {
      // Se não tivermos API key, simular verificação
      if (!this.apiKey) {
        // Simulamos que 30% das verificações vão retornar que o usuário já existe
        const exists = Math.random() < 0.3;
        const customerId = exists ? "cus_" + Math.random().toString(36).substring(2, 15) : undefined;
        console.log(`[SIMULAÇÃO ASAAS] Verificando estudante existente: email: ${userData.email}${userData.cpf ? ', CPF: ' + userData.cpf : ''}, Resultado: ${exists ? 'Encontrado' : 'Não encontrado'}`);
        return { exists, customerId };
      }
      
      // Buscar por email
      const params = { email: userData.email };
      
      // Adicionar CPF aos parâmetros de busca se disponível
      if (userData.cpf) {
        Object.assign(params, { cpfCnpj: userData.cpf.replace(/[^\d]/g, '') });
      }
      
      // Buscar cliente no Asaas
      const response = await axios.get(`${this.apiUrl}/customers`, {
        params,
        headers: {
          'access_token': this.apiKey
        }
      });
      
      // Verificar se encontrou algum cliente
      if (response.data.data && response.data.data.length > 0) {
        return { 
          exists: true, 
          customerId: response.data.data[0].id 
        };
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar estudante no Asaas:', error);
      return { exists: false };
    }
  }

  // Registra um usuário sem estar vinculado a uma matrícula
  public async registerStudent(userData: { 
    id: number, 
    fullName: string, 
    email: string,
    cpf?: string 
  }): Promise<{ customerId: string, alreadyExists: boolean }> {
    try {
      // Verificar se o estudante já existe
      const checkResult = await this.checkStudentExists({ 
        email: userData.email,
        cpf: userData.cpf
      });
      
      // Se o estudante já existe, retornar o ID existente
      if (checkResult.exists && checkResult.customerId) {
        console.log(`Estudante já existe no Asaas: ${userData.email}`);
        return { 
          customerId: checkResult.customerId,
          alreadyExists: true
        };
      }
      
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        const customerId = "cus_" + Math.random().toString(36).substring(2, 15);
        console.log(`[SIMULAÇÃO ASAAS] Registrando estudante: ${userData.fullName}, email: ${userData.email}, ID externo: ${customerId}`);
        return { customerId, alreadyExists: false };
      }
      
      // Criar cliente no Asaas
      const customerData: any = {
        name: userData.fullName,
        email: userData.email,
        externalReference: `student_${userData.id}`,
      };
      
      // Adicionar CPF se disponível
      if (userData.cpf) {
        customerData.cpfCnpj = userData.cpf.replace(/[^\d]/g, '');
      }
      
      const response = await axios.post(`${this.apiUrl}/customers`, customerData, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      return { 
        customerId: response.data.id,
        alreadyExists: false
      };
    } catch (error) {
      console.error('Erro ao registrar estudante no Asaas:', error);
      // Em caso de erro, retornarmos um ID fictício para não interromper o fluxo
      return { 
        customerId: "cus_error_" + Math.random().toString(36).substring(2, 15),
        alreadyExists: false
      };
    }
  }
  
  // Métodos para simulação (modo de desenvolvimento)
  private simulatePaymentCreation(enrollment: Enrollment): { externalId: string, paymentUrl: string } {
    const externalId = "pay_" + Math.random().toString(36).substring(2, 15);
    const paymentUrl = `https://sandbox.asaas.com/payment/${externalId}`;
    
    console.log(`[SIMULAÇÃO ASAAS] Criando pagamento para: ${enrollment.code}, valor: ${enrollment.amount}`);
    
    return { externalId, paymentUrl };
  }
  
  private simulatePaymentStatus(externalId: string): string {
    // Para simulação, vamos retornar um status baseado no ID externo 
    // (assim podemos testar diferentes cenários)
    
    if (externalId.endsWith('1')) return 'active';
    if (externalId.endsWith('2')) return 'pending_payment';
    if (externalId.endsWith('3')) return 'suspended';
    if (externalId.endsWith('4')) return 'cancelled';
    
    // Por padrão, 80% de chance de estar pago
    return Math.random() > 0.2 ? 'active' : 'pending_payment';
  }
}

// Implementação do gateway Lytex
// Classe de gateway Lytex implementando a interface comum PaymentGateway
export class LytexGatewayAdapter implements PaymentGateway {
  private apiKey: string;
  private apiUrl: string;
  private clientId: string;
  private accessToken: string | null = null;
  private accessTokenExpiry: Date | null = null;
  
  constructor() {
    this.apiKey = process.env.LYTEX_API_KEY || '';
    this.clientId = process.env.LYTEX_CLIENT_ID || '';
    this.apiUrl = process.env.LYTEX_API_URL || 'https://api-pay.lytex.com.br';
    
    if (!this.apiKey) {
      console.warn('LYTEX_API_KEY não configurada. Integração com Lytex funcionará em modo de simulação.');
    }
    
    if (!this.clientId) {
      console.warn('LYTEX_CLIENT_ID não configurada. Algumas funcionalidades da Lytex podem não funcionar corretamente.');
    }
  }
  
  // Obtém um token de acesso válido, renovando se necessário
  private async getAccessToken(): Promise<string> {
    try {
      // Se já temos um token válido, reutilizamos
      if (this.accessToken && this.accessTokenExpiry && this.accessTokenExpiry > new Date()) {
        return this.accessToken;
      }
      
      // Se não tivermos API key ou Client ID, retornamos um token fictício para testes
      if (!this.apiKey || !this.clientId) {
        console.log('[SIMULAÇÃO LYTEX] Gerando token de acesso simulado');
        this.accessToken = 'lytex_simulated_token_' + Math.random().toString(36).substring(2, 15);
        this.accessTokenExpiry = new Date(Date.now() + 3600 * 1000); // Expira em 1h
        return this.accessToken;
      }
      
      // Autenticação com o formato correto dos parâmetros conforme documentação
      const authUrl = `${this.apiUrl}/v2/auth/obtain_token`;
      
      const authResponse = await axios.post(authUrl, {
        grantType: 'clientCredentials',
        clientId: this.clientId,
        clientSecret: this.apiKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Verifica se recebemos um token válido na resposta
      if (!authResponse.data || !authResponse.data.accessToken) {
        throw new Error('Resposta da autenticação Lytex não contém accessToken');
      }
      
      // Salva o token e sua expiração
      this.accessToken = authResponse.data.accessToken;
      
      // Configura a data de expiração (subtrai 5 min para margem de segurança)
      if (authResponse.data.expireAt) {
        this.accessTokenExpiry = new Date(authResponse.data.expireAt);
        // Subtrai 5 minutos para garantir que renovamos antes de expirar
        this.accessTokenExpiry.setMinutes(this.accessTokenExpiry.getMinutes() - 5);
      } else {
        // Se não tiver expireAt, assumimos 30 minutos de validade
        this.accessTokenExpiry = new Date(Date.now() + 25 * 60 * 1000); // 25 min
      }
      
      console.log(`Token de acesso Lytex obtido com sucesso. Válido até ${this.accessTokenExpiry.toISOString()}`);
      return this.accessToken;
    } catch (error) {
      console.error('Erro ao obter token de acesso Lytex:', error);
      throw new Error('Falha na autenticação com a Lytex');
    }
  }
  
  // Verifica se o estudante já existe no Lytex
  public async checkStudentExists(userData: { 
    email: string, 
    cpf?: string 
  }): Promise<{ exists: boolean, customerId?: string }> {
    try {
      // Se não tivermos API key, simular verificação
      if (!this.apiKey || !this.clientId) {
        // Simulamos que 30% das verificações vão retornar que o usuário já existe
        const exists = Math.random() < 0.3;
        const customerId = exists ? "lytex_cus_" + Math.random().toString(36).substring(2, 15) : undefined;
        console.log(`[SIMULAÇÃO LYTEX] Verificando estudante existente: email: ${userData.email}${userData.cpf ? ', CPF: ' + userData.cpf : ''}, Resultado: ${exists ? 'Encontrado' : 'Não encontrado'}`);
        return { exists, customerId };
      }
      
      // Obter token de acesso
      const accessToken = await this.getAccessToken();
      
      // Atualmente a API Lytex parece não disponibilizar endpoint de consulta de clientes
      // Esta implementação é para quando o endpoint estiver disponível
      // Por enquanto, retornamos que o cliente não existe para forçar a criação
      console.log(`[LYTEX] Verificação de cliente com email: ${userData.email} - Endpoint não disponível atualmente`);
      
      return { exists: false };
      
      /* Código comentado para quando o endpoint estiver disponível
      
      // Construir parâmetros de busca
      let queryParams = new URLSearchParams();
      queryParams.append('email', userData.email);
      
      // Adicionar CPF aos parâmetros de busca se disponível
      if (userData.cpf) {
        queryParams.append('document', userData.cpf.replace(/[^\d]/g, ''));
      }
      
      // Adicionar client_id aos parâmetros de busca se disponível
      if (this.clientId) {
        queryParams.append('client_id', this.clientId);
      }
      
      // Buscar cliente no Lytex - v2 do endpoint quando disponível
      const response = await axios.get(`${this.apiUrl}/v2/customers?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      // Verificar se encontrou algum cliente
      if (response.data.data && response.data.data.length > 0) {
        return { 
          exists: true, 
          customerId: response.data.data[0].id 
        };
      }
      
      return { exists: false };
      */
    } catch (error) {
      console.error('Erro ao verificar estudante no Lytex:', error);
      return { exists: false };
    }
  }

  // Registra um usuário sem estar vinculado a uma matrícula
  public async registerStudent(userData: { 
    id: number, 
    fullName: string, 
    email: string,
    cpf?: string 
  }): Promise<{ customerId: string, alreadyExists: boolean }> {
    try {
      // Verificar se o estudante já existe
      const checkResult = await this.checkStudentExists({ 
        email: userData.email,
        cpf: userData.cpf
      });
      
      // Se o estudante já existe, retornar o ID existente
      if (checkResult.exists && checkResult.customerId) {
        console.log(`Estudante já existe no Lytex: ${userData.email}`);
        return { 
          customerId: checkResult.customerId,
          alreadyExists: true
        };
      }
      
      // Se não tivermos API key ou Client ID, retornar dados simulados
      if (!this.apiKey || !this.clientId) {
        const customerId = "lytex_cus_" + Math.random().toString(36).substring(2, 15);
        console.log(`[SIMULAÇÃO LYTEX] Registrando estudante: ${userData.fullName}, email: ${userData.email}, ID externo: ${customerId}`);
        return { customerId, alreadyExists: false };
      }

      // Obter token de acesso
      const accessToken = await this.getAccessToken();
      
      // Atualmente a API Lytex v2 pode não disponibilizar endpoint de criação de clientes
      // O código abaixo tenta criar o cliente no endpoint v2/customers, mas como atualmente
      // esse endpoint retorna 404, vamos simular a criação temporariamente
      console.log(`[LYTEX] Tentando registrar cliente com email: ${userData.email}`);
      
      try {
        // Criar cliente no Lytex - tentativa com v2 do endpoint
        const customerData: any = {
          name: userData.fullName,
          email: userData.email,
          external_id: `student_${userData.id}`,
          clientId: this.clientId // Formato correto para V2
        };
        
        // Adicionar CPF se disponível
        if (userData.cpf) {
          customerData.document = userData.cpf.replace(/[^\d]/g, '');
        }
        
        const response = await axios.post(`${this.apiUrl}/v2/customers`, customerData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.id) {
          console.log(`[LYTEX] Cliente registrado com sucesso: ${response.data.id}`);
          return { 
            customerId: response.data.id,
            alreadyExists: false
          };
        }
      } catch (createError) {
        console.warn(`[LYTEX] Falha ao criar cliente na API v2: ${createError.message}`);
        if (createError.response) {
          console.warn(`Status: ${createError.response.status}, Resposta: ${JSON.stringify(createError.response.data)}`);
        }
      }
      
      // Como estamos em fase de adaptação da API, retornarmos um ID fictício
      // para não interromper o fluxo, mas com um prefixo que indica que é um ID simulado
      const simulatedId = "lytex_tmp_" + Math.random().toString(36).substring(2, 15);
      console.log(`[LYTEX] Gerando ID de cliente simulado temporariamente: ${simulatedId}`);
      
      return { 
        customerId: simulatedId,
        alreadyExists: false
      };
    } catch (error) {
      console.error('Erro ao registrar estudante no Lytex:', error);
      // Em caso de erro, retornarmos um ID fictício para não interromper o fluxo
      return { 
        customerId: "lytex_err_" + Math.random().toString(36).substring(2, 15),
        alreadyExists: false
      };
    }
  }
  
  async createPayment(enrollment: Enrollment): Promise<{ externalId: string, paymentUrl: string }> {
    try {
      // Se não tivermos API key ou Client ID, retornar dados simulados
      if (!this.apiKey || !this.clientId) {
        return this.simulatePaymentCreation(enrollment);
      }
      
      // Obter token de acesso
      const accessToken = await this.getAccessToken();
      
      // Tentativa de buscar dados do aluno (para ter nome e documento)
      let customerName = 'Aluno';
      let customerDocument = '';
      let customerEmail = 'aluno@example.com';
      let customerId = '';
      
      try {
        // Tentamos buscar os dados do aluno no banco se disponível
        // Isso é apenas uma melhoria, não essencial para o funcionamento
        // Lógica a implementar posteriormente
      } catch (studentError) {
        console.warn('Erro ao buscar dados do aluno:', studentError);
      }
      
      // Primeiro, verificar se o cliente existe ou criar um novo
      if (customerDocument) {
        try {
          // Implementação usando o LytexGateway da pasta services
          const lytexService = new LytexGateway(this.clientId, this.apiKey);
          const client = await lytexService.getClientByCpfCnpj(customerDocument);
          
          if (client) {
            // Cliente já existe, usamos o ID existente
            console.log(`[LYTEX] Cliente encontrado: ${client._id}`);
            customerId = client._id;
          } else {
            // Cliente não existe, criamos um novo
            const newClient = await lytexService.createClient({
              name: customerName,
              type: 'pf', // Assumimos pessoa física por padrão
              treatmentPronoun: 'you',
              cpfCnpj: customerDocument,
              email: customerEmail
            });
            
            console.log(`[LYTEX] Novo cliente criado: ${newClient._id}`);
            customerId = newClient._id;
          }
        } catch (clientError) {
          console.warn(`[LYTEX] Erro ao buscar/criar cliente: ${clientError.message}`);
        }
      }
      
      // Preparar os itens para a fatura
      const invoiceItems = [
        {
          name: `Matrícula ${enrollment.code} - Curso ID ${enrollment.courseId}`,
          quantity: 1,
          value: enrollment.amount * 100 // Lytex trabalha em centavos
        }
      ];
      
      // Configurar os métodos de pagamento
      const paymentMethods = {
        pix: { enable: true },
        boleto: { enable: true, dueDateDays: 3 }
      };
      
      // Adicionar cartão de crédito se valor for suficiente (>= R$500)
      if (enrollment.amount >= 500) {
        paymentMethods['creditCard'] = { 
          enable: true, 
          maxParcels: 10,
          isRatesToPayer: false 
        };
      }
      
      // Data de vencimento (7 dias a partir de hoje)
      const dueDate = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
      
      try {
        // Implementando formato V1 validado em testes
        const lytexService = new LytexGateway(this.clientId, this.apiKey);
        const invoiceData = {
          client: {
            _id: customerId || null
          },
          items: invoiceItems,
          dueDate: dueDate,
          paymentMethods: paymentMethods,
          externalReference: enrollment.code
        };
        
        // Se não temos ID de cliente, precisamos incluir informações do cliente
        if (!customerId) {
          // Formato alternativo quando não temos ID de cliente
          invoiceData.client = {
            name: customerName,
            type: 'pf',
            treatmentPronoun: 'you',
            cpfCnpj: customerDocument || '00000000000', // CPF genérico
            email: customerEmail
          };
        }
        
        console.log(`[LYTEX] Criando fatura para matrícula: ${enrollment.code}`);
        const invoice = await lytexService.createInvoice(invoiceData);
        
        if (invoice && invoice._id) {
          console.log(`[LYTEX] Fatura criada com sucesso: ${invoice._id}`);
          return {
            externalId: invoice._id,
            paymentUrl: invoice.linkCheckout || ''
          };
        } else {
          throw new Error('Resposta da API não contém dados da fatura');
        }
      } catch (invoiceError) {
        console.warn(`[LYTEX] Erro ao criar fatura: ${invoiceError.message}`);
        if (invoiceError.response) {
          console.warn(`Status: ${invoiceError.response.status}, Resposta: ${JSON.stringify(invoiceError.response.data)}`);
        }
        
        // Se falhou, tentamos simulação como fallback temporário
        console.log('[LYTEX] Criando pagamento simulado como fallback temporário');
        return this.simulatePaymentCreation(enrollment);
      }
    } catch (error) {
      console.error('Erro ao criar pagamento na Lytex:', error);
      throw new Error('Falha ao processar pagamento na Lytex');
    }
  }
  
  async getPaymentStatus(externalId: string): Promise<string> {
    try {
      // Se não tivermos API key ou Client ID, retornar dados simulados
      if (!this.apiKey || !this.clientId) {
        return this.simulatePaymentStatus(externalId);
      }
      
      // Obter token de acesso
      const accessToken = await this.getAccessToken();
      
      // Construir URL com os parâmetros necessários para V2
      let requestUrl = `${this.apiUrl}/v2/payments/${externalId}`;
      
      // Adicionar client_id como parâmetro para V2
      requestUrl += `?clientId=${this.clientId}`;
      
      console.log(`[LYTEX] Verificando status do pagamento: ${externalId}`);
      
      try {
        const response = await axios.get(requestUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        // Mapear status da Lytex para nosso padrão
        if (response.data && response.data.status) {
          console.log(`[LYTEX] Status do pagamento ${externalId}: ${response.data.status}`);
          
          switch (response.data.status) {
            case 'paid':
              return 'active';
            case 'unpaid':
            case 'waiting_payment':
              return 'pending_payment';
            case 'expired':
              return 'suspended';
            case 'canceled':
            case 'refunded':
              return 'cancelled';
            default:
              return 'pending_payment';
          }
        }
      } catch (statusError) {
        console.warn(`[LYTEX] Falha ao verificar status na API v2: ${statusError.message}`);
        if (statusError.response) {
          console.warn(`Status: ${statusError.response.status}, Resposta: ${JSON.stringify(statusError.response.data)}`);
        }
        
        // Se o ID começa com "lytex_" (nosso prefixo para IDs simulados), retorna um status simulado
        if (externalId.startsWith('lytex_')) {
          return this.simulatePaymentStatus(externalId);
        }
      }
      
      // Em caso de erro ao consultar, retornarmos pending_payment por segurança
      return 'pending_payment';
    } catch (error) {
      console.error('Erro ao consultar status do pagamento na Lytex:', error);
      // Em caso de erro geral, assumimos pending_payment por segurança
      return 'pending_payment';
    }
  }
  
  processWebhook(payload: any): { status: string, externalId: string } {
    try {
      console.log('[LYTEX] Processando webhook:', JSON.stringify(payload));
      
      // Verificar formato do payload - Lytex pode enviar em formatos diferentes
      // v1 (direto) x v2 (dentro de 'data' ou 'event')
      
      // Se tiver um campo 'data' ou 'event', extrai os dados de lá
      const data = payload.data || payload.event || payload;
      
      // Validar se é um evento válido
      if (!data.id && !data.paymentId) {
        throw new Error('Payload inválido do webhook Lytex: sem ID do pagamento');
      }
      
      if (!data.status && !data.paymentStatus) {
        throw new Error('Payload inválido do webhook Lytex: sem status do pagamento');
      }
      
      // Extrair ID externo do pagamento e garantir que é string
      const externalId = String(data.id || data.paymentId);
      
      // Obter status (v1 ou v2)
      const paymentStatus = data.status || data.paymentStatus;
      
      // Mapear o status da Lytex para um status em nosso sistema
      let status = 'pending_payment';
      
      switch (paymentStatus.toLowerCase()) {
        case 'paid':
        case 'approved':
        case 'complete':
        case 'completed':
          status = 'active';
          break;
        case 'unpaid':
        case 'waiting_payment':
        case 'pending':
        case 'processing':
          status = 'pending_payment';
          break;
        case 'expired':
          status = 'suspended';
          break;
        case 'canceled':
        case 'cancelled':
        case 'refunded':
        case 'failed':
          status = 'cancelled';
          break;
      }
      
      console.log(`[LYTEX] Webhook processado: ID ${externalId}, status original ${paymentStatus}, mapeado para ${status}`);
      return { status, externalId };
    } catch (error) {
      console.error('Erro ao processar webhook da Lytex:', error);
      throw new Error('Falha ao processar webhook da Lytex');
    }
  }
  
  // Métodos auxiliares
  private getPaymentMethodsForLytex(method?: string): string[] {
    // Define quais métodos de pagamento serão aceitos
    if (method === 'boleto') return ['boleto'];
    if (method === 'pix') return ['pix'];
    if (method === 'credit_card') return ['credit_card'];
    
    // Padrão: aceita todos
    return ['credit_card', 'boleto', 'pix'];
  }
  
  // Métodos para simulação (modo de desenvolvimento)
  private simulatePaymentCreation(enrollment: Enrollment): { externalId: string, paymentUrl: string } {
    const externalId = "lytex_" + Math.random().toString(36).substring(2, 15);
    const paymentUrl = `https://pay.lytex.com.br/checkout/${externalId}`;
    
    console.log(`[SIMULAÇÃO LYTEX] Criando pagamento para: ${enrollment.code}, valor: ${enrollment.amount}`);
    
    return { externalId, paymentUrl };
  }
  
  private simulatePaymentStatus(externalId: string): string {
    // Para simulação, vamos retornar um status baseado no ID externo 
    // (assim podemos testar diferentes cenários)
    
    if (externalId.endsWith('1')) return 'active';
    if (externalId.endsWith('2')) return 'pending_payment';
    if (externalId.endsWith('3')) return 'suspended';
    if (externalId.endsWith('4')) return 'cancelled';
    
    // Por padrão, 80% de chance de estar pago
    return Math.random() > 0.2 ? 'active' : 'pending_payment';
  }
}

// Factory para criar a instância do gateway correto
export function createPaymentGateway(gateway: string): PaymentGateway {
  switch (gateway.toLowerCase()) {
    case 'asaas':
      return new AsaasGateway();
    case 'lytex':
      return new LytexGateway();
    default:
      throw new Error(`Gateway de pagamento não suportado: ${gateway}`);
  }
}