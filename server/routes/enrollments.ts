import { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { insertEnrollmentSchema } from '@shared/schema';
import { requireAdmin, requireStudent, requirePartner } from '../middleware/auth';
import { z } from 'zod';

export function registerEnrollmentRoutes(app: Express) {
  // Listar matrículas (acesso administrativo)
  app.get('/api/enrollments', requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        search,
        status,
        studentId,
        courseId,
        poloId,
        institutionId,
        partnerId,
        paymentGateway,
        startDate,
        endDate,
        limit = '50',
        offset = '0'
      } = req.query;
      
      // Converte datas se fornecidas
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;
      
      if (startDate && typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }
      
      const enrollments = await storage.getEnrollments(
        typeof search === 'string' ? search : undefined,
        typeof status === 'string' ? status : undefined,
        typeof studentId === 'string' ? parseInt(studentId) : undefined,
        typeof courseId === 'string' ? parseInt(courseId) : undefined,
        typeof poloId === 'string' ? parseInt(poloId) : undefined,
        typeof institutionId === 'string' ? parseInt(institutionId) : undefined,
        typeof partnerId === 'string' ? parseInt(partnerId) : undefined,
        parsedStartDate,
        parsedEndDate,
        typeof paymentGateway === 'string' ? paymentGateway : undefined,
        typeof limit === 'string' ? parseInt(limit) : 50,
        typeof offset === 'string' ? parseInt(offset) : 0
      );
      
      res.json(enrollments);
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
      res.status(500).json({ error: 'Erro interno ao buscar matrículas' });
    }
  });
  
  // Obter detalhes de uma matrícula por ID (acesso administrativo ou do aluno proprietário)
  app.get('/api/enrollments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const enrollment = await storage.getEnrollment(id);
      
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }
      
      // Verificar se o usuário tem acesso a esta matrícula
      if (
        req.user?.portalType === 'admin' || 
        (req.user?.portalType === 'student' && req.user?.id === enrollment.studentId) ||
        (req.user?.portalType === 'partner' && req.user?.id === enrollment.partnerId)
      ) {
        // Pegar histórico de status da matrícula
        const statusHistory = await storage.getEnrollmentStatusHistory(id);
        
        // Retornar a matrícula com o histórico de status
        return res.json({
          ...enrollment,
          statusHistory
        });
      } else {
        return res.status(403).json({ error: 'Acesso negado a esta matrícula' });
      }
    } catch (error) {
      console.error('Erro ao buscar matrícula:', error);
      res.status(500).json({ error: 'Erro interno ao buscar matrícula' });
    }
  });
  
  // Criar nova matrícula (acesso administrativo ou parceiro)
  app.post('/api/enrollments', async (req: Request, res: Response) => {
    try {
      // Validar que o usuário é admin ou parceiro
      if (req.user?.portalType !== 'admin' && req.user?.portalType !== 'partner') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores e parceiros podem criar matrículas' });
      }
      
      // Validar os dados da matrícula
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      
      // Adicionar o ID do usuário que está criando a matrícula
      const enrollmentWithCreator = {
        ...enrollmentData,
        createdById: req.user.id,
        // Se o usuário for parceiro, adicionar ele como parceiro da matrícula
        partnerId: req.user.portalType === 'partner' ? req.user.id : enrollmentData.partnerId
      };
      
      // Criar a matrícula
      const newEnrollment = await storage.createEnrollment(enrollmentWithCreator);
      
      // Se tiver gateway de pagamento, criar o pagamento
      if (newEnrollment.paymentGateway) {
        try {
          const paymentResult = await storage.createPayment(newEnrollment, newEnrollment.paymentGateway);
          
          // Atualizar a matrícula com os dados do pagamento
          await storage.updateEnrollment(newEnrollment.id, {
            paymentExternalId: paymentResult.externalId,
            paymentUrl: paymentResult.paymentUrl
          });
          
          // Adicionar os dados de pagamento ao objeto retornado
          newEnrollment.paymentExternalId = paymentResult.externalId;
          newEnrollment.paymentUrl = paymentResult.paymentUrl;
        } catch (paymentError) {
          console.error('Erro ao criar pagamento:', paymentError);
          // Não falhar a criação da matrícula se o pagamento falhar,
          // apenas registrar o erro e continuar
        }
      }
      
      res.status(201).json(newEnrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Erro ao criar matrícula:', error);
      res.status(500).json({ error: 'Erro interno ao criar matrícula' });
    }
  });
  
  // Atualizar matrícula (acesso administrativo)
  app.patch('/api/enrollments/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se a matrícula existe
      const enrollment = await storage.getEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }
      
      // Validar dados parciais da matrícula
      const updateData = req.body;
      
      // Atualizar a matrícula
      const updatedEnrollment = await storage.updateEnrollment(id, updateData);
      
      res.json(updatedEnrollment);
    } catch (error) {
      console.error('Erro ao atualizar matrícula:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar matrícula' });
    }
  });
  
  // Atualizar status da matrícula (acesso administrativo)
  app.post('/api/enrollments/:id/status', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }
      
      // Verificar se a matrícula existe
      const enrollment = await storage.getEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }
      
      // Atualizar o status da matrícula
      const updatedEnrollment = await storage.updateEnrollmentStatus(
        id,
        status,
        reason || `Status alterado manualmente para ${status}`,
        req.user?.id
      );
      
      res.json(updatedEnrollment);
    } catch (error) {
      console.error('Erro ao atualizar status da matrícula:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar status da matrícula' });
    }
  });
  
  // Excluir matrícula (acesso administrativo)
  app.delete('/api/enrollments/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se a matrícula existe
      const enrollment = await storage.getEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada' });
      }
      
      // Excluir a matrícula (na prática, marca como cancelada)
      const deleted = await storage.deleteEnrollment(id);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Erro ao excluir matrícula' });
      }
    } catch (error) {
      console.error('Erro ao excluir matrícula:', error);
      res.status(500).json({ error: 'Erro interno ao excluir matrícula' });
    }
  });
  
  // Obter matrículas do aluno atual (acesso do aluno)
  app.get('/api/student/enrollments', requireStudent, async (req: Request, res: Response) => {
    try {
      const studentId = req.user!.id;
      
      const enrollments = await storage.getStudentEnrollments(studentId);
      
      res.json(enrollments);
    } catch (error) {
      console.error('Erro ao buscar matrículas do aluno:', error);
      res.status(500).json({ error: 'Erro interno ao buscar matrículas do aluno' });
    }
  });
  
  // Rotas para parceiros
  
  // Obter matrículas vinculadas ao parceiro atual
  app.get('/api/partner/enrollments', requirePartner, async (req: Request, res: Response) => {
    try {
      const partnerId = req.user!.id;
      
      const enrollments = await storage.getEnrollments(
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        partnerId,
        undefined,
        undefined,
        undefined,
        50,
        0
      );
      
      res.json(enrollments);
    } catch (error) {
      console.error('Erro ao buscar matrículas do parceiro:', error);
      res.status(500).json({ error: 'Erro interno ao buscar matrículas do parceiro' });
    }
  });
  
  // Webhook para receber notificações de pagamento do Asaas
  app.post('/api/webhooks/asaas', async (req: Request, res: Response) => {
    try {
      const { createPaymentGateway } = await import('../services/payment-gateways');
      
      const gateway = createPaymentGateway('asaas');
      const { status, externalId } = gateway.processWebhook(req.body);
      
      // Buscar todas as matrículas
      const enrollments = await storage.getEnrollments(
        undefined, undefined, undefined, undefined, undefined, 
        undefined, undefined, undefined, undefined, undefined, 50, 0
      );
      
      // Encontrar a matrícula com o ID externo correspondente
      const enrollment = enrollments.find(e => e.paymentExternalId === externalId);
      
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada para este pagamento' });
      }
      
      // Atualizar o status da matrícula
      await storage.updateEnrollmentStatus(
        enrollment.id,
        status,
        `Status atualizado pelo webhook Asaas: ${req.body.event || 'evento desconhecido'}`,
        undefined,
        req.body
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook Asaas:', error);
      res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
  });
  
  // Webhook para receber notificações de pagamento da Lytex
  app.post('/api/webhooks/lytex', async (req: Request, res: Response) => {
    try {
      const { createPaymentGateway } = await import('../services/payment-gateways');
      
      const gateway = createPaymentGateway('lytex');
      const { status, externalId } = gateway.processWebhook(req.body);
      
      // Buscar todas as matrículas
      const enrollments = await storage.getEnrollments(
        undefined, undefined, undefined, undefined, undefined, 
        undefined, undefined, undefined, undefined, undefined, 50, 0
      );
      
      // Encontrar a matrícula com o ID externo correspondente
      const enrollment = enrollments.find(e => e.paymentExternalId === externalId);
      
      if (!enrollment) {
        return res.status(404).json({ error: 'Matrícula não encontrada para este pagamento' });
      }
      
      // Atualizar o status da matrícula
      await storage.updateEnrollmentStatus(
        enrollment.id,
        status,
        `Status atualizado pelo webhook Lytex: ${req.body.status || 'status desconhecido'}`,
        undefined,
        req.body
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook Lytex:', error);
      res.status(500).json({ error: 'Erro interno ao processar webhook' });
    }
  });
}