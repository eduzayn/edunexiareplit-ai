import { db, pool } from "./db";
import * as schema from "../shared/schema";

// Este script aplica automaticamente o schema ao banco de dados
async function main() {
  console.log("Aplicando schema ao banco de dados...");
  
  try {
    // Criar tabelas para polos
    console.log("Criando tabela de polos...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS polos (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        institution_id INTEGER NOT NULL REFERENCES institutions(id),
        manager_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        status TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Criar tabelas para transações financeiras
    console.log("Criando tabela de transações financeiras...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        institution_id INTEGER NOT NULL REFERENCES institutions(id),
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Criar tabelas para categorias financeiras
    console.log("Criando tabela de categorias financeiras...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        institution_id INTEGER NOT NULL REFERENCES institutions(id),
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("Schema aplicado com sucesso!");
  } catch (error) {
    console.error("Erro ao aplicar schema:", error);
    process.exit(1);
  }
  
  console.log("Processo concluído!");
  await pool.end();
}

main();