/**
 * Script para criar as novas tabelas do sistema de leads com integração Asaas
 * 
 * Este script cria as tabelas:
 * - leads: registros de potenciais clientes
 * - lead_activities: registro de interações com leads (notas, ligações, etc)
 * - checkout_links: links de pagamento Asaas associados a leads
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definida nas variáveis de ambiente');
  process.exit(1);
}

async function runMigration() {
  const connectionString = DATABASE_URL;
  const sql = postgres(connectionString, { 
    max: 1,
    ssl: 'require'
  });
  
  const db = drizzle(sql);
  
  try {
    console.log('Conectado ao banco de dados. Iniciando criação das tabelas...');
    
    // Cria a tabela leads
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        course VARCHAR(255),
        source VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        converted_to_client_id INTEGER,
        created_by_id INTEGER,
        updated_by_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
    `);
    console.log('✅ Tabela leads criada com sucesso');
    
    // Cria a tabela lead_activities
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lead_activities (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        created_by_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
      CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);
    `);
    console.log('✅ Tabela lead_activities criada com sucesso');
    
    // Cria a tabela checkout_links
    await db.execute(`
      CREATE TABLE IF NOT EXISTS checkout_links (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        course_id INTEGER,
        product_id INTEGER,
        asaas_checkout_id VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        expiration_time INTEGER NOT NULL DEFAULT 30,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        url VARCHAR(1000) NOT NULL,
        created_by_id INTEGER,
        updated_by_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_checkout_links_lead_id ON checkout_links(lead_id);
      CREATE INDEX IF NOT EXISTS idx_checkout_links_asaas_id ON checkout_links(asaas_checkout_id);
      CREATE INDEX IF NOT EXISTS idx_checkout_links_status ON checkout_links(status);
      CREATE INDEX IF NOT EXISTS idx_checkout_links_created_at ON checkout_links(created_at);
    `);
    console.log('✅ Tabela checkout_links criada com sucesso');
    
    // Adiciona coluna em clients para rastrear a origem do cliente (a partir de qual lead)
    await db.execute(`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS created_from_lead_id INTEGER REFERENCES leads(id);
      
      CREATE INDEX IF NOT EXISTS idx_clients_created_from_lead_id ON clients(created_from_lead_id);
    `);
    console.log('✅ Coluna created_from_lead_id adicionada à tabela clients');
    
    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await sql.end();
  }
}

runMigration().catch(err => {
  console.error('❌ Erro ao executar migração:', err);
  process.exit(1);
});