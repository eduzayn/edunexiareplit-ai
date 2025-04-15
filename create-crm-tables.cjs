// Script para criar as tabelas do CRM
const { neon } = require("@neondatabase/serverless");
const { drizzle } = require("drizzle-orm/neon-serverless");
require("dotenv").config();

// Conexão com o banco de dados
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function runMigration() {
  console.log("Iniciando criação das tabelas do CRM...");

  try {
    // Criar enum leadStatusEnum se não existir
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
          CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'inactive');
        END IF;
      END
      $$;
    `;
    console.log("Enum leadStatusEnum criado ou já existente.");

    // Criar enum clientTypeEnum se não existir
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_type') THEN
          CREATE TYPE client_type AS ENUM ('pf', 'pj');
        END IF;
      END
      $$;
    `;
    console.log("Enum clientTypeEnum criado ou já existente.");

    // Criar tabela leads
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        position TEXT,
        source TEXT,
        status lead_status NOT NULL DEFAULT 'new',
        score INTEGER,
        last_contact_date TIMESTAMP,
        next_contact_date TIMESTAMP,
        assigned_to_id INTEGER REFERENCES users(id),
        institution_id INTEGER REFERENCES institutions(id),
        notes TEXT,
        interests JSONB,
        segment TEXT,
        metadata JSONB,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Tabela leads criada ou já existente.");

    // Criar tabela clients
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type client_type NOT NULL DEFAULT 'pf',
        email TEXT NOT NULL,
        phone TEXT,
        document TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        segment TEXT,
        institution_id INTEGER REFERENCES institutions(id),
        assigned_to_id INTEGER REFERENCES users(id),
        
        -- Para clientes PJ
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        
        -- Financeiro
        payment_terms TEXT,
        credit_limit DOUBLE PRECISION,
        
        -- Metadados
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        metadata JSONB,
        
        -- Auditoria
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Tabela clients criada ou já existente.");

    // Criar tabela contacts
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        position TEXT,
        department TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        institution_id INTEGER REFERENCES institutions(id),
        
        -- Metadados
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        
        -- Auditoria
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Tabela contacts criada ou já existente.");

    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao executar a migração:", error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log("Script concluído.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao executar o script:", error);
    process.exit(1);
  });