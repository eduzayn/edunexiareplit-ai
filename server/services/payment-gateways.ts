import axios from 'axios';
import type { Enrollment } from '@shared/schema';

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
export class LytexGateway implements PaymentGateway {
  private apiKey: string;
  private apiUrl: string;
  private clientId: string;
  
  constructor() {
    this.apiKey = process.env.LYTEX_API_KEY || '';
    this.clientId = process.env.LYTEX_CLIENT_ID || '';
    this.apiUrl = process.env.LYTEX_API_URL || 'https://api.lytex.com.br/api/v2';
    
    if (!this.apiKey) {
      console.warn('LYTEX_API_KEY não configurada. Integração com Lytex funcionará em modo de simulação.');
    }
    
    if (!this.clientId) {
      console.warn('LYTEX_CLIENT_ID não configurada. Algumas funcionalidades da Lytex podem não funcionar corretamente.');
    }
  }
  
  // Verifica se o estudante já existe no Lytex
  public async checkStudentExists(userData: { 
    email: string, 
    cpf?: string 
  }): Promise<{ exists: boolean, customerId?: string }> {
    try {
      // Se não tivermos API key, simular verificação
      if (!this.apiKey) {
        // Simulamos que 30% das verificações vão retornar que o usuário já existe
        const exists = Math.random() < 0.3;
        const customerId = exists ? "lytex_cus_" + Math.random().toString(36).substring(2, 15) : undefined;
        console.log(`[SIMULAÇÃO LYTEX] Verificando estudante existente: email: ${userData.email}${userData.cpf ? ', CPF: ' + userData.cpf : ''}, Resultado: ${exists ? 'Encontrado' : 'Não encontrado'}`);
        return { exists, customerId };
      }
      
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
      
      // Buscar cliente no Lytex
      const response = await axios.get(`${this.apiUrl}/customers?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
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
      
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        const customerId = "lytex_cus_" + Math.random().toString(36).substring(2, 15);
        console.log(`[SIMULAÇÃO LYTEX] Registrando estudante: ${userData.fullName}, email: ${userData.email}, ID externo: ${customerId}`);
        return { customerId, alreadyExists: false };
      }
      
      // Criar cliente no Lytex
      const customerData: any = {
        name: userData.fullName,
        email: userData.email,
        external_id: `student_${userData.id}`,
        client_id: this.clientId // Adicionar o client_id nos dados do cliente
      };
      
      // Adicionar CPF se disponível
      if (userData.cpf) {
        customerData.document = userData.cpf.replace(/[^\d]/g, '');
      }
      
      const response = await axios.post(`${this.apiUrl}/customers`, customerData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return { 
        customerId: response.data.id,
        alreadyExists: false
      };
    } catch (error) {
      console.error('Erro ao registrar estudante no Lytex:', error);
      // Em caso de erro, retornarmos um ID fictício para não interromper o fluxo
      return { 
        customerId: "lytex_cus_error_" + Math.random().toString(36).substring(2, 15),
        alreadyExists: false
      };
    }
  }
  
  async createPayment(enrollment: Enrollment): Promise<{ externalId: string, paymentUrl: string }> {
    try {
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        return this.simulatePaymentCreation(enrollment);
      }
      
      // Estrutura da requisição para a Lytex (baseado na documentação)
      const paymentData = {
        amount: enrollment.amount * 100, // Lytex trabalha em centavos
        description: `Matrícula ${enrollment.code} - Curso ID ${enrollment.courseId}`,
        order_id: enrollment.code,
        payment_methods: this.getPaymentMethodsForLytex(enrollment.paymentMethod || undefined),
        customer: {
          name: 'Nome do Aluno', // Na implementação real, buscaríamos esses dados
          document: '12345678900',
          email: 'aluno@example.com'
        },
        notification_url: `${process.env.APP_URL}/api/webhooks/lytex`,
        client_id: this.clientId // Usar o Client ID na requisição
      };
      
      const response = await axios.post(`${this.apiUrl}/payments`, paymentData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        externalId: response.data.id,
        paymentUrl: response.data.checkout_url || ''
      };
    } catch (error) {
      console.error('Erro ao criar pagamento na Lytex:', error);
      throw new Error('Falha ao processar pagamento na Lytex');
    }
  }
  
  async getPaymentStatus(externalId: string): Promise<string> {
    try {
      // Se não tivermos API key, retornar dados simulados
      if (!this.apiKey) {
        return this.simulatePaymentStatus(externalId);
      }
      
      // Construir URL com os parâmetros necessários
      let requestUrl = `${this.apiUrl}/payments/${externalId}`;
      
      // Adicionar client_id se disponível
      if (this.clientId) {
        requestUrl += `?client_id=${this.clientId}`;
      }
      
      const response = await axios.get(requestUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      // Mapear status da Lytex para nosso padrão
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
    } catch (error) {
      console.error('Erro ao consultar status do pagamento na Lytex:', error);
      throw new Error('Falha ao consultar status do pagamento na Lytex');
    }
  }
  
  processWebhook(payload: any): { status: string, externalId: string } {
    try {
      // Validar se é um evento válido
      if (!payload.id || !payload.status) {
        throw new Error('Payload inválido do webhook Lytex');
      }
      
      // Extrair ID externo do pagamento e garantir que é string
      const externalId = String(payload.id);
      
      // Mapear o status da Lytex para um status em nosso sistema
      let status = 'pending_payment';
      
      switch (payload.status) {
        case 'paid':
          status = 'active';
          break;
        case 'unpaid':
        case 'waiting_payment':
          status = 'pending_payment';
          break;
        case 'expired':
          status = 'suspended';
          break;
        case 'canceled':
        case 'refunded':
          status = 'cancelled';
          break;
      }
      
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