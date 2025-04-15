import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, subscriptionPlans, institutions, subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AsaasService } from '../services/asaas-service';

const router = express.Router();

// Rota para registro de novos usuários com instituição e inscrição no trial
router.post('/', async (req, res) => {
  try {
    const { 
      nome, 
      cnpj, 
      email, 
      telefone, 
      senha, 
      instituicao, 
      planoId,
      iniciarTrial 
    } = req.body;

    // Validar os dados básicos
    if (!nome || !cnpj || !email || !telefone || !senha || !instituicao.nome) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. Por favor, preencha todos os campos obrigatórios.' 
      });
    }

    // Verificar se o email já está cadastrado
    const existingUserEmail = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUserEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email já está cadastrado.' 
      });
    }

    // Verificar se o CNPJ já está cadastrado em alguma instituição
    const existingInstitution = await db.query.institutions.findFirst({
      where: eq(institutions.cnpj, cnpj)
    });

    if (existingInstitution) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este CNPJ já está cadastrado.' 
      });
    }

    // Buscar o plano selecionado
    let selectedPlan = null;
    if (planoId) {
      selectedPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, planoId)
      });

      if (!selectedPlan) {
        return res.status(400).json({ 
          success: false, 
          message: 'Plano selecionado não encontrado.' 
        });
      }
    } else {
      // Se nenhum plano foi selecionado, seleciona o plano básico por padrão
      selectedPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.code, 'basic')
      });

      if (!selectedPlan) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao buscar plano padrão. Por favor, tente novamente.' 
        });
      }
    }

    // Iniciar uma transação para garantir que todas as operações sejam realizadas ou nenhuma
    const result = await db.transaction(async (tx) => {
      // 1. Criar o usuário
      const hashedPassword = await bcrypt.hash(senha, 10);
      
      const newUser = await tx.insert(users).values({
        name: nome,
        email: email,
        passwordHash: hashedPassword,
        isActive: true,
        isVerified: false, // Requer confirmação de email
        role: 'admin',
        portalType: 'admin',
        phone: telefone
      }).returning();

      if (!newUser || newUser.length === 0) {
        throw new Error('Erro ao criar usuário');
      }

      const userId = newUser[0].id;

      // 2. Criar a instituição
      const today = new Date();
      
      // Calcular datas do trial
      const trialStartDate = today;
      const trialEndDate = new Date();
      trialEndDate.setDate(today.getDate() + selectedPlan.trialDays);

      // Dados para o Asaas
      let asaasCustomerId = null;
      
      // Registrar cliente no Asaas, se o período trial for iniciado
      if (iniciarTrial) {
        try {
          // Criar cliente no Asaas
          const customerData = {
            name: instituicao.nome,
            email: email,
            phone: telefone,
            cpfCnpj: cnpj,
            address: instituicao.endereco,
            addressNumber: 'SN', // Sem número, caso não tenha sido especificado
            province: instituicao.cidade,
            postalCode: instituicao.cep,
            externalReference: `inst_${instituicao.nome.substring(0, 10).replace(/\\s/g, '_').toLowerCase()}`
          };
          
          const asaasResponse = await AsaasService.createCustomer(customerData);
          if (asaasResponse && asaasResponse.id) {
            asaasCustomerId = asaasResponse.id;
          }
        } catch (error) {
          console.error('Erro ao criar cliente no Asaas:', error);
          // Não interrompe o fluxo se o Asaas falhar, apenas não seta o ID
        }
      }

      const newInstitution = await tx.insert(institutions).values({
        name: instituicao.nome,
        code: instituicao.nome.substring(0, 10).replace(/\\s/g, '_').toLowerCase(),
        cnpj: cnpj,
        description: instituicao.descricao || null,
        website: instituicao.website || null,
        address: instituicao.endereco,
        city: instituicao.cidade,
        state: instituicao.estado,
        zipCode: instituicao.cep,
        isActive: true,
        createdById: userId,
        currentPlanId: selectedPlan.id,
        isOnTrial: iniciarTrial || false,
        trialStartDate: iniciarTrial ? trialStartDate : null,
        trialEndDate: iniciarTrial ? trialEndDate : null,
        asaasId: asaasCustomerId
      }).returning();

      if (!newInstitution || newInstitution.length === 0) {
        throw new Error('Erro ao criar instituição');
      }

      const institutionId = newInstitution[0].id;

      // Atualizar o usuário com a instituição
      await tx.update(users)
        .set({ institutionId: institutionId })
        .where(eq(users.id, userId));

      // 3. Criar a assinatura do plano (subscription) se for iniciar trial
      if (iniciarTrial && selectedPlan) {
        const newSubscription = await tx.insert(subscriptions).values({
          institutionId: institutionId,
          planId: selectedPlan.id,
          status: 'trial',
          startDate: trialStartDate,
          endDate: trialEndDate,
          price: selectedPlan.price,
          billingCycle: selectedPlan.billingCycle,
          createdById: userId,
          asaasId: null // Será preenchido quando criar a assinatura no Asaas após o trial
        }).returning();

        if (!newSubscription || newSubscription.length === 0) {
          throw new Error('Erro ao criar assinatura');
        }
      }

      return {
        userId,
        institutionId,
        trialStartDate,
        trialEndDate
      };
    });

    // Enviar resposta de sucesso
    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Verifique seu email para ativar sua conta.',
      data: {
        userId: result.userId,
        institutionId: result.institutionId,
        trialStartDate: result.trialStartDate,
        trialEndDate: result.trialEndDate,
        plano: selectedPlan.name
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar cadastro:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor ao processar cadastro',
    });
  }
});

export default router;