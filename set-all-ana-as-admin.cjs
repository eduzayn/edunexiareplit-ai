/**
 * Script para atribuir papel de super_admin a todos os usuários relacionados a Ana Lúcia
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setAllAnaAsAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Lista de IDs de usuários relacionados a Ana Lúcia
    const userIds = [5, 6, 7, 9]; // Ana Lúcia e variações
    
    // Obter ID do papel super_admin
    const roleResult = await client.query("SELECT id FROM roles WHERE name = 'super_admin'");
    
    if (roleResult.rows.length === 0) {
      throw new Error("Papel 'super_admin' não encontrado");
    }
    
    const superAdminRoleId = roleResult.rows[0].id;
    console.log(`ID do papel 'super_admin': ${superAdminRoleId}`);
    
    // Para cada usuário
    for (const userId of userIds) {
      // Obter informações do usuário
      const userResult = await client.query("SELECT username, full_name FROM users WHERE id = $1", [userId]);
      
      if (userResult.rows.length === 0) {
        console.log(`Usuário ID ${userId} não encontrado`);
        continue;
      }
      
      const username = userResult.rows[0].username;
      const fullName = userResult.rows[0].full_name;
      
      console.log(`Processando usuário: ${fullName} (${username}, ID: ${userId})`);
      
      // Verificar se o usuário já tem o papel super_admin
      const checkRole = await client.query(
        "SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2",
        [userId, superAdminRoleId]
      );
      
      if (checkRole.rows.length > 0) {
        console.log(`Usuário ${fullName} já possui o papel super_admin`);
      } else {
        // Atribuir papel super_admin ao usuário
        await client.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
          [userId, superAdminRoleId]
        );
        console.log(`Papel super_admin atribuído ao usuário ${fullName}`);
      }
      
      // Se o usuário não é do tipo 'admin', atualizar para 'admin'
      const portalTypeResult = await client.query(
        "SELECT portal_type FROM users WHERE id = $1",
        [userId]
      );
      
      if (portalTypeResult.rows[0].portal_type !== 'admin') {
        await client.query(
          "UPDATE users SET portal_type = 'admin' WHERE id = $1",
          [userId]
        );
        console.log(`Usuário ${fullName} atualizado para tipo 'admin'`);
      }
    }
    
    await client.query('COMMIT');
    console.log('Todos os usuários relacionados a Ana Lúcia agora são super_admin!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao configurar usuários como super_admin:', error);
  } finally {
    client.release();
    pool.end();
  }
}

setAllAnaAsAdmin().catch(console.error);