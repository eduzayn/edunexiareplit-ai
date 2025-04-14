// create-subscription-tables.cjs
require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('url');

async function createTables() {
  // Configuração da conexão com o banco de dados
  let connectionString = process.env.DATABASE_URL;
  let config;

  if (connectionString) {
    console.log("Usando string de conexão do DATABASE_URL");
    const url = parse(connectionString);
    config = {
      user: url.auth ? url.auth.split(':')[0] : undefined,
      password: url.auth ? url.auth.split(':')[1] : undefined,
      host: url.hostname,
      port: url.port,
      database: url.pathname ? url.pathname.substring(1) : undefined,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    throw new Error("DATABASE_URL não está definido no arquivo .env");
  }

  const pool = new Pool(config);

  try {
    console.log('Conectando ao banco de dados...');
    await pool.connect();
    console.log('Conectado com sucesso!');

    console.log('Verificando existência das tabelas...');
    
    // Verificar se a tabela subscription_plans já existe
    const plansTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscription_plans'
      );
    `);
    
    if (!plansTableExists.rows[0].exists) {
      console.log('Criando tabela subscription_plans...');
      
      // Criar enum subscription_status se não existir
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
            CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired');
          END IF;
        END
        $$;
      `);
      
      // Criar tabela de planos
      await pool.query(`
        CREATE TABLE subscription_plans (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL,
          billing_cycle TEXT NOT NULL,
          trial_days INTEGER DEFAULT 0,
          max_students INTEGER NOT NULL,
          max_courses INTEGER,
          max_polos INTEGER,
          has_finance_module BOOLEAN DEFAULT FALSE,
          has_crm_module BOOLEAN DEFAULT FALSE,
          has_multi_channel_chat BOOLEAN DEFAULT FALSE,
          has_advanced_reports BOOLEAN DEFAULT FALSE,
          has_api_access BOOLEAN DEFAULT FALSE,
          has_priority_support BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE NOT NULL,
          is_featured BOOLEAN DEFAULT FALSE,
          display_order INTEGER DEFAULT 0,
          created_by_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      console.log('Tabela subscription_plans criada com sucesso!');
      
      // Inserir planos padrão
      console.log('Inserindo planos padrão...');
      
      await pool.query(`
        INSERT INTO subscription_plans 
        (name, code, description, price, billing_cycle, trial_days, max_students, max_courses, max_polos, 
        has_finance_module, has_crm_module, has_multi_channel_chat, has_advanced_reports, has_api_access, has_priority_support, 
        is_active, is_featured, display_order)
        VALUES 
        ('Plano Básico', 'basic', 'Plano ideal para instituições iniciantes, com recursos essenciais para gerenciamento educacional.', 
        99.90, 'monthly', 14, 50, 5, 1, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, 1),
        
        ('Plano Intermediário', 'standard', 'Recursos avançados para instituições em crescimento, incluindo módulos de CRM e finanças.', 
        199.90, 'monthly', 14, 200, 20, 3, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, 2),
        
        ('Plano Avançado', 'advanced', 'Solução completa para instituições estabelecidas, com todos os recursos e suporte prioritário.', 
        349.90, 'monthly', 14, 500, 50, 10, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 3),
        
        ('Plano Empresarial', 'enterprise', 'Para grandes instituições com necessidades específicas e volumes elevados de alunos.', 
        699.90, 'monthly', 14, 2000, 100, 30, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 4);
      `);
      
      console.log('Planos padrão inseridos com sucesso!');
    } else {
      console.log('Tabela subscription_plans já existe, pulando criação...');
    }

    // Verificar se a tabela subscriptions já existe
    const subscriptionsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscriptions'
      );
    `);
    
    if (!subscriptionsTableExists.rows[0].exists) {
      console.log('Criando tabela subscriptions...');
      
      await pool.query(`
        CREATE TABLE subscriptions (
          id SERIAL PRIMARY KEY,
          institution_id INTEGER REFERENCES institutions(id),
          plan_id INTEGER REFERENCES subscription_plans(id),
          status subscription_status DEFAULT 'trial' NOT NULL,
          start_date TIMESTAMP DEFAULT NOW() NOT NULL,
          end_date TIMESTAMP,
          trial_ends_at TIMESTAMP,
          current_period_start TIMESTAMP,
          current_period_end TIMESTAMP,
          canceled_at TIMESTAMP,
          billing_cycle TEXT,
          price DOUBLE PRECISION,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      console.log('Tabela subscriptions criada com sucesso!');
    } else {
      console.log('Tabela subscriptions já existe, pulando criação...');
    }
    
    // Adicionar campo current_plan_id à tabela institutions, se ainda não existir
    console.log('Verificando coluna current_plan_id na tabela institutions...');
    
    const currentPlanIdExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'institutions' AND column_name = 'current_plan_id'
      );
    `);
    
    if (!currentPlanIdExists.rows[0].exists) {
      console.log('Adicionando coluna current_plan_id à tabela institutions...');
      
      await pool.query(`
        ALTER TABLE institutions 
        ADD COLUMN current_plan_id INTEGER REFERENCES subscription_plans(id);
      `);
      
      console.log('Coluna current_plan_id adicionada com sucesso!');
    } else {
      console.log('Coluna current_plan_id já existe, pulando criação...');
    }
    
    // Verificar campos para gerenciamento de trial na tabela institutions
    const trialFieldsExist = await pool.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'institutions' AND column_name = 'is_on_trial') as is_on_trial_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'institutions' AND column_name = 'trial_start_date') as trial_start_date_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'institutions' AND column_name = 'trial_end_date') as trial_end_date_exists
    `);
    
    const { is_on_trial_exists, trial_start_date_exists, trial_end_date_exists } = trialFieldsExist.rows[0];
    
    // Adicionar campos que faltam, se necessário
    if (!is_on_trial_exists) {
      console.log('Adicionando coluna is_on_trial à tabela institutions...');
      await pool.query(`ALTER TABLE institutions ADD COLUMN is_on_trial BOOLEAN DEFAULT FALSE;`);
    }
    
    if (!trial_start_date_exists) {
      console.log('Adicionando coluna trial_start_date à tabela institutions...');
      await pool.query(`ALTER TABLE institutions ADD COLUMN trial_start_date TIMESTAMP;`);
    }
    
    if (!trial_end_date_exists) {
      console.log('Adicionando coluna trial_end_date à tabela institutions...');
      await pool.query(`ALTER TABLE institutions ADD COLUMN trial_end_date TIMESTAMP;`);
    }
    
    // Atualizar instituições existentes para terem plano básico e período trial
    console.log('Atualizando instituições existentes para o plano básico...');
    
    // Primeiro verificar se existem instituições sem plano atual
    const institutionsWithoutPlan = await pool.query(`
      SELECT id FROM institutions WHERE current_plan_id IS NULL;
    `);
    
    if (institutionsWithoutPlan.rows.length > 0) {
      // Obter ID do plano básico
      const basicPlan = await pool.query(`SELECT id FROM subscription_plans WHERE code = 'basic' LIMIT 1;`);
      
      if (basicPlan.rows.length > 0) {
        const basicPlanId = basicPlan.rows[0].id;
        
        // Atualizar todas as instituições que não têm plano
        await pool.query(`
          UPDATE institutions
          SET 
            current_plan_id = $1,
            is_on_trial = TRUE,
            trial_start_date = NOW(),
            trial_end_date = NOW() + INTERVAL '14 days'
          WHERE current_plan_id IS NULL;
        `, [basicPlanId]);
        
        console.log(`${institutionsWithoutPlan.rows.length} instituições atualizadas com o plano básico!`);
      } else {
        console.log('Plano básico não encontrado. Verifique se os planos foram inseridos corretamente.');
      }
    } else {
      console.log('Não há instituições sem plano atual.');
    }

    console.log('Migração concluída com sucesso!');

  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    console.log('Fechando conexão com o banco de dados...');
    await pool.end();
    console.log('Conexão fechada!');
  }
}

createTables()
  .then(() => {
    console.log('Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar o script:', error);
    process.exit(1);
  });