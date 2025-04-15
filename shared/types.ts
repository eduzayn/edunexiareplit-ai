// Tipos para o sistema de permissões

/**
 * Tipos de recursos do sistema para permissões
 */
export type PermissionResource =
  // Recursos administrativos
  | "users"
  | "institutions"
  | "polos"
  
  // Recursos educacionais
  | "courses"
  | "disciplines"
  | "enrollments"
  | "assessments"
  | "questions"
  
  // Recursos financeiros
  | "financial_transactions"
  | "financial_categories"
  
  // Recursos de certificados
  | "certificates"
  | "certificate_templates"
  | "certificate_signers"
  
  // Recursos de CRM
  | "leads"
  | "clients"
  | "contacts"
  
  // Recursos financeiros
  | "products"
  | "invoices"
  | "payments"
  
  // Recursos de contratos
  | "contracts"
  | "contract_templates"
  
  // Recursos de permissões
  | "roles"
  | "permissions"
  
  // Recursos de integração
  | "integrations"
  
  // Outros recursos
  | "reports"
  | "dashboard"
  | "settings";

/**
 * Tipos de ações que podem ser executadas em recursos
 */
export type PermissionAction =
  | "create"   // Criar um novo recurso
  | "read"     // Visualizar um recurso
  | "update"   // Atualizar um recurso
  | "delete"   // Excluir um recurso
  | "manage"   // Controle total (inclui todas as ações acima)
  | "export";  // Exportar dados de um recurso

/**
 * Interface para representar uma permissão
 */
export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: PermissionResource;
  action: PermissionAction;
  createdAt: Date;
}

/**
 * Interface para representar um papel (role)
 */
export interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  institutionId?: number;
  createdById?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para representar a associação entre papel e permissão
 */
export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  createdById?: number;
  createdAt: Date;
}

/**
 * Interface para representar a associação entre usuário e papel
 */
export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  institutionId?: number;
  poloId?: number;
  createdById?: number;
  createdAt: Date;
}