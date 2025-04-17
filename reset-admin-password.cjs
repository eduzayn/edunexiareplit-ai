/**
 * Script para resetar a senha do usuário 'ana.diretoria'
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const util = require('util');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Nome de usuário que terá a senha resetada
    const username = 'ana.diretoria';
    const email = 'ana.diretoria@eduzayn.com.br';
    const newPassword = '123456';
    
    // Verificar se o usuário existe
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`Usuário '${username}' não encontrado, criando...`);
      
      // Hash da senha
      const hashedPassword = await hashPassword(newPassword);
      
      // Criar o usuário admin
      const insertResult = await client.query(
        'INSERT INTO users (username, email, password, full_name, portal_type, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [username, email, hashedPassword, 'Ana Diretoria', 'admin', true]
      );
      
      const userId = insertResult.rows[0].id;
      console.log(`Usuário '${username}' criado com ID: ${userId}`);
    } else {
      const userId = userResult.rows[0].id;
      console.log(`Usuário '${username}' encontrado com ID: ${userId}`);
      
      // Hash da senha
      const hashedPassword = await hashPassword(newPassword);
      
      // Atualizar a senha
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
      
      console.log(`Senha do usuário '${username}' atualizada com sucesso!`);
    }
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao resetar senha:', error);
  } finally {
    client.release();
    pool.end();
  }
}

resetAdminPassword().catch(console.error);