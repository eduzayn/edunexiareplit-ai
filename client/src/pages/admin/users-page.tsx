import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import AdminLayout from "@/components/layout/admin-layout";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  UserIcon,
  UserPlusIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from "lucide-react";

// Schema para validação do formulário
const userFormSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  portalType: z.enum(["student", "partner", "polo", "admin"], {
    required_error: "O tipo de portal é obrigatório",
  }),
  fullName: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().optional(),
  // Campos RBAC
  roleId: z.number().optional(),
  // Campos ABAC
  institutionId: z.number().optional(),
  poloId: z.number().optional(),
  // Outros campos úteis
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
}).superRefine((data, ctx) => {
  // CPF é obrigatório para alunos
  if (data.portalType === "student" && (!data.cpf || data.cpf.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CPF é obrigatório para alunos",
      path: ["cpf"],
    });
  }
  
  // Instituição é obrigatória para usuários do tipo partner ou polo
  if ((data.portalType === "partner" || data.portalType === "polo") && !data.institutionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A instituição é obrigatória para este tipo de usuário",
      path: ["institutionId"],
    });
  }
  
  // Polo é obrigatório para usuários do tipo polo
  if (data.portalType === "polo" && !data.poloId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O polo é obrigatório para este tipo de usuário",
      path: ["poloId"],
    });
  }
});

// Tipos para os formulários
type UserFormValues = z.infer<typeof userFormSchema>;

// Interface para usuário
interface User {
  id: number;
  username: string;
  password: string;
  portalType: "student" | "partner" | "polo" | "admin";
  fullName: string;
  email: string;
  cpf?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [portalTypeFilter, setPortalTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Checking if user has permissions for actions
  const hasCreatePermission = true; // Temporary - to be replaced with proper permission check
  const hasUpdatePermission = true; // Temporary - to be replaced with proper permission check
  const hasDeletePermission = true; // Temporary - to be replaced with proper permission check

  // Consulta para listar usuários
  const { 
    data: users, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/users', searchTerm, portalTypeFilter],
    queryFn: async () => {
      let url = `/api/admin/users`;
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (portalTypeFilter && portalTypeFilter !== "all") {
        params.append("portalType", portalTypeFilter);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      return apiRequest<User[]>(url);
    },
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormValues) => 
      apiRequest('/api/admin/users', { 
        method: 'POST',
        data
      }),
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso!",
        description: "O novo usuário foi adicionado ao sistema.",
      });
      setIsCreateDialogOpen(false);
      
