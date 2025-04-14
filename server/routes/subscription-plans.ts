import express from 'express';
import { storage } from '../storage';
import { eq } from 'drizzle-orm';
import { subscriptionPlans } from '@shared/schema';
import { db } from '../db';

const router = express.Router();

// Obter todos os planos ativos
router.get('/', async (req, res) => {
  try {
    const plans = await db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.isActive, true),
      orderBy: (plans) => [plans.displayOrder]
    });
    
    return res.json({ plans });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter um plano específico pelo ID
router.get('/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'ID de plano inválido' });
    }
    
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    return res.json({ plan });
  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// As rotas abaixo exigem autenticação de administrador
// Usamos o middleware isAdmin que já verifica autenticação

// Verificar se o usuário é admin
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.portalType !== 'admin') {
    return res.status(403).json({ error: 'Acesso não autorizado' });
  }
  next();
}

// Criar um novo plano (apenas admin)
router.post('/', isAdmin, async (req, res) => {
  try {
    const newPlan = req.body;
    
    if (!newPlan.name || !newPlan.code || !newPlan.description || !newPlan.price || !newPlan.maxStudents) {
      return res.status(400).json({ error: 'Dados insuficientes para criar o plano' });
    }
    
    // Verificar se já existe um plano com o mesmo código
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.code, newPlan.code)
    });
    
    if (existingPlan) {
      return res.status(400).json({ error: 'Já existe um plano com este código' });
    }
    
    const plan = await db.insert(subscriptionPlans).values({
      name: newPlan.name,
      code: newPlan.code,
      description: newPlan.description,
      price: newPlan.price,
      billingCycle: newPlan.billingCycle || 'monthly',
      trialDays: newPlan.trialDays || 14,
      maxStudents: newPlan.maxStudents,
      maxCourses: newPlan.maxCourses,
      maxPolos: newPlan.maxPolos,
      hasFinanceModule: newPlan.hasFinanceModule || false,
      hasCrmModule: newPlan.hasCrmModule || false,
      hasMultiChannelChat: newPlan.hasMultiChannelChat || false,
      hasAdvancedReports: newPlan.hasAdvancedReports || false,
      hasApiAccess: newPlan.hasApiAccess || false,
      hasPrioritySupportl: newPlan.hasPrioritySupportl || false,
      isActive: newPlan.isActive !== undefined ? newPlan.isActive : true,
      isFeatured: newPlan.isFeatured || false,
      displayOrder: newPlan.displayOrder || 0,
      createdById: req.user?.id
    }).returning();
    
    return res.status(201).json({ plan: plan[0] });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar um plano existente (apenas admin)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'ID de plano inválido' });
    }
    
    // Verificar se o plano existe
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });
    
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Atualizar o plano
    const updatedPlan = await db.update(subscriptionPlans)
      .set({
        name: updateData.name !== undefined ? updateData.name : existingPlan.name,
        description: updateData.description !== undefined ? updateData.description : existingPlan.description,
        price: updateData.price !== undefined ? updateData.price : existingPlan.price,
        billingCycle: updateData.billingCycle !== undefined ? updateData.billingCycle : existingPlan.billingCycle,
        trialDays: updateData.trialDays !== undefined ? updateData.trialDays : existingPlan.trialDays,
        maxStudents: updateData.maxStudents !== undefined ? updateData.maxStudents : existingPlan.maxStudents,
        maxCourses: updateData.maxCourses !== undefined ? updateData.maxCourses : existingPlan.maxCourses,
        maxPolos: updateData.maxPolos !== undefined ? updateData.maxPolos : existingPlan.maxPolos,
        hasFinanceModule: updateData.hasFinanceModule !== undefined ? updateData.hasFinanceModule : existingPlan.hasFinanceModule,
        hasCrmModule: updateData.hasCrmModule !== undefined ? updateData.hasCrmModule : existingPlan.hasCrmModule,
        hasMultiChannelChat: updateData.hasMultiChannelChat !== undefined ? updateData.hasMultiChannelChat : existingPlan.hasMultiChannelChat,
        hasAdvancedReports: updateData.hasAdvancedReports !== undefined ? updateData.hasAdvancedReports : existingPlan.hasAdvancedReports,
        hasApiAccess: updateData.hasApiAccess !== undefined ? updateData.hasApiAccess : existingPlan.hasApiAccess,
        hasPrioritySupportl: updateData.hasPrioritySupportl !== undefined ? updateData.hasPrioritySupportl : existingPlan.hasPrioritySupportl,
        isActive: updateData.isActive !== undefined ? updateData.isActive : existingPlan.isActive,
        isFeatured: updateData.isFeatured !== undefined ? updateData.isFeatured : existingPlan.isFeatured,
        displayOrder: updateData.displayOrder !== undefined ? updateData.displayOrder : existingPlan.displayOrder,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, planId))
      .returning();
    
    return res.json({ plan: updatedPlan[0] });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir um plano (apenas admin)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({ error: 'ID de plano inválido' });
    }
    
    // Verificar se o plano existe
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });
    
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    // Em vez de excluir, podemos marcar como inativo
    await db.update(subscriptionPlans)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptionPlans.id, planId));
    
    return res.json({ message: 'Plano desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;