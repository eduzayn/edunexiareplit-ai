import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Controlador para tratar webhooks do Asaas
 */
export const WebhookController = {
  /**
   * Processa webhooks do Asaas
   * Documentação: https://asaasv3.docs.apiary.io/#reference/0/notificacoes
   */
  async handleAsaasWebhook(req: Request, res: Response) {
    try {
      const eventData = req.body;
      console.log('Webhook recebido do Asaas:', JSON.stringify(eventData));

      // Verificar se o webhook é válido
      if (!eventData || !eventData.event || !eventData.payment) {
        return res.status(400).json({ message: 'Webhook inválido' });
      }

      // Extrair dados do evento
      const { event, payment } = eventData;
      const paymentId = payment.id;
      
      console.log(`Processando evento ${event} para pagamento ${paymentId}`);

      // Buscar o pagamento correspondente no banco de dados pelo asaasId
      const dbPayment = await storage.getPaymentByAsaasId(paymentId);
      
      if (!dbPayment) {
        console.log(`Pagamento não encontrado: ${paymentId}`);
        return res.status(404).json({ message: 'Pagamento não encontrado' });
      }

      // Mapear eventos para ações
      switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_APPROVED':
          // Atualizar o status do pagamento para 'completed'
          await storage.updatePayment(dbPayment.id, { status: 'completed' });
          break;
          
        case 'PAYMENT_OVERDUE':
          // Pagamento vencido
          await storage.updatePayment(dbPayment.id, { status: 'pending' });
          break;
          
        case 'PAYMENT_DELETED':
        case 'PAYMENT_CANCELED':
          // Pagamento cancelado
          await storage.updatePayment(dbPayment.id, { status: 'failed' });
          break;
          
        case 'PAYMENT_REFUNDED':
          // Pagamento estornado
          await storage.updatePayment(dbPayment.id, { status: 'refunded' });
          break;
          
        default:
          console.log(`Evento não tratado: ${event}`);
      }
      
      // Atualizar o status da fatura
      await storage.updateInvoiceAfterPayment(dbPayment.invoiceId);
      
      // Responder ao Asaas com sucesso
      return res.status(200).json({ message: 'Webhook processado com sucesso' });
    } catch (error) {
      console.error('Erro ao processar webhook do Asaas:', error);
      return res.status(500).json({ message: 'Erro ao processar webhook' });
    }
  }
};