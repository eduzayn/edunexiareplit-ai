/**
 * Migração para adicionar o campo client_id à tabela checkout_links
 * Isso permitirá vincular uma cobrança diretamente a um cliente
 */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  // Configuração da conexão com o banco
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString as string);
  const db = drizzle(client);

  try {
    console.log('Iniciando migração para adicionar client_id na tabela checkout_links...');

    // Verifica se a coluna já existe para evitar erros
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'checkout_links' AND column_name = 'client_id'
    `;
    
    const existingColumn = await db.execute(checkColumnQuery);
    
    if (existingColumn && existingColumn.rows && existingColumn.rows.length > 0) {
      console.log('Coluna client_id já existe na tabela checkout_links');
      await client.end();
      return;
    }

    // Adiciona a coluna client_id com referência à tabela clients
    await db.execute(sql`
      ALTER TABLE checkout_links
      ADD COLUMN client_id INTEGER REFERENCES clients(id)
    `);

    console.log('Coluna client_id adicionada com sucesso!');

    // Atualiza os registros existentes, associando checkouts aos clientes criados a partir de leads
    await db.execute(sql`
      UPDATE checkout_links AS cl
      SET client_id = c.id
      FROM clients AS c
      WHERE c.created_from_lead_id = cl.lead_id
    `);

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

runMigration()
  .then(() => {
    console.log('Migração finalizada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal durante a migração:', error);
    process.exit(1);
  });