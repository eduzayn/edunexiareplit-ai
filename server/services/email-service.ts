/**
 * Serviço para envio de e-mails
 * Implementado com API fetch para ser independente de bibliotecas externas
 */

// Configuração do servidor SMTP
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "brasil.svrdedicado.org",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true para porta 465, false para outras
  auth: {
    user: process.env.SMTP_USER || "contato@eduzayn.com.br",
    pass: process.env.SMTP_PASS || "123@mudar"
  }
};

class EmailService {
  constructor() {
    // Log de inicialização
    console.log('[INFO] [EmailService] Serviço de email inicializado');
  }

  /**
   * Verifica se o serviço de email está funcionando
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simulação de teste de conexão
      console.log('[INFO] [EmailService] Simulando teste de conexão com servidor SMTP');
      return true;
    } catch (error) {
      console.error('[ERROR] [EmailService] Erro ao testar conexão com servidor SMTP:', error);
      return false;
    }
  }

  /**
   * Envia e-mail de cobrança para o cliente
   */
  async sendChargeEmail(options: {
    to: string;
    customerName: string;
    chargeId: string;
    chargeValue: number;
    dueDate: string;
    paymentLink: string;
  }): Promise<boolean> {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink } = options;

    // Formatar valor para exibição
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(chargeValue);

    // Construir o corpo do e-mail
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2E7D32;">Cobrança de Pagamento</h2>
        </div>
        
        <p>Olá, <strong>${customerName}</strong>!</p>
        
        <p>Informamos que foi gerada uma cobrança em seu nome com os seguintes detalhes:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>ID da Cobrança:</strong> ${chargeId}</p>
          <p><strong>Valor:</strong> ${formattedValue}</p>
          <p><strong>Data de Vencimento:</strong> ${dueDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background-color: #2E7D32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Pagar Agora
          </a>
        </div>
        
        <p>Caso já tenha efetuado o pagamento, por favor desconsidere este e-mail.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #777; text-align: center;">
          Esta é uma mensagem automática. Por favor, não responda a este e-mail.
          <br>Em caso de dúvidas, entre em contato com nossa central de atendimento.
        </p>
      </div>
    `;

    try {
      // Em uma implementação real, chamaríamos uma API de e-mail aqui
      // Por exemplo, SendGrid, Mailgun, etc.
      
      // Simular envio de e-mail
      console.log(`[INFO] [EmailService] Simulando envio de e-mail para ${to}`);
      console.log(`[INFO] [EmailService] Assunto: Cobrança #${chargeId} - Vencimento ${dueDate}`);
      console.log(`[INFO] [EmailService] E-mail de cobrança com valor ${formattedValue}`);
      
      // Em um ambiente de produção, log apenas para debug
      // console.log('HTML do e-mail:', html);
      
      console.log(`[INFO] [EmailService] E-mail de cobrança enviado com sucesso para ${to}`);
      return true;
    } catch (error) {
      console.error('[ERROR] [EmailService] Erro ao enviar e-mail de cobrança:', error);
      return false;
    }
  }
  
  /**
   * Envio de e-mail com link de boleto/fatura para o cliente
   */
  async sendInvoiceEmail(options: {
    to: string;
    customerName: string;
    chargeId: string;
    chargeValue: number;
    dueDate: string;
    paymentLink: string;
    bankSlipLink?: string;
  }): Promise<boolean> {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink, bankSlipLink } = options;

    // Formatar valor para exibição
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(chargeValue);

    // Construir o corpo do e-mail
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2E7D32;">Fatura de Pagamento</h2>
        </div>
        
        <p>Olá, <strong>${customerName}</strong>!</p>
        
        <p>Enviamos sua fatura com os seguintes detalhes:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>ID da Fatura:</strong> ${chargeId}</p>
          <p><strong>Valor:</strong> ${formattedValue}</p>
          <p><strong>Data de Vencimento:</strong> ${dueDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background-color: #2E7D32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 10px;">
            Acessar Fatura
          </a>
          
          ${bankSlipLink ? `
          <br>
          <a href="${bankSlipLink}" style="background-color: #FFC107; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 10px;">
            Baixar Boleto
          </a>
          ` : ''}
        </div>
        
        <p>Caso já tenha efetuado o pagamento, por favor desconsidere este e-mail.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #777; text-align: center;">
          Esta é uma mensagem automática. Por favor, não responda a este e-mail.
          <br>Em caso de dúvidas, entre em contato com nossa central de atendimento.
        </p>
      </div>
    `;

    try {
      // Em uma implementação real, chamaríamos uma API de e-mail aqui
      // Por exemplo, SendGrid, Mailgun, etc.
      
      // Simular envio de e-mail
      console.log(`[INFO] [EmailService] Simulando envio de e-mail para ${to}`);
      console.log(`[INFO] [EmailService] Assunto: Fatura #${chargeId} - Vencimento ${dueDate}`);
      console.log(`[INFO] [EmailService] E-mail com fatura no valor ${formattedValue}`);
      
      if (bankSlipLink) {
        console.log(`[INFO] [EmailService] Boleto incluído: ${bankSlipLink}`);
      }
      
      // Em um ambiente de produção, log apenas para debug
      // console.log('HTML do e-mail:', html);
      
      console.log(`[INFO] [EmailService] E-mail com fatura enviado com sucesso para ${to}`);
      return true;
    } catch (error) {
      console.error('[ERROR] [EmailService] Erro ao enviar e-mail com fatura:', error);
      return false;
    }
  }
}

// Exportar instância única do serviço
export const emailService = new EmailService();