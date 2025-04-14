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
  ContactIcon, 
  PlusIcon, 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Quando tivermos a API real, este useQuery será usado para carregar os dados
  // Por enquanto, definimos como isLoading para mostrar o estado de carregamento
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/crm/contacts"],
    enabled: false, // Desabilitado até termos a API real
  });

  const getContactRoleBadge = (role: string) => {
    const roleMap: Record<string, React.ReactNode> = {
      decision_maker: <Badge className="bg-blue-500">Decisor</Badge>,
      influencer: <Badge className="bg-purple-500">Influenciador</Badge>,
      technical: <Badge className="bg-green-500">Técnico</Badge>,
      financial: <Badge className="bg-yellow-500">Financeiro</Badge>,
      admin: <Badge className="bg-gray-500">Administrativo</Badge>,
    };

    return roleMap[role] || <Badge>{role}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
            <p className="text-gray-500">
              Gerenciamento de contatos associados aos clientes.
            </p>
          </div>
          <Button onClick={() => navigate("/admin/crm/contacts/new")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Listagem de Contatos</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as pessoas de contato.
            </CardDescription>
            <div className="flex items-center space-x-2 pt-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, cargo ou empresa..."
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados de exemplo - serão substituídos por dados da API */}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ContactIcon className="mr-2 h-4 w-4" />
                        Ana Luiza Mendes
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingIcon className="mr-2 h-4 w-4 text-gray-500" />
                        Empresa ABC Ltda
                      </div>
                    </TableCell>
                    <TableCell>Diretora Financeira</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MailIcon className="mr-2 h-4 w-4 text-gray-500" />
                        ana.mendes@empresaabc.com.br
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                        (11) 98765-4321
                      </div>
                    </TableCell>
                    <TableCell>
                      {getContactRoleBadge('decision_maker')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/contacts/1")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ContactIcon className="mr-2 h-4 w-4" />
                        Ricardo Santos
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingIcon className="mr-2 h-4 w-4 text-gray-500" />
                        Instituto Educacional XYZ
                      </div>
                    </TableCell>
                    <TableCell>Diretor Acadêmico</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MailIcon className="mr-2 h-4 w-4 text-gray-500" />
                        ricardo.santos@institutoxyz.edu.br
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                        (21) 99876-5432
                      </div>
                    </TableCell>
                    <TableCell>
                      {getContactRoleBadge('technical')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/contacts/2")}
                      >
                        <EyeIcon className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ContactIcon className="mr-2 h-4 w-4" />
                        Patrícia Oliveira
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BuildingIcon className="mr-2 h-4 w-4 text-gray-500" />
                        Faculdade Metropolitana
                      </div>
                    </TableCell>
                    <TableCell>Coordenadora de Compras</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MailIcon className="mr-2 h-4 w-4 text-gray-500" />
                        patricia.oliveira@facmetro.edu.br
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                        (31) 97654-3210
                      </div>
                    </TableCell>
                    <TableCell>
                      {getContactRoleBadge('financial')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/crm/contacts/3")}
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