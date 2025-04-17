/**
 * Página de Antecipação de Recebíveis
 * 
 * Integração com a funcionalidade de antecipação de recebíveis do Asaas
 * para melhorar o fluxo de caixa da instituição.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowDownToLine,
  ArrowUpRight, 
  CalendarIcon, 
  CircleDollarSign, 
  Download, 
  FileText, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

/**
 * Componente da página de antecipação de recebíveis
 */
export default function AntecipacaoPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);

  // Exemplo de dados de antecipações (serão substituídos por dados da API Asaas)
  const anticipations = [
    {
      id: "ant_000001",
      requestDate: "2025-04-10",
      amount: 45000.00,
      receivables: 50000.00,
      fee: 5000.00,
      status: "approved",
      transferDate: "2025-04-12",
    },
    {
      id: "ant_000002",
      requestDate: "2025-03-15",
      amount: 32000.00,
      receivables: 35000.00,
      fee: 3000.00,
      status: "completed",
      transferDate: "2025-03-16",
    },
    {
      id: "ant_000003",
      requestDate: "2025-04-20",
      amount: 27500.00,
      receivables: 30000.00,
      fee: 2500.00,
      status: "pending",
      transferDate: null,
    },
  ];

  // Exemplo de recebíveis disponíveis para antecipação
  const availableReceivables = [
    {
      id: "rec_000001",
      customer: "Universidade Federal do Amazonas",
      dueDate: "2025-06-15",
      amount: 12000.00,
      anticipationFee: 800.00,
      netAmount: 11200.00,
    },
    {
      id: "rec_000002",
      customer: "Faculdade Integrada Brasil Amazônia",
      dueDate: "2025-06-10",
      amount: 8500.00,
      anticipationFee: 600.00,
      netAmount: 7900.00,
    },
    {
      id: "rec_000003",
      customer: "Instituto de Educação Superior",
      dueDate: "2025-07-05",
      amount: 15000.00,
      anticipationFee: 1200.00,
      netAmount: 13800.00,
    },
    {
      id: "rec_000004",
      customer: "Centro Universitário do Norte",
      dueDate: "2025-06-22",
      amount: 10500.00,
      anticipationFee: 750.00,
      netAmount: 9750.00,
    },
    {
      id: "rec_000005",
      customer: "Polo Educacional Manacapuru",
      dueDate: "2025-07-10",
      amount: 4000.00,
      anticipationFee: 280.00,
      netAmount: 3720.00,
    },
  ];

  // Verificação de acesso exclusivo para super_admin
  if (!user?.isAdmin && user?.role !== "super_admin") {
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

  // Função para renderizar o status das antecipações
  const renderStatus = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Em análise</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluída</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  // Total disponível para antecipação
  const totalAvailable = availableReceivables.reduce((total, item) => total + item.amount, 0);
  const anticipationFee = availableReceivables.reduce((total, item) => total + item.anticipationFee, 0);
  const netAmount = totalAvailable - anticipationFee;

  return (
    <div className="flex h-screen bg-background">
      <Helmet>
        <title>Antecipação de Recebíveis | Financeiro Empresarial</title>
      </Helmet>

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
              <h1 className="text-3xl font-bold tracking-tight">Antecipação de Recebíveis</h1>
              <p className="text-muted-foreground">
                Antecipe seus recebimentos e melhore seu fluxo de caixa
              </p>
            </div>
            <Button onClick={() => setShowNewRequestDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Antecipação
            </Button>
          </div>

          {/* Resumo de antecipações */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Disponível para Antecipação
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAvailable)}</div>
                <p className="text-xs text-muted-foreground">
                  Em cobranças confirmadas para os próximos 90 dias
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Antecipação
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(anticipationFee)}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa média de 7% para antecipação
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor Líquido
                </CardTitle>
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(netAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Valor a receber após descontos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Última Antecipação
                </CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(32000.00)}</div>
                <p className="text-xs text-muted-foreground">
                  Realizada em 15/03/2025
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="history" className="space-y-4">
            <TabsList>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="available">Disponível para Antecipação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Antecipações</CardTitle>
                  <CardDescription>
                    Acompanhe todas as solicitações de antecipação realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Buscar solicitações..."
                          className="pl-8 w-[250px]"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data do Pedido</TableHead>
                        <TableHead>Valor Solicitado</TableHead>
                        <TableHead>Valor de Recebíveis</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Transferência</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anticipations.map((anticipation) => (
                        <TableRow key={anticipation.id}>
                          <TableCell className="font-medium">{anticipation.id}</TableCell>
                          <TableCell>{formatDate(anticipation.requestDate)}</TableCell>
                          <TableCell>{formatCurrency(anticipation.amount)}</TableCell>
                          <TableCell>{formatCurrency(anticipation.receivables)}</TableCell>
                          <TableCell>{formatCurrency(anticipation.fee)}</TableCell>
                          <TableCell>{renderStatus(anticipation.status)}</TableCell>
                          <TableCell>{formatDate(anticipation.transferDate)}</TableCell>
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
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Baixar Comprovante
                                </DropdownMenuItem>
                                {anticipation.status === "pending" && (
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancelar Solicitação
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="available" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recebíveis Disponíveis para Antecipação</CardTitle>
                  <CardDescription>
                    Selecione os recebíveis que deseja antecipar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Input type="checkbox" className="h-4 w-4" />
                        </TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor Original</TableHead>
                        <TableHead>Taxa de Antecipação</TableHead>
                        <TableHead>Valor Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableReceivables.map((receivable) => (
                        <TableRow key={receivable.id}>
                          <TableCell>
                            <Input type="checkbox" className="h-4 w-4" />
                          </TableCell>
                          <TableCell className="font-medium">{receivable.customer}</TableCell>
                          <TableCell>{formatDate(receivable.dueDate)}</TableCell>
                          <TableCell>{formatCurrency(receivable.amount)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(receivable.anticipationFee)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(receivable.netAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Resumo da Antecipação</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Valor Total dos Recebíveis</span>
                      <span className="font-medium">{formatCurrency(totalAvailable)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Antecipação</span>
                      <span className="font-medium text-red-600">-{formatCurrency(anticipationFee)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Valor Líquido a Receber</span>
                      <span className="font-bold">{formatCurrency(netAmount)}</span>
                    </div>
                    
                    <Button className="w-full mt-4">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Solicitar Antecipação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de solicitação de nova antecipação */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Antecipação</DialogTitle>
            <DialogDescription>
              Solicite a antecipação de seus recebíveis para melhorar seu capital de giro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Valor Disponível para Antecipação</Label>
              <div className="text-2xl font-bold">{formatCurrency(totalAvailable)}</div>
              <p className="text-sm text-muted-foreground">
                Em cobranças já confirmadas para os próximos 90 dias
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anticipation-amount">Valor a Antecipar</Label>
              <Input
                id="anticipation-amount"
                placeholder="0,00"
                type="text"
                inputMode="decimal"
              />
              <p className="text-sm text-muted-foreground">
                O valor máximo para antecipação é {formatCurrency(totalAvailable)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Simulação da Antecipação</Label>
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Valor Solicitado</span>
                    <span className="font-medium">{formatCurrency(45000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Antecipação (7%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(3150)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Valor Líquido a Receber</span>
                    <span className="font-bold">{formatCurrency(41850)}</span>
                  </div>
                  
                  <div className="pt-2">
                    <Label className="text-xs mb-1 block">Progresso da Antecipação</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={90} className="h-2" />
                      <span className="text-xs">90%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você está antecipando 90% do valor disponível
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Antecipação (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da antecipação"
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowNewRequestDialog(false)} className="bg-green-600 hover:bg-green-700">
              Confirmar Antecipação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}