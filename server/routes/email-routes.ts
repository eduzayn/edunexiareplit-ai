/**
 * Rotas de email
 */
import express from 'express';
import { emailService } from '../services/email-service';
import { requireAuth } from '../auth';

const router = express.Router();

/**
 * Rota para enviar e-mail com link de cobrança
 */
router.post('/send-charge-email', requireAuth, async (req, res) => {
  try {
    const { 
      to,
      customerName,
      chargeId,
      chargeValue,
      dueDate,
      paymentLink 
    } = req.body;

    // Validar dados
    if (!to || !customerName || !chargeId || !chargeValue || !dueDate || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Todos os campos são obrigatórios.'
      });
    }

    // Enviar e-mail
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
        message: `E-mail enviado com sucesso para ${to}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar e-mail. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar solicitação de envio de e-mail:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota para enviar e-mail com link de fatura/boleto
 */
router.post('/send-invoice-email', requireAuth, async (req, res) => {
  try {
    const { 
      to,
      customerName,
      chargeId,
      chargeValue,
      dueDate,
      paymentLink,
      bankSlipLink
    } = req.body;

    // Validar dados
    if (!to || !customerName || !chargeId || !chargeValue || !dueDate || !paymentLink) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Todos os campos são obrigatórios (exceto bankSlipLink).'
      });
    }

    // Enviar e-mail
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
        message: `E-mail com fatura enviado com sucesso para ${to}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar e-mail com fatura. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar solicitação de envio de e-mail com fatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;