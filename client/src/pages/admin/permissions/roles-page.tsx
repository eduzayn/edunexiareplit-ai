import React from "react";
import AdminLayout from "@/components/layout/admin-layout";
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
  PlusIcon,
  SearchIcon,
  EyeIcon,
  RefreshCwIcon,
  FileEditIcon,
  TrashIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRoles, usePermissionsList } from "@/hooks/use-permissions";
import { usePermissions, PermissionGuard } from "@/hooks/use-permissions";

// Schema para o formulário de criação de papel
const roleFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  description: z.string().min(5, { message: "A descrição deve ter pelo menos 5 caracteres" }),
  scope: z.string().min(1, { message: "Selecione um escopo" }),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function RolesPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Hooks de permissões
  const { hasPermission } = usePermissions();
  const { 
    roles, 
    isLoading, 
    isError, 
    error,
    createRole,
    isPendingCreate,
    deleteRole
  } = useRoles();

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
    createRole(values);
    setIsOpen(false);
    form.reset();
  }

  // Função para buscar dados com base no termo de pesquisa
  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
          
          <PermissionGuard
            resource="roles"
            action="criar"
            fallback={
              <Button disabled title="Você não tem permissão para criar papéis">
                <PlusIcon className="mr-2 h-4 w-4" />
                Novo Papel
              </Button>
            }
          >
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
                        disabled={isPendingCreate}
                      >
                        {isPendingCreate && (
                          <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Criar Papel
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </PermissionGuard>
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
            {isLoading ? (
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
            ) : isError ? (
              // Estado de erro
              <div className="text-center py-8 text-red-500">
                Erro ao carregar papéis: {(error as any)?.message || 'Erro desconhecido'}
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
                          <PermissionGuard resource="roles" action="ler">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/permissions/roles/${role.id}`)}
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              Detalhes
                            </Button>
                          </PermissionGuard>
                          
                          {/* Verificar permissão de atualização */}
                          <PermissionGuard 
                            resource="roles" 
                            action="atualizar"
                            fallback={null}
                          >
                            {!role.isSystem && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/permissions/roles/${role.id}/edit`)}
                              >
                                <FileEditIcon className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                            )}
                          </PermissionGuard>
                          
                          {/* Verificar permissão de exclusão */}
                          <PermissionGuard 
                            resource="roles" 
                            action="deletar"
                            fallback={null}
                          >
                            {!role.isSystem && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir este papel? Esta ação não pode ser desfeita.')) {
                                    deleteRole(role.id);
                                  }
                                }}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            )}
                          </PermissionGuard>
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