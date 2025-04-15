// Script para criar apenas os papéis (roles) e suas associações com permissões
// Versão CJS para execução direta com Node.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Constantes - Definição de papéis e suas permissões

// Lista de papéis e descrições
const ROLE_DESCRIPTIONS = {
  // Papéis globais
  'super_admin': 'Acesso total ao sistema',
  'admin': 'Administrador do sistema',
  
  // Papéis de instituição
  'institution_admin': 'Administrador da instituição',
  'institution_manager': 'Gerente da instituição',
  'institution_teacher': 'Professor da instituição',
  'institution_staff': 'Funcionário administrativo da instituição',
  'institution_financial': 'Responsável financeiro da instituição',
  
  // Papéis de polo
  'polo_admin': 'Administrador do polo',
  'polo_manager': 'Gerente do polo',
  'polo_staff': 'Funcionário administrativo do polo',
  'polo_financial': 'Responsável financeiro do polo',
  
  // Outros papéis
  'student': 'Estudante',
  'guest': 'Usuário convidado'
};

// Definições de permissões para cada papel
const ROLE_PERMISSIONS = {
  'super_admin': [
    // Permissões administrativas
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'institutions', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'polos', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'permissions', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    
    // Permissões acadêmicas
    { resource: 'courses', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'disciplines', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'assessments', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'questions', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Permissões financeiras
    { resource: 'financial_transactions', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'financial_categories', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Permissões de CRM
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'contacts', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Permissões de certificados
    { resource: 'certificates', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'certificate_templates', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'certificate_signers', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Permissões de produtos e financeiro
    { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'payments', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Permissões de contratos
    { resource: 'contracts', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'contract_templates', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    
    // Outras permissões
    { resource: 'reports', actions: ['create', 'read', 'manage', 'export'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update', 'manage'] },
    { resource: 'integrations', actions: ['create', 'read', 'update', 'delete', 'manage'] }
  ],
  
  'admin': [
    // Permissões administrativas limitadas
    { resource: 'users', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'institutions', actions: ['read', 'update', 'export'] },
    { resource: 'polos', actions: ['read', 'update', 'export'] },
    { resource: 'roles', actions: ['read'] },
    { resource: 'permissions', actions: ['read'] },
    
    // Permissões acadêmicas
    { resource: 'courses', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'disciplines', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'assessments', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'questions', actions: ['create', 'read', 'update', 'export'] },
    
    // Permissões financeiras
    { resource: 'financial_transactions', actions: ['read', 'export'] },
    { resource: 'financial_categories', actions: ['read'] },
    
    // Permissões de certificados
    { resource: 'certificates', actions: ['create', 'read', 'export'] },
    { resource: 'certificate_templates', actions: ['read'] },
    { resource: 'certificate_signers', actions: ['read'] },
    
    // Outras permissões
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'settings', actions: ['read'] }
  ],
  
  'institution_admin': [
    // Permissões administrativas na instituição
    { resource: 'users', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'polos', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'roles', actions: ['read'] },
    
    // Permissões acadêmicas
    { resource: 'courses', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'disciplines', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'assessments', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'questions', actions: ['create', 'read', 'update', 'manage', 'export'] },
    
    // Permissões financeiras
    { resource: 'financial_transactions', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'financial_categories', actions: ['create', 'read', 'update', 'export'] },
    
    // Permissões de CRM
    { resource: 'leads', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'contacts', actions: ['create', 'read', 'update', 'manage', 'export'] },
    
    // Permissões de certificados
    { resource: 'certificates', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'certificate_templates', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'certificate_signers', actions: ['create', 'read', 'update', 'export'] },
    
    // Permissões de produtos e financeiro
    { resource: 'products', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'payments', actions: ['create', 'read', 'update', 'manage', 'export'] },
    
    // Permissões de contratos
    { resource: 'contracts', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'contract_templates', actions: ['create', 'read', 'update', 'export'] },
    
    // Outras permissões
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update'] }
  ],
  
  'institution_manager': [
    // Permissões limitadas na instituição
    { resource: 'users', actions: ['read'] },
    { resource: 'polos', actions: ['read'] },
    
    // Permissões acadêmicas
    { resource: 'courses', actions: ['read', 'update', 'export'] },
    { resource: 'disciplines', actions: ['read', 'update', 'export'] },
    { resource: 'enrollments', actions: ['read', 'update', 'export'] },
    { resource: 'assessments', actions: ['read', 'update', 'export'] },
    { resource: 'questions', actions: ['read', 'update', 'export'] },
    
    // Permissões de CRM
    { resource: 'leads', actions: ['read', 'update', 'export'] },
    { resource: 'clients', actions: ['read', 'update', 'export'] },
    { resource: 'contacts', actions: ['read', 'update', 'export'] },
    
    // Permissões de certificados
    { resource: 'certificates', actions: ['read', 'export'] },
    
    // Permissões de produtos
    { resource: 'products', actions: ['read', 'export'] },
    
    // Outras permissões
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  
  'polo_admin': [
    // Permissões administrativas no polo
    { resource: 'users', actions: ['create', 'read', 'update', 'export'] },
    
    // Permissões acadêmicas
    { resource: 'courses', actions: ['read', 'export'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update', 'export'] },
    
    // Permissões de CRM
    { resource: 'leads', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'manage', 'export'] },
    { resource: 'contacts', actions: ['create', 'read', 'update', 'manage', 'export'] },
    
    // Permissões de produtos e financeiro
    { resource: 'products', actions: ['read', 'export'] },
    { resource: 'invoices', actions: ['create', 'read', 'export'] },
    { resource: 'payments', actions: ['create', 'read', 'export'] },
    
    // Permissões de contratos
    { resource: 'contracts', actions: ['create', 'read', 'export'] },
    
    // Outras permissões
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  
  'student': [
    // Permissões do estudante
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read'] },
    { resource: 'assessments', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] }
  ],
  
  'guest': [
    // Permissões mínimas para convidados
    { resource: 'courses', actions: ['read'] },
    { resource: 'products', actions: ['read'] }
  ]
};

async function createRolesAndAssignPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando a criação de papéis e atribuição de permissões...');
    
    // Criar papéis
    for (const [roleName, description] of Object.entries(ROLE_DESCRIPTIONS)) {
      // Verificar se o papel já existe
      const existingRoles = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [roleName]
      );
      
      if (existingRoles.rows.length === 0) {
        // Determinar o escopo com base no nome do papel
        const scope = roleName.includes('institution') ? 'institution' : 
                      roleName.includes('polo') ? 'polo' : 'global';
        
        // Inserir o papel
        const roleResult = await client.query(
          'INSERT INTO roles (name, description, is_system, scope) VALUES ($1, $2, $3, $4) RETURNING id',
          [roleName, description, true, scope]
        );
        
        const roleId = roleResult.rows[0].id;
        console.log(`Papel criado: ${roleName} (ID: ${roleId})`);
        
        // Associar permissões ao papel
        if (ROLE_PERMISSIONS[roleName]) {
          for (const permItem of ROLE_PERMISSIONS[roleName]) {
            const { resource, actions } = permItem;
            
            for (const action of actions) {
              // Encontrar a permissão
              const permissionResult = await client.query(
                'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                [resource, action]
              );
              
              if (permissionResult.rows.length > 0) {
                const permissionId = permissionResult.rows[0].id;
                
                // Associar permissão ao papel
                await client.query(
                  'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                  [roleId, permissionId]
                );
                
                console.log(`  Associada permissão: ${action}:${resource}`);
              } else {
                console.log(`  AVISO: Permissão não encontrada: ${action}:${resource}`);
              }
            }
          }
        }
      } else {
        console.log(`Papel já existe: ${roleName}`);
      }
    }
    
    console.log('\nCriação de papéis e atribuição de permissões concluídas com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar papéis e atribuir permissões:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Executar a função principal
createRolesAndAssignPermissions();