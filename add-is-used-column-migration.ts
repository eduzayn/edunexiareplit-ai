/**
 * Migração para adicionar a coluna is_used à tabela checkout_links
 * Essa coluna indica se o link de checkout já foi utilizado pelo cliente
 */
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Iniciando migração para adicionar coluna is_used à tabela checkout_links...');
  
  try {
    // Verificar se a coluna já existe
    const checkColumnExistsResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'checkout_links' AND column_name = 'is_used'
    `);
    
    if (checkColumnExistsResult.rows.length > 0) {
      console.log('A coluna is_used já existe na tabela checkout_links.');
      return;
    }
    
    // Adicionar a coluna is_used
    await db.execute(sql`
      ALTER TABLE checkout_links
      ADD COLUMN is_used BOOLEAN NOT NULL DEFAULT FALSE
    `);
    
    console.log('Coluna is_used adicionada à tabela checkout_links com sucesso.');
    
    // Atualiza os checkouts já usados (com status confirmado ou pago)
    await db.execute(sql`
      UPDATE checkout_links
      SET is_used = TRUE
      WHERE status IN ('confirmed', 'paid', 'CONFIRMED', 'PAID')
    `);
    
    console.log('Checkouts com status confirmado ou pago marcados como usados.');
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  }
}

// Executar a migração
runMigration()
  .then(() => {
    console.log('Migração executada com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  });