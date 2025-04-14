import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
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

export default function LeadsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/crm/leads"],
    enabled: false, // Desabilitado até termos a API real
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, React.ReactNode> = {
      new: <Badge className="bg-blue-500">Novo</Badge>,
      contacted: <Badge className="bg-yellow-500">Contatado</Badge>,
      qualified: <Badge className="bg-green-500">Qualificado</Badge>,
      negotiating: <Badge className="bg-purple-500">Em Negociação</Badge>,
      won: <Badge className="bg-emerald-500">Convertido</Badge>,
      lost: <Badge className="bg-red-500">Perdido</Badge>,
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
          <Button onClick={() => navigate("/admin/crm/leads/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
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
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Marcela Oliveira
                      </div>
                    </TableCell>
                    <TableCell>marcela.oliveira@email.com</TableCell>
                    <TableCell>(11) 99876-5432</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>MBA em Gestão Empresarial</TableCell>
                    <TableCell>
                      {getStatusBadge('new')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/leads/1")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Roberto Mendes
                      </div>
                    </TableCell>
                    <TableCell>roberto.mendes@empresa.com.br</TableCell>
                    <TableCell>(21) 98765-4321</TableCell>
                    <TableCell>Indicação</TableCell>
                    <TableCell>Especialização em Marketing Digital</TableCell>
                    <TableCell>
                      {getStatusBadge('contacted')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/leads/2")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Carolina Souza
                      </div>
                    </TableCell>
                    <TableCell>carolina.souza@outlook.com</TableCell>
                    <TableCell>(31) 97654-3210</TableCell>
                    <TableCell>Redes Sociais</TableCell>
                    <TableCell>Graduação em Pedagogia</TableCell>
                    <TableCell>
                      {getStatusBadge('qualified')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/leads/3")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}