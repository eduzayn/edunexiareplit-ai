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
  BuildingStoreIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  ContractIcon,
  InvoiceIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/crm/clients"],
    enabled: false, // Desabilitado até termos a API real
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-gray-500">
              Gerenciamento completo de clientes e suas informações.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/crm/clients/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Clientes</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os clientes cadastrados.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, CNPJ/CPF ou email..."
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
                    <TableHead>Nome/Razão Social</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Faturas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">Empresa Alpha Ltda.</TableCell>
                    <TableCell>43.295.111/0001-93</TableCell>
                    <TableCell>contato@alpha.com.br</TableCell>
                    <TableCell>(11) 3456-7890</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500">Pessoa Jurídica</Badge>
                    </TableCell>
                    <TableCell>3 faturas abertas</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate("/admin/finance/invoices?client=1")}
                        >
                          <InvoiceIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate("/admin/contracts?client=1")}
                        >
                          <ContractIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/crm/clients/1")}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Carlos Eduardo Santos</TableCell>
                    <TableCell>342.856.977-88</TableCell>
                    <TableCell>carlos.eduardo@email.com</TableCell>
                    <TableCell>(21) 98765-4321</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Pessoa Física</Badge>
                    </TableCell>
                    <TableCell>1 fatura aberta</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate("/admin/finance/invoices?client=2")}
                        >
                          <InvoiceIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate("/admin/contracts?client=2")}
                        >
                          <ContractIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/crm/clients/2")}
                        >
                          Ver detalhes
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