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
  UserPlusIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon 
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

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-gray-500">
              Gerencie seus leads e oportunidades comerciais.
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
              Visualize e gerencie todos os leads registrados no sistema.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, email ou empresa..."
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Interação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">João Silva</TableCell>
                    <TableCell>joao.silva@empresa.com.br</TableCell>
                    <TableCell>Empresa A Ltda</TableCell>
                    <TableCell>Site</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500">Em Contato</Badge>
                    </TableCell>
                    <TableCell>10/04/2025 10:30</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/leads/1")}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Maria Santos</TableCell>
                    <TableCell>maria@contato.com.br</TableCell>
                    <TableCell>Empresa B S.A.</TableCell>
                    <TableCell>Indicação</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Qualificado</Badge>
                    </TableCell>
                    <TableCell>12/04/2025 14:15</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/leads/2")}
                      >
                        Ver detalhes
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