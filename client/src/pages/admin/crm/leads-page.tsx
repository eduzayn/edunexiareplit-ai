import React from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  LeadIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  UserIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/use-crm";
import { usePermissions, PermissionGuard } from "@/hooks/use-permissions";

export default function LeadsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  
  // Usar o hook de permissões para verificar acesso
  const { hasPermission } = usePermissions();
  
  // Usar o hook de leads que criamos
  const { 
    leads, 
    isLoading, 
    isError, 
    error,
    deleteLead 
  } = useLeads(searchTerm, statusFilter);

  // Função para buscar dados com base no termo de pesquisa
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, React.ReactNode> = {
      novo: <Badge className="bg-blue-500">Novo</Badge>,
      contatado: <Badge className="bg-yellow-500">Contatado</Badge>,
      qualificado: <Badge className="bg-green-500">Qualificado</Badge>,
      negociacao: <Badge className="bg-purple-500">Em Negociação</Badge>,
      convertido: <Badge className="bg-emerald-500">Convertido</Badge>,
      perdido: <Badge className="bg-red-500">Perdido</Badge>,
    };

    return statusMap[status] || <Badge>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-gray-500">
              Gerenciamento de leads e prospecção de clientes.
            </p>
          </div>
          {/* Usando o componente PermissionGuard para verificar permissão de criação */}
          <PermissionGuard 
            resource="leads" 
            action="criar"
            fallback={
              <Button disabled title="Você não tem permissão para criar leads">
                <PlusIcon className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            }
          >
            <Button onClick={() => navigate("/admin/crm/leads/new")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Leads</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os leads registrados.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, email ou origem..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filtros
              </Button>
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
            ) : (
              // Tabela que será preenchida com dados da API
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-red-500">
                        Erro ao carregar leads: {(error as any)?.message || 'Erro desconhecido'}
                      </TableCell>
                    </TableRow>
                  ) : leads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    /* Dados reais da API */
                    leads?.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            {lead.name}
                          </div>
                        </TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell>{lead.interest}</TableCell>
                        <TableCell>
                          {getStatusBadge(lead.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Verificar permissão de leitura */}
                            <PermissionGuard resource="leads" action="ler">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/crm/leads/${lead.id}`)}
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Detalhes
                              </Button>
                            </PermissionGuard>
                            
                            {/* Verificar permissão de exclusão */}
                            <PermissionGuard 
                              resource="leads" 
                              action="deletar"
                              fallback={null}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir este lead?')) {
                                    deleteLead(lead.id);
                                  }
                                }}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  className="mr-2 h-4 w-4"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                                Excluir
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}