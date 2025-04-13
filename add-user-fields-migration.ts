import { db, pool } from './server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Iniciando migração para adicionar novos campos à tabela de usuários...');

  try {
    // Verificar se as colunas já existem antes de adicioná-las
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone', 'address', 'city', 'state', 'zip_code', 'birth_date');
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    // Adicionar colunas que não existem
    if (!existingColumns.includes('phone')) {
      console.log('Adicionando coluna phone...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`);
    }
    
    if (!existingColumns.includes('address')) {
      console.log('Adicionando coluna address...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`);
    }
    
    if (!existingColumns.includes('city')) {
      console.log('Adicionando coluna city...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;`);
    }
    
    if (!existingColumns.includes('state')) {
      console.log('Adicionando coluna state...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;`);
    }
    
    if (!existingColumns.includes('zip_code')) {
      console.log('Adicionando coluna zip_code...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code TEXT;`);
    }
    
    if (!existingColumns.includes('birth_date')) {
      console.log('Adicionando coluna birth_date...');
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date TEXT;`);
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration();