const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('Iniciando migração: Criação da tabela userPermissions');
    
    // Verifica se a tabela já existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_permissions'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Tabela userPermissions já existe, pulando criação');
    } else {
      // Criar a tabela userPermissions
      await pool.query(`
        CREATE TABLE user_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
          polo_id INTEGER REFERENCES polos(id) ON DELETE CASCADE,
          expires_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, permission_id, institution_id, polo_id)
        )
      `);
      
      console.log('Tabela userPermissions criada com sucesso!');
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration();