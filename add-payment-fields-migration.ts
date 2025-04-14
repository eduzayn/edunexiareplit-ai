import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

async function runMigration() {
  // Conexão com o banco de dados
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Iniciando migração: Adicionando campos de integração ao Asaas nas tabelas de pagamento...');

  try {
    // Adicionar campo asaasId na tabela payments
    await db.execute(sql`
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