import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Icons
import {
  Edit2Icon,
  TrashIcon,
  SearchIcon,
  UserPlusIcon,
  LoaderIcon,
  UsersIcon,
  KeyIcon,
} from "lucide-react";

// Interfaces
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

// ----------------
// Página de usuários
// ----------------
export default function UsersPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [portalTypeFilter, setPortalTypeFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Hook de permissões RBAC
  const { hasPermission } = usePermissions();
  const hasCreatePermission = hasPermission("usuario", "criar");
  const hasReadPermission = hasPermission("usuario", "ler");
  const hasUpdatePermission = hasPermission("usuario", "atualizar");
  const hasDeletePermission = hasPermission("usuario", "deletar");
  const hasManagePermissionPermission = hasPermission("permissao", "gerenciar");

  // Query client para invalidar caches
  const queryClient = useQueryClient();

  // Consulta de usuários
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['/api/users'],
    enabled: hasReadPermission,
  });

  // Filtragem de usuários
  const filteredUsers = users
    .filter((user: User) => {
      if (portalTypeFilter !== "all" && user.portalType !== portalTypeFilter) return false;
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          user.username.toLowerCase().includes(searchTermLower) ||
          user.fullName.toLowerCase().includes(searchTermLower) ||
          user.email.toLowerCase().includes(searchTermLower) ||
          (user.cpf && user.cpf.includes(searchTerm))
        );
      }
      return true;
    })
    .sort((a: User, b: User) => b.id - a.id);

  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest(`/api/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  // Funções de navegação para formulário dedicado
  const handleCreateUser = () => {
    navigate("/admin/users/new");
  };

  const handleEditUser = (user: User) => {
    navigate(`/admin/users/edit/${user.id}`);
  };

  // Funções para confirmação de exclusão
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  // Tradução dos tipos de portal
  const getPortalTypeLabel = (type: string) => {
    switch (type) {
      case "admin": return "Administrador";
      case "student": return "Aluno";
      case "partner": return "Parceiro";
      case "polo": return "Polo";
      default: return type;
    }
  };

  // Cor dos badges por tipo de portal
  const getPortalTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "admin": return "destructive";
      case "student": return "default";
      case "partner": return "secondary";
      case "polo": return "outline";
      default: return "default";
    }
  };

  // Formatação de data
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout sidebarItems={getAdminSidebarItems()}>
      <div className="space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
          <div className="flex items-center space-x-2">
            {hasCreatePermission && (
              <Button onClick={handleCreateUser}>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema e suas permissões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <div className="flex items-center space-x-2 w-full md:w-1/2">
                <div className="relative w-full">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                    <SelectValue placeholder="Filtrar por tipo" />
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
              <div className="flex justify-center items-center h-64">
                <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando usuários...</span>
              </div>
            ) : isError ? (
              <div className="flex justify-center items-center h-64 text-destructive">
                <p>Erro ao carregar usuários. Tente novamente mais tarde.</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
                <UsersIcon className="h-16 w-16 mb-4" />
                <p>Nenhum usuário encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getPortalTypeBadgeVariant(user.portalType)}>
                            {getPortalTypeLabel(user.portalType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {hasUpdatePermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2Icon className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            )}
                            {hasManagePermissionPermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/users/${user.id}/permissions`)}
                              >
                                <KeyIcon className="h-4 w-4" />
                                <span className="sr-only">Permissões</span>
                              </Button>
                            )}
                            {hasDeletePermission && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(user)}
                              >
                                <TrashIcon className="h-4 w-4 text-destructive" />
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
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
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