      // Verificar se existe redirecionamento salvo
      const redirectData = sessionStorage.getItem('userRedirect');
      if (redirectData) {
        try {
          const { redirectTo } = JSON.parse(redirectData);
          if (redirectTo === 'enrollments/new') {
            // Redirecionar para a página de nova matrícula
            navigate('/admin/enrollments/new');
          }
        } catch (e) {
          console.error('Erro ao processar redirecionamento:', e);
        }
        // Limpar dados de redirecionamento
        sessionStorage.removeItem('userRedirect');
      } else {
        // Comportamento padrão: apenas atualizar a lista
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      }
      
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao tentar criar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      return apiRequest(`/api/admin/users/${id}`, { 
        method: 'PUT',
        data: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao tentar atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Usuário excluído com sucesso!",
        description: "O usuário foi removido do sistema.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao tentar excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  // Consulta para listar papéis (roles)
  const { 
    data: roles, 
    isLoading: isLoadingRoles 
  } = useQuery({
    queryKey: ['/api/admin/roles'],
    queryFn: () => apiRequest<Array<{id: number, name: string, description: string, scope: string}>>('/api/admin/roles'),
    // Não buscar roles quando o modal não estiver aberto para reduzir chamadas desnecessárias
    enabled: isCreateDialogOpen || isEditDialogOpen,
  });

  // Consulta para listar instituições
  const { 
    data: institutions, 
    isLoading: isLoadingInstitutions 
  } = useQuery({
    queryKey: ['/api/admin/institutions'],
    queryFn: () => apiRequest<Array<{id: number, name: string, code: string}>>('/api/admin/institutions'),
    // Não buscar quando o modal não estiver aberto
    enabled: isCreateDialogOpen || isEditDialogOpen,
  });

  // Consulta para listar polos (filtrada por instituição selecionada)
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  
  const { 
    data: polos, 
    isLoading: isLoadingPolos 
  } = useQuery({
    queryKey: ['/api/admin/polos', selectedInstitutionId],
    queryFn: () => {
      let url = `/api/admin/polos`;
      if (selectedInstitutionId) {
        url += `?institutionId=${selectedInstitutionId}`;
      }
      return apiRequest<Array<{id: number, name: string, code: string}>>(url);
    },
    // Só buscar polos se tiver uma instituição selecionada e modal aberto
    enabled: !!selectedInstitutionId && (isCreateDialogOpen || isEditDialogOpen),
  });

  // Form para criar usuário
  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      portalType: "student",
      fullName: "",
      email: "",
      cpf: "",
      // Novos campos RBAC/ABAC
      roleId: undefined,
      institutionId: undefined,
      poloId: undefined,
      // Outros campos
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Form para editar usuário
  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      portalType: "student",
      fullName: "",
      email: "",
      cpf: "",
      // Novos campos RBAC/ABAC
      roleId: undefined,
      institutionId: undefined,
      poloId: undefined,
      // Outros campos
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Funções para abrir diálogos
  const handleOpenCreateDialog = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      password: "", // Não preenchemos a senha por segurança
      portalType: user.portalType,
      fullName: user.fullName,
      email: user.email,
      cpf: user.cpf || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Funções para enviar formulários
  const onCreateSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: UserFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ ...data, id: selectedUser.id });
    }
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  // Função para formatar e mostrar o tipo de portal
  const renderPortalType = (portalType: string) => {
    switch (portalType) {
      case "admin":
        return <Badge className="bg-green-100 text-green-800">Administrador</Badge>;
      case "student":
        return <Badge className="bg-blue-100 text-blue-800">Aluno</Badge>;
      case "partner":
        return <Badge className="bg-purple-100 text-purple-800">Parceiro</Badge>;
      case "polo":
        return <Badge className="bg-orange-100 text-orange-800">Polo</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{portalType}</Badge>;
    }
  };

  // Função para renderizar botão com permissão
  const PermissionButtonWrapper = ({ 
    onClick, 
    hasPermission, 
    deniedTooltip, 
    children,
    variant = "default",
    size = "default",
    className = ""
  }: { 
    onClick: () => void, 
    hasPermission: boolean, 
    deniedTooltip: string,
    children: React.ReactNode,
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link",
    size?: "default" | "sm" | "lg" | "icon",
    className?: string
  }) => {
    if (hasPermission) {
      return (
        <Button onClick={onClick} variant={variant} size={size} className={className}>
          {children}
        </Button>
      );
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              className={`opacity-50 cursor-not-allowed ${className}`} 
              disabled
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{deniedTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Efeito para verificar parâmetros de redirecionamento na URL e abrir modal de criação
  useEffect(() => {
    // Verificar se há parâmetros de redirecionamento na URL
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirectTo');
    
    if (redirectTo) {
      // Guardar para uso após a criação do usuário
      sessionStorage.setItem('userRedirect', JSON.stringify({
        redirectTo
      }));
      
      // Abrir automaticamente o modal de criação quando vier de redirecionamento
      handleOpenCreateDialog();
    }
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserIcon className="mr-2 h-6 w-6" />
              Gestão de Usuários
            </h1>
            <p className="text-gray-600">
              Gerencie os usuários da plataforma
            </p>
          </div>
          <div className="mt-4 flex space-x-2 md:mt-0">
            <PermissionButtonWrapper
              onClick={handleOpenCreateDialog}
              hasPermission={hasCreatePermission}
              deniedTooltip="Você não tem permissão para criar usuários"
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              <UserPlusIcon className="mr-1 h-4 w-4" />
              Novo Usuário
            </PermissionButtonWrapper>
          </div>
        </div>

        {/* Search and filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, username ou email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      refetch();
                    }
                  }}
                />
              </div>
              <div className="w-full md:w-48">
                <Select 
                  value={portalTypeFilter} 
                  onValueChange={setPortalTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Portal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="student">Alunos</SelectItem>
                    <SelectItem value="partner">Parceiros</SelectItem>
                    <SelectItem value="polo">Polos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="flex items-center"
              >
                <RefreshCwIcon className="mr-1 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Lista completa de usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle>Erro ao carregar usuários</AlertTitle>
                <AlertDescription>
                  Ocorreu um erro ao tentar carregar a lista de usuários. Por favor, tente novamente.
                </AlertDescription>
              </Alert>
            ) : users && users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo de Portal</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{renderPortalType(user.portalType)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <PermissionButtonWrapper
                              onClick={() => handleOpenEditDialog(user)}
                              hasPermission={hasUpdatePermission}
                              deniedTooltip="Você não tem permissão para editar usuários"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <EditIcon className="h-4 w-4" />
                            </PermissionButtonWrapper>
                            <PermissionButtonWrapper
                              onClick={() => handleOpenDeleteDialog(user)}
                              hasPermission={hasDeletePermission}
                              deniedTooltip="Você não tem permissão para excluir usuários"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </PermissionButtonWrapper>
                            <Button
                              onClick={() => navigate(`/admin/permissions/users/${user.id}`)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ShieldIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-3">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-1 text-lg font-medium">Nenhum usuário encontrado</h3>
                <p className="mb-4 text-sm text-gray-500">
                  Não encontramos nenhum usuário com os filtros aplicados.
                </p>
                <PermissionButtonWrapper
                  onClick={handleOpenCreateDialog}
                  hasPermission={hasCreatePermission}
                  deniedTooltip="Você não tem permissão para criar usuários"
                  className="flex items-center"
                >
                  <UserPlusIcon className="mr-1 h-4 w-4" />
                  Criar Usuário
                </PermissionButtonWrapper>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para criar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome de usuário para login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormDescription>
                        Senha de pelo menos 6 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="portalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Portal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="student">Aluno</SelectItem>
                          <SelectItem value="partner">Parceiro</SelectItem>
                          <SelectItem value="polo">Polo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de acesso do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email para contato e notificações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="123.456.789-00" {...field} />
                      </FormControl>
                      <FormDescription>
                        CPF (obrigatório para alunos)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos RBAC/ABAC */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Sistema de Permissionamento</h3>
                  
                  {/* Seleção de Papel/Função (RBAC) */}
                  <FormField
                    control={createForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel/Função</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um papel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingRoles ? (
                              <SelectItem value="loading" disabled>Carregando papéis...</SelectItem>
                            ) : roles && roles.length > 0 ? (
                              roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>Nenhum papel encontrado</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Atribua um papel ao usuário para definir suas permissões básicas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Instituição (ABAC) */}
                  <FormField
                    control={createForm.control}
                    name="institutionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instituição</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const id = parseInt(value);
                            field.onChange(id);
                            setSelectedInstitutionId(id);
                            // Reset poloId when institution changes
                            createForm.setValue('poloId', undefined);
                          }}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma instituição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingInstitutions ? (
                              <SelectItem value="loading" disabled>Carregando instituições...</SelectItem>
                            ) : institutions && institutions.length > 0 ? (
                              institutions.map((institution) => (
                                <SelectItem key={institution.id} value={institution.id.toString()}>
                                  {institution.name} ({institution.code})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>Nenhuma instituição encontrada</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associe o usuário a uma instituição (obrigatório para parceiros e polos)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Polo (ABAC) - condicionalmente exibido baseado na instituição selecionada */}
                  {selectedInstitutionId && (
                    <FormField
                      control={createForm.control}
                      name="poloId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Polo</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um polo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingPolos ? (
                                <SelectItem value="loading" disabled>Carregando polos...</SelectItem>
                              ) : polos && polos.length > 0 ? (
                                polos.map((polo) => (
                                  <SelectItem key={polo.id} value={polo.id.toString()}>
                                    {polo.name} ({polo.code})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>Nenhum polo encontrado para esta instituição</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Associe o usuário a um polo específico (obrigatório para usuários do tipo polo)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Campos adicionais opcionais */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="additional-info">
                      <AccordionTrigger className="text-sm">
                        Informações adicionais
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={createForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(00) 00000-0000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Endereço</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua, número" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input placeholder="Cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input placeholder="UF" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                  <Input placeholder="00000-000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome de usuário para login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Deixe em branco para manter a mesma senha"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Preencha apenas se quiser alterar a senha
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="portalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Portal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="student">Aluno</SelectItem>
                          <SelectItem value="partner">Parceiro</SelectItem>
                          <SelectItem value="polo">Polo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de acesso do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email para contato e notificações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="123.456.789-00" {...field} />
                      </FormControl>
                      <FormDescription>
                        CPF (obrigatório para alunos)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos RBAC/ABAC */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Sistema de Permissionamento</h3>
                  
                  {/* Seleção de Papel/Função (RBAC) */}
                  <FormField
                    control={editForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel/Função</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um papel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingRoles ? (
                              <SelectItem value="loading" disabled>Carregando papéis...</SelectItem>
                            ) : roles && roles.length > 0 ? (
                              roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>Nenhum papel encontrado</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Atribua um papel ao usuário para definir suas permissões básicas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Instituição (ABAC) */}
                  <FormField
                    control={editForm.control}
                    name="institutionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instituição</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const id = parseInt(value);
                            field.onChange(id);
                            setSelectedInstitutionId(id);
                            // Reset poloId when institution changes
                            editForm.setValue('poloId', undefined);
                          }}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma instituição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingInstitutions ? (
                              <SelectItem value="loading" disabled>Carregando instituições...</SelectItem>
                            ) : institutions && institutions.length > 0 ? (
                              institutions.map((institution) => (
                                <SelectItem key={institution.id} value={institution.id.toString()}>
                                  {institution.name} ({institution.code})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>Nenhuma instituição encontrada</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associe o usuário a uma instituição (obrigatório para parceiros e polos)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleção de Polo (ABAC) - condicionalmente exibido baseado na instituição selecionada */}
                  {selectedInstitutionId && (
                    <FormField
                      control={editForm.control}
                      name="poloId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Polo</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um polo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingPolos ? (
                                <SelectItem value="loading" disabled>Carregando polos...</SelectItem>
                              ) : polos && polos.length > 0 ? (
                                polos.map((polo) => (
                                  <SelectItem key={polo.id} value={polo.id.toString()}>
                                    {polo.name} ({polo.code})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>Nenhum polo encontrado para esta instituição</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Associe o usuário a um polo específico (obrigatório para usuários do tipo polo)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Campos adicionais opcionais */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="additional-info">
                      <AccordionTrigger className="text-sm">
                        Informações adicionais
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={editForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(00) 00000-0000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Endereço</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua, número" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input placeholder="Cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input placeholder="UF" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl>
                                  <Input placeholder="00000-000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o usuário{" "}
                <span className="font-semibold">
                  {selectedUser?.fullName || "selecionado"}
                </span>
                ? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}