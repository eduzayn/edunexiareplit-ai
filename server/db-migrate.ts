import { db, pool } from "./db";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

// Este script aplica automaticamente todas as migrações ao banco de dados
async function main() {
  console.log("Iniciando migração do banco de dados...");
  
  // Lista de tabelas a serem migradas
  const tables = [
    "polos",
    "financial_transactions",
    "financial_categories"
  ];
  
  // Migrar o banco de dados
  console.log("Aplicando migrações...");
  
  try {
    // O migrate() vem da biblioteca drizzle-orm e aplica as migrações diretamente
    // sem precisar de entrada do usuário
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrações aplicadas com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar migrações:", error);
    process.exit(1);
  }
  
  console.log("Migração concluída!");
  await pool.end();
}

main();