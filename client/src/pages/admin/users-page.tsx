import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/layout/admin-layout";
import { usePermissions } from "@/hooks/use-permissions";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Edit2,
  Trash2,
  Search,
  UserPlus,
  Loader2,
  Users,
  Key,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Building,
  Tag,
} from "lucide-react";

// Interfaces
interface User {
  id: number;
  username: string;
  portalType: "student" | "partner" | "polo" | "admin";
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  roleId?: number;
  institutionId?: number;
  poloId?: number;
  roleName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Estado local
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [portalTypeFilter, setPortalTypeFilter] = useState("all");

  // Verificar permissões
  const hasReadPermission = hasPermission('usuarios', 'ler');
  const hasCreatePermission = hasPermission('usuarios', 'criar');
  const hasUpdatePermission = hasPermission('usuarios', 'atualizar');
  const hasDeletePermission = hasPermission('usuarios', 'deletar');
  const hasManagePermissionPermission = hasPermission('permissoes', 'gerenciar');

  // Buscar todos os usuários
  const { 
    data: users = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['/api/users'],
    enabled: hasReadPermission,
  });

  // Filtrar usuários com base no termo de busca e tipo
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    // Filtrar por tipo de portal
    const matchesType = portalTypeFilter === "all" || user.portalType === portalTypeFilter;
    
    // Filtrar por termo de busca (nome, email, CPF)
    const matchesSearch = 
      searchTerm === "" || 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  }) : [];

  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handler para abrir modal de exclusão
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handler para excluir usuário
  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  // Handler para editar usuário
  const handleEditUser = (user: User) => {
    navigate(`/admin/users/${user.id}`);
  };

  // Handler para criar novo usuário
  const handleCreateUser = () => {
    navigate('/admin/users/new');
  };

  // Função para obter o label do tipo de portal
  const getPortalTypeLabel = (type: string) => {
    switch (type) {
      case "admin": return "Administrador";
      case "student": return "Aluno";
      case "partner": return "Parceiro";
      case "polo": return "Polo";
      default: return type;
    }
  };

  // Função para obter a variante da badge com base no tipo de portal
  const getPortalTypeBadgeVariant = (type: string): "default" | "outline" | "secondary" | "destructive" => {
    switch (type) {
      case "admin": return "destructive";
      case "student": return "default";
      case "partner": return "secondary";
      case "polo": return "outline";
      default: return "default";
    }
  };

  // Função para formatar data
  const formatDate = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!user || user.portalType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Usuários</h1>
          {hasCreatePermission && (
            <Button onClick={handleCreateUser} size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema e suas permissões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <div className="flex items-center space-x-2 w-full md:w-1/2">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por nome, email ou CPF..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  value={portalTypeFilter}
                  onValueChange={setPortalTypeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="student">Alunos</SelectItem>
                    <SelectItem value="partner">Parceiros</SelectItem>
                    <SelectItem value="polo">Polos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : isError ? (
              <div className="flex justify-center items-center py-20 text-destructive">
                <p>Erro ao carregar usuários. Tente novamente mais tarde.</p>
                <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-20 text-muted-foreground">
                <Users className="h-16 w-16 mb-4" />
                <p>Nenhum usuário encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">ID</TableHead>
                      <TableHead>Nome / Informações</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-center">{user.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Tag className="h-3 w-3" />
                              <span>{user.username}</span>
                            </div>
                            {user.roleName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Função: {user.roleName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-sm flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.city && user.state && (
                              <div className="text-sm flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{user.city}/{user.state}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPortalTypeBadgeVariant(user.portalType)}>
                            {getPortalTypeLabel(user.portalType)}
                          </Badge>
                          {user.portalType === "polo" && user.poloId && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>Polo #{user.poloId}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDate(user.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {hasUpdatePermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            )}
                            {hasManagePermissionPermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/users/${user.id}/permissions`)}
                              >
                                <Key className="h-4 w-4" />
                                <span className="sr-only">Permissões</span>
                              </Button>
                            )}
                            {hasDeletePermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(user)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de exclusão de usuário */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{selectedUser?.fullName}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}