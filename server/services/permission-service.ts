/**
 * Serviço de gerenciamento de permissões
 */

import { db } from '../db';
import * as schema from '../../shared/schema';
import * as abacSchema from '../../shared/abac-schema';
import { eq, and, or, inArray, lt, gt, lte, gte, isNull, not, asc, desc, sql } from 'drizzle-orm';
import { InsertInstitutionPhasePermission, InsertPeriodPermissionRule, InsertPaymentStatusPermission } from '../../shared/abac-schema';

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

/**
 * ABAC - Attribute-Based Access Control
 * Funções para verificação de permissões contextual baseada em atributos
 */

/**
 * Verifica se um usuário é proprietário de um recurso
 * @param userId ID do usuário
 * @param resourceType Tipo do recurso (ex: 'courses', 'products', etc)
 * @param entityId ID da entidade
 * @returns boolean
 */
export async function isEntityOwner(
  userId: number,
  resourceType: string,
  entityId: number
): Promise<boolean> {
  try {
    // Verifica permissões administrativas primeiro (bypass)
    const isSuperAdmin = await hasSuperAdminRole(userId);
    if (isSuperAdmin) return true;

    // Tipos específicos de recursos e suas tabelas correspondentes
    switch (resourceType) {
      case 'courses':
        const course = await db
          .select()
          .from(schema.courses)
          .where(
            and(
              eq(schema.courses.id, entityId),
              eq(schema.courses.createdById, userId)
            )
          );
        return course.length > 0;

      case 'institutions':
        const institution = await db
          .select()
          .from(schema.institutions)
          .where(
            and(
              eq(schema.institutions.id, entityId),
              eq(schema.institutions.ownerId, userId)
            )
          );
        return institution.length > 0;

      case 'polos':
        const polo = await db
          .select()
          .from(schema.polos)
          .where(
            and(
              eq(schema.polos.id, entityId),
              eq(schema.polos.managerId, userId)
            )
          );
        return polo.length > 0;

      case 'products':
        const product = await db
          .select()
          .from(schema.products)
          .where(
            and(
              eq(schema.products.id, entityId),
              eq(schema.products.createdBy, userId)
            )
          );
        return product.length > 0;

      case 'invoices':
        const invoice = await db
          .select()
          .from(schema.invoices)
          .where(
            and(
              eq(schema.invoices.id, entityId),
              eq(schema.invoices.createdBy, userId)
            )
          );
        return invoice.length > 0;

      case 'contracts':
        const contract = await db
          .select()
          .from(schema.contracts)
          .where(
            and(
              eq(schema.contracts.id, entityId),
              eq(schema.contracts.createdBy, userId)
            )
          );
        return contract.length > 0;

      case 'leads':
        const lead = await db
          .select()
          .from(schema.leads)
          .where(
            and(
              eq(schema.leads.id, entityId),
              eq(schema.leads.assignedTo, userId)
            )
          );
        return lead.length > 0;

      case 'clients':
        const client = await db
          .select()
          .from(schema.clients)
          .where(
            and(
              eq(schema.clients.id, entityId),
              eq(schema.clients.assignedTo, userId)
            )
          );
        return client.length > 0;

      case 'certificate_templates':
        const template = await db
          .select()
          .from(schema.certificateTemplates)
          .where(
            and(
              eq(schema.certificateTemplates.id, entityId),
              eq(schema.certificateTemplates.createdBy, userId)
            )
          );
        return template.length > 0;

      default:
        // Para outros tipos de recursos, retorna false
        return false;
    }
  } catch (error) {
    console.error(`Erro ao verificar propriedade do recurso ${resourceType}:`, error);
    return false;
  }
}

/**
 * Verifica se um usuário tem papel de super admin
 * @param userId ID do usuário
 * @returns boolean
 */
export async function hasSuperAdminRole(userId: number): Promise<boolean> {
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

  return superAdmin.length > 0;
}

/**
 * Verifica se o acesso é permitido com base no ciclo acadêmico/financeiro
 * @param userId ID do usuário
 * @param resource Nome do recurso
 * @param action Ação a ser verificada
 * @param targetDate Data alvo a ser verificada
 * @param institutionId ID da instituição (opcional)
 * @returns boolean
 */
export async function checkPeriodAccess(
  userId: number,
  resource: string,
  action: string,
  targetDate: Date,
  institutionId?: number
): Promise<boolean> {
  try {
    // Verifica permissões administrativas primeiro (bypass)
    const isSuperAdmin = await hasSuperAdminRole(userId);
    if (isSuperAdmin) return true;

    // Verifica permissão básica
    const hasBasePermission = await checkUserPermission(userId, resource, action);
    if (!hasBasePermission) return false;

    // Se não houver instituição, usa regras gerais de período
    if (!institutionId) {
      // Períodos financeiros gerais do sistema
      const financialPeriods = await db
        .select()
        .from(schema.financialPeriods)
        .where(
          and(
            lte(schema.financialPeriods.startDate, targetDate),
            gte(schema.financialPeriods.endDate, targetDate),
            eq(schema.financialPeriods.isActive, true),
            isNull(schema.financialPeriods.institutionId) // Períodos globais (não vinculados a instituição)
          )
        );

      // Se não houver período financeiro ativo que inclua a data, nega o acesso
      if (financialPeriods.length === 0) {
        // Exceções para ações administrativas
        if (action === 'ler') return true;
        return false;
      }

      return true;
    }

    // Verifica regras específicas da instituição
    const financialPeriods = await db
      .select()
      .from(schema.financialPeriods)
      .where(
        and(
          eq(schema.financialPeriods.institutionId, institutionId),
          lte(schema.financialPeriods.startDate, targetDate),
          gte(schema.financialPeriods.endDate, targetDate),
          eq(schema.financialPeriods.isActive, true)
        )
      );

    // Se não houver período específico da instituição, nega o acesso
    if (financialPeriods.length === 0) {
      // Exceções para ações administrativas
      if (action === 'ler') return true;
      return false;
    }

    // Verifica permissões específicas para ações dentro do período
    const periodRules = await db
      .select()
      .from(schema.periodPermissionRules)
      .where(
        and(
          eq(schema.periodPermissionRules.institutionId, institutionId),
          eq(schema.periodPermissionRules.resource, resource),
          eq(schema.periodPermissionRules.action, action)
        )
      );

    // Se não houver regras específicas para este recurso/ação, permite o acesso
    if (periodRules.length === 0) return true;

    // Verifica regras específicas
    const rule = periodRules[0];
    const period = financialPeriods[0];
    const currentDate = new Date();
    
    // Calcula o período estendido com os dias antes/depois 
    // usando valores default em caso de daysBefore/daysAfter nulos
    const daysBefore = rule.daysBefore ?? 0;
    const daysAfter = rule.daysAfter ?? 0;
    
    const effectiveStartDate = new Date(period.startDate);
    effectiveStartDate.setDate(effectiveStartDate.getDate() - daysBefore);
    
    const effectiveEndDate = new Date(period.endDate);
    effectiveEndDate.setDate(effectiveEndDate.getDate() + daysAfter);
    
    // Verifica se a data atual está dentro do período estendido
    if (currentDate < effectiveStartDate || currentDate > effectiveEndDate) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar acesso por período:', error);
    return false;
  }
}

/**
 * Verifica permissões baseadas na fase da instituição
 * @param userId ID do usuário
 * @param resource Nome do recurso
 * @param action Ação a ser verificada
 * @param institutionId ID da instituição
 * @returns boolean
 */
export async function checkInstitutionPhaseAccess(
  userId: number,
  resource: string,
  action: string,
  institutionId: number
): Promise<boolean> {
  try {
    // Verifica permissões administrativas primeiro (bypass)
    const isSuperAdmin = await hasSuperAdminRole(userId);
    if (isSuperAdmin) return true;

    // Verifica permissão básica
    const hasBasePermission = await checkUserPermission(userId, resource, action);
    if (!hasBasePermission) return false;

    // Obtém a fase atual da instituição
    const institution = await db
      .select({ phase: schema.institutions.phase })
      .from(schema.institutions)
      .where(eq(schema.institutions.id, institutionId));

    if (institution.length === 0) return false;

    const currentPhase = institution[0].phase;

    // Consulta as regras de permissão baseadas na fase atual da instituição
    const phasePermissions = await db
      .select()
      .from(schema.institutionPhasePermissions)
      .where(
        and(
          eq(schema.institutionPhasePermissions.phase, currentPhase),
          eq(schema.institutionPhasePermissions.resource, resource),
          eq(schema.institutionPhasePermissions.action, action),
          eq(schema.institutionPhasePermissions.isActive, true)
        )
      );

    // Se encontrar regras específicas para essa combinação de fase/recurso/ação
    if (phasePermissions.length > 0) {
      // Retorna o valor de isAllowed (true = permitir, false = negar)
      return phasePermissions[0].isAllowed;
    }
    
    // Se não houver regras específicas, consulta apenas pela fase e recurso
    const resourcePhasePermissions = await db
      .select()
      .from(schema.institutionPhasePermissions)
      .where(
        and(
          eq(schema.institutionPhasePermissions.phase, currentPhase),
          eq(schema.institutionPhasePermissions.resource, resource),
          eq(schema.institutionPhasePermissions.isActive, true)
        )
      );
    
    // Se encontrar regras para o recurso mas não específicas para a ação,
    // assume uma regra padrão baseada na fase
    if (resourcePhasePermissions.length > 0) {
      // Lógica para determinar o comportamento padrão por fase
      switch (currentPhase) {
        case 'trial':
          // Na fase trial, permitimos apenas ações de leitura por padrão
          return ['ler', 'listar'].includes(action);
        case 'setup':
          // Na fase de configuração, permitimos leitura e edição, mas não exclusão
          return !['deletar', 'cancelar'].includes(action);
        case 'active':
          // Na fase ativa, permitimos a maioria das ações
          return true;
        case 'suspended':
          // Na fase suspensa, permitimos apenas leitura
          return action === 'ler';
        case 'cancelled':
          // Na fase cancelada, bloqueamos a maioria das ações
          return ['ler', 'listar'].includes(action);
        default:
          return false;
      }
    }
    
    // Regra de fallback baseada apenas na fase da instituição
    switch (currentPhase) {
      case 'trial':
        // No trial, permissão limitada (apenas recursos principais)
        const trialAllowedResources = ['usuario', 'curso', 'disciplina', 'polo', 'lead', 'cliente', 'configuracao'];
        if (!trialAllowedResources.includes(resource)) {
          return false;
        }
        // Restringe ações potencialmente custosas ou de transação financeira
        const trialRestrictedActions = ['criar', 'deletar', 'aprovar', 'gerar_cobranca'];
        return !trialRestrictedActions.includes(action);
        
      case 'setup':
        // Em setup, mais permissões, mas ainda com restrições
        const setupRestrictedResources = ['pagamento', 'fatura', 'certificado'];
        if (setupRestrictedResources.includes(resource)) {
          return ['ler', 'listar'].includes(action);
        }
        return true;
        
      case 'active':
        // Na fase ativa, quase tudo é permitido
        return true;
        
      case 'suspended':
        // Na fase suspensa, restrições significativas
        const suspendedAllowedResources = ['usuario', 'relatorio', 'configuracao', 'suporte'];
        if (!suspendedAllowedResources.includes(resource)) {
          return ['ler', 'listar'].includes(action);
        }
        return true;
        
      case 'cancelled':
        // Na fase cancelada, acesso mínimo
        const cancelledAllowedResources = ['relatorio', 'configuracao', 'suporte'];
        return cancelledAllowedResources.includes(resource) && ['ler', 'listar'].includes(action);
        
      default:
        return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao verificar permissões baseadas na fase da instituição:', error);
    return false;
  }
}

/**
 * Verifica permissões baseadas no status do pagamento
 * @param userId ID do usuário
 * @param resource Nome do recurso
 * @param action Ação a ser verificada
 * @param entityId ID da entidade
 * @returns boolean
 */
export async function checkPaymentStatusAccess(
  userId: number,
  resource: string,
  action: string,
  entityId: number
): Promise<boolean> {
  try {
    // Verifica permissões administrativas primeiro (bypass)
    const isSuperAdmin = await hasSuperAdminRole(userId);
    if (isSuperAdmin) return true;

    // Verifica permissão básica
    const hasBasePermission = await checkUserPermission(userId, resource, action);
    if (!hasBasePermission) return false;

    // Regras específicas com base no tipo de recurso
    switch (resource) {
      case 'enrollments':
        // Verifica o status da matrícula e pagamentos associados
        const enrollment = await db
          .select({ 
            status: schema.enrollments.status,
            studentId: schema.enrollments.studentId,
            courseId: schema.enrollments.courseId,
            hasPendingPayment: schema.enrollments.hasPendingPayment
          })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, entityId));

        if (enrollment.length === 0) return false;

        const enrollmentData = enrollment[0];

        // Ações restritas com base no status do pagamento
        if (enrollmentData.hasPendingPayment && 
            ['complete', 'issue_certificate', 'grant_access'].includes(action)) {
          return false;
        }

        // Regras específicas para status da matrícula
        if (enrollmentData.status === 'cancelled' && 
            !['read', 'view_history'].includes(action)) {
          return false;
        }

        if (enrollmentData.status === 'suspended' && 
            !['read', 'reactivate', 'view_history'].includes(action)) {
          return false;
        }

        return true;

      case 'certificates':
        // Verificar se a matrícula relacionada tem pagamentos pendentes
        const certificate = await db
          .select({
            enrollmentId: schema.certificates.enrollmentId
          })
          .from(schema.certificates)
          .where(eq(schema.certificates.id, entityId));

        if (certificate.length === 0) return false;

        const certEnrollment = await db
          .select({ hasPendingPayment: schema.enrollments.hasPendingPayment })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, certificate[0].enrollmentId));

        if (certEnrollment.length === 0) return false;

        // Não permite emitir/assinar certificados se houver pagamentos pendentes
        if (certEnrollment[0].hasPendingPayment && 
            ['issue', 'sign', 'publish'].includes(action)) {
          return false;
        }

        return true;

      case 'subscriptions':
        // Verifica status da assinatura
        const subscription = await db
          .select({ status: schema.subscriptions.status })
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.id, entityId));

        if (subscription.length === 0) return false;

        // Restrições baseadas no status da assinatura
        if (subscription[0].status === 'cancelled' && 
            !['read', 'view_history'].includes(action)) {
          return false;
        }

        if (subscription[0].status === 'expired' && 
            !['read', 'renew', 'view_history'].includes(action)) {
          return false;
        }

        if (subscription[0].status === 'trial' && 
            action === 'access_premium_features') {
          return false;
        }

        return true;

      default:
        // Para outros recursos, permitir acesso
        return true;
    }
  } catch (error) {
    console.error('Erro ao verificar permissões baseadas no status de pagamento:', error);
    return false;
  }
}

/**
 * Verifica permissão contextual ABAC completa
 * @param userId ID do usuário
 * @param condition Condição contextual
 * @returns boolean
 */
export async function checkContextualPermission(
  userId: number,
  condition: {
    resource: string;
    action: string;
    entityId?: number;
    institutionId?: number;
    poloId?: number;
    subscriptionStatus?: string;
    paymentStatus?: string;
    institutionPhase?: string;
    entityOwnerId?: number;
    dateRange?: { start: Date; end: Date };
  }
): Promise<boolean> {
  try {
    // 1. Verificação RBAC básica
    const hasBasePermission = await checkUserPermission(userId, condition.resource, condition.action);
    if (!hasBasePermission) return false;

    // 2. Verificação de propriedade da entidade (se apropriado)
    if (condition.entityId && condition.entityOwnerId === userId) {
      const isOwner = await isEntityOwner(userId, condition.resource, condition.entityId);
      // Se for proprietário, concede acesso para a maioria das ações
      if (isOwner && !['delete', 'approve', 'reject'].includes(condition.action)) {
        return true;
      }
    }

    // 3. Verificação de escopo institucional
    if (condition.institutionId) {
      const hasInstitutionAccess = await checkInstitutionAccess(userId, condition.institutionId);
      if (!hasInstitutionAccess) return false;

      // 4. Verificações específicas da fase da instituição
      if (condition.institutionPhase) {
        const hasPhasePermission = await checkInstitutionPhaseAccess(
          userId, 
          condition.resource, 
          condition.action, 
          condition.institutionId
        );
        if (!hasPhasePermission) return false;
      }
    }

    // 5. Verificação de escopo do polo
    if (condition.poloId) {
      const hasPoloAccess = await checkPoloAccess(userId, condition.poloId);
      if (!hasPoloAccess) return false;
    }

    // 6. Verificação de período financeiro/acadêmico (se aplicável)
    if (condition.dateRange) {
      const targetDate = new Date(condition.dateRange.start);
      const hasPeriodPermission = await checkPeriodAccess(
        userId,
        condition.resource,
        condition.action,
        targetDate,
        condition.institutionId
      );
      if (!hasPeriodPermission) return false;
    }

    // 7. Verificação de status de pagamento (se aplicável)
    if (condition.entityId && (condition.paymentStatus || 
        ['enrollments', 'certificates', 'subscriptions'].includes(condition.resource))) {
      const hasPaymentStatusPermission = await checkPaymentStatusAccess(
        userId,
        condition.resource,
        condition.action,
        condition.entityId
      );
      if (!hasPaymentStatusPermission) return false;
    }

    // 8. Verificação de status de assinatura (se aplicável)
    if (condition.subscriptionStatus) {
      // Implementação específica para verificação de status de assinatura
      // Se a condição exige "active" e o status atual não é ativo, negar
      if (condition.subscriptionStatus === 'active' && 
          condition.paymentStatus !== 'active') {
        return false;
      }
    }

    // Todas as verificações passaram, concede acesso
    return true;

  } catch (error) {
    console.error('Erro na verificação contextual de permissão:', error);
    return false;
  }
}