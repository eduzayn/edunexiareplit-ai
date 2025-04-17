import { Request, Response } from 'express';
import asaasChargesService from '../services/asaas-charges-service';
import { storage } from '../storage';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    portalType?: string;
    cpf?: string;
    [key: string]: any;
  };
}

export const studentChargesController = {
  /**
   * Obtém as cobranças do aluno autenticado
   * @param req Requisição Express
   * @param res Resposta Express
   */
  async getStudentCharges(req: AuthenticatedRequest, res: Response) {
    try {
      // Verificar autenticação
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado'
        });
      }

      const userId = req.user.id;
      logger.info(`[StudentChargesController] Buscando cobranças para usuário ID: ${userId}`);

      // Buscar os dados do aluno
      const studentData = await storage.users.findById(userId);
      if (!studentData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dados do estudante não encontrados'
        });
      }

      // Se o tipo de portal não for estudante, rejeitar
      if (studentData.portalType !== 'student') {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso permitido apenas para estudantes'
        });
      }

      // Verificar se o aluno tem CPF cadastrado
      if (!studentData.cpf) {
        logger.warn(`[StudentChargesController] Aluno ID ${userId} não possui CPF cadastrado`);
        return res.status(400).json({ 
          success: false, 
          message: 'CPF não cadastrado no perfil do aluno'
        });
      }

      // Tentar encontrar o cliente no Asaas usando o CPF do aluno
      const customerData = await asaasChargesService.findCustomerByCpfCnpj(studentData.cpf);
      
      if (!customerData) {
        logger.warn(`[StudentChargesController] Cliente não encontrado no Asaas para CPF: ${studentData.cpf}`);
        
        // Se não encontrar pelo CPF, tentar buscar matrículas com pagamento
        // Buscar matrículas usando a função apropriada do storage
        const enrollments = await storage.enrollments.findByStudentId(userId);
        
        if (!enrollments || enrollments.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Não foram encontradas informações de pagamento para este aluno'
          });
        }
        
        // Retorna cobrança vazia (não encontrada)
        return res.json([]);
      }

      // Buscar cobranças do cliente no Asaas
      const charges = await asaasChargesService.getCustomerCharges(customerData.id);
      logger.info(`[StudentChargesController] Encontradas ${charges.length} cobranças para o cliente ${customerData.id}`);

      // Retornar as cobranças
      return res.json(charges);
    } catch (error) {
      logger.error('[StudentChargesController] Erro ao buscar cobranças do aluno', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar informações financeiras'
      });
    }
  }
};