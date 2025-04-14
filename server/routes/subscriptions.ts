import express from 'express';
import { storage } from '../storage';
import { eq, and } from 'drizzle-orm';
import { subscriptions, institutions, subscriptionPlans } from '@shared/schema';
import { db } from '../db';
import { requireAuth } from '../auth';

const router = express.Router();

// Todas as rotas exigem autenticação (middleware isAdmin verifica autenticação)

// Obter assinatura da instituição atual
router.get('/current', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    // Buscar a instituição do usuário, dependendo do tipo de portal
    let institutionId: number | null = null;
    
    if (req.user.portalType === 'admin') {
      // Se for admin global, precisa passar o ID da instituição como query param
      institutionId = req.query.institutionId ? parseInt(req.query.institutionId as string) : null;
      
      if (!institutionId) {
        return res.status(400).json({ error: 'ID da instituição é obrigatório para admins globais' });
      }
    } else {
      // Para outros tipos de usuário, pegar instituição pelo polo ou diretamente
      const user = await storage.getUser(req.user.id);
      
      if (user?.institutionId) {
        institutionId = user.institutionId;
      } else if (user?.poloId) {
        const polo = await storage.getPolo(user.poloId);
        institutionId = polo?.institutionId || null;
      }
      
      if (!institutionId) {
        return res.status(404).json({ error: 'Instituição não encontrada para este usuário' });
      }
    }
    
    // Buscar a instituição
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId),
      with: {
        currentPlan: true
      }
    });
    
    if (!institution) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    
    // Buscar a assinatura ativa
    const activeSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.institutionId, institutionId),
        eq(subscriptions.status, institution.isOnTrial ? 'trial' : 'active')
      ),
      with: {
        plan: true
      }
    });
    
    // Preparar resposta com informações de trial e plano atual
    const response = {
      institution: {
        id: institution.id,
        name: institution.name,
        isOnTrial: institution.isOnTrial,
        trialStartDate: institution.trialStartDate,
        trialEndDate: institution.trialEndDate
      },
      subscription: activeSubscription || null,
      currentPlan: institution.currentPlan
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Erro ao buscar assinatura atual:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar se o usuário é admin
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.portalType !== 'admin') {
    return res.status(403).json({ error: 'Acesso não autorizado' });
  }
  next();
}

// Criar uma nova assinatura (apenas admin)
router.post('/', requireAuth, isAdmin, async (req, res) => {
  try {
    const { institutionId, planId, status, startDate, endDate, trialEndsAt } = req.body;
    
    if (!institutionId || !planId) {
      return res.status(400).json({ error: 'Instituição e plano são obrigatórios' });
    }
    
    // Verificar se a instituição existe
    const institution = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    });
    
    if (!institution) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    
    // Verificar se o plano existe
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Criar a assinatura
    const newSubscription = await db.insert(subscriptions).values({
      institutionId,
      planId,
      status: status || 'trial',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias a partir de agora
      billingCycle: plan.billingCycle,
      price: plan.price
    }).returning();
    
    // Atualizar a instituição com o plano atual
    await db.update(institutions)
      .set({
        currentPlanId: planId,
        isOnTrial: status === 'trial',
        trialStartDate: status === 'trial' ? new Date() : null,
        trialEndDate: trialEndsAt ? new Date(trialEndsAt) : null
      })
      .where(eq(institutions.id, institutionId));
    
    return res.status(201).json({ subscription: newSubscription[0] });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status da assinatura (cancelar, etc.) - apenas admin
router.patch('/:id/status', requireAuth, isAdmin, async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(subscriptionId)) {
      return res.status(400).json({ error: 'ID de assinatura inválido' });
    }
    
    if (!status || !['trial', 'active', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Verificar se a assinatura existe
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId)
    });
    
    if (!existingSubscription) {
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }
    
    // Atualizar status
    const updatedSubscription = await db.update(subscriptions)
      .set({
        status,
        canceledAt: status === 'cancelled' ? new Date() : existingSubscription.canceledAt,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    
    // Se status for 'cancelled' ou 'expired', remover como plano atual da instituição
    if (['cancelled', 'expired'].includes(status) && existingSubscription.institutionId) {
      // Buscar a instituição
      const institution = await db.query.institutions.findFirst({
        where: eq(institutions.id, existingSubscription.institutionId)
      });
      
      if (institution && institution.currentPlanId === existingSubscription.planId) {
        await db.update(institutions)
          .set({
            currentPlanId: null,
            isOnTrial: false,
            trialStartDate: null,
            trialEndDate: null
          })
          .where(eq(institutions.id, existingSubscription.institutionId));
      }
    }
    
    return res.json({ subscription: updatedSubscription[0] });
  } catch (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as assinaturas (apenas admin)
router.get('/admin/all', requireAuth, isAdmin, async (req, res) => {
  try {
    const allSubscriptions = await db.query.subscriptions.findMany({
      with: {
        institution: true,
        plan: true
      }
    });
    
    return res.json({ subscriptions: allSubscriptions });
  } catch (error) {
    console.error('Erro ao buscar todas as assinaturas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;