import React from "react";
import { useParams, useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  SearchIcon,
  PlusIcon,
  MinusIcon,
  RefreshCwIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  useRoles, 
  usePermissionsList, 
  usePermissions, 
  PermissionGuard 
} from "@/hooks/use-permissions";
import { Permission } from "@/hooks/use-permissions";

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roleId = parseInt(id, 10);
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddPermissionOpen, setIsAddPermissionOpen] = React.useState(false);
  
  // Hooks de permissões
  const { hasPermission } = usePermissions();
  
  const { useRole, useRolePermissions, addPermissionToRole, removePermissionFromRole } = useRoles();
  const { permissions: allPermissions, isLoading: isLoadingPermissions } = usePermissionsList();
  
  // Buscar dados do papel
  const { data: role, isLoading: isLoadingRole, isError: isErrorRole, error: roleError } = useRole(roleId);
  
  // Buscar permissões do papel
  const { 
    data: rolePermissions, 
    isLoading: isLoadingRolePermissions, 
    isError: isErrorRolePermissions, 
    error: rolePermissionsError 
  } = useRolePermissions(roleId);

  // Filtrar permissões com base no termo de pesquisa
  const filteredPermissions = searchTerm && rolePermissions
    ? rolePermissions.filter(permission => 
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rolePermissions;

  // Filtrar permissões disponíveis para adicionar (que ainda não foram adicionadas ao papel)
  const availablePermissions = allPermissions && rolePermissions
    ? allPermissions.filter(permission => 
        !rolePermissions.some(rp => rp.permissionId === permission.id)
      )
    : [];

  // Função para buscar dados com base no termo de pesquisa
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Função para adicionar permissão ao papel
  const handleAddPermission = (permissionId: number) => {
    addPermissionToRole({ roleId, permissionId });
    setIsAddPermissionOpen(false);
  };

  // Função para remover permissão do papel
  const handleRemovePermission = (permissionId: number) => {
    if (window.confirm('Tem certeza que deseja remover esta permissão do papel?')) {
      removePermissionFromRole({ roleId, permissionId });
    }
  };

  // Agrupando permissões por recurso para exibição
  const groupedPermissions = React.useMemo(() => {
    if (!filteredPermissions) return {};
    
    return filteredPermissions.reduce((acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    }, {} as Record<string, typeof filteredPermissions>);
  }, [filteredPermissions]);

  // Estado de carregamento
  if (isLoadingRole || isLoadingRolePermissions) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-64" />
            </div>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(4)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-64" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array(6)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-64" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Estado de erro
  if (isErrorRole || isErrorRolePermissions || !role) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/permissions/roles")}
              className="mr-4"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Erro</h1>
          </div>
          
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-500">
                <p className="text-lg font-semibold mb-2">Erro ao carregar dados do papel</p>
                <p>{(roleError as any)?.message || (rolePermissionsError as any)?.message || 'Erro desconhecido'}</p>
                <Button
                  onClick={() => navigate("/admin/permissions/roles")}
                  className="mt-4"
                >
                  Voltar para a lista de papéis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/permissions/roles")}
            className="mr-4"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
            <p className="text-gray-500">
              {role.description}
            </p>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Papel</CardTitle>
                <CardDescription>
                  Detalhes completos sobre este papel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID</h3>
                    <p>{role.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nome</h3>
                    <p>{role.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                    <p>{role.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Escopo</h3>
                    <p>
                      {role.scope === 'global' && (
                        <Badge className="bg-blue-500">Global</Badge>
                      )}
                      {role.scope === 'institution' && (
                        <Badge className="bg-green-500">Instituição</Badge>
                      )}
                      {role.scope === 'polo' && (
                        <Badge className="bg-purple-500">Polo</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                    <p>
                      {role.isSystem ? (
                        <Badge className="bg-yellow-500">Sistema</Badge>
                      ) : (
                        <Badge className="bg-gray-500">Customizado</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                    <p>{new Date(role.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                    <p>{new Date(role.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar permissões..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              
              <PermissionGuard
                resource="roles"
                action="atualizar"
                fallback={
                  <Button disabled title="Você não tem permissão para adicionar permissões">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Adicionar Permissão
                  </Button>
                }
              >
                {!role.isSystem && (
                  <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Adicionar Permissão
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Adicionar Permissão ao Papel</DialogTitle>
                        <DialogDescription>
                          Selecione uma permissão para adicionar ao papel {role.name}.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">Selecionar</TableHead>
                              <TableHead>Recurso</TableHead>
                              <TableHead>Ação</TableHead>
                              <TableHead>Descrição</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingPermissions ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">
                                  Carregando permissões...
                                </TableCell>
                              </TableRow>
                            ) : availablePermissions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">
                                  Todas as permissões já foram adicionadas a este papel.
                                </TableCell>
                              </TableRow>
                            ) : (
                              availablePermissions.map((permission) => (
                                <TableRow key={permission.id}>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddPermission(permission.id)}
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                  <TableCell className="capitalize">{permission.resource}</TableCell>
                                  <TableCell className="capitalize">{permission.action}</TableCell>
                                  <TableCell>{permission.description}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddPermissionOpen(false)}
                        >
                          Cancelar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </PermissionGuard>
            </div>
            
            {/* Permissões agrupadas por recurso */}
            {rolePermissions?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <p className="text-lg font-semibold mb-2">Nenhuma permissão encontrada</p>
                    <p>Este papel não possui permissões atribuídas ainda.</p>
                    {!role.isSystem && hasPermission('roles', 'atualizar') && (
                      <Button
                        onClick={() => setIsAddPermissionOpen(true)}
                        className="mt-4"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Adicionar Permissão
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedPermissions).map(([resource, permissions]) => (
                <Card key={resource}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{resource}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div 
                          key={permission.permissionId} 
                          className="flex justify-between items-center p-2 border rounded-md"
                        >
                          <div>
                            <p className="font-medium capitalize">{permission.action}</p>
                            <p className="text-sm text-gray-500">{permission.description}</p>
                          </div>
                          
                          <PermissionGuard
                            resource="roles"
                            action="atualizar"
                            fallback={null}
                          >
                            {!role.isSystem && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleRemovePermission(permission.permissionId)}
                              >
                                <Cross1Icon className="h-4 w-4" />
                              </Button>
                            )}
                          </PermissionGuard>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}