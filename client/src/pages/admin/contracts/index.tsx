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
  ContractIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  DownloadIcon,
  BuildingStoreIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContractsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/contracts"],
    enabled: false, // Desabilitado até termos a API real
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      active: <Badge className="bg-green-500">Ativo</Badge>,
      draft: <Badge className="bg-gray-400">Rascunho</Badge>,
      expired: <Badge className="bg-red-500">Expirado</Badge>,
      pending: <Badge className="bg-yellow-500">Pendente</Badge>,
      cancelled: <Badge className="bg-red-400">Cancelado</Badge>,
    };

    return statusMap[status] || <Badge>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
            <p className="text-gray-500">
              Gerenciamento de contratos e acordos com clientes.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/contracts/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Contratos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os contratos gerados.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por número, cliente ou tipo..."
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
                      <Skeleton className="h-12 w-12 rounded-md" />
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
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">CTR-2025-0001</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Empresa Alpha Ltda.
                      </div>
                    </TableCell>
                    <TableCell>Prestação de Serviços Educacionais</TableCell>
                    <TableCell>01/04/2025</TableCell>
                    <TableCell>01/04/2026</TableCell>
                    <TableCell>
                      {getStatusBadge('active')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Baixar contrato"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/contracts/1")}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CTR-2025-0002</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Carlos Eduardo Santos
                      </div>
                    </TableCell>
                    <TableCell>MBA em Gestão Empresarial</TableCell>
                    <TableCell>15/03/2025</TableCell>
                    <TableCell>15/09/2026</TableCell>
                    <TableCell>
                      {getStatusBadge('active')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Baixar contrato"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/contracts/2")}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CTR-2025-0003</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Empresa Beta S.A.
                      </div>
                    </TableCell>
                    <TableCell>Parceria Institucional</TableCell>
                    <TableCell>01/01/2025</TableCell>
                    <TableCell>31/12/2025</TableCell>
                    <TableCell>
                      {getStatusBadge('pending')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Baixar contrato"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/contracts/3")}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
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