/**
 * Hook para gerenciamento do sistema de permissões
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";

// Types
export interface Role {
  id: number;
  name: string;
  description: string;
  scope: string;
  isSystem: boolean;
  institutionId?: number;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  roleName: string;
  roleDescription: string;
  roleScope: string;
  institutionId?: number;
  poloId?: number;
  createdAt: string;
}

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  resource: string;
  action: string;
  description: string;
}

export interface UserPermission {
  id: number;
  userId: number;
  permissionId: number;
  resource: string;
  action: string;
  description: string;
  institutionId?: number;
  poloId?: number;
  expiresAt?: string;
  createdAt: string;
}

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissions() {
  const { user } = useAuth();
  
  // Buscar permissões do usuário atual
  const permissionsQuery = useQuery({
    queryKey: ['/api/permissions/user'],
    queryFn: () => apiRequest<Record<string, boolean>>('/api/permissions/user'),
    enabled: !!user
  });

  /**
   * Verifica se o usuário tem uma determinada permissão
   * @param resource Nome do recurso
   * @param action Ação desejada
   * @returns boolean
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!permissionsQuery.data) return false;
    
    const key = `${resource}:${action}`;
    const manageKey = `${resource}:manage`;
    
    // 'manage' concede todas as permissões para o recurso
    return permissionsQuery.data[key] === true || permissionsQuery.data[manageKey] === true;
  };

  /**
   * Verifica acesso a instituição
   * @param institutionId ID da instituição
   * @returns Promise<boolean>
   */
  const checkInstitutionAccess = async (institutionId: number): Promise<boolean> => {
    try {
      const result = await apiRequest<{ hasAccess: boolean }>(`/api/permissions/institution-access/${institutionId}`);
      return result.hasAccess;
    } catch (error) {
      console.error('Erro ao verificar acesso à instituição:', error);
      return false;
    }
  };

  /**
   * Verifica acesso a polo
   * @param poloId ID do polo
   * @returns Promise<boolean>
   */
  const checkPoloAccess = async (poloId: number): Promise<boolean> => {
    try {
      const result = await apiRequest<{ hasAccess: boolean }>(`/api/permissions/polo-access/${poloId}`);
      return result.hasAccess;
    } catch (error) {
      console.error('Erro ao verificar acesso ao polo:', error);
      return false;
    }
  };

  return {
    permissions: permissionsQuery.data || {},
    isLoading: permissionsQuery.isLoading,
    isError: permissionsQuery.isError,
    error: permissionsQuery.error,
    hasPermission,
    checkInstitutionAccess,
    checkPoloAccess
  };
}

/**
 * Hook para gerenciamento de papéis (roles)
 */
