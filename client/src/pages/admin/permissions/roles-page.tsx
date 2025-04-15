/**
 * Página de Gerenciamento de Papéis (Roles)
 * Esta página permite visualizar, criar, editar e excluir papéis de usuário no sistema
 */

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Componentes de UI
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
import { Skeleton } from "@/components/ui/skeleton";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ícones
import { 
  Plus as PlusIcon,
  Search as SearchIcon,
  Eye as EyeIcon,
  RefreshCw as RefreshCwIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon,
  AlertTriangle
} from "lucide-react";

// Tipos de dados
interface Role {
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

// Schema para o formulário de criação de papel
const roleFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  description: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres" }),
  scope: z.string().min(1, { message: "Selecione um escopo" }),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function RolesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  // Verificar se o usuário tem permissão para criar papéis
  const permissionsQuery = useQuery({
    queryKey: ['/api/permissions/user'],
    queryFn: () => apiRequest<Record<string, boolean>>('/api/permissions/user'),
  });

  const hasCreatePermission = React.useMemo(() => {
    if (!permissionsQuery.data) return false;
    return permissionsQuery.data['roles:criar'] === true || permissionsQuery.data['roles:manage'] === true;
  }, [permissionsQuery.data]);

  // Consulta para buscar todos os papéis
  const rolesQuery = useQuery({
    queryKey: ['/api/permissions/roles'],
    queryFn: () => apiRequest<Role[]>('/api/permissions/roles'),
  });

  // Mutação para criar um novo papel
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormValues) => 
      apiRequest<Role>('/api/permissions/roles', { 
        method: 'POST', 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/roles'] });
      toast({
        title: "Papel criado",
        description: "O papel foi criado com sucesso.",
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar papel",
        description: error.message || "Ocorreu um erro ao criar o papel.",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir um papel
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<{}>(`/api/permissions/roles/${id}`, { method: 'DELETE' }),
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

  // Garantir que roles é sempre um array
  const roles = rolesQuery.data || [];

  // Filtrar papéis com base no termo de pesquisa
  const filteredRoles = searchTerm 
    ? roles.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.scope.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : roles;

  // Formulário para criação de papel
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      scope: "",
    },
  });

  // Função para lidar com a submissão do formulário
  function onSubmit(values: RoleFormValues) {
    createRoleMutation.mutate(values);
  }

  // Função para buscar dados com base no termo de pesquisa
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Verificar se o usuário tem permissão para uma ação específica
  const hasPermission = (action: string): boolean => {
    if (!permissionsQuery.data) return false;
    
    const key = `roles:${action}`;
    const manageKey = 'roles:manage';
    
    return permissionsQuery.data[key] === true || permissionsQuery.data[manageKey] === true;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Papéis (Roles)</h1>
            <p className="text-gray-500">
              Gerenciamento de papéis e permissões do sistema.
            </p>
          </div>
          
          {hasCreatePermission ? (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Novo Papel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Papel</DialogTitle>
                  <DialogDescription>
                    Crie um novo papel com permissões específicas no sistema.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Papel</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Gerente Financeiro" {...field} />
                          </FormControl>
                          <FormDescription>
                            Um nome único que identifica este papel no sistema.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Acesso à gestão financeira" {...field} />
                          </FormControl>
                          <FormDescription>
                            Uma descrição que explica o propósito deste papel.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escopo</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um escopo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="global">Global</SelectItem>
                              <SelectItem value="institution">Instituição</SelectItem>
                              <SelectItem value="polo">Polo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            O escopo define onde este papel pode ser atribuído.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createRoleMutation.isPending}
                      >
                        {createRoleMutation.isPending && (
                          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Criar Papel
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled title="Você não tem permissão para criar papéis">
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Papel
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Papéis</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os papéis do sistema.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, descrição ou escopo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rolesQuery.isLoading ? (
              // Estado de carregamento
              <div className="space-y-2">
                {Array(5)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : rolesQuery.isError ? (
              // Estado de erro
              <div className="text-center py-8 text-red-500 flex flex-col items-center">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>Erro ao carregar papéis: {(rolesQuery.error as any)?.message || 'Erro desconhecido'}</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              // Estado vazio
              <div className="text-center py-8 text-gray-500">
                Nenhum papel encontrado
              </div>
            ) : (
              // Tabela com os dados
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        {role.name}
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        {role.scope === 'global' && (
                          <Badge className="bg-blue-500">Global</Badge>
                        )}
                        {role.scope === 'institution' && (
                          <Badge className="bg-green-500">Instituição</Badge>
                        )}
                        {role.scope === 'polo' && (
                          <Badge className="bg-purple-500">Polo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge className="bg-yellow-500">Sistema</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Customizado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Verificar permissão de leitura */}
                          {hasPermission('ler') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/permissions/roles/${role.id}`)}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              Detalhes
                            </Button>
                          )}
                          
                          {/* Verificar permissão de atualização */}
                          {hasPermission('atualizar') && !role.isSystem && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/permissions/roles/${role.id}/edit`)}
                            >
                              <PencilIcon className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          )}
                          
                          {/* Verificar permissão de exclusão */}
                          {hasPermission('deletar') && !role.isSystem && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja excluir este papel? Esta ação não pode ser desfeita.')) {
                                  deleteRoleMutation.mutate(role.id);
                                }
                              }}
                              disabled={deleteRoleMutation.isPending}
                            >
                              {deleteRoleMutation.isPending && (
                                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {!deleteRoleMutation.isPending && (
                                <TrashIcon className="mr-2 h-4 w-4" />
                              )}
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}