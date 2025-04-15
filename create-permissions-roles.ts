/**
 * Script para criação das permissões e papéis padrão do sistema
 * Execução: npm run ts-node create-permissions-roles.ts
 */

import { db } from './server/db';
import * as schema from './shared/schema';
import { eq, and } from 'drizzle-orm';

// Definição dos recursos do sistema
type PermissionResource = 
  | 'users'
  | 'roles'
  | 'permissions'
  | 'institutions'
  | 'polos'
  | 'courses'
  | 'enrollments'
  | 'financial_transactions'
  | 'leads'
  | 'clients'
  | 'contracts'
  | 'products'
  | 'invoices'
  | 'payments'
  | 'certificates'
  | 'certificate_templates'
  | 'certificate_signers'
  | 'subscription_plans'
  | 'subscriptions'
  | 'reports'
  | 'settings'
  | 'communications';

// Definição das ações possíveis
type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'manage';

// Mapeamento dos papéis e suas permissões
const ROLE_PERMISSIONS: Record<string, { resource: PermissionResource, actions: PermissionAction[] }[]> = {
  // Papel com acesso total ao sistema
  'super_admin': [
    // Recursos administrativos
    { resource: 'users', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'roles', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'permissions', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'institutions', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'polos', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'settings', actions: ['read', 'update', 'manage'] },
    
    // Recursos educacionais
    { resource: 'courses', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'enrollments', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Recursos financeiros
    { resource: 'financial_transactions', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'invoices', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'payments', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'clients', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'communications', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Recursos de contratos
    { resource: 'contracts', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'products', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Recursos de certificados
    { resource: 'certificates', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'certificate_templates', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'certificate_signers', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Recursos de assinaturas
    { resource: 'subscription_plans', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { resource: 'subscriptions', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    
    // Relatórios
    { resource: 'reports', actions: ['read', 'create', 'manage'] }
  ],
  
  // Administrador com acesso à maioria das funcionalidades, exceto configurações críticas
  'admin': [
    // Recursos administrativos
    { resource: 'users', actions: ['read', 'create', 'update'] },
    { resource: 'institutions', actions: ['read', 'create', 'update'] },
    { resource: 'polos', actions: ['read', 'create', 'update'] },
    
    // Recursos educacionais
    { resource: 'courses', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'enrollments', actions: ['read', 'create', 'update'] },
    
    // Recursos financeiros
    { resource: 'financial_transactions', actions: ['read'] },
    { resource: 'invoices', actions: ['read', 'create', 'update'] },
    { resource: 'payments', actions: ['read', 'create'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read', 'create', 'update'] },
    { resource: 'communications', actions: ['read', 'create', 'update'] },
    
    // Recursos de contratos
    { resource: 'contracts', actions: ['read', 'create', 'update'] },
    { resource: 'products', actions: ['read', 'create', 'update'] },
    
    // Recursos de certificados
    { resource: 'certificates', actions: ['read', 'create'] },
    { resource: 'certificate_templates', actions: ['read', 'create', 'update'] },
    { resource: 'certificate_signers', actions: ['read', 'create', 'update'] },
    
    // Relatórios
    { resource: 'reports', actions: ['read', 'create'] }
  ],
  
  // Administrador de uma instituição específica
  'institution_admin': [
    // Recursos administrativos específicos da instituição
    { resource: 'users', actions: ['read', 'create', 'update'] },
    { resource: 'polos', actions: ['read', 'create', 'update'] },
    
    // Recursos educacionais
    { resource: 'courses', actions: ['read', 'create', 'update'] },
    { resource: 'enrollments', actions: ['read', 'create', 'update'] },
    
    // Recursos financeiros
    { resource: 'financial_transactions', actions: ['read'] },
    { resource: 'invoices', actions: ['read', 'create'] },
    { resource: 'payments', actions: ['read'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read', 'create', 'update'] },
    { resource: 'communications', actions: ['read', 'create'] },
    
    // Recursos de contratos
    { resource: 'contracts', actions: ['read', 'create'] },
    
    // Recursos de certificados
    { resource: 'certificates', actions: ['read', 'create'] },
    
    // Relatórios
    { resource: 'reports', actions: ['read'] }
  ],
  
  // Coordenador pedagógico de uma instituição
  'coordinator': [
    // Acesso a usuários
    { resource: 'users', actions: ['read'] },
    
    // Recursos educacionais
    { resource: 'courses', actions: ['read', 'update'] },
    { resource: 'enrollments', actions: ['read', 'update'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    
    // Certificados
    { resource: 'certificates', actions: ['read', 'create'] },
    
    // Relatórios
    { resource: 'reports', actions: ['read'] }
  ],
  
  // Secretaria acadêmica
  'secretary': [
    // Acesso a usuários
    { resource: 'users', actions: ['read'] },
    
    // Recursos educacionais
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read', 'create', 'update'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'update'] },
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['read', 'create'] },
    
    // Certificados
    { resource: 'certificates', actions: ['read', 'create'] }
  ],
  
  // Financeiro
  'financial': [
    // Recursos financeiros
    { resource: 'financial_transactions', actions: ['read', 'create', 'update'] },
    { resource: 'invoices', actions: ['read', 'create', 'update'] },
    { resource: 'payments', actions: ['read', 'create', 'update'] },
    
    // Recursos de clientes
    { resource: 'clients', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['read', 'create'] },
    
    // Contratos
    { resource: 'contracts', actions: ['read'] },
    
    // Relatórios
    { resource: 'reports', actions: ['read'] }
  ],
  
  // Vendas
  'sales': [
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read', 'create', 'update'] },
    { resource: 'communications', actions: ['read', 'create', 'update'] },
    
    // Produtos e contratos
    { resource: 'contracts', actions: ['read', 'create'] },
    { resource: 'products', actions: ['read'] },
    
    // Cursos e matrículas
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read', 'create'] }
  ],
  
  // Professor
  'teacher': [
    // Recursos educacionais
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read', 'update'] }
  ],
  
  // Administrador de polo
  'polo_admin': [
    // Recursos educacionais
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read', 'create', 'update'] },
    
    // Recursos de CRM
    { resource: 'leads', actions: ['read', 'create', 'update'] },
    { resource: 'clients', actions: ['read', 'create', 'update'] },
    { resource: 'communications', actions: ['read', 'create'] },
    
    // Certificados
    { resource: 'certificates', actions: ['read'] }
  ],
  
  // Aluno
  'student': [
    // Acesso limitado a seus próprios dados
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read', 'create'] }
  ],
  
  // Auditor
  'auditor': [
    // Acesso de leitura a dados diversos para auditoria
    { resource: 'users', actions: ['read'] },
    { resource: 'courses', actions: ['read'] },
    { resource: 'enrollments', actions: ['read'] },
    { resource: 'financial_transactions', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'contracts', actions: ['read'] },
    { resource: 'certificates', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ],
  
  // Gerente de marketing
  'marketing': [
    // Recursos de CRM e comunicação
    { resource: 'leads', actions: ['read', 'create', 'update'] },
    { resource: 'communications', actions: ['read', 'create', 'update'] },
    { resource: 'reports', actions: ['read'] }
  ]
};

/**
 * Descrições detalhadas das permissões
 */
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'users:read': 'Visualizar usuários',
  'users:create': 'Criar novos usuários',
  'users:update': 'Atualizar dados de usuários',
  'users:delete': 'Remover usuários',
  'users:manage': 'Gerenciar usuários (todas as operações)',
  
  'roles:read': 'Visualizar papéis',
  'roles:create': 'Criar novos papéis',
  'roles:update': 'Atualizar papéis',
  'roles:delete': 'Remover papéis',
  'roles:manage': 'Gerenciar papéis (todas as operações)',
  
  'permissions:read': 'Visualizar permissões',
  'permissions:create': 'Criar novas permissões',
  'permissions:update': 'Atualizar permissões',
  'permissions:delete': 'Remover permissões',
  'permissions:manage': 'Gerenciar permissões (todas as operações)',
  
  'institutions:read': 'Visualizar instituições',
  'institutions:create': 'Criar novas instituições',
  'institutions:update': 'Atualizar instituições',
  'institutions:delete': 'Remover instituições',
  'institutions:manage': 'Gerenciar instituições (todas as operações)',
  
  'polos:read': 'Visualizar polos',
  'polos:create': 'Criar novos polos',
  'polos:update': 'Atualizar polos',
  'polos:delete': 'Remover polos',
  'polos:manage': 'Gerenciar polos (todas as operações)',
  
  'courses:read': 'Visualizar cursos',
  'courses:create': 'Criar novos cursos',
  'courses:update': 'Atualizar cursos',
  'courses:delete': 'Remover cursos',
  'courses:manage': 'Gerenciar cursos (todas as operações)',
  
  'enrollments:read': 'Visualizar matrículas',
  'enrollments:create': 'Criar novas matrículas',
  'enrollments:update': 'Atualizar matrículas',
  'enrollments:delete': 'Cancelar matrículas',
  'enrollments:manage': 'Gerenciar matrículas (todas as operações)',
  
  'financial_transactions:read': 'Visualizar transações financeiras',
  'financial_transactions:create': 'Registrar novas transações financeiras',
  'financial_transactions:update': 'Atualizar transações financeiras',
  'financial_transactions:delete': 'Remover transações financeiras',
  'financial_transactions:manage': 'Gerenciar transações financeiras (todas as operações)',
  
  'leads:read': 'Visualizar leads',
  'leads:create': 'Criar novos leads',
  'leads:update': 'Atualizar leads',
  'leads:delete': 'Remover leads',
  'leads:manage': 'Gerenciar leads (todas as operações)',
  
  'clients:read': 'Visualizar clientes',
  'clients:create': 'Criar novos clientes',
  'clients:update': 'Atualizar clientes',
  'clients:delete': 'Remover clientes',
  'clients:manage': 'Gerenciar clientes (todas as operações)',
  
  'contracts:read': 'Visualizar contratos',
  'contracts:create': 'Criar novos contratos',
  'contracts:update': 'Atualizar contratos',
  'contracts:delete': 'Remover contratos',
  'contracts:manage': 'Gerenciar contratos (todas as operações)',
  
  'products:read': 'Visualizar produtos',
  'products:create': 'Criar novos produtos',
  'products:update': 'Atualizar produtos',
  'products:delete': 'Remover produtos',
  'products:manage': 'Gerenciar produtos (todas as operações)',
  
  'invoices:read': 'Visualizar faturas',
  'invoices:create': 'Criar novas faturas',
  'invoices:update': 'Atualizar faturas',
  'invoices:delete': 'Cancelar faturas',
  'invoices:manage': 'Gerenciar faturas (todas as operações)',
  
  'payments:read': 'Visualizar pagamentos',
  'payments:create': 'Registrar novos pagamentos',
  'payments:update': 'Atualizar pagamentos',
  'payments:delete': 'Estornar pagamentos',
  'payments:manage': 'Gerenciar pagamentos (todas as operações)',
  
  'certificates:read': 'Visualizar certificados',
  'certificates:create': 'Emitir novos certificados',
  'certificates:update': 'Atualizar certificados',
  'certificates:delete': 'Revogar certificados',
  'certificates:manage': 'Gerenciar certificados (todas as operações)',
  
  'certificate_templates:read': 'Visualizar modelos de certificados',
  'certificate_templates:create': 'Criar novos modelos de certificados',
  'certificate_templates:update': 'Atualizar modelos de certificados',
  'certificate_templates:delete': 'Remover modelos de certificados',
  'certificate_templates:manage': 'Gerenciar modelos de certificados (todas as operações)',
  
  'certificate_signers:read': 'Visualizar signatários',
  'certificate_signers:create': 'Criar novos signatários',
  'certificate_signers:update': 'Atualizar signatários',
  'certificate_signers:delete': 'Remover signatários',
  'certificate_signers:manage': 'Gerenciar signatários (todas as operações)',
  
  'subscription_plans:read': 'Visualizar planos de assinatura',
  'subscription_plans:create': 'Criar novos planos de assinatura',
  'subscription_plans:update': 'Atualizar planos de assinatura',
  'subscription_plans:delete': 'Remover planos de assinatura',
  'subscription_plans:manage': 'Gerenciar planos de assinatura (todas as operações)',
  
  'subscriptions:read': 'Visualizar assinaturas',
  'subscriptions:create': 'Criar novas assinaturas',
  'subscriptions:update': 'Atualizar assinaturas',
  'subscriptions:delete': 'Cancelar assinaturas',
  'subscriptions:manage': 'Gerenciar assinaturas (todas as operações)',
  
  'reports:read': 'Visualizar relatórios',
  'reports:create': 'Gerar novos relatórios',
  'reports:manage': 'Gerenciar relatórios (todas as operações)',
  
  'settings:read': 'Visualizar configurações do sistema',
  'settings:update': 'Atualizar configurações do sistema',
  'settings:manage': 'Gerenciar configurações do sistema (todas as operações)',
  
  'communications:read': 'Visualizar comunicações',
  'communications:create': 'Enviar novas comunicações',
  'communications:update': 'Atualizar comunicações',
  'communications:delete': 'Remover comunicações',
  'communications:manage': 'Gerenciar comunicações (todas as operações)'
};

/**
 * Detalhes dos papéis
 */
const ROLES_DETAILS: Record<string, { name: string, description: string, scope: 'global' | 'institution' | 'polo' }> = {
  'super_admin': {
    name: 'super_admin',
    description: 'Administrador com acesso total ao sistema',
    scope: 'global'
  },
  'admin': {
    name: 'admin',
    description: 'Administrador com acesso à maioria das funcionalidades',
    scope: 'global'
  },
  'institution_admin': {
    name: 'institution_admin',
    description: 'Administrador de uma instituição específica',
    scope: 'institution'
  },
  'coordinator': {
    name: 'coordinator',
    description: 'Coordenador pedagógico',
    scope: 'institution'
  },
  'secretary': {
    name: 'secretary',
    description: 'Secretaria acadêmica',
    scope: 'institution'
  },
  'financial': {
    name: 'financial',
    description: 'Profissional do setor financeiro',
    scope: 'institution'
  },
  'sales': {
    name: 'sales',
    description: 'Profissional de vendas',
    scope: 'institution'
  },
  'teacher': {
    name: 'teacher',
    description: 'Professor ou tutor',
    scope: 'institution'
  },
  'polo_admin': {
    name: 'polo_admin',
    description: 'Administrador de polo',
    scope: 'polo'
  },
  'student': {
    name: 'student',
    description: 'Aluno',
    scope: 'institution'
  },
  'auditor': {
    name: 'auditor',
    description: 'Auditor com acesso de leitura aos dados',
    scope: 'institution'
  },
  'marketing': {
    name: 'marketing',
    description: 'Gerente de marketing e comunicação',
    scope: 'institution'
  }
};

async function createPermissionsAndRoles() {
  try {
    console.log('Iniciando criação de permissões e papéis...');
    
    // Criar permissões
    const allPermissions: { resource: string; action: string; description: string }[] = [];
    
    // Gerar lista completa de permissões com base em ROLE_PERMISSIONS
    Object.values(ROLE_PERMISSIONS).forEach(permissions => {
      permissions.forEach(permission => {
        const { resource, actions } = permission;
        actions.forEach(action => {
          const permissionKey = `${resource}:${action}`;
          
          // Evitar duplicatas
          if (!allPermissions.some(p => p.resource === resource && p.action === action)) {
            allPermissions.push({
              resource,
              action,
              description: PERMISSION_DESCRIPTIONS[permissionKey] || `${action} ${resource}`
            });
          }
        });
      });
    });
    
    console.log(`Criando ${allPermissions.length} permissões...`);
    
    // Inserir permissões no banco
    for (const permission of allPermissions) {
      // Verificar se a permissão já existe
      const existingPermission = await db
        .select({ id: schema.permissions.id })
        .from(schema.permissions)
        .where(
          and(
            eq(schema.permissions.resource, permission.resource),
            eq(schema.permissions.action, permission.action)
          )
        );
      
      if (existingPermission.length === 0) {
        await db.insert(schema.permissions).values({
          resource: permission.resource,
          action: permission.action,
          description: permission.description
        });
      }
    }
    
    console.log('Permissões criadas com sucesso!');
    console.log(`Criando ${Object.keys(ROLES_DETAILS).length} papéis...`);
    
    // Criar papéis
    const roleIds: Record<string, number> = {};
    
    for (const [roleKey, roleData] of Object.entries(ROLES_DETAILS)) {
      // Verificar se o papel já existe
      const existingRole = await db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(eq(schema.roles.name, roleData.name));
      
      let roleId: number;
      
      if (existingRole.length === 0) {
        // Criar novo papel
        const [newRole] = await db.insert(schema.roles).values({
          name: roleData.name,
          description: roleData.description,
          scope: roleData.scope,
          isSystem: true
        }).returning({ id: schema.roles.id });
        
        roleId = newRole.id;
      } else {
        roleId = existingRole[0].id;
      }
      
      roleIds[roleKey] = roleId;
    }
    
    console.log('Papéis criados com sucesso!');
    console.log('Atribuindo permissões aos papéis...');
    
    // Atribuir permissões aos papéis
    for (const [roleKey, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleIds[roleKey];
      
      if (!roleId) {
        console.error(`Papel '${roleKey}' não encontrado!`);
        continue;
      }
      
      for (const { resource, actions } of permissions) {
        for (const action of actions) {
          // Buscar ID da permissão
          const permission = await db
            .select({ id: schema.permissions.id })
            .from(schema.permissions)
            .where(
              and(
                eq(schema.permissions.resource, resource),
                eq(schema.permissions.action, action)
              )
            );
          
          if (permission.length === 0) {
            console.error(`Permissão '${resource}:${action}' não encontrada!`);
            continue;
          }
          
          const permissionId = permission[0].id;
          
          // Verificar se a associação já existe
          const existingAssociation = await db
            .select({ id: schema.rolePermissions.id })
            .from(schema.rolePermissions)
            .where(
              and(
                eq(schema.rolePermissions.roleId, roleId),
                eq(schema.rolePermissions.permissionId, permissionId)
              )
            );
          
          if (existingAssociation.length === 0) {
            // Criar nova associação
            await db.insert(schema.rolePermissions).values({
              roleId,
              permissionId
            });
          }
        }
      }
    }
    
    console.log('Permissões atribuídas aos papéis com sucesso!');
    console.log('Contando atribuições...');
    
    // Contar número de permissões por papel
    for (const [roleKey, roleId] of Object.entries(roleIds)) {
      const permissionCount = await db
        .select({ count: schema.rolePermissions.id })
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, roleId));
      
      console.log(`Papel '${roleKey}' possui ${permissionCount.length} permissões atribuídas.`);
    }
    
    console.log('Criação de permissões e papéis concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a criação de permissões e papéis:', error);
  } finally {
    // Encerrar conexão com o banco de dados
    process.exit(0);
  }
}

// Executar o script
createPermissionsAndRoles();