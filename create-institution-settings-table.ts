/**
 * Migração para criar a tabela de configurações de instituições
 * Execução: npm run ts-node create-institution-settings-table.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';
import 'dotenv/config';

async function runMigration() {
  try {
    console.log('Iniciando migração para criar a tabela institution_settings...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
    }
    
    const sql = postgres(connectionString);
    const db = drizzle(sql, { schema });
    
    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'institution_settings'
      );
    `;
    
    const tableExists = await sql.unsafe(checkTableQuery);
    if (tableExists[0].exists) {
      console.log('Tabela institution_settings já existe. Pulando criação.');
    } else {
      // Criar tabela
      const createTableQuery = `
        CREATE TABLE "institution_settings" (
          "id" SERIAL PRIMARY KEY,
          "institution_id" INTEGER NOT NULL REFERENCES "institutions"("id") ON DELETE CASCADE,
          "key" VARCHAR(255) NOT NULL,
          "value" TEXT NOT NULL,
          "encrypted" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now()
        );
      `;
      
      await sql.unsafe(createTableQuery);
      console.log('Tabela institution_settings criada com sucesso!');
      
      // Criar índice único
      const createIndexQuery = `
        CREATE UNIQUE INDEX "institution_key_idx" ON "institution_settings" ("institution_id", "key");
      `;
      
      await sql.unsafe(createIndexQuery);
      console.log('Índice institution_key_idx criado com sucesso!');
    }
    
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

runMigration();