export function useRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar papéis
  const rolesQuery = useQuery({
    queryKey: ['/api/permissions/roles'],
    queryFn: () => apiRequest<Role[]>('/api/permissions/roles')
  });

  // Buscar papel por ID
  const useRole = (id: number) => useQuery({
    queryKey: ['/api/permissions/roles', id],
    queryFn: () => apiRequest<Role>(`/api/permissions/roles/${id}`),
    enabled: !!id
  });

  // Listar permissões de um papel
  const useRolePermissions = (roleId: number) => useQuery({
    queryKey: ['/api/permissions/roles', roleId, 'permissions'],
    queryFn: () => apiRequest<RolePermission[]>(`/api/permissions/roles/${roleId}/permissions`),
    enabled: !!roleId
  });

  // Criar papel
  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string, description: string, scope: string }) => 
      apiRequest<Role>('/api/permissions/roles', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles'] });
      toast({
        title: "Papel criado",
        description: "O papel foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar papel",
        description: error.message || "Ocorreu um erro ao criar o papel.",
        variant: "destructive",
      });
    }
  });

  // Atualizar papel
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { description?: string, scope?: string } }) => 
      apiRequest<Role>(`/api/permissions/roles/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles', data.id] });
      toast({
        title: "Papel atualizado",
        description: "O papel foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar papel",
        description: error.message || "Ocorreu um erro ao atualizar o papel.",
        variant: "destructive",
      });
    }
  });

  // Excluir papel
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/permissions/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles'] });
      toast({
        title: "Papel excluído",
        description: "O papel foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir papel",
        description: error.message || "Ocorreu um erro ao excluir o papel.",
        variant: "destructive",
      });
    }
  });

  // Adicionar permissão a um papel
  const addPermissionToRoleMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: number, permissionId: number }) => 
      apiRequest(`/api/permissions/roles/${roleId}/permissions/${permissionId}`, { method: 'POST' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles', variables.roleId, 'permissions'] });
      toast({
        title: "Permissão adicionada",
        description: "A permissão foi adicionada ao papel com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar permissão",
        description: error.message || "Ocorreu um erro ao adicionar a permissão ao papel.",
        variant: "destructive",
      });
    }
  });

  // Remover permissão de um papel
  const removePermissionFromRoleMutation = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: number, permissionId: number }) => 
      apiRequest(`/api/permissions/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles', variables.roleId, 'permissions'] });
      toast({
        title: "Permissão removida",
        description: "A permissão foi removida do papel com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover permissão",
        description: error.message || "Ocorreu um erro ao remover a permissão do papel.",
        variant: "destructive",
      });
    }
  });

  return {
    roles: rolesQuery.data || [],
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    error: rolesQuery.error,
    useRole,
    useRolePermissions,
    createRole: createRoleMutation.mutate,
    isPendingCreate: createRoleMutation.isPending,
    updateRole: updateRoleMutation.mutate,
    isPendingUpdate: updateRoleMutation.isPending,
    deleteRole: deleteRoleMutation.mutate,
    isPendingDelete: deleteRoleMutation.isPending,
    addPermissionToRole: addPermissionToRoleMutation.mutate,
    isPendingAddPermission: addPermissionToRoleMutation.isPending,
    removePermissionFromRole: removePermissionFromRoleMutation.mutate,
    isPendingRemovePermission: removePermissionFromRoleMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de permissões
 */
export function usePermissionsList() {
  // Listar todas as permissões
  const permissionsQuery = useQuery({
    queryKey: ['/api/permissions/list'],
    queryFn: () => apiRequest<Permission[]>('/api/permissions/list'),
  });

  return {
    permissions: permissionsQuery.data || [],
    isLoading: permissionsQuery.isLoading,
    isError: permissionsQuery.isError,
    error: permissionsQuery.error,
  };
}

/**
 * Hook para gerenciamento de papéis de usuário
 */
export function useUserRoles(userId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar papéis do usuário
  const userRolesQuery = useQuery({
    queryKey: ['/api/permissions/users', userId, 'roles'],
    queryFn: () => apiRequest<UserRole[]>(`/api/permissions/users/${userId}/roles`),
    enabled: !!userId
  });

  // Atribuir papel ao usuário
  const assignRoleToUserMutation = useMutation({
    mutationFn: ({
      roleId,
      institutionId,
      poloId
    }: {
      roleId: number,
      institutionId?: number,
      poloId?: number
    }) => 
      apiRequest(`/api/permissions/users/${userId}/roles`, { 
        method: 'POST', 
        data: { roleId, institutionId, poloId } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/users', userId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/user'] });
      toast({
        title: "Papel atribuído",
        description: "O papel foi atribuído ao usuário com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir papel",
        description: error.message || "Ocorreu um erro ao atribuir o papel ao usuário.",
        variant: "destructive",
      });
    }
  });

  // Remover papel do usuário
  const removeRoleFromUserMutation = useMutation({
    mutationFn: ({
      roleId,
      institutionId,
      poloId
    }: {
      roleId: number,
      institutionId?: number,
      poloId?: number
    }) => 
      apiRequest(`/api/permissions/users/${userId}/roles`, { 
        method: 'DELETE', 
        data: { roleId, institutionId, poloId } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/users', userId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/user'] });
      toast({
        title: "Papel removido",
        description: "O papel foi removido do usuário com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover papel",
        description: error.message || "Ocorreu um erro ao remover o papel do usuário.",
        variant: "destructive",
      });
    }
  });

  return {
    userRoles: userRolesQuery.data || [],
    isLoading: userRolesQuery.isLoading,
    isError: userRolesQuery.isError,
    error: userRolesQuery.error,
    assignRoleToUser: assignRoleToUserMutation.mutate,
    isPendingAssign: assignRoleToUserMutation.isPending,
    removeRoleFromUser: removeRoleFromUserMutation.mutate,
    isPendingRemove: removeRoleFromUserMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de permissões diretas de usuário
 */
export function useUserPermissions(userId: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar permissões diretas do usuário
  const userPermissionsQuery = useQuery({
    queryKey: ['/api/permissions/users', userId, 'permissions'],
    queryFn: () => apiRequest<UserPermission[]>(`/api/permissions/users/${userId}/permissions`),
    enabled: !!userId
  });

  // Adicionar permissão direta ao usuário
  const addPermissionToUserMutation = useMutation({
    mutationFn: ({
      permissionId,
      institutionId,
      poloId,
      expiresAt
    }: {
      permissionId: number,
      institutionId?: number,
      poloId?: number,
      expiresAt?: string
    }) => 
      apiRequest(`/api/permissions/users/${userId}/permissions`, { 
        method: 'POST', 
        data: { permissionId, institutionId, poloId, expiresAt } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/users', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/user'] });
      toast({
        title: "Permissão adicionada",
        description: "A permissão foi adicionada ao usuário com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar permissão",
        description: error.message || "Ocorreu um erro ao adicionar a permissão ao usuário.",
        variant: "destructive",
      });
    }
  });

  // Remover permissão direta do usuário
  const removePermissionFromUserMutation = useMutation({
    mutationFn: (permissionId: number) => 
      apiRequest(`/api/permissions/users/${userId}/permissions/${permissionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/users', userId, 'permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/user'] });
      toast({
        title: "Permissão removida",
        description: "A permissão foi removida do usuário com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover permissão",
        description: error.message || "Ocorreu um erro ao remover a permissão do usuário.",
        variant: "destructive",
      });
    }
  });

  return {
    userPermissions: userPermissionsQuery.data || [],
    isLoading: userPermissionsQuery.isLoading,
    isError: userPermissionsQuery.isError,
    error: userPermissionsQuery.error,
    addPermissionToUser: addPermissionToUserMutation.mutate,
    isPendingAdd: addPermissionToUserMutation.isPending,
    removePermissionFromUser: removePermissionFromUserMutation.mutate,
    isPendingRemove: removePermissionFromUserMutation.isPending,
  };
}

/**
 * Componente de Verificação de Permissão
 * Usado para renderizar condicionalmente componentes baseados em permissões
 */
export function PermissionGuard({ 
  resource, 
  action, 
  fallback = null, 
  children 
}: { 
  resource: string, 
  action: string, 
  fallback?: React.ReactNode, 
  children: React.ReactNode 
}) {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(resource, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}