// Script para criar as tabelas de permissões no banco de dados
// Necessário executar antes do script de criação de permissões e papéis
// Execute com: node create-permission-tables.cjs

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createPermissionTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Criando tabelas do sistema de permissões...');
    
    // 1. Tabela de permissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela "permissions" criada.');
    
    // 2. Tabela de papéis (roles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        scope VARCHAR(50) NOT NULL, -- 'global', 'institution', 'polo'
        institution_id INTEGER REFERENCES institutions(id),
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela "roles" criada.');
    
    // 3. Tabela de associação entre papéis e permissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela "role_permissions" criada.');
    
    // 4. Tabela de associação entre usuários e papéis
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        institution_id INTEGER REFERENCES institutions(id),
        polo_id INTEGER REFERENCES polos(id),
        created_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela "user_roles" criada.');
    
    // 5. Tabela de auditoria de permissões
    await client.query(`
      CREATE TABLE IF NOT EXISTS permission_audits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action VARCHAR(50) NOT NULL, -- 'grant', 'revoke', 'modify_role'
        resource VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Tabela "permission_audits" criada.');
    
    // 6. Criação de tipos enum para uso futuro (podem já existir)
    try {
      await client.query(`CREATE TYPE permission_resource_enum AS ENUM (
        'users', 'institutions', 'polos', 
        'courses', 'disciplines', 'enrollments', 'assessments', 'questions',
        'financial_transactions', 'financial_categories',
        'certificates', 'certificate_templates', 'certificate_signers',
        'leads', 'clients', 'contacts',
        'products', 'invoices', 'payments',
        'contracts', 'contract_templates',
        'roles', 'permissions',
        'integrations',
        'reports', 'dashboard', 'settings'
      );`);
      console.log('Tipo "permission_resource_enum" criado.');
    } catch (err) {
      console.log('Tipo "permission_resource_enum" já existe ou não pôde ser criado:', err.message);
    }
    
    try {
      await client.query(`CREATE TYPE permission_action_enum AS ENUM (
        'create', 'read', 'update', 'delete', 'manage', 'export'
      );`);
      console.log('Tipo "permission_action_enum" criado.');
    } catch (err) {
      console.log('Tipo "permission_action_enum" já existe ou não pôde ser criado:', err.message);
    }
    
    await client.query('COMMIT');
    console.log('Todas as tabelas do sistema de permissões foram criadas com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar tabelas de permissões:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createPermissionTables();