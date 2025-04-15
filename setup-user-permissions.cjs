const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupUserPermissions() {
  const client = await pool.connect();
  
  try {
    // Iniciar uma transação
    await client.query('BEGIN');
    
    console.log('Configurando permissões para os usuários...');
    
    // IDs dos usuários para atribuir super_admin
    const userIds = [1, 5];  // IDs do admin e ana.diretoria
    
    // Obter ID do papel super_admin
    const roleResult = await client.query(`
      SELECT id FROM roles 
      WHERE name = 'super_admin'
    `);
    
    if (roleResult.rows.length === 0) {
      throw new Error("Papel super_admin não encontrado!");
    }
    
    const superAdminRoleId = roleResult.rows[0].id;
    console.log(`Papel 'super_admin' encontrado com ID: ${superAdminRoleId}`);
    
    // Atribuir papel super_admin aos usuários
    for (const userId of userIds) {
      // Verificar se o usuário existe
      const userCheck = await client.query(`
        SELECT id, username FROM users WHERE id = $1
      `, [userId]);
      
      if (userCheck.rows.length === 0) {
        console.log(`Usuário com ID ${userId} não encontrado, pulando...`);
        continue;
      }
      
      const username = userCheck.rows[0].username;
      
      // Verificar se o usuário já tem o papel
      const checkUserRole = await client.query(`
        SELECT id FROM user_roles 
        WHERE user_id = $1 AND role_id = $2
      `, [userId, superAdminRoleId]);
      
      if (checkUserRole.rows.length === 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [userId, superAdminRoleId]);
        console.log(`Papel super_admin atribuído ao usuário ${username} (ID: ${userId})`);
      } else {
        console.log(`Usuário ${username} (ID: ${userId}) já possui o papel super_admin`);
      }
      
      // Atribuir permissões diretas também
      const permissionsToAdd = [
        { resource: 'roles', action: 'read' },
        { resource: 'roles', action: 'create' },
        { resource: 'roles', action: 'update' },
        { resource: 'roles', action: 'delete' },
        { resource: 'roles', action: 'manage' },
        { resource: 'permissions', action: 'read' },
        { resource: 'permissions', action: 'create' },
        { resource: 'permissions', action: 'update' },
        { resource: 'permissions', action: 'delete' },
        { resource: 'permissions', action: 'manage' }
      ];
      
      console.log(`Atribuindo permissões diretas ao usuário ${username} (ID: ${userId})...`);
      for (const perm of permissionsToAdd) {
        // Obter ID da permissão
        const permResult = await client.query(`
          SELECT id FROM permissions 
          WHERE resource = $1 AND action = $2
        `, [perm.resource, perm.action]);
        
        if (permResult.rows.length > 0) {
          const permissionId = permResult.rows[0].id;
          
          // Verificar se a permissão já está atribuída diretamente
          const checkUserPerm = await client.query(`
            SELECT id FROM user_permissions 
            WHERE user_id = $1 AND permission_id = $2
          `, [userId, permissionId]);
          
          if (checkUserPerm.rows.length === 0) {
            await client.query(`
              INSERT INTO user_permissions (user_id, permission_id)
              VALUES ($1, $2)
            `, [userId, permissionId]);
            console.log(`Permissão direta ${perm.resource}:${perm.action} atribuída ao usuário ${username}`);
          } else {
            console.log(`Permissão direta ${perm.resource}:${perm.action} já está atribuída ao usuário ${username}`);
          }
        } else {
          console.log(`Permissão ${perm.resource}:${perm.action} não encontrada no banco de dados`);
        }
      }
    }
    
    // Confirmar transação
    await client.query('COMMIT');
    console.log('Configuração de permissões concluída com sucesso!');
    
  } catch (error) {
    // Reverter em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro durante a configuração de permissões:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupUserPermissions();