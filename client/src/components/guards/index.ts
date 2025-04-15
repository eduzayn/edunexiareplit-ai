/**
 * Exportação centralizada dos componentes de guarda de permissão
 */

// Guardiões de permissão
export { default as AbacGuard } from './abac-guard';
export { PermissionGuard } from '@/hooks/use-permissions';

// Componentes com verificação de permissão
export { default as PermissionButton } from './permission-button';
export { default as PermissionMenuItem } from './permission-menu-item';

// Hooks de permissão
export { usePermissions, useRoles, usePermissionsList, useUserRoles, useUserPermissions } from '@/hooks/use-permissions';
export { useABAC } from '@/hooks/use-abac';

// Tipos
export type { 
  Role, 
  Permission, 
  UserRole, 
  RolePermission, 
  UserPermission 
} from '@/hooks/use-permissions';

/**
 * Exemplo de uso:
 * 
 * // Verificação simples de permissão RBAC
 * <PermissionGuard resource="users" action="create">
 *   <CreateUserForm />
 * </PermissionGuard>
 * 
 * // Verificação contextual ABAC
 * <AbacGuard 
 *   resource="invoices" 
 *   action="create" 
 *   condition={{ 
 *     institutionId: 5, 
 *     paymentStatus: "pending" 
 *   }}
 * >
 *   <CreateInvoiceForm />
 * </AbacGuard>
 * 
 * // Botão com verificação de permissão
 * <PermissionButton
 *   resource="users"
 *   action="delete"
 *   variant="destructive"
 *   onClick={handleDeleteUser}
 * >
 *   Excluir Usuário
 * </PermissionButton>
 * 
 * // Item de menu com verificação de permissão
 * <DropdownMenu>
 *   <DropdownMenuTrigger>Ações</DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <PermissionMenuItem
 *       resource="users"
 *       action="update"
 *       onClick={handleEditUser}
 *     >
 *       Editar Usuário
 *     </PermissionMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */