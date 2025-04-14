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
  ShoppingBagIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/finance/products"],
    enabled: false, // Desabilitado até termos a API real
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos e Serviços</h1>
            <p className="text-gray-500">
              Gerencie seu catálogo de produtos e serviços oferecidos.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/finance/products/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Produto/Serviço
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Catálogo de Produtos e Serviços</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os produtos e serviços disponíveis.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, código ou categoria..."
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
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell>CURSO-POS-001</TableCell>
                    <TableCell className="font-medium">MBA em Gestão Empresarial</TableCell>
                    <TableCell>Serviço</TableCell>
                    <TableCell>R$ 12.900,00</TableCell>
                    <TableCell>Educação / Pós-Graduação</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/products/1")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CURSO-GRAD-001</TableCell>
                    <TableCell className="font-medium">Graduação em Pedagogia</TableCell>
                    <TableCell>Serviço</TableCell>
                    <TableCell>R$ 9.800,00</TableCell>
                    <TableCell>Educação / Graduação</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/products/2")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>MATERIAL-001</TableCell>
                    <TableCell className="font-medium">Kit Material Didático Digital</TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell>R$ 750,00</TableCell>
                    <TableCell>Material Didático</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/finance/products/3")}
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