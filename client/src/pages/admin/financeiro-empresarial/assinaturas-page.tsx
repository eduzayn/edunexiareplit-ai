/**
 * Página de Gestão de Assinaturas Recorrentes
 * 
 * Integração com a funcionalidade de assinaturas do Asaas para criar
 * e gerenciar planos de pagamento recorrentes.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  Check, 
  ChevronLeft, 
  Circle, 
  Download, 
  FileText, 
  Filter, 
  MoreHorizontal, 
  Pause, 
  Play, 
  Plus, 
  Repeat, 
  Search, 
  Trash
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Componente da página de gerenciamento de assinaturas
 */
export default function AssinaturasPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNewSubscriptionDialog, setShowNewSubscriptionDialog] = useState(false);

  // Exemplo de dados de assinaturas (serão substituídos por dados da API Asaas)
  const subscriptions = [
    {
      id: "sub_000001",
      customer: "Universidade Federal do Amazonas",
      plan: "Plano Institucional Premium",
      value: 12000.00,
      nextDueDate: "2025-05-15",
      status: "active",
      cycle: "monthly",
    },
    {
      id: "sub_000002",
      customer: "Faculdade Integrada Brasil Amazônia",
      plan: "Plano Institucional Básico",
      value: 4500.00,
      nextDueDate: "2025-05-10",
      status: "active",
      cycle: "monthly",
    },
    {
      id: "sub_000003",
      customer: "Instituto de Educação Superior",
      plan: "Plano Institucional Standard",
      value: 7800.00,
      nextDueDate: "2025-05-22",
      status: "overdue",
      cycle: "monthly",
    },
    {
      id: "sub_000004",
      customer: "Centro Universitário do Norte",
      plan: "Plano Institucional Premium",
      value: 11500.00,
      nextDueDate: "2025-06-01",
      status: "inactive",
      cycle: "yearly",
    },
    {
      id: "sub_000005",
      customer: "Polo Educacional Manacapuru",
      plan: "Plano Polo Avançado",
      value: 3200.00,
      nextDueDate: "2025-05-18",
      status: "active",
      cycle: "monthly",
    },
  ];

  // Verificação de acesso exclusivo para administradores
  if (user?.portalType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar o módulo Financeiro Empresarial.
          </p>
        </div>
      </div>
    );
  }

  // Função para renderizar o status das assinaturas
  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Atrasada</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
    }
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  useEffect(() => {
    document.title = "Assinaturas | Financeiro Empresarial";
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar para navegação */}
      <Sidebar
        items={getAdminSidebarItems(location)}
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
              <p className="text-muted-foreground">
                Gestão de planos e assinaturas recorrentes via Asaas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={() => setShowNewSubscriptionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Assinatura
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Assinaturas Ativas</CardTitle>
              <CardDescription>
                Gerencie todas as assinaturas recorrentes das instituições
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar assinaturas..."
                      className="pl-8 w-[250px]"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                      <SelectItem value="overdue">Atrasadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="monthly">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os ciclos</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Próximo Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.customer}</TableCell>
                      <TableCell>{subscription.plan}</TableCell>
                      <TableCell>{formatCurrency(subscription.value)}</TableCell>
                      <TableCell>{formatDate(subscription.nextDueDate)}</TableCell>
                      <TableCell>{renderStatus(subscription.status)}</TableCell>
                      <TableCell>
                        {subscription.cycle === "monthly" && "Mensal"}
                        {subscription.cycle === "yearly" && "Anual"}
                        {subscription.cycle === "quarterly" && "Trimestral"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Pausar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Cancelar Assinatura
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Mostrando 5 de 5 assinaturas
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Próxima
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Assinaturas
                </CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  +2 novas este mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Recorrente
                </CardTitle>
                <Circle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 39.000,00</div>
                <p className="text-xs text-muted-foreground">
                  Mensal (MRR)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Renovação
                </CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.3%</div>
                <p className="text-xs text-muted-foreground">
                  +1.2% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assinaturas em Risco
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Atrasada > 5 dias
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de criação de nova assinatura */}
      <Dialog open={showNewSubscriptionDialog} onOpenChange={setShowNewSubscriptionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>
              Crie uma nova assinatura recorrente para um cliente utilizando a API Asaas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="customer" className="mb-2 block">
                  Cliente
                </Label>
                <Select>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_1">Universidade Federal do Amazonas</SelectItem>
                    <SelectItem value="client_2">Faculdade Integrada Brasil Amazônia</SelectItem>
                    <SelectItem value="client_3">Instituto de Educação Superior</SelectItem>
                    <SelectItem value="client_4">Centro Universitário do Norte</SelectItem>
                    <SelectItem value="client_5">Polo Educacional Manacapuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan" className="mb-2 block">
                  Plano
                </Label>
                <Select>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan_1">Plano Institucional Premium</SelectItem>
                    <SelectItem value="plan_2">Plano Institucional Standard</SelectItem>
                    <SelectItem value="plan_3">Plano Institucional Básico</SelectItem>
                    <SelectItem value="plan_4">Plano Polo Avançado</SelectItem>
                    <SelectItem value="plan_5">Plano Polo Básico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value" className="mb-2 block">
                    Valor
                  </Label>
                  <Input
                    id="value"
                    placeholder="0,00"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <Label htmlFor="cycle" className="mb-2 block">
                    Ciclo de Cobrança
                  </Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger id="cycle">
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-due-date" className="mb-2 block">
                    Primeiro Vencimento
                  </Label>
                  <Input
                    id="first-due-date"
                    type="date"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="mb-2 block">
                    Status Inicial
                  </Label>
                  <Select defaultValue="active">
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="mb-2 block">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os detalhes da assinatura"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSubscriptionDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={() => setShowNewSubscriptionDialog(false)}>
              Criar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}