import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Iniciando migração para adicionar a coluna polo_id na tabela users...');
    
    // Verifica se a coluna já existe
    const checkColumnQuery = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'polo_id'
    `);
    
    if (checkColumnQuery.rows.length === 0) {
      // Adiciona a coluna polo_id
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN polo_id INTEGER REFERENCES polos(id)
      `);
      console.log('Coluna polo_id adicionada com sucesso à tabela users!');
    } else {
      console.log('A coluna polo_id já existe na tabela users.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();