import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../db";
import { permissions, rolePermissions, roles, userRoles, users } from "@shared/schema";
import { PermissionAction, PermissionResource } from "@shared/types";

/**
 * Verifica se um usuário tem permissão para realizar uma ação específica em um recurso
 * @param userId ID do usuário
 * @param action Ação que o usuário deseja realizar
 * @param resource Recurso no qual a ação será realizada
 * @param contextParams Parâmetros de contexto (instituição, polo, etc)
 * @returns true se o usuário tem permissão, false caso contrário
 */
export async function hasPermission(
  userId: number,
  action: PermissionAction,
  resource: PermissionResource,
  contextParams?: {
    institutionId?: number;
    poloId?: number;
    ownedResource?: boolean;
  }
): Promise<boolean> {
  const { institutionId, poloId, ownedResource } = contextParams || {};

  try {
    // Buscar o usuário e verificar se é superadmin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return false;
    }

    // Superadmins têm todas as permissões
    if (user.isSuperAdmin) {
      return true;
    }

    // Buscar os papéis (roles) do usuário
    let userRolesList = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    // Filtrar papéis por contexto se fornecido
    if (institutionId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.institutionId || ur.institutionId === institutionId
      );
    }

    if (poloId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.poloId || ur.poloId === poloId
      );
    }

    if (userRolesList.length === 0) {
      return false;
    }

    // Listar IDs dos papéis
    const roleIds = userRolesList.map((ur) => ur.roleId);

    // Verificar permissão específica
    const permissionCheck = await db
      .select()
      .from(permissions)
      .innerJoin(
        rolePermissions,
        eq(rolePermissions.permissionId, permissions.id)
      )
      .where(
        and(
          inArray(rolePermissions.roleId, roleIds),
          or(
            // Verificar ação específica
            and(
              eq(permissions.resource, resource),
              eq(permissions.action, action)
            ),
            // Verificar ação 'manage' que concede todas as permissões nesse recurso
            and(
              eq(permissions.resource, resource),
              eq(permissions.action, "manage")
            )
          )
        )
      )
      .limit(1);

    // Se encontrou alguma permissão, o usuário está autorizado
    return permissionCheck.length > 0;
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
}

/**
 * Obtém todas as permissões disponíveis para um usuário
 * @param userId ID do usuário
 * @param contextParams Parâmetros de contexto (instituição, polo, etc)
 * @returns Lista de permissões do usuário
 */
export async function getUserPermissions(
  userId: number,
  contextParams?: {
    institutionId?: number;
    poloId?: number;
  }
): Promise<{ action: string; resource: string }[]> {
  const { institutionId, poloId } = contextParams || {};

  try {
    // Buscar o usuário e verificar se é superadmin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return [];
    }

    // Se for superadmin, buscar todas as permissões disponíveis
    if (user.isSuperAdmin) {
      const allPermissions = await db.query.permissions.findMany();
      return allPermissions.map((p) => ({
        action: p.action,
        resource: p.resource,
      }));
    }

    // Buscar os papéis (roles) do usuário
    let userRolesList = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
    });

    // Filtrar papéis por contexto se fornecido
    if (institutionId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.institutionId || ur.institutionId === institutionId
      );
    }

    if (poloId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.poloId || ur.poloId === poloId
      );
    }

    if (userRolesList.length === 0) {
      return [];
    }

    // Listar IDs dos papéis
    const roleIds = userRolesList.map((ur) => ur.roleId);

    // Buscar todas as permissões associadas aos papéis do usuário
    const permissionResults = await db
      .select({
        action: permissions.action,
        resource: permissions.resource,
      })
      .from(permissions)
      .innerJoin(
        rolePermissions,
        eq(rolePermissions.permissionId, permissions.id)
      )
      .where(inArray(rolePermissions.roleId, roleIds));

    // Remover duplicatas
    const uniquePermissions = Array.from(
      new Set(
        permissionResults.map((p) => `${p.action}:${p.resource}`)
      )
    ).map((combined) => {
      const [action, resource] = combined.split(":");
      return { action, resource };
    });

    return uniquePermissions;
  } catch (error) {
    console.error("Erro ao obter permissões do usuário:", error);
    return [];
  }
}

/**
 * Obtém todos os papéis (roles) de um usuário
 * @param userId ID do usuário
 * @param contextParams Parâmetros de contexto (instituição, polo, etc)
 * @returns Lista de papéis do usuário
 */
export async function getUserRoles(
  userId: number,
  contextParams?: {
    institutionId?: number;
    poloId?: number;
  }
): Promise<{ id: number; name: string; description: string }[]> {
  const { institutionId, poloId } = contextParams || {};

  try {
    // Buscar os papéis (roles) do usuário
    let userRolesList = await db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    // Filtrar papéis por contexto se fornecido
    if (institutionId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.institutionId || ur.institutionId === institutionId
      );
    }

    if (poloId) {
      userRolesList = userRolesList.filter(
        (ur) => !ur.poloId || ur.poloId === poloId
      );
    }

    // Extrair informações dos papéis
    return userRolesList.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    }));
  } catch (error) {
    console.error("Erro ao obter papéis do usuário:", error);
    return [];
  }
}

/**
 * Atribui um papel (role) a um usuário
 * @param userId ID do usuário
 * @param roleId ID do papel
 * @param contextParams Parâmetros de contexto (instituição, polo, criador)
 * @returns true se a atribuição foi bem-sucedida, false caso contrário
 */
export async function assignRoleToUser(
  userId: number,
  roleId: number,
  contextParams: {
    institutionId?: number;
    poloId?: number;
    createdById: number;
  }
): Promise<boolean> {
  const { institutionId, poloId, createdById } = contextParams;

  try {
    // Verificar se o usuário e o papel existem
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!user || !role) {
      return false;
    }

    // Verificar se esta atribuição já existe
    const existingAssignment = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId),
        institutionId ? eq(userRoles.institutionId, institutionId) : undefined,
        poloId ? eq(userRoles.poloId, poloId) : undefined
      ),
    });

    if (existingAssignment) {
      // Já existe esta atribuição
      return true;
    }

    // Criar a nova atribuição
    await db.insert(userRoles).values({
      userId,
      roleId,
      institutionId,
      poloId,
      createdById,
    });

    return true;
  } catch (error) {
    console.error("Erro ao atribuir papel ao usuário:", error);
    return false;
  }
}

/**
 * Remove um papel (role) de um usuário
 * @param userId ID do usuário
 * @param roleId ID do papel
 * @param contextParams Parâmetros de contexto (instituição, polo)
 * @returns true se a remoção foi bem-sucedida, false caso contrário
 */
export async function removeRoleFromUser(
  userId: number,
  roleId: number,
  contextParams?: {
    institutionId?: number;
    poloId?: number;
  }
): Promise<boolean> {
  const { institutionId, poloId } = contextParams || {};

  try {
    // Filtros para a consulta de remoção
    const filters = [
      eq(userRoles.userId, userId),
      eq(userRoles.roleId, roleId),
    ];

    if (institutionId) {
      filters.push(eq(userRoles.institutionId, institutionId));
    }

    if (poloId) {
      filters.push(eq(userRoles.poloId, poloId));
    }

    // Remover a atribuição
    await db.delete(userRoles).where(and(...filters));

    return true;
  } catch (error) {
    console.error("Erro ao remover papel do usuário:", error);
    return false;
  }
}