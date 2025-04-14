import { pool } from './server/db';
import 'dotenv/config';

async function runMigration() {
  console.log('Iniciando migração para adicionar campos de rastreamento e auditoria em matrículas...');
  
  try {
    // Iniciar transação
    await pool.query('BEGIN');
    
    console.log('Adicionando campos de rastreamento na tabela enrollments...');
    
    // Adicionando novos campos na tabela enrollments
    await pool.query(`
      ALTER TABLE enrollments 
      ADD COLUMN IF NOT EXISTS source_channel TEXT,
      ADD COLUMN IF NOT EXISTS reference_code TEXT,
      ADD COLUMN IF NOT EXISTS updated_by_id INTEGER REFERENCES users(id)
    `);
    
    console.log('Adicionando campos de rastreamento na tabela enrollment_status_history...');
    
    // Adicionando novos campos na tabela enrollment_status_history
    await pool.query(`
      ALTER TABLE enrollment_status_history 
      ADD COLUMN IF NOT EXISTS polo_id INTEGER REFERENCES polos(id),
      ADD COLUMN IF NOT EXISTS source_channel TEXT,
      ADD COLUMN IF NOT EXISTS ip_address TEXT,
      ADD COLUMN IF NOT EXISTS user_agent TEXT
    `);
    
    console.log('Criando tabela enrollment_audits...');
    
    // Criando tabela de auditoria de matrículas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollment_audits (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        performed_by_id INTEGER REFERENCES users(id),
        performed_by_type TEXT NOT NULL,
        polo_id INTEGER REFERENCES polos(id),
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT,
        details JSONB,
        before_state JSONB,
        after_state JSONB
      )
    `);
    
    // Commit da transação
    await pool.query('COMMIT');
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    // Rollback em caso de erro
    await pool.query('ROLLBACK');
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    // Não fechamos a pool aqui pois é a mesma usada pelo aplicativo
  }
}

// Executar a migração
runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao executar migração:', err);
    process.exit(1);
  });