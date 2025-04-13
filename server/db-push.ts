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
    
    // Criar tipo enum para status de matrícula
    console.log("Criando tipo enum para status de matrícula...");
    await db.execute(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
          CREATE TYPE enrollment_status AS ENUM ('pending_payment', 'active', 'completed', 'cancelled', 'suspended');
        END IF;
      END $$;
    `);
    
    // Criar tipo enum para gateway de pagamento
    console.log("Criando tipo enum para gateway de pagamento...");
    await db.execute(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
          CREATE TYPE payment_gateway AS ENUM ('asaas', 'lytex');
        END IF;
      END $$;
    `);
    
    // Criar tabela de matrículas
    console.log("Criando tabela de matrículas...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        student_id INTEGER NOT NULL REFERENCES users(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        polo_id INTEGER REFERENCES polos(id),
        institution_id INTEGER NOT NULL REFERENCES institutions(id),
        partner_id INTEGER REFERENCES users(id),
        
        amount DECIMAL(10, 2) NOT NULL,
        payment_gateway payment_gateway NOT NULL,
        payment_external_id TEXT,
        payment_url TEXT,
        payment_method TEXT,
        
        enrollment_date TIMESTAMP NOT NULL DEFAULT NOW(),
        start_date TIMESTAMP,
        expected_end_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        
        status enrollment_status NOT NULL DEFAULT 'pending_payment',
        observations TEXT,
        
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Criar tabela de histórico de status de matrículas
    console.log("Criando tabela de histórico de status de matrículas...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enrollment_status_history (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
        previous_status enrollment_status,
        new_status enrollment_status NOT NULL,
        change_date TIMESTAMP NOT NULL DEFAULT NOW(),
        change_reason TEXT,
        changed_by_id INTEGER REFERENCES users(id),
        metadata JSONB
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