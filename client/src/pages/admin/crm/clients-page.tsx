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
  UserIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-crm";

export default function ClientsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { clients, isLoading } = useClients();
  
  // Filtragem de clientes com base no termo de busca
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    
    if (!searchTerm) return clients;
    
    const search = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.cpfCnpj.toLowerCase().includes(search)
    );
  }, [clients, searchTerm]);

  const getClientTypeBadge = (type: string) => {
    const typeMap: Record<string, React.ReactNode> = {
      pf: <Badge className="bg-blue-500">Pessoa Física</Badge>,
      pj: <Badge className="bg-purple-500">Pessoa Jurídica</Badge>,
    };

    return typeMap[type] || <Badge>{type}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-gray-500">
              Gerenciamento de clientes da sua instituição.
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
                  placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4" />
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell>{client.cpfCnpj}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MailIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {client.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                            {client.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClientTypeBadge(client.type)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/crm/clients/${client.id}`)}
                          >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
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