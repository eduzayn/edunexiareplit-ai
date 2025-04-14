// add-subscription-plans-migration.ts
import { db } from "./server/db";
import { subscriptionPlans } from "./shared/schema";
import * as process from "process";

async function runMigration() {
  try {
    console.log("Iniciando migração de planos de assinatura...");
    
    // Verificar se existem planos
    const existingPlans = await db.query.subscriptionPlans.findMany();
    
    if (existingPlans.length === 0) {
      console.log("Criando planos de assinatura padrão...");
      
      // Plano Básico
      await db.insert(subscriptionPlans).values({
        name: "Plano Básico",
        code: "basic",
        description: "Plano ideal para instituições iniciantes, com recursos essenciais para gerenciamento educacional.",
        price: 99.90,
        billingCycle: "monthly",
        trialDays: 14,
        maxStudents: 50,
        maxCourses: 5,
        maxPolos: 1,
        hasFinanceModule: false,
        hasCrmModule: false,
        hasMultiChannelChat: false,
        hasAdvancedReports: false,
        hasApiAccess: false,
        hasPrioritySupportl: false,
        isActive: true,
        isFeatured: false,
        displayOrder: 1
      });
      
      // Plano Intermediário
      await db.insert(subscriptionPlans).values({
        name: "Plano Intermediário",
        code: "standard",
        description: "Recursos avançados para instituições em crescimento, incluindo módulos de CRM e finanças.",
        price: 199.90,
        billingCycle: "monthly",
        trialDays: 14,
        maxStudents: 200,
        maxCourses: 20,
        maxPolos: 3,
        hasFinanceModule: true,
        hasCrmModule: true,
        hasMultiChannelChat: false,
        hasAdvancedReports: false,
        hasApiAccess: false,
        hasPrioritySupportl: false,
        isActive: true,
        isFeatured: true,
        displayOrder: 2
      });
      
      // Plano Avançado
      await db.insert(subscriptionPlans).values({
        name: "Plano Avançado",
        code: "advanced",
        description: "Solução completa para instituições estabelecidas, com todos os recursos e suporte prioritário.",
        price: 349.90,
        billingCycle: "monthly",
        trialDays: 14,
        maxStudents: 500,
        maxCourses: 50,
        maxPolos: 10,
        hasFinanceModule: true,
        hasCrmModule: true,
        hasMultiChannelChat: true,
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasPrioritySupportl: true,
        isActive: true,
        isFeatured: false,
        displayOrder: 3
      });
      
      // Plano Empresarial
      await db.insert(subscriptionPlans).values({
        name: "Plano Empresarial",
        code: "enterprise",
        description: "Para grandes instituições com necessidades específicas e volumes elevados de alunos.",
        price: 699.90,
        billingCycle: "monthly",
        trialDays: 14,
        maxStudents: 2000,
        maxCourses: 100,
        maxPolos: 30,
        hasFinanceModule: true,
        hasCrmModule: true,
        hasMultiChannelChat: true,
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasPrioritySupportl: true,
        isActive: true,
        isFeatured: false,
        displayOrder: 4
      });
      
      console.log("Planos de assinatura padrão criados com sucesso!");
    } else {
      console.log(`Já existem ${existingPlans.length} planos de assinatura cadastrados. Nenhuma ação necessária.`);
    }
    
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a migração:", error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log("Script de migração executado com sucesso.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro ao executar script de migração:", err);
    process.exit(1);
  });