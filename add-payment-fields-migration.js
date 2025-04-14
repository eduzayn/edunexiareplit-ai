// Script de migração para adicionar campos de integração do Asaas na tabela payments
require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
  // Conexão com o banco de dados
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Iniciando migração: Adicionando campos de integração ao Asaas nas tabelas de pagamento...');

  try {
    // Adicionar campo asaasId na tabela payments
    await pool.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS asaas_id text,
      ADD COLUMN IF NOT EXISTS payment_url text,
      ADD COLUMN IF NOT EXISTS payment_link_url text,
      ADD COLUMN IF NOT EXISTS bank_slip_url text,
      ADD COLUMN IF NOT EXISTS pix_qr_code_url text,
      ADD COLUMN IF NOT EXISTS pix_code_text text
    `);

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

// Executar migração
runMigration().catch(console.error);