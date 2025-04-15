// Script para criar permissões e papéis (roles) padrão
// Execute com: node create-permissions-roles.cjs

const { config } = require('dotenv');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
config();

const DATABASE_URL = process.env.DATABASE_URL;

// Recursos do sistema
const RESOURCES = [
  // Recursos administrativos
  'users', 'institutions', 'polos', 
  
  // Recursos educacionais
  'courses', 'disciplines', 'enrollments', 'assessments', 'questions',
  
  // Recursos financeiros
  'financial_transactions', 'financial_categories',
  
  // Recursos de certificados
  'certificates', 'certificate_templates', 'certificate_signers',
  
  // Recursos de CRM
  'leads', 'clients', 'contacts',
  
  // Recursos financeiros
  'products', 'invoices', 'payments',
  
  // Recursos de contratos
  'contracts', 'contract_templates',
  
  // Recursos de permissões
  'roles', 'permissions',
  
  // Recursos de integração
  'integrations',
  
  // Outros recursos
  'reports', 'dashboard', 'settings'
];

// Ações possíveis
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage', 'export'];

// Nomes de papéis (roles) padrão
const DEFAULT_ROLES = {
  SUPER_ADMIN: 'super_admin',
  INSTITUTION_ADMIN: 'institution_admin',
  INSTITUTION_MANAGER: 'institution_manager',
  POLO_ADMIN: 'polo_admin',
  POLO_MANAGER: 'polo_manager',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARTNER: 'partner',
  FINANCIAL_ANALYST: 'financial_analyst',
  CERTIFICATE_MANAGER: 'certificate_manager',
  CRM_AGENT: 'crm_agent'
};

