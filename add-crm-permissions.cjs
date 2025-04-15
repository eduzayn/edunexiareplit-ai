/**
 * Script para adicionar permissões de CRM ao usuário específico
 * Este script adiciona permissões para cliente, contato e lead
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCrmPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Nome de usuário que receberá as permissões (Ana Lúcia)
    const username = 'ana.diretoria';
    
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
    
    // Recursos e ações de CRM a serem adicionados
    const crmPermissions = [
      { resource: 'cliente', action: 'ler' },
      { resource: 'cliente', action: 'criar' },
      { resource: 'cliente', action: 'atualizar' },
      { resource: 'cliente', action: 'deletar' },
      { resource: 'lead', action: 'ler' },
      { resource: 'lead', action: 'criar' },
      { resource: 'lead', action: 'atualizar' },
      { resource: 'lead', action: 'deletar' },
      { resource: 'contato', action: 'ler' },
      { resource: 'contato', action: 'criar' },
      { resource: 'contato', action: 'atualizar' },
      { resource: 'contato', action: 'deletar' },
      // Adicionar também a permissão de clients para compatibilidade com ambos os formatos
      { resource: 'clients', action: 'read' },
      { resource: 'clients', action: 'create' },
      { resource: 'clients', action: 'update' },
      { resource: 'clients', action: 'delete' },
    ];
    
    // Para cada permissão
    for (const perm of crmPermissions) {
      // Verificar se a permissão existe
      const permResult = await client.query(
        'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
        [perm.resource, perm.action]
      );
      
      let permissionId;
      
      if (permResult.rows.length === 0) {
        // Se a permissão não existe, criá-la
        console.log(`Criando permissão: ${perm.resource}:${perm.action}`);
        const insertResult = await client.query(
          'INSERT INTO permissions (resource, action, description) VALUES ($1, $2, $3) RETURNING id',
          [perm.resource, perm.action, `Permite ${perm.action} ${perm.resource}`]
        );
        permissionId = insertResult.rows[0].id;
      } else {
        permissionId = permResult.rows[0].id;
      }
      
      // Verificar se o usuário já tem esta permissão
      const userPermResult = await client.query(
        'SELECT id FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
        [userId, permissionId]
      );
      
      if (userPermResult.rows.length === 0) {
        // Adicionar permissão ao usuário
        await client.query(
          'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)',
          [userId, permissionId]
        );
        console.log(`Permissão ${perm.resource}:${perm.action} adicionada ao usuário ${username}`);
      } else {
        console.log(`Usuário ${username} já possui a permissão ${perm.resource}:${perm.action}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('Permissões de CRM adicionadas com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao adicionar permissões:', error);
  } finally {
    client.release();
    pool.end();
  }
}

addCrmPermissions().catch(console.error);