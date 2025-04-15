import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Configurações do banco de dados
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('A variável de ambiente DATABASE_URL não está definida');
  process.exit(1);
}

/**
 * Migração para adicionar a coluna is_allowed nas tabelas de permissões ABAC
 */
async function runMigration() {
  console.log('Iniciando migração para adicionar coluna is_allowed nas tabelas ABAC...');
  
  // Conecta ao banco de dados
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Verifica se a coluna is_allowed existe na tabela institution_phase_permissions
    const checkInstitutionPhaseColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'institution_phase_permissions' 
      AND column_name = 'is_allowed'
    `);

    // Adiciona a coluna is_allowed à tabela institution_phase_permissions se ela não existir
    if (checkInstitutionPhaseColumn.length === 0) {
      console.log('Adicionando coluna is_allowed à tabela institution_phase_permissions...');
      await db.execute(sql`
        ALTER TABLE institution_phase_permissions 
        ADD COLUMN is_allowed BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log('Coluna is_allowed adicionada com sucesso à tabela institution_phase_permissions');
    } else {
      console.log('A coluna is_allowed já existe na tabela institution_phase_permissions');
    }

    // Verifica se a coluna is_allowed existe na tabela payment_status_permissions
    const checkPaymentStatusColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_status_permissions' 
      AND column_name = 'is_allowed'
    `);

    // Adiciona a coluna is_allowed à tabela payment_status_permissions se ela não existir
    if (checkPaymentStatusColumn.length === 0) {
      console.log('Adicionando coluna is_allowed à tabela payment_status_permissions...');
      await db.execute(sql`
        ALTER TABLE payment_status_permissions 
        ADD COLUMN is_allowed BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log('Coluna is_allowed adicionada com sucesso à tabela payment_status_permissions');
    } else {
      console.log('A coluna is_allowed já existe na tabela payment_status_permissions');
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executa a migração
runMigration()
  .then(() => {
    console.log('Processo de migração finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na migração:', error);
    process.exit(1);
  });