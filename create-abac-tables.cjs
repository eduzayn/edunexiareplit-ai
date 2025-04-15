require('dotenv').config();
const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');

async function createAbacTables() {
  console.log('Criando tabelas do sistema ABAC...');
  
  // Conexão com o banco de dados
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Enum para fase de instituição
    await sql`
      DO $$ BEGIN
        CREATE TYPE institution_phase AS ENUM (
          'prospecting', 'onboarding', 'implementation', 
          'active', 'suspended', 'canceled'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `;
    console.log('Enum institution_phase criado ou já existente');
    
    // Enum para tipo de período
    await sql`
      DO $$ BEGIN
        CREATE TYPE period_type AS ENUM (
          'financial', 'academic', 'enrollment', 'certification'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `;
    console.log('Enum period_type criado ou já existente');
    
    // Enum para status de pagamento
    await sql`
      DO $$ BEGIN
        CREATE TYPE payment_status_enum AS ENUM (
          'pending', 'paid', 'overdue', 'refunded', 'canceled'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `;
    console.log('Enum payment_status_enum criado ou já existente');
    
    // Tabela de permissões baseadas em fase de instituição
    await sql`
      CREATE TABLE IF NOT EXISTS institution_phase_permissions (
        id SERIAL PRIMARY KEY,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        phase institution_phase NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;
    console.log('Tabela institution_phase_permissions criada ou já existente');
    
    // Tabela de períodos financeiros/acadêmicos
    await sql`
      CREATE TABLE IF NOT EXISTS financial_periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type period_type NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        institution_id INTEGER REFERENCES institutions(id),
        polo_id INTEGER REFERENCES polos(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;
    console.log('Tabela financial_periods criada ou já existente');
    
    // Tabela de regras de permissão baseadas em período
    await sql`
      CREATE TABLE IF NOT EXISTS period_permission_rules (
        id SERIAL PRIMARY KEY,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        period_type period_type NOT NULL,
        days_before_start INTEGER NOT NULL DEFAULT 0,
        days_after_end INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;
    console.log('Tabela period_permission_rules criada ou já existente');
    
    // Tabela de permissões baseadas em status de pagamento
    await sql`
      CREATE TABLE IF NOT EXISTS payment_status_permissions (
        id SERIAL PRIMARY KEY,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        payment_status payment_status_enum NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;
    console.log('Tabela payment_status_permissions criada ou já existente');
    
    // Adicionar campo phase à tabela institutions
    await sql`
      DO $$ 
      BEGIN
        ALTER TABLE institutions ADD COLUMN phase institution_phase DEFAULT 'prospecting';
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
    `;
    console.log('Campo phase adicionado à tabela institutions ou já existente');
    
    console.log('Tabelas ABAC criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas ABAC:', error);
  }
}

createAbacTables()
  .then(() => {
    console.log('Processo de criação de tabelas ABAC concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no processo de criação de tabelas ABAC:', error);
    process.exit(1);
  });