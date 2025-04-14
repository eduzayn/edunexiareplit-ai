// update-institutions-migration.ts
import { db } from "./server/db";
import { subscriptionPlans, institutions } from "./shared/schema";
import { eq } from "drizzle-orm";
import * as process from "process";

async function runMigration() {
  try {
    console.log("Iniciando migração para atualizar instituições...");
    
    // Verificar se há um plano básico
    const basicPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.code, "basic")
    });
    
    if (!basicPlan) {
      console.error("Plano básico não encontrado. Execute primeiro a migração de planos de assinatura.");
      process.exit(1);
    }
    
    // Buscar instituições sem plano definido
    const allInstitutions = await db.query.institutions.findMany();
    let updatedCount = 0;
    
    for (const institution of allInstitutions) {
      if (!institution.currentPlanId) {
        await db.update(institutions)
          .set({
            currentPlanId: basicPlan.id,
            isOnTrial: true,
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 dias a partir de agora
          })
          .where(eq(institutions.id, institution.id));
        
        updatedCount++;
      }
    }
    
    console.log(`${updatedCount} instituições atualizadas com o plano básico e período trial.`);
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