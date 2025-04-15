const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupAdminPermissions() {
  const client = await pool.connect();
  
  try {
    // Iniciar uma transação
    await client.query('BEGIN');
    
    console.log('Configurando permissões do administrador...');
    
    // 1. Verificar se o papel super_admin existe
    const roleCheck = await client.query(`
      SELECT id FROM roles 
      WHERE name = 'super_admin'
    `);
    
    let superAdminRoleId;
    
    if (roleCheck.rows.length === 0) {
      // Criar papel super_admin
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, scope, is_system) 
        VALUES ('super_admin', 'Administrador com acesso total', 'global', true)
        RETURNING id
      `);
      superAdminRoleId = roleResult.rows[0].id;
      console.log(`Papel 'super_admin' criado com ID: ${superAdminRoleId}`);
    } else {
      superAdminRoleId = roleCheck.rows[0].id;
      console.log(`Papel 'super_admin' já existe com ID: ${superAdminRoleId}`);
    }
    
    // 2. Obter todas as permissões
    const permissionsResult = await client.query(`
      SELECT id FROM permissions
    `);
    
    // 3. Atribuir todas as permissões ao papel super_admin
    console.log('Atribuindo permissões ao papel super_admin...');
    for (const permission of permissionsResult.rows) {
      // Verificar se a permissão já está atribuída ao papel
      const checkPermission = await client.query(`
        SELECT id FROM role_permissions 
        WHERE role_id = $1 AND permission_id = $2
      `, [superAdminRoleId, permission.id]);
      
      if (checkPermission.rows.length === 0) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
        `, [superAdminRoleId, permission.id]);
        console.log(`Permissão ID ${permission.id} atribuída ao papel super_admin`);
      } else {
        console.log(`Permissão ID ${permission.id} já está atribuída ao papel super_admin`);
      }
    }
    
    // 4. Atribuir o papel super_admin ao usuário admin (ID 1)
    const checkUserRole = await client.query(`
      SELECT id FROM user_roles 
      WHERE user_id = 1 AND role_id = $1
    `, [superAdminRoleId]);
    
    if (checkUserRole.rows.length === 0) {
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (1, $1)
      `, [superAdminRoleId]);
      console.log('Papel super_admin atribuído ao usuário admin');
    } else {
      console.log('O usuário admin já possui o papel super_admin');
    }
    
    // 5. Atribuir algumas permissões diretas ao usuário admin para teste
    const permissionsToAdd = [
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'roles', action: 'read' }
    ];
    
    console.log('Atribuindo permissões diretas ao usuário admin...');
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
          WHERE user_id = 1 AND permission_id = $1
        `, [permissionId]);
        
        if (checkUserPerm.rows.length === 0) {
          await client.query(`
            INSERT INTO user_permissions (user_id, permission_id)
            VALUES (1, $1)
          `, [permissionId]);
          console.log(`Permissão direta ${perm.resource}:${perm.action} atribuída ao usuário admin`);
        } else {
          console.log(`Permissão direta ${perm.resource}:${perm.action} já está atribuída ao usuário admin`);
        }
      } else {
        console.log(`Permissão ${perm.resource}:${perm.action} não encontrada no banco de dados`);
      }
    }
    
    // Confirmar transação
    await client.query('COMMIT');
    console.log('Configuração de permissões do administrador concluída com sucesso!');
    
  } catch (error) {
    // Reverter em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro durante a configuração de permissões:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAdminPermissions();