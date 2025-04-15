/**
 * Página de Gerenciamento de Usuários
 * Esta página permite visualizar e gerenciar os usuários do sistema
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { PlusCircle, Search, Filter, MoreHorizontal, Loader2 } from "lucide-react";

// Componentes UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UsuariosPage() {
  // Estado para pesquisa, filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [portalTypeFilter, setPortalTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [, navigate] = useLocation();

  // Preparar os parâmetros de filtro (convertendo 'all' para string vazia)
  const actualPortalTypeFilter = portalTypeFilter === 'all' ? '' : portalTypeFilter;

  // Tipo para resposta da API de usuários
  interface UsersResponse {
    data: Array<{
      id: number;
      username: string;
      fullName: string;
      email: string;
      portalType: string;
      isActive: boolean;
    }>;
    totalPages: number;
    currentPage: number;
    totalItems: number;
  }

  // Buscar lista de usuários
  const { data: users, isLoading } = useQuery<UsersResponse>({
    queryKey: ['/api/users', page, perPage, searchTerm, actualPortalTypeFilter],
    placeholderData: (prevData) => prevData, // Substitui keepPreviousData
  });

  // Navegar para a página de cadastro de novo usuário
  const handleCreateNewUser = () => {
    navigate("/admin/pessoas/usuarios/new");
  };

  // Navegar para a página de edição de usuário
  const handleEditUser = (userId: number) => {
    navigate(`/admin/pessoas/usuarios/${userId}`);
  };

  // Renderizar o status do usuário com cores apropriadas
  const renderUserStatus = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Ativo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        Inativo
      </Badge>
    );
  };

  // Renderizar o tipo de portal com rótulos amigáveis
  const renderPortalType = (portalType: string) => {
    const portalTypeMap: Record<string, string> = {
      admin: "Administrador",
      student: "Aluno",
      polo: "Polo",
      partner: "Parceiro",
    };

    return portalTypeMap[portalType] || portalType;
  };

  // Calcular o número total de páginas
  const totalPages = users?.totalPages || 1;

  return (
    <AdminLayout>
      <title>Usuários | EdunexIA</title>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <Button onClick={handleCreateNewUser}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, email ou usuário..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={portalTypeFilter} onValueChange={setPortalTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{portalTypeFilter ? renderPortalType(portalTypeFilter) : "Tipo de Portal"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="polo">Polo</SelectItem>
                  <SelectItem value="partner">Parceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerenciamento completo de usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.data?.length ? (
                    users.data.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{renderPortalType(user.portalType)}</TableCell>
                        <TableCell>{renderUserStatus(user.isActive)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Visualizar Permissões
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                {user.isActive ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage(page - 1);
                          }}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                        .map((p, i, arr) => {
                          if (i > 0 && arr[i - 1] !== p - 1) {
                            return (
                              <PaginationItem key={`ellipsis-${p}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(p);
                                }}
                                isActive={page === p}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage(page + 1);
                          }}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}