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
  PaymentsIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  BuildingStoreIcon,
  InvoiceIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/finance/payments"],
    enabled: false, // Desabilitado até termos a API real
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMethodBadge = (method) => {
    const methodMap = {
      credit_card: <Badge className="bg-green-500">Cartão de Crédito</Badge>,
      debit_card: <Badge className="bg-blue-500">Cartão de Débito</Badge>,
      bank_slip: <Badge className="bg-yellow-500">Boleto Bancário</Badge>,
      bank_transfer: <Badge className="bg-violet-500">Transferência</Badge>,
      pix: <Badge className="bg-purple-500">PIX</Badge>,
    };

    return methodMap[method] || <Badge>{method}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
            <p className="text-gray-500">
              Acompanhe todos os pagamentos realizados.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/finance/payments/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Registrar Pagamento
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Pagamentos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os pagamentos recebidos.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por transação, cliente ou fatura..."
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
                    <TableHead>ID Transação</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">TXN-2025-0001</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Empresa Beta S.A.
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <InvoiceIcon className="mr-2 h-4 w-4" />
                        FAT-2025-0002
                      </div>
                    </TableCell>
                    <TableCell>02/04/2025</TableCell>
                    <TableCell>
                      {getMethodBadge('bank_transfer')}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(9850.00)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/payments/1")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">TXN-2025-0002</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Carlos Eduardo Santos
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <InvoiceIcon className="mr-2 h-4 w-4" />
                        FAT-2025-0004
                      </div>
                    </TableCell>
                    <TableCell>03/04/2025</TableCell>
                    <TableCell>
                      {getMethodBadge('credit_card')}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(1250.00)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/payments/2")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">TXN-2025-0003</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingStoreIcon className="mr-2 h-4 w-4" />
                        Empresa Alpha Ltda.
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <InvoiceIcon className="mr-2 h-4 w-4" />
                        FAT-2025-0005
                      </div>
                    </TableCell>
                    <TableCell>05/04/2025</TableCell>
                    <TableCell>
                      {getMethodBadge('pix')}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(3200.00)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/payments/3")}
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