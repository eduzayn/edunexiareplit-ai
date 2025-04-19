/**
 * Script para adicionar o papel de Super Admin ao usuário especificado
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function makeSuperAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Nome de usuário que receberá o papel de Super Admin
    const username = 'admin';
    
    // Obter ID do usuário
    const userResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`Usuário '${username}' não encontrado`);
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`ID do usuário '${username}': ${userId}`);
    
    // Obter o ID do papel Super Admin
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'super_admin'"
    );
    
    if (roleResult.rows.length === 0) {
      console.error("Papel 'super_admin' não encontrado. Criando o papel...");
      
      // Criar papel Super Admin se não existir
      const insertRoleResult = await client.query(
        "INSERT INTO roles (name, description) VALUES ('super_admin', 'Acesso completo a todas as funcionalidades do sistema') RETURNING id"
      );
      
      superAdminRoleId = insertRoleResult.rows[0].id;
      console.log(`Papel 'super_admin' criado com ID: ${superAdminRoleId}`);
    } else {
      superAdminRoleId = roleResult.rows[0].id;
      console.log(`ID do papel 'super_admin': ${superAdminRoleId}`);
    }
    
    // Verificar se o usuário já tem este papel
    const userRoleResult = await client.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, superAdminRoleId]
    );
    
    if (userRoleResult.rows.length === 0) {
      // Adicionar papel ao usuário
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userId, superAdminRoleId]
      );
      console.log(`Papel 'super_admin' adicionado ao usuário ${username}`);
    } else {
      console.log(`Usuário ${username} já possui o papel 'super_admin'`);
    }
    
    // Obter todas as permissões existentes
    const permissionsResult = await client.query('SELECT id FROM permissions');
    
    // Verificar se o papel Super Admin já tem todas as permissões
    console.log('Atribuindo permissões ao papel super_admin...');
    
    for (const permission of permissionsResult.rows) {
      // Verificar se a permissão já está atribuída ao papel
      const checkPermission = await client.query(
        'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [superAdminRoleId, permission.id]
      );
      
      if (checkPermission.rows.length === 0) {
        await client.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [superAdminRoleId, permission.id]
        );
        console.log(`Permissão ID ${permission.id} atribuída ao papel super_admin`);
      } else {
        console.log(`Permissão ID ${permission.id} já está atribuída ao papel super_admin`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`Usuário ${username} agora é Super Admin com acesso completo ao sistema!`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao configurar Super Admin:', error);
  } finally {
    client.release();
    pool.end();
  }
}

makeSuperAdmin().catch(console.error);