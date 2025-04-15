/**
 * Serviço para gerenciamento de permissões, papéis e atribuições de usuários
 */

import { db } from '../db';
import * as schema from '../../shared/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Atribui um papel a um usuário
 * @param userId ID do usuário 
 * @param roleId ID do papel
 * @param institutionId ID da instituição (opcional, para papéis de escopo institucional)
 * @param poloId ID do polo (opcional, para papéis de escopo de polo)
 * @returns ID da atribuição
 */
export async function assignRoleToUser(
  userId: number, 
  roleId: number, 
  institutionId?: number,
  poloId?: number
): Promise<number> {
  // Verificar se o papel existe
  const role = await db.select({ id: schema.roles.id, scope: schema.roles.scope })
    .from(schema.roles)
    .where(eq(schema.roles.id, roleId));

  if (role.length === 0) {
    throw new Error(`Papel com ID ${roleId} não encontrado`);
  }

  const roleScope = role[0].scope;

  // Validar instituição e polo de acordo com o escopo do papel
  if (roleScope === 'institution' && !institutionId) {
    throw new Error(`Papel de escopo 'institution' requer um ID de instituição`);
  }

  if (roleScope === 'polo' && !poloId) {
    throw new Error(`Papel de escopo 'polo' requer um ID de polo`);
  }

  // Verificar se o usuário já tem este papel no mesmo contexto
  const existingRole = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.roleId, roleId),
        institutionId ? eq(schema.userRoles.institutionId, institutionId) : undefined,
        poloId ? eq(schema.userRoles.poloId, poloId) : undefined
      )
    );

  if (existingRole.length > 0) {
    return existingRole[0].id; // Papel já atribuído, retorna o ID existente
  }

  // Atribuir o papel ao usuário
  const [userRole] = await db.insert(schema.userRoles)
    .values({
      userId,
      roleId,
      institutionId: institutionId || null,
      poloId: poloId || null
    })
    .returning({ id: schema.userRoles.id });

  return userRole.id;
}

/**
 * Remove um papel de um usuário
 * @param userId ID do usuário
 * @param roleId ID do papel
 * @param institutionId ID da instituição (opcional)
 * @param poloId ID do polo (opcional)
 * @returns boolean indicando sucesso
 */
export async function removeRoleFromUser(
  userId: number, 
  roleId: number, 
  institutionId?: number,
  poloId?: number
): Promise<boolean> {
  const result = await db.delete(schema.userRoles)
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.roleId, roleId),
        institutionId ? eq(schema.userRoles.institutionId, institutionId) : undefined,
        poloId ? eq(schema.userRoles.poloId, poloId) : undefined
      )
    );

  return true;
}

/**
 * Obtém todos os papéis de um usuário
 * @param userId ID do usuário
 * @returns Lista de papéis do usuário com detalhes
 */
export async function getUserRoles(userId: number) {
  const userRoles = await db.select({
    id: schema.userRoles.id,
    roleId: schema.userRoles.roleId,
    roleName: schema.roles.name,
    roleDescription: schema.roles.description,
    roleScope: schema.roles.scope,
    institutionId: schema.userRoles.institutionId,
    poloId: schema.userRoles.poloId,
    createdAt: schema.userRoles.createdAt
  })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));

  return userRoles;
}

/**
 * Obtém todas as permissões de um usuário
 * @param userId ID do usuário
 * @returns Lista de permissões únicas do usuário
 */
export async function getUserPermissions(userId: number) {
  const permissions = await db.select({
    id: schema.permissions.id,
    resource: schema.permissions.resource,
    action: schema.permissions.action,
    description: schema.permissions.description
  })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.userRoles.userId, userId));

  // Remover duplicatas (usuário pode ter a mesma permissão de papéis diferentes)
  const uniquePermissions = permissions.filter((permission, index, self) =>
    index === self.findIndex((p) => p.id === permission.id)
  );

  return uniquePermissions;
}

/**
 * Verificar se um usuário possui uma permissão específica
 * @param userId ID do usuário 
 * @param resource Recurso
 * @param action Ação
 * @returns boolean indicando se o usuário tem a permissão
 */
export async function checkUserPermission(userId: number, resource: string, action: string): Promise<boolean> {
  // Verificar super_admin primeiro
  const superAdminCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdminCheck.length > 0) {
    return true;
  }

  // Verificar permissão específica
  const permissionCheck = await db.select({ id: schema.permissions.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.permissions.resource, resource),
        eq(schema.permissions.action, action)
      )
    );

  // Verificar permissão 'manage'
  const managePermissionCheck = await db.select({ id: schema.permissions.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .innerJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.permissions.resource, resource),
        eq(schema.permissions.action, 'manage')
      )
    );

  return permissionCheck.length > 0 || managePermissionCheck.length > 0;
}

/**
 * Verifica se um usuário tem acesso a uma instituição
 * @param userId ID do usuário
 * @param institutionId ID da instituição
 * @returns boolean indicando se o usuário tem acesso
 */
export async function checkInstitutionAccess(userId: number, institutionId: number): Promise<boolean> {
  // Verificar super_admin primeiro
  const superAdminCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdminCheck.length > 0) {
    return true;
  }

  // Verificar se é owner da instituição
  const institutionOwnerCheck = await db.select({ id: schema.institutions.id })
    .from(schema.institutions)
    .where(
      and(
        eq(schema.institutions.id, institutionId),
        eq(schema.institutions.ownerId, userId)
      )
    );

  if (institutionOwnerCheck.length > 0) {
    return true;
  }

  // Verificar se tem papel na instituição
  const institutionRoleCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.institutionId, institutionId),
        eq(schema.roles.scope, 'institution')
      )
    );

  return institutionRoleCheck.length > 0;
}

/**
 * Verifica se um usuário tem acesso a um polo
 * @param userId ID do usuário
 * @param poloId ID do polo
 * @returns boolean indicando se o usuário tem acesso
 */
export async function checkPoloAccess(userId: number, poloId: number): Promise<boolean> {
  // Verificar super_admin primeiro
  const superAdminCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdminCheck.length > 0) {
    return true;
  }

  // Verificar se tem papel no polo
  const poloRoleCheck = await db.select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.poloId, poloId),
        eq(schema.roles.scope, 'polo')
      )
    );

  if (poloRoleCheck.length > 0) {
    return true;
  }

  // Verificar se tem acesso à instituição deste polo
  const poloData = await db.select({ institutionId: schema.polos.institutionId })
    .from(schema.polos)
    .where(eq(schema.polos.id, poloId));

  if (poloData.length > 0) {
    const institutionId = poloData[0].institutionId;
    return await checkInstitutionAccess(userId, institutionId);
  }

  return false;
}