// Combinações de recursos e ações para cada papel
const ROLE_PERMISSIONS = {
  [DEFAULT_ROLES.SUPER_ADMIN]: RESOURCES.map(resource => ({
    resource,
    actions: ['manage'] // Super admin tem permissão total em todos os recursos
  })),
  
  [DEFAULT_ROLES.INSTITUTION_ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'polos', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'courses', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'disciplines', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'assessments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'questions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'financial_transactions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'financial_categories', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'certificates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'certificate_templates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'certificate_signers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contacts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'payments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contracts', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contract_templates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'permissions', actions: ['read'] },
    { resource: 'integrations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update'] }
  ],
  
  [DEFAULT_ROLES.INSTITUTION_MANAGER]: [
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'polos', actions: ['read'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update'] },
    { resource: 'assessments', actions: ['read'] },
    { resource: 'financial_transactions', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'contacts', actions: ['create', 'read', 'update'] },
    { resource: 'products', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.POLO_ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update'] }, // Só pode gerenciar usuários do próprio polo
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read'] },
    { resource: 'enrollments', actions: ['create', 'read', 'update'] }, // Só pode gerenciar matrículas do próprio polo
    { resource: 'assessments', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'contacts', actions: ['create', 'read', 'update'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.POLO_MANAGER]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] },
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'dashboard', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.TEACHER]: [
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read', 'update'] },
    { resource: 'assessments', actions: ['create', 'read', 'update'] },
    { resource: 'questions', actions: ['create', 'read', 'update'] },
    { resource: 'enrollments', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.STUDENT]: [
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read'] },
    { resource: 'assessments', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.PARTNER]: [
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] } // Só pode ver matrículas que indicou
  ],
  
  [DEFAULT_ROLES.FINANCIAL_ANALYST]: [
    { resource: 'financial_transactions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'financial_categories', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'payments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read', 'export'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.CERTIFICATE_MANAGER]: [
    { resource: 'certificates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'certificate_templates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'certificate_signers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'disciplines', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] },
    { resource: 'users', actions: ['read'] }
  ],
  
  [DEFAULT_ROLES.CRM_AGENT]: [
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'contacts', actions: ['create', 'read', 'update'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] }
  ]
};

// Descrições dos papéis
const ROLE_DESCRIPTIONS = {
  [DEFAULT_ROLES.SUPER_ADMIN]: 'Administrador com acesso total ao sistema',
  [DEFAULT_ROLES.INSTITUTION_ADMIN]: 'Administrador da instituição com acesso à maioria das funcionalidades',
  [DEFAULT_ROLES.INSTITUTION_MANAGER]: 'Gerente da instituição com permissões limitadas de administração',
  [DEFAULT_ROLES.POLO_ADMIN]: 'Administrador do polo com permissões para gerenciar recursos do seu polo',
  [DEFAULT_ROLES.POLO_MANAGER]: 'Gerente do polo com permissões limitadas',
  [DEFAULT_ROLES.TEACHER]: 'Professor com acesso a disciplinas, avaliações e questões',
  [DEFAULT_ROLES.STUDENT]: 'Aluno com acesso limitado a cursos e disciplinas matriculados',
  [DEFAULT_ROLES.PARTNER]: 'Parceiro com permissões para captação de leads e acompanhamento',
  [DEFAULT_ROLES.FINANCIAL_ANALYST]: 'Analista financeiro com permissões para gerenciar recursos financeiros',
  [DEFAULT_ROLES.CERTIFICATE_MANAGER]: 'Gerente de certificados com permissões para criar e gerenciar certificados',
  [DEFAULT_ROLES.CRM_AGENT]: 'Agente de CRM com permissões para gerenciar leads e clientes'
};

// Função principal para criar permissões e papéis
async function createPermissionsAndRoles() {
  // Conexão com o banco de dados
  const client = postgres(DATABASE_URL);
  const db = drizzle(client);
  
  try {
    console.log('Iniciando a criação de permissões e papéis...');
    
    // 1. Criação das permissões
    console.log('Criando permissões...');
    const permissionsToCreate = [];
    
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const permissionName = `${action}:${resource}`;
        const description = `Permissão para ${action} em ${resource}`;
        
        permissionsToCreate.push({
          name: permissionName,
          description: description,
          resource: resource,
          action: action
        });
      }
    }
    
    // Inserir permissões no banco de dados (verificar se já existem)
    for (const permission of permissionsToCreate) {
      const existingPermission = await db.query.permissions.findFirst({
        where: (permissions, { eq, and }) => 
          and(
            eq(permissions.resource, permission.resource),
            eq(permissions.action, permission.action)
          )
      });
      
      if (!existingPermission) {
        await db.insert(db.permissions).values(permission);
        console.log(`Permissão criada: ${permission.name}`);
      } else {
        console.log(`Permissão já existe: ${permission.name}`);
      }
    }
    
    // 2. Criação dos papéis (roles)
    console.log('\nCriando papéis (roles)...');
    
    for (const [roleName, description] of Object.entries(ROLE_DESCRIPTIONS)) {
      const existingRole = await db.query.roles.findFirst({
        where: (roles, { eq }) => eq(roles.name, roleName)
      });
      
      if (!existingRole) {
        // Inserir o papel
        const roleResult = await db.insert(db.roles).values({
          name: roleName,
          description: description,
          isSystem: true
        }).returning();
        
        const roleId = roleResult[0].id;
        console.log(`Papel criado: ${roleName} (ID: ${roleId})`);
        
        // Associar permissões ao papel
        if (ROLE_PERMISSIONS[roleName]) {
          for (const permItem of ROLE_PERMISSIONS[roleName]) {
            const { resource, actions } = permItem;
            
            for (const action of actions) {
              // Encontrar a permissão
              const permission = await db.query.permissions.findFirst({
                where: (permissions, { eq, and }) => 
                  and(
                    eq(permissions.resource, resource),
                    eq(permissions.action, action)
                  )
              });
              
              if (permission) {
                // Associar permissão ao papel
                await db.insert(db.rolePermissions).values({
                  roleId: roleId,
                  permissionId: permission.id
                });
                
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
    
    console.log('\nCriação de permissões e papéis concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar permissões e papéis:', error);
  } finally {
    // Fechar a conexão
    await client.end();
  }
}

// Executar a função principal
createPermissionsAndRoles();