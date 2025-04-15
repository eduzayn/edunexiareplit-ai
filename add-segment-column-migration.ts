import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar conexão com o banco de dados
const sql_url = process.env.DATABASE_URL || '';
const client = neon(sql_url);
const db = drizzle(client);

/**
 * Migração para adicionar a coluna segment à tabela clients
 */
async function runMigration() {
  try {
    console.log('Iniciando migração para adicionar coluna segment na tabela clients');
    
    // Verificar se a coluna já existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'segment';
    `);
    
    if (checkColumn.rowCount > 0) {
      console.log('A coluna segment já existe na tabela clients');
      return;
    }
    
    // Adicionar a coluna segment
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN segment TEXT;
    `);
    
    console.log('Coluna segment adicionada com sucesso à tabela clients');
  } catch (error) {
    console.error('Erro na migração:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar a migração
runMigration()
  .then(() => {
    console.log('Migração concluída com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na migração:', error);
    process.exit(1);
  });