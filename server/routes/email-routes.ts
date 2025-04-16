/**
 * Rotas de email
 */
import { Router } from 'express';
import { emailService } from '../services/email-service';

const router = Router();

/**
 * Rota para enviar e-mail com link de cobrança
 */
router.post('/send-charge-email', async (req, res) => {
  try {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink } = req.body;
    
    // Validação básica
    if (!to || !customerName || !chargeId || !chargeValue || !dueDate || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Certifique-se de fornecer todos os campos necessários.'
      });
    }
    
    // Enviar e-mail via serviço
    const success = await emailService.sendChargeEmail({
      to,
      customerName,
      chargeId,
      chargeValue,
      dueDate,
      paymentLink
    });
    
    if (success) {
      return res.json({
        success: true,
        message: 'E-mail enviado com sucesso.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar e-mail. Verifique os logs para mais detalhes.'
      });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar envio de e-mail:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a solicitação de envio de e-mail.'
    });
  }
});

/**
 * Rota para enviar e-mail com link de fatura/boleto
 */
router.post('/send-invoice-email', async (req, res) => {
  try {
    const { to, customerName, chargeId, chargeValue, dueDate, paymentLink, bankSlipLink } = req.body;
    
    // Validação básica
    if (!to || !customerName || !chargeId || !chargeValue || !dueDate || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Certifique-se de fornecer todos os campos necessários.'
      });
    }
    
    // Enviar e-mail via serviço
    const success = await emailService.sendInvoiceEmail({
      to,
      customerName,
      chargeId,
      chargeValue,
      dueDate,
      paymentLink,
      bankSlipLink
    });
    
    if (success) {
      return res.json({
        success: true,
        message: 'E-mail de fatura enviado com sucesso.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Falha ao enviar e-mail de fatura. Verifique os logs para mais detalhes.'
      });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar envio de e-mail de fatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a solicitação de envio de e-mail de fatura.'
    });
  }
});

export default router;