import { pool } from './db';

async function main() {
  console.log('Adicionando coluna CPF na tabela de usuários...');
  
  try {
    // Verificar se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'cpf'
    `);
    
    if (checkResult.rows.length === 0) {
      // Adicionar a coluna
      await pool.query(`ALTER TABLE users ADD COLUMN cpf TEXT`);
      console.log('Coluna CPF adicionada com sucesso!');
    } else {
      console.log('Coluna CPF já existe, ignorando...');
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();