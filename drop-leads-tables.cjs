/**
 * Script para remover tabelas relacionadas a leads e criar a nova estrutura
 * Execução: node drop-leads-tables.cjs
 */
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Iniciar uma transação para garantir que todas as operações sejam executadas juntas
    await client.query('BEGIN');

    // Verificar se as tabelas existem
    const checkLeadsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'leads'
      )
    `);

    if (checkLeadsTable.rows[0].exists) {
      console.log('Removendo tabelas existentes relacionadas a leads...');
      
      // Remover possíveis constraints que referenciam a tabela leads
      await client.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT conname, conrelid::regclass AS table_name
                    FROM pg_constraint
                    WHERE confrelid = 'leads'::regclass)
          LOOP
            EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.conname;
          END LOOP;
        END $$;
      `);
      
      // Remover tabelas existentes
      await client.query('DROP TABLE IF EXISTS lead_notes CASCADE');
      await client.query('DROP TABLE IF EXISTS lead_activities CASCADE');
      await client.query('DROP TABLE IF EXISTS lead_tags CASCADE');
      await client.query('DROP TABLE IF EXISTS leads CASCADE');
      
      console.log('Tabelas antigas removidas com sucesso');
    } else {
      console.log('Tabela leads não existe, pulando remoção');
    }

    // Criar novas tabelas
    console.log('Criando novas tabelas...');

    // Nova tabela de leads
    await client.query(`
      CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        origin TEXT,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        client_id INTEGER REFERENCES clients(id),
        assigned_to INTEGER REFERENCES users(id),
        last_contact_date TIMESTAMP
      )
    `);

    // Tabela de links de checkout para leads
    await client.query(`
      CREATE TABLE checkout_links (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        checkout_url TEXT NOT NULL,
        checkout_id TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        course_id INTEGER REFERENCES courses(id),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);

    // Tabela para acompanhamento de atividades (histórico)
    await client.query(`
      CREATE TABLE lead_activities (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by INTEGER REFERENCES users(id)
      )
    `);

    // Commit da transação
    await client.query('COMMIT');
    console.log('Novas tabelas criadas com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao executar migração:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Conexão encerrada');
  }
}

runMigration()
  .then(() => {
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na migração:', error);
    process.exit(1);
  });