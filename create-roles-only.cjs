// Script para criar apenas os papéis (roles) sem associações
// Versão CJS para execução direta com Node.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Lista de papéis e descrições
const ROLES = [
  // Papéis já criados (vamos pular estes)
  // { name: 'super_admin', description: 'Acesso total ao sistema', scope: 'global' },
  // { name: 'admin', description: 'Administrador do sistema', scope: 'global' },
  // { name: 'institution_admin', description: 'Administrador da instituição', scope: 'institution' },
  
  // Papéis a serem criados
  { name: 'institution_manager', description: 'Gerente da instituição', scope: 'institution' },
  { name: 'institution_teacher', description: 'Professor da instituição', scope: 'institution' },
  { name: 'institution_staff', description: 'Funcionário administrativo da instituição', scope: 'institution' },
  { name: 'institution_financial', description: 'Responsável financeiro da instituição', scope: 'institution' },
  
  { name: 'polo_admin', description: 'Administrador do polo', scope: 'polo' },
  { name: 'polo_manager', description: 'Gerente do polo', scope: 'polo' },
  { name: 'polo_staff', description: 'Funcionário administrativo do polo', scope: 'polo' },
  { name: 'polo_financial', description: 'Responsável financeiro do polo', scope: 'polo' },
  
  { name: 'student', description: 'Estudante', scope: 'global' },
  { name: 'guest', description: 'Usuário convidado', scope: 'global' }
];

async function createRoles() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando a criação dos papéis...');
    
    // Criar papéis
    for (const role of ROLES) {
      // Verificar se o papel já existe
      const existingRoles = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [role.name]
      );
      
      if (existingRoles.rows.length === 0) {
        // Inserir o papel
        const roleResult = await client.query(
          'INSERT INTO roles (name, description, is_system, scope) VALUES ($1, $2, $3, $4) RETURNING id',
          [role.name, role.description, true, role.scope]
        );
        
        const roleId = roleResult.rows[0].id;
        console.log(`Papel criado: ${role.name} (ID: ${roleId})`);
      } else {
        console.log(`Papel já existe: ${role.name}`);
      }
    }
    
    console.log('\nCriação de papéis concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar papéis:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Executar a função principal
createRoles();