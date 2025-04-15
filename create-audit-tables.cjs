const { Pool } = require('pg');
require('dotenv').config();

async function createAuditTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Iniciando criação das tabelas de auditoria...');

    // Criar enum para tipos de ação
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE audit_action_type AS ENUM (
          'create', 'update', 'delete', 'grant', 'revoke', 'login', 'logout', 'view', 'assign', 'unassign'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para tipos de entidade
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE audit_entity_type AS ENUM (
          'user', 'role', 'permission', 'role_permission', 'user_role', 'user_permission',
          'institution', 'polo', 'lead', 'client', 'invoice', 'payment', 'contract', 'subscription'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar tabela de auditoria de permissões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permission_audit (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        action_type audit_action_type NOT NULL,
        entity_type audit_entity_type NOT NULL,
        entity_id INTEGER NOT NULL,
        resource_type TEXT,
        description TEXT NOT NULL,
        old_value JSONB,
        new_value JSONB,
        metadata JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Criar índices para melhorar a performance das consultas
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON permission_audit(user_id);
      CREATE INDEX IF NOT EXISTS idx_permission_audit_action_type ON permission_audit(action_type);
      CREATE INDEX IF NOT EXISTS idx_permission_audit_entity_type ON permission_audit(entity_type);
      CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON permission_audit(created_at);
    `);

    console.log('Tabelas de auditoria criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas de auditoria:', error);
  } finally {
    await pool.end();
  }
}

createAuditTables().catch(console.error);