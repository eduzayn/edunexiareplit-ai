import postgres from "postgres";
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import "dotenv/config";

/**
 * Migração para adicionar a coluna asaasId à tabela clients
 * Essa coluna armazenará o ID do cliente no sistema Asaas
 */
async function runMigration() {
  try {
    console.log("Iniciando migração para adicionar asaasId à tabela clients...");
    
    // Configurar conexão com o banco de dados
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client);
    
    // Adicionar coluna asaasId
    await db.execute(sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS asaas_id text;
    `);
    
    console.log("Coluna asaasId adicionada com sucesso!");
    
    // Encerrar conexão
    await client.end();
    
    return { success: true, message: "Migração concluída com sucesso!" };
  } catch (error) {
    console.error("Erro durante a migração:", error);
    return { success: false, message: "Erro durante a migração", error };
  }
}

// Executar a migração
runMigration()
  .then((result) => {
    console.log(result.message);
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro inesperado:", err);
    process.exit(1);
  });