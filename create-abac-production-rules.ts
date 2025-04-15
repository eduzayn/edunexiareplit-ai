import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import * as abacSchema from './shared/abac-schema';

dotenv.config();

// Configurações do banco de dados
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('A variável de ambiente DATABASE_URL não está definida');
  process.exit(1);
}

/**
 * Script para criar regras de produção para o sistema ABAC
 */
async function createProductionRules() {
  console.log('Criando regras de permissão ABAC para produção...');
  
  // Conecta ao banco de dados
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Regras de permissão por fase de instituição
    console.log('Criando regras de permissão por fase de instituição...');
    
    // Limpa dados existentes
    await db.delete(abacSchema.institutionPhasePermissions);
    
    // Fase: Prospecção (prospecting)
    const prospectingRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'prospecting', description: 'Visualizar usuários durante fase de prospecção', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'prospecting', description: 'Criar usuários durante fase de prospecção', isAllowed: true },
      { resource: 'usuario', action: 'atualizar', phase: 'prospecting', description: 'Atualizar usuários durante fase de prospecção', isAllowed: true },
      { resource: 'usuario', action: 'deletar', phase: 'prospecting', description: 'Deletar usuários durante fase de prospecção', isAllowed: false },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'prospecting', description: 'Visualizar papéis durante fase de prospecção', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'prospecting', description: 'Atribuir papéis durante fase de prospecção', isAllowed: true },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'prospecting', description: 'Visualizar instituição durante fase de prospecção', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'prospecting', description: 'Atualizar instituição durante fase de prospecção', isAllowed: true },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'prospecting', description: 'Visualizar polos durante fase de prospecção', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'prospecting', description: 'Criar polos durante fase de prospecção', isAllowed: false },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'prospecting', description: 'Visualizar cursos durante fase de prospecção', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'prospecting', description: 'Criar cursos durante fase de prospecção', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'prospecting', description: 'Visualizar matrículas durante fase de prospecção', isAllowed: false },
      { resource: 'matricula', action: 'criar', phase: 'prospecting', description: 'Criar matrículas durante fase de prospecção', isAllowed: false },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'prospecting', description: 'Visualizar financeiro durante fase de prospecção', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'prospecting', description: 'Criar registros financeiros durante fase de prospecção', isAllowed: false },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'prospecting', description: 'Gerar relatórios durante fase de prospecção', isAllowed: false },
    ];
    
    // Fase: Onboarding (onboarding)
    const onboardingRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'onboarding', description: 'Visualizar usuários durante fase de onboarding', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'onboarding', description: 'Criar usuários durante fase de onboarding', isAllowed: true },
      { resource: 'usuario', action: 'atualizar', phase: 'onboarding', description: 'Atualizar usuários durante fase de onboarding', isAllowed: true },
      { resource: 'usuario', action: 'deletar', phase: 'onboarding', description: 'Deletar usuários durante fase de onboarding', isAllowed: true },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'onboarding', description: 'Visualizar papéis durante fase de onboarding', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'onboarding', description: 'Atribuir papéis durante fase de onboarding', isAllowed: true },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'onboarding', description: 'Visualizar instituição durante fase de onboarding', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'onboarding', description: 'Atualizar instituição durante fase de onboarding', isAllowed: true },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'onboarding', description: 'Visualizar polos durante fase de onboarding', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'onboarding', description: 'Criar polos durante fase de onboarding', isAllowed: true },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'onboarding', description: 'Visualizar cursos durante fase de onboarding', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'onboarding', description: 'Criar cursos durante fase de onboarding', isAllowed: true },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'onboarding', description: 'Visualizar matrículas durante fase de onboarding', isAllowed: true },
      { resource: 'matricula', action: 'criar', phase: 'onboarding', description: 'Criar matrículas durante fase de onboarding', isAllowed: false },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'onboarding', description: 'Visualizar financeiro durante fase de onboarding', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'onboarding', description: 'Criar registros financeiros durante fase de onboarding', isAllowed: true },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'onboarding', description: 'Gerar relatórios durante fase de onboarding', isAllowed: true },
    ];
    
    // Fase: Implementação (implementation)
    const implementationRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'implementation', description: 'Visualizar usuários durante fase de implementação', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'implementation', description: 'Criar usuários durante fase de implementação', isAllowed: true },
      { resource: 'usuario', action: 'atualizar', phase: 'implementation', description: 'Atualizar usuários durante fase de implementação', isAllowed: true },
      { resource: 'usuario', action: 'deletar', phase: 'implementation', description: 'Deletar usuários durante fase de implementação', isAllowed: true },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'implementation', description: 'Visualizar papéis durante fase de implementação', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'implementation', description: 'Atribuir papéis durante fase de implementação', isAllowed: true },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'implementation', description: 'Visualizar instituição durante fase de implementação', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'implementation', description: 'Atualizar instituição durante fase de implementação', isAllowed: true },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'implementation', description: 'Visualizar polos durante fase de implementação', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'implementation', description: 'Criar polos durante fase de implementação', isAllowed: true },
      { resource: 'polo', action: 'atualizar', phase: 'implementation', description: 'Atualizar polos durante fase de implementação', isAllowed: true },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'implementation', description: 'Visualizar cursos durante fase de implementação', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'implementation', description: 'Criar cursos durante fase de implementação', isAllowed: true },
      { resource: 'curso', action: 'atualizar', phase: 'implementation', description: 'Atualizar cursos durante fase de implementação', isAllowed: true },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'implementation', description: 'Visualizar matrículas durante fase de implementação', isAllowed: true },
      { resource: 'matricula', action: 'criar', phase: 'implementation', description: 'Criar matrículas durante fase de implementação', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'implementation', description: 'Visualizar financeiro durante fase de implementação', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'implementation', description: 'Criar registros financeiros durante fase de implementação', isAllowed: true },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'implementation', description: 'Gerar relatórios durante fase de implementação', isAllowed: true },
    ];
    
    // Fase: Ativa (active)
    const activeRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'active', description: 'Visualizar usuários durante fase ativa', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'active', description: 'Criar usuários durante fase ativa', isAllowed: true },
      { resource: 'usuario', action: 'atualizar', phase: 'active', description: 'Atualizar usuários durante fase ativa', isAllowed: true },
      { resource: 'usuario', action: 'deletar', phase: 'active', description: 'Deletar usuários durante fase ativa', isAllowed: true },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'active', description: 'Visualizar papéis durante fase ativa', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'active', description: 'Atribuir papéis durante fase ativa', isAllowed: true },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'active', description: 'Visualizar instituição durante fase ativa', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'active', description: 'Atualizar instituição durante fase ativa', isAllowed: true },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'active', description: 'Visualizar polos durante fase ativa', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'active', description: 'Criar polos durante fase ativa', isAllowed: true },
      { resource: 'polo', action: 'atualizar', phase: 'active', description: 'Atualizar polos durante fase ativa', isAllowed: true },
      { resource: 'polo', action: 'deletar', phase: 'active', description: 'Deletar polos durante fase ativa', isAllowed: true },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'active', description: 'Visualizar cursos durante fase ativa', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'active', description: 'Criar cursos durante fase ativa', isAllowed: true },
      { resource: 'curso', action: 'atualizar', phase: 'active', description: 'Atualizar cursos durante fase ativa', isAllowed: true },
      { resource: 'curso', action: 'deletar', phase: 'active', description: 'Deletar cursos durante fase ativa', isAllowed: true },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'active', description: 'Visualizar matrículas durante fase ativa', isAllowed: true },
      { resource: 'matricula', action: 'criar', phase: 'active', description: 'Criar matrículas durante fase ativa', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', phase: 'active', description: 'Atualizar matrículas durante fase ativa', isAllowed: true },
      { resource: 'matricula', action: 'cancelar', phase: 'active', description: 'Cancelar matrículas durante fase ativa', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'active', description: 'Visualizar financeiro durante fase ativa', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'active', description: 'Criar registros financeiros durante fase ativa', isAllowed: true },
      { resource: 'financeiro', action: 'atualizar', phase: 'active', description: 'Atualizar registros financeiros durante fase ativa', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', phase: 'active', description: 'Visualizar certificados durante fase ativa', isAllowed: true },
      { resource: 'certificado', action: 'gerar', phase: 'active', description: 'Gerar certificados durante fase ativa', isAllowed: true },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'active', description: 'Gerar relatórios durante fase ativa', isAllowed: true },
    ];
    
    // Fase: Suspensa (suspended)
    const suspendedRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'suspended', description: 'Visualizar usuários durante fase suspensa', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'suspended', description: 'Criar usuários durante fase suspensa', isAllowed: false },
      { resource: 'usuario', action: 'atualizar', phase: 'suspended', description: 'Atualizar usuários durante fase suspensa', isAllowed: true },
      { resource: 'usuario', action: 'deletar', phase: 'suspended', description: 'Deletar usuários durante fase suspensa', isAllowed: false },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'suspended', description: 'Visualizar papéis durante fase suspensa', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'suspended', description: 'Atribuir papéis durante fase suspensa', isAllowed: false },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'suspended', description: 'Visualizar instituição durante fase suspensa', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'suspended', description: 'Atualizar instituição durante fase suspensa', isAllowed: true },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'suspended', description: 'Visualizar polos durante fase suspensa', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'suspended', description: 'Criar polos durante fase suspensa', isAllowed: false },
      { resource: 'polo', action: 'atualizar', phase: 'suspended', description: 'Atualizar polos durante fase suspensa', isAllowed: true },
      { resource: 'polo', action: 'deletar', phase: 'suspended', description: 'Deletar polos durante fase suspensa', isAllowed: false },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'suspended', description: 'Visualizar cursos durante fase suspensa', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'suspended', description: 'Criar cursos durante fase suspensa', isAllowed: false },
      { resource: 'curso', action: 'atualizar', phase: 'suspended', description: 'Atualizar cursos durante fase suspensa', isAllowed: true },
      { resource: 'curso', action: 'deletar', phase: 'suspended', description: 'Deletar cursos durante fase suspensa', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'suspended', description: 'Visualizar matrículas durante fase suspensa', isAllowed: true },
      { resource: 'matricula', action: 'criar', phase: 'suspended', description: 'Criar matrículas durante fase suspensa', isAllowed: false },
      { resource: 'matricula', action: 'atualizar', phase: 'suspended', description: 'Atualizar matrículas durante fase suspensa', isAllowed: true },
      { resource: 'matricula', action: 'cancelar', phase: 'suspended', description: 'Cancelar matrículas durante fase suspensa', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'suspended', description: 'Visualizar financeiro durante fase suspensa', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'suspended', description: 'Criar registros financeiros durante fase suspensa', isAllowed: false },
      { resource: 'financeiro', action: 'atualizar', phase: 'suspended', description: 'Atualizar registros financeiros durante fase suspensa', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', phase: 'suspended', description: 'Visualizar certificados durante fase suspensa', isAllowed: true },
      { resource: 'certificado', action: 'gerar', phase: 'suspended', description: 'Gerar certificados durante fase suspensa', isAllowed: false },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'suspended', description: 'Gerar relatórios durante fase suspensa', isAllowed: true },
    ];
    
    // Fase: Cancelada (canceled)
    const canceledRules = [
      // Usuários
      { resource: 'usuario', action: 'ler', phase: 'canceled', description: 'Visualizar usuários durante fase cancelada', isAllowed: true },
      { resource: 'usuario', action: 'criar', phase: 'canceled', description: 'Criar usuários durante fase cancelada', isAllowed: false },
      { resource: 'usuario', action: 'atualizar', phase: 'canceled', description: 'Atualizar usuários durante fase cancelada', isAllowed: false },
      { resource: 'usuario', action: 'deletar', phase: 'canceled', description: 'Deletar usuários durante fase cancelada', isAllowed: false },
      
      // Papéis
      { resource: 'papel', action: 'ler', phase: 'canceled', description: 'Visualizar papéis durante fase cancelada', isAllowed: true },
      { resource: 'papel', action: 'atribuir', phase: 'canceled', description: 'Atribuir papéis durante fase cancelada', isAllowed: false },
      
      // Instituição
      { resource: 'instituicao', action: 'ler', phase: 'canceled', description: 'Visualizar instituição durante fase cancelada', isAllowed: true },
      { resource: 'instituicao', action: 'atualizar', phase: 'canceled', description: 'Atualizar instituição durante fase cancelada', isAllowed: false },
      
      // Polos
      { resource: 'polo', action: 'ler', phase: 'canceled', description: 'Visualizar polos durante fase cancelada', isAllowed: true },
      { resource: 'polo', action: 'criar', phase: 'canceled', description: 'Criar polos durante fase cancelada', isAllowed: false },
      { resource: 'polo', action: 'atualizar', phase: 'canceled', description: 'Atualizar polos durante fase cancelada', isAllowed: false },
      { resource: 'polo', action: 'deletar', phase: 'canceled', description: 'Deletar polos durante fase cancelada', isAllowed: false },
      
      // Cursos
      { resource: 'curso', action: 'ler', phase: 'canceled', description: 'Visualizar cursos durante fase cancelada', isAllowed: true },
      { resource: 'curso', action: 'criar', phase: 'canceled', description: 'Criar cursos durante fase cancelada', isAllowed: false },
      { resource: 'curso', action: 'atualizar', phase: 'canceled', description: 'Atualizar cursos durante fase cancelada', isAllowed: false },
      { resource: 'curso', action: 'deletar', phase: 'canceled', description: 'Deletar cursos durante fase cancelada', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', phase: 'canceled', description: 'Visualizar matrículas durante fase cancelada', isAllowed: true },
      { resource: 'matricula', action: 'criar', phase: 'canceled', description: 'Criar matrículas durante fase cancelada', isAllowed: false },
      { resource: 'matricula', action: 'atualizar', phase: 'canceled', description: 'Atualizar matrículas durante fase cancelada', isAllowed: false },
      { resource: 'matricula', action: 'cancelar', phase: 'canceled', description: 'Cancelar matrículas durante fase cancelada', isAllowed: false },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', phase: 'canceled', description: 'Visualizar financeiro durante fase cancelada', isAllowed: true },
      { resource: 'financeiro', action: 'criar', phase: 'canceled', description: 'Criar registros financeiros durante fase cancelada', isAllowed: false },
      { resource: 'financeiro', action: 'atualizar', phase: 'canceled', description: 'Atualizar registros financeiros durante fase cancelada', isAllowed: false },
      
      // Certificados
      { resource: 'certificado', action: 'ler', phase: 'canceled', description: 'Visualizar certificados durante fase cancelada', isAllowed: true },
      { resource: 'certificado', action: 'gerar', phase: 'canceled', description: 'Gerar certificados durante fase cancelada', isAllowed: false },
      
      // Relatórios
      { resource: 'relatorio', action: 'gerar', phase: 'canceled', description: 'Gerar relatórios durante fase cancelada', isAllowed: true },
    ];
    
    // Combinando todas as regras
    const allInstitutionPhaseRules = [
      ...prospectingRules,
      ...onboardingRules,
      ...implementationRules,
      ...activeRules,
      ...suspendedRules,
      ...canceledRules
    ];
    
    // Adicionando isActive = true em todas as regras
    const finalInstitutionPhaseRules = allInstitutionPhaseRules.map(rule => ({
      ...rule,
      isActive: true
    }));
    
    // Insere as regras
    await db.insert(abacSchema.institutionPhasePermissions).values(finalInstitutionPhaseRules);
    console.log(`Inseridas ${finalInstitutionPhaseRules.length} regras de permissão por fase de instituição`);
    
    // Regras de permissão por status de pagamento
    console.log('Criando regras de permissão por status de pagamento...');
    
    // Limpa dados existentes
    await db.delete(abacSchema.paymentStatusPermissions);
    
    // Status: Pendente (pending)
    const pendingRules = [
      // Aulas e materiais
      { resource: 'aula', action: 'acessar', paymentStatus: 'pending', description: 'Acessar aulas quando pagamento está pendente', isAllowed: true },
      { resource: 'material', action: 'baixar', paymentStatus: 'pending', description: 'Baixar materiais quando pagamento está pendente', isAllowed: true },
      { resource: 'aula', action: 'enviar_atividade', paymentStatus: 'pending', description: 'Enviar atividades quando pagamento está pendente', isAllowed: true },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', paymentStatus: 'pending', description: 'Visualizar matrícula quando pagamento está pendente', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', paymentStatus: 'pending', description: 'Atualizar matrícula quando pagamento está pendente', isAllowed: true },
      { resource: 'matricula', action: 'cancelar', paymentStatus: 'pending', description: 'Cancelar matrícula quando pagamento está pendente', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', paymentStatus: 'pending', description: 'Visualizar informações financeiras quando pagamento está pendente', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', paymentStatus: 'pending', description: 'Visualizar certificados quando pagamento está pendente', isAllowed: true },
      { resource: 'certificado', action: 'gerar', paymentStatus: 'pending', description: 'Gerar certificados quando pagamento está pendente', isAllowed: false },
    ];
    
    // Status: Pago (paid)
    const paidRules = [
      // Aulas e materiais
      { resource: 'aula', action: 'acessar', paymentStatus: 'paid', description: 'Acessar aulas quando pagamento está confirmado', isAllowed: true },
      { resource: 'material', action: 'baixar', paymentStatus: 'paid', description: 'Baixar materiais quando pagamento está confirmado', isAllowed: true },
      { resource: 'aula', action: 'enviar_atividade', paymentStatus: 'paid', description: 'Enviar atividades quando pagamento está confirmado', isAllowed: true },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', paymentStatus: 'paid', description: 'Visualizar matrícula quando pagamento está confirmado', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', paymentStatus: 'paid', description: 'Atualizar matrícula quando pagamento está confirmado', isAllowed: true },
      { resource: 'matricula', action: 'cancelar', paymentStatus: 'paid', description: 'Cancelar matrícula quando pagamento está confirmado', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', paymentStatus: 'paid', description: 'Visualizar informações financeiras quando pagamento está confirmado', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', paymentStatus: 'paid', description: 'Visualizar certificados quando pagamento está confirmado', isAllowed: true },
      { resource: 'certificado', action: 'gerar', paymentStatus: 'paid', description: 'Gerar certificados quando pagamento está confirmado', isAllowed: true },
    ];
    
    // Status: Atrasado (overdue)
    const overdueRules = [
      // Aulas e materiais
      { resource: 'aula', action: 'acessar', paymentStatus: 'overdue', description: 'Acessar aulas quando pagamento está atrasado', isAllowed: false },
      { resource: 'material', action: 'baixar', paymentStatus: 'overdue', description: 'Baixar materiais quando pagamento está atrasado', isAllowed: false },
      { resource: 'aula', action: 'enviar_atividade', paymentStatus: 'overdue', description: 'Enviar atividades quando pagamento está atrasado', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', paymentStatus: 'overdue', description: 'Visualizar matrícula quando pagamento está atrasado', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', paymentStatus: 'overdue', description: 'Atualizar matrícula quando pagamento está atrasado', isAllowed: true },
      { resource: 'matricula', action: 'cancelar', paymentStatus: 'overdue', description: 'Cancelar matrícula quando pagamento está atrasado', isAllowed: true },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', paymentStatus: 'overdue', description: 'Visualizar informações financeiras quando pagamento está atrasado', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', paymentStatus: 'overdue', description: 'Visualizar certificados quando pagamento está atrasado', isAllowed: true },
      { resource: 'certificado', action: 'gerar', paymentStatus: 'overdue', description: 'Gerar certificados quando pagamento está atrasado', isAllowed: false },
    ];
    
    // Status: Reembolsado (refunded)
    const refundedRules = [
      // Aulas e materiais
      { resource: 'aula', action: 'acessar', paymentStatus: 'refunded', description: 'Acessar aulas quando pagamento foi reembolsado', isAllowed: false },
      { resource: 'material', action: 'baixar', paymentStatus: 'refunded', description: 'Baixar materiais quando pagamento foi reembolsado', isAllowed: false },
      { resource: 'aula', action: 'enviar_atividade', paymentStatus: 'refunded', description: 'Enviar atividades quando pagamento foi reembolsado', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', paymentStatus: 'refunded', description: 'Visualizar matrícula quando pagamento foi reembolsado', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', paymentStatus: 'refunded', description: 'Atualizar matrícula quando pagamento foi reembolsado', isAllowed: false },
      { resource: 'matricula', action: 'cancelar', paymentStatus: 'refunded', description: 'Cancelar matrícula quando pagamento foi reembolsado', isAllowed: false },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', paymentStatus: 'refunded', description: 'Visualizar informações financeiras quando pagamento foi reembolsado', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', paymentStatus: 'refunded', description: 'Visualizar certificados quando pagamento foi reembolsado', isAllowed: true },
      { resource: 'certificado', action: 'gerar', paymentStatus: 'refunded', description: 'Gerar certificados quando pagamento foi reembolsado', isAllowed: false },
    ];
    
    // Status: Cancelado (canceled)
    const canceledPaymentRules = [
      // Aulas e materiais
      { resource: 'aula', action: 'acessar', paymentStatus: 'canceled', description: 'Acessar aulas quando pagamento foi cancelado', isAllowed: false },
      { resource: 'material', action: 'baixar', paymentStatus: 'canceled', description: 'Baixar materiais quando pagamento foi cancelado', isAllowed: false },
      { resource: 'aula', action: 'enviar_atividade', paymentStatus: 'canceled', description: 'Enviar atividades quando pagamento foi cancelado', isAllowed: false },
      
      // Matrículas
      { resource: 'matricula', action: 'ler', paymentStatus: 'canceled', description: 'Visualizar matrícula quando pagamento foi cancelado', isAllowed: true },
      { resource: 'matricula', action: 'atualizar', paymentStatus: 'canceled', description: 'Atualizar matrícula quando pagamento foi cancelado', isAllowed: false },
      { resource: 'matricula', action: 'cancelar', paymentStatus: 'canceled', description: 'Cancelar matrícula quando pagamento foi cancelado', isAllowed: false },
      
      // Financeiro
      { resource: 'financeiro', action: 'ler', paymentStatus: 'canceled', description: 'Visualizar informações financeiras quando pagamento foi cancelado', isAllowed: true },
      
      // Certificados
      { resource: 'certificado', action: 'ler', paymentStatus: 'canceled', description: 'Visualizar certificados quando pagamento foi cancelado', isAllowed: true },
      { resource: 'certificado', action: 'gerar', paymentStatus: 'canceled', description: 'Gerar certificados quando pagamento foi cancelado', isAllowed: false },
    ];
    
    // Combinando todas as regras
    const allPaymentStatusRules = [
      ...pendingRules,
      ...paidRules,
      ...overdueRules,
      ...refundedRules,
      ...canceledPaymentRules
    ];
    
    // Adicionando isActive = true em todas as regras
    const finalPaymentStatusRules = allPaymentStatusRules.map(rule => ({
      ...rule,
      isActive: true
    }));
    
    // Insere as regras
    await db.insert(abacSchema.paymentStatusPermissions).values(finalPaymentStatusRules);
    console.log(`Inseridas ${finalPaymentStatusRules.length} regras de permissão por status de pagamento`);
    
    console.log('Regras de permissão ABAC criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar regras de permissão:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executa a criação das regras de permissão
createProductionRules()
  .then(() => {
    console.log('Processo de criação de regras de permissão finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na criação de regras de permissão:', error);
    process.exit(1);
  });