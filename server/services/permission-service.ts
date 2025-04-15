/**
 * Serviço de gerenciamento de permissões
 */

import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq, and, or, inArray, lt, gt, lte, gte, isNull, not, asc, desc, sql } from 'drizzle-orm';

/**
 * Verifica se um usuário tem uma permissão específica
 * @param userId ID do usuário
 * @param resource Nome do recurso
 * @param action Ação a ser verificada
 * @returns boolean
 */
export async function checkUserPermission(userId: number, resource: string, action: string): Promise<boolean> {
  // Primeiro verifique se o usuário tem a permissão explicitamente
  const userPermission = await db
    .select({ id: schema.userPermissions.id })
    .from(schema.userPermissions)
    .innerJoin(schema.permissions, eq(schema.userPermissions.permissionId, schema.permissions.id))
    .where(
      and(
        eq(schema.userPermissions.userId, userId),
        eq(schema.permissions.resource, resource),
        or(
          eq(schema.permissions.action, action),
          eq(schema.permissions.action, 'manage') // 'manage' concede todas as permissões para o recurso
        )
      )
    );

  if (userPermission.length > 0) {
    return true;
  }

  // Verifique se o usuário tem a permissão através de um papel
  const rolePermission = await db
    .select({ id: schema.rolePermissions.id })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .innerJoin(schema.userRoles, eq(schema.rolePermissions.roleId, schema.userRoles.roleId))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.permissions.resource, resource),
        or(
          eq(schema.permissions.action, action),
          eq(schema.permissions.action, 'manage') // 'manage' concede todas as permissões para o recurso
        )
      )
    );

  return rolePermission.length > 0;
}

/**
 * Verifica se um usuário tem acesso a uma instituição
 * @param userId ID do usuário
 * @param institutionId ID da instituição
 * @returns boolean
 */
export async function checkInstitutionAccess(userId: number, institutionId: number): Promise<boolean> {
  // Verifica papéis de super_admin (acesso a tudo)
  const superAdmin = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdmin.length > 0) {
    return true;
  }

  // Verifica se é owner da instituição
  const isOwner = await db
    .select({ id: schema.institutions.id })
    .from(schema.institutions)
    .where(
      and(
        eq(schema.institutions.id, institutionId),
        eq(schema.institutions.ownerId, userId)
      )
    );

  if (isOwner.length > 0) {
    return true;
  }

  // Verifica papéis na instituição
  const institutionRole = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.institutionId, institutionId),
        eq(schema.roles.scope, 'institution')
      )
    );

  return institutionRole.length > 0;
}

/**
 * Verifica se um usuário tem acesso a um polo
 * @param userId ID do usuário
 * @param poloId ID do polo
 * @returns boolean
 */
export async function checkPoloAccess(userId: number, poloId: number): Promise<boolean> {
  // Verifica papéis de super_admin (acesso a tudo)
  const superAdmin = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.roles.name, 'super_admin')
      )
    );

  if (superAdmin.length > 0) {
    return true;
  }

  // Verifica papéis no polo
  const poloRole = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(
      and(
        eq(schema.userRoles.userId, userId),
        eq(schema.userRoles.poloId, poloId)
      )
    );

  if (poloRole.length > 0) {
    return true;
  }

  // Verifica acesso via instituição
  const poloData = await db
    .select({ institutionId: schema.polos.institutionId })
    .from(schema.polos)
    .where(eq(schema.polos.id, poloId));

  if (poloData.length > 0) {
    return await checkInstitutionAccess(userId, poloData[0].institutionId);
  }

  return false;
}

/**
 * Atribui um papel a um usuário
 * @param userId ID do usuário
 * @param roleId ID do papel
 * @param institutionId ID da instituição (opcional)
 * @param poloId ID do polo (opcional)
 * @returns boolean
 */
export async function assignRoleToUser(
  userId: number, 
  roleId: number, 
  institutionId?: number, 
  poloId?: number
): Promise<boolean> {
  try {
    // Verifica o escopo do papel
    const role = await db
      .select({ scope: schema.roles.scope })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (role.length === 0) {
      throw new Error('Papel não encontrado');
    }

    const scope = role[0].scope;

    // Verifica se o escopo exige instituição/polo
    if (scope === 'institution' && !institutionId) {
      throw new Error('Papel de instituição requer ID da instituição');
    }

    if (scope === 'polo' && !poloId) {
      throw new Error('Papel de polo requer ID do polo');
    }

    // Verifica se a associação já existe
    const existingRole = await db
      .select({ id: schema.userRoles.id })
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
      // Papel já atribuído
      return true;
    }

    // Atribui o papel
    await db.insert(schema.userRoles).values({
      userId,
      roleId,
      institutionId: institutionId || null,
      poloId: poloId || null
    });

    return true;
  } catch (error) {
    console.error('Erro ao atribuir papel ao usuário:', error);
    return false;
  }
}

/**
 * Remove um papel de um usuário
 * @param userId ID do usuário
 * @param roleId ID do papel
 * @param institutionId ID da instituição (opcional)
 * @param poloId ID do polo (opcional)
 * @returns boolean
 */
export async function removeRoleFromUser(
  userId: number, 
  roleId: number, 
  institutionId?: number, 
  poloId?: number
): Promise<boolean> {
  try {
    // Remove o papel
    await db
      .delete(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId),
          institutionId ? eq(schema.userRoles.institutionId, institutionId) : undefined,
          poloId ? eq(schema.userRoles.poloId, poloId) : undefined
        )
      );

    return true;
  } catch (error) {
    console.error('Erro ao remover papel do usuário:', error);
    return false;
  }
}

/**
 * Obtém todas as permissões
 * @returns Array de permissões
 */
export async function getAllPermissions() {
  return await db
    .select({
      id: schema.permissions.id,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
      description: schema.permissions.description
    })
    .from(schema.permissions)
    .orderBy(schema.permissions.resource, schema.permissions.action);
}

/**
 * Obtém todos os papéis
 * @returns Array de papéis
 */
export async function getAllRoles() {
  return await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      description: schema.roles.description,
      scope: schema.roles.scope,
      isSystem: schema.roles.isSystem
    })
    .from(schema.roles)
    .orderBy(schema.roles.name);
}

/**
 * Obtém os papéis de um usuário
 * @param userId ID do usuário
 * @returns Array de papéis
 */
export async function getUserRoles(userId: number) {
  return await db
    .select({
      id: schema.userRoles.id,
      roleId: schema.userRoles.roleId,
      roleName: schema.roles.name,
      roleDescription: schema.roles.description,
      roleScope: schema.roles.scope,
      institutionId: schema.userRoles.institutionId,
      poloId: schema.userRoles.poloId
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));
}

/**
 * Obtém as permissões de um papel
 * @param roleId ID do papel
 * @returns Array de permissões
 */
export async function getRolePermissions(roleId: number) {
  return await db
    .select({
      id: schema.rolePermissions.id,
      permissionId: schema.permissions.id,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
      description: schema.permissions.description
    })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.rolePermissions.roleId, roleId));
}

/**
 * Cria um novo papel
 * @param data Dados do papel
 * @returns Papel criado
 */
export async function createRole(data: {
  name: string;
  description: string;
  scope: 'global' | 'institution' | 'polo';
}) {
  try {
    // Verifica se já existe papel com este nome
    const existingRole = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.name, data.name));

    if (existingRole.length > 0) {
      throw new Error('Já existe um papel com este nome');
    }

    // Cria o papel
    const [newRole] = await db
      .insert(schema.roles)
      .values({
        name: data.name,
        description: data.description,
        scope: data.scope,
        isSystem: false
      })
      .returning();

    return newRole;
  } catch (error) {
    console.error('Erro ao criar papel:', error);
    throw error;
  }
}

/**
 * Atualiza um papel
 * @param roleId ID do papel
 * @param data Dados do papel
 * @returns Papel atualizado
 */
export async function updateRole(
  roleId: number,
  data: {
    description?: string;
    scope?: 'global' | 'institution' | 'polo';
  }
) {
  try {
    // Verifica se o papel existe
    const role = await db
      .select({ isSystem: schema.roles.isSystem })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (role.length === 0) {
      throw new Error('Papel não encontrado');
    }

    // Não permite modificar papéis do sistema
    if (role[0].isSystem) {
      throw new Error('Não é possível modificar papéis do sistema');
    }

    // Atualiza o papel
    const [updatedRole] = await db
      .update(schema.roles)
      .set({
        description: data.description,
        scope: data.scope
      })
      .where(eq(schema.roles.id, roleId))
      .returning();

    return updatedRole;
  } catch (error) {
    console.error('Erro ao atualizar papel:', error);
    throw error;
  }
}

/**
 * Exclui um papel
 * @param roleId ID do papel
 * @returns boolean
 */
export async function deleteRole(roleId: number): Promise<boolean> {
  try {
    // Verifica se o papel existe
    const role = await db
      .select({ isSystem: schema.roles.isSystem })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (role.length === 0) {
      throw new Error('Papel não encontrado');
    }

    // Não permite excluir papéis do sistema
    if (role[0].isSystem) {
      throw new Error('Não é possível excluir papéis do sistema');
    }

    // Remove todas as associações de permissões
    await db
      .delete(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));

    // Remove todas as associações de usuários
    await db
      .delete(schema.userRoles)
      .where(eq(schema.userRoles.roleId, roleId));

    // Exclui o papel
    await db
      .delete(schema.roles)
      .where(eq(schema.roles.id, roleId));

    return true;
  } catch (error) {
    console.error('Erro ao excluir papel:', error);
    throw error;
  }
}

/**
 * Adiciona uma permissão a um papel
 * @param roleId ID do papel
 * @param permissionId ID da permissão
 * @returns boolean
 */
export async function addPermissionToRole(roleId: number, permissionId: number): Promise<boolean> {
  try {
    // Verifica se o papel existe
    const role = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.id, roleId));

    if (role.length === 0) {
      throw new Error('Papel não encontrado');
    }

    // Verifica se a permissão existe
    const permission = await db
      .select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(eq(schema.permissions.id, permissionId));

    if (permission.length === 0) {
      throw new Error('Permissão não encontrada');
    }

    // Verifica se a associação já existe
    const existingPermission = await db
      .select({ id: schema.rolePermissions.id })
      .from(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, roleId),
          eq(schema.rolePermissions.permissionId, permissionId)
        )
      );

    if (existingPermission.length > 0) {
      // Permissão já atribuída
      return true;
    }

    // Adiciona a permissão
    await db.insert(schema.rolePermissions).values({
      roleId,
      permissionId
    });

    return true;
  } catch (error) {
    console.error('Erro ao adicionar permissão ao papel:', error);
    return false;
  }
}

/**
 * Remove uma permissão de um papel
 * @param roleId ID do papel
 * @param permissionId ID da permissão
 * @returns boolean
 */
export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
  try {
    // Remove a permissão
    await db
      .delete(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.roleId, roleId),
          eq(schema.rolePermissions.permissionId, permissionId)
        )
      );

    return true;
  } catch (error) {
    console.error('Erro ao remover permissão do papel:', error);
    return false;
  }
}

/**
 * Obtém as permissões diretas de um usuário
 * @param userId ID do usuário
 * @returns Array de permissões
 */
export async function getUserPermissions(userId: number) {
  return await db
    .select({
      id: schema.userPermissions.id,
      permissionId: schema.permissions.id,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
      description: schema.permissions.description,
      institutionId: schema.userPermissions.institutionId,
      poloId: schema.userPermissions.poloId,
      expiresAt: schema.userPermissions.expiresAt
    })
    .from(schema.userPermissions)
    .innerJoin(schema.permissions, eq(schema.userPermissions.permissionId, schema.permissions.id))
    .where(eq(schema.userPermissions.userId, userId));
}

/**
 * Adiciona uma permissão direta a um usuário
 * @param userId ID do usuário
 * @param permissionId ID da permissão
 * @param institutionId ID da instituição (opcional)
 * @param poloId ID do polo (opcional)
 * @param expiresAt Data de expiração (opcional)
 * @returns boolean
 */
export async function addPermissionToUser(
  userId: number, 
  permissionId: number, 
  institutionId?: number,
  poloId?: number,
  expiresAt?: Date
): Promise<boolean> {
  try {
    // Verifica se o usuário existe
    const user = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (user.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    // Verifica se a permissão existe
    const permission = await db
      .select({ id: schema.permissions.id })
      .from(schema.permissions)
      .where(eq(schema.permissions.id, permissionId));

    if (permission.length === 0) {
      throw new Error('Permissão não encontrada');
    }

    // Verifica se a associação já existe
    const existingPermission = await db
      .select({ id: schema.userPermissions.id })
      .from(schema.userPermissions)
      .where(
        and(
          eq(schema.userPermissions.userId, userId),
          eq(schema.userPermissions.permissionId, permissionId),
          institutionId ? eq(schema.userPermissions.institutionId, institutionId) : undefined,
          poloId ? eq(schema.userPermissions.poloId, poloId) : undefined
        )
      );

    if (existingPermission.length > 0) {
      // Permissão já atribuída - atualiza expiração se fornecida
      if (expiresAt) {
        await db
          .update(schema.userPermissions)
          .set({ expiresAt })
          .where(eq(schema.userPermissions.id, existingPermission[0].id));
      }
      return true;
    }

    // Adiciona a permissão
    await db.insert(schema.userPermissions).values({
      userId,
      permissionId,
      institutionId: institutionId || null,
      poloId: poloId || null,
      expiresAt: expiresAt || null
    });

    return true;
  } catch (error) {
    console.error('Erro ao adicionar permissão ao usuário:', error);
    return false;
  }
}

/**
 * Remove uma permissão direta de um usuário
 * @param userId ID do usuário
 * @param permissionId ID da permissão
 * @param institutionId ID da instituição (opcional)
 * @param poloId ID do polo (opcional)
 * @returns boolean
 */
export async function removePermissionFromUser(
  userId: number, 
  permissionId: number,
  institutionId?: number,
  poloId?: number
): Promise<boolean> {
  try {
    // Remove a permissão
    await db
      .delete(schema.userPermissions)
      .where(
        and(
          eq(schema.userPermissions.userId, userId),
          eq(schema.userPermissions.permissionId, permissionId),
          institutionId ? eq(schema.userPermissions.institutionId, institutionId) : undefined,
          poloId ? eq(schema.userPermissions.poloId, poloId) : undefined
        )
      );

    return true;
  } catch (error) {
    console.error('Erro ao remover permissão do usuário:', error);
    return false;
  }
}