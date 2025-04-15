import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MonetizationOnIcon,
  DashboardIcon,
  TrendingUpIcon,
  ReceiptIcon,
  ChartIcon,
} from "@/components/ui/icons";
import {
  PlusIcon,
  FileTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  SearchIcon,
  FilterIcon,
  TrendingDownIcon,
  LineChartIcon,
  BarChart2Icon,
  DownloadIcon,
  PrinterIcon,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

// Dados simulados para demonstração
const MOCK_DATA = {
  transactions: [
    { id: 1, date: '10/04/2025', type: 'entrada', category: 'Mensalidades', description: 'Mensalidades - Curso de Administração', amount: 25000.00, status: 'concluído' },
    { id: 2, date: '05/04/2025', type: 'entrada', category: 'Taxas', description: 'Taxas de matrícula - Novos alunos', amount: 12500.00, status: 'concluído' },
    { id: 3, date: '12/04/2025', type: 'saida', category: 'Salários', description: 'Folha de pagamento - Docentes', amount: 18000.00, status: 'agendado' },
    { id: 4, date: '08/04/2025', type: 'saida', category: 'Infraestrutura', description: 'Manutenção de equipamentos', amount: 4500.00, status: 'concluído' },
    { id: 5, date: '15/04/2025', type: 'saida', category: 'Marketing', description: 'Campanha de captação 2025', amount: 7800.00, status: 'pendente' },
    { id: 6, date: '02/04/2025', type: 'entrada', category: 'Serviços', description: 'Aluguel de espaço para eventos', amount: 3200.00, status: 'concluído' },
    { id: 7, date: '18/04/2025', type: 'saida', category: 'Impostos', description: 'Impostos mensais', amount: 9350.00, status: 'agendado' },
  ],
  cashFlow: [
    { month: 'Jan', entradas: 58000, saidas: 45000 },
    { month: 'Fev', entradas: 55000, saidas: 48000 },
    { month: 'Mar', entradas: 60000, saidas: 51000 },
    { month: 'Abr', entradas: 70000, saidas: 55000 },
    { month: 'Mai', entradas: 65000, saidas: 52000 },
    { month: 'Jun', entradas: 75000, saidas: 58000 },
    { month: 'Jul', entradas: 80000, saidas: 62000 },
    { month: 'Ago', entradas: 78000, saidas: 60000 },
    { month: 'Set', entradas: 82000, saidas: 63000 },
    { month: 'Out', entradas: 85000, saidas: 64000 },
    { month: 'Nov', entradas: 90000, saidas: 68000 },
    { month: 'Dez', entradas: 96000, saidas: 72000 },
  ],
  categorias: {
    entradas: [
      { id: 1, name: 'Mensalidades' },
      { id: 2, name: 'Taxas' },
      { id: 3, name: 'Serviços' },
      { id: 4, name: 'Doações' },
      { id: 5, name: 'Outros' },
    ],
    saidas: [
      { id: 1, name: 'Salários' },
      { id: 2, name: 'Infraestrutura' },
      { id: 3, name: 'Marketing' },
      { id: 4, name: 'Impostos' },
      { id: 5, name: 'Administrativo' },
      { id: 6, name: 'Outros' },
    ]
  }
};

export default function FinancialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("transacoes");
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState("entrada");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Usar o componente padronizado para os itens da barra lateral
  const sidebarItems = getAdminSidebarItems(location || "");

  // Dados simulados totais
  const totalEntradas = MOCK_DATA.transactions
    .filter(t => t.type === 'entrada')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalSaidas = MOCK_DATA.transactions
    .filter(t => t.type === 'saida')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const saldo = totalEntradas - totalSaidas;

  // Filtrar transações com base na pesquisa e filtro
  const filteredTransactions = MOCK_DATA.transactions.filter(transaction => {
    // Filtrar por tipo
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }
    
    // Filtrar por termo de pesquisa
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower) ||
        transaction.date.includes(searchTerm)
      );
    }
    
    return true;
  });

  // Funções simuladas
  const handleNewTransaction = () => {
    toast({
      title: "Transação registrada",
      description: "A nova transação financeira foi registrada com sucesso.",
    });
    setShowNewTransactionDialog(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MonetizationOnIcon className="mr-2 h-6 w-6" />
                Financeiro Empresarial
              </h1>
              <p className="text-gray-600">
                Gerencie as finanças corporativas da sua instituição
              </p>
            </div>
            <div className="mt-4 md:mt-0 space-x-2 flex">
              <Button onClick={() => setShowNewTransactionDialog(true)}>
                <PlusIcon className="mr-1 h-4 w-4" />
                Nova Transação
              </Button>
              <Button variant="outline">
                <FileTextIcon className="mr-1 h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
            <Card className="bg-white border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                  <ArrowUpIcon className="mr-1 h-4 w-4 text-green-600" />
                  Total de Entradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalEntradas)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Último mês: +5.2%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center">
                  <ArrowDownIcon className="mr-1 h-4 w-4 text-red-600" />
                  Total de Saídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalSaidas)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Último mês: +3.1%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                  <DashboardIcon className="mr-1 h-4 w-4 text-blue-600" />
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(saldo)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Último mês: {saldo >= 0 ? '+8.3%' : '-4.7%'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal com Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto mb-4">
              <TabsTrigger value="transacoes" className="flex-1 md:flex-none">
                <ReceiptIcon className="mr-1 h-4 w-4" />
                Transações
              </TabsTrigger>
              <TabsTrigger value="fluxo-caixa" className="flex-1 md:flex-none">
                <TrendingUpIcon className="mr-1 h-4 w-4" />
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="categorias" className="flex-1 md:flex-none">
                <ChartIcon className="mr-1 h-4 w-4" />
                Categorias
              </TabsTrigger>
            </TabsList>

            {/* Tab: Transações */}
            <TabsContent value="transacoes">
              <Card>
                <CardHeader>
                  <CardTitle>Transações Financeiras</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as transações financeiras da instituição
                  </CardDescription>
                  <div className="mt-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Pesquisar transações..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select 
                      value={filterType} 
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger className="w-full md:w-36">
                        <FilterIcon className="mr-1 h-4 w-4" />
                        <SelectValue placeholder="Filtrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.date}</TableCell>
                              <TableCell className="font-medium">
                                {transaction.description}
                              </TableCell>
                              <TableCell>{transaction.category}</TableCell>
                              <TableCell className={transaction.type === 'entrada' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                  ${transaction.status === 'concluído' ? 'bg-green-100 text-green-800' : 
                                    transaction.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-blue-100 text-blue-800'}`}>
                                  {transaction.status}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhuma transação encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-gray-500">
                    {filteredTransactions.length} transações encontradas
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <PrinterIcon className="mr-1 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm">
                      <DownloadIcon className="mr-1 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab: Fluxo de Caixa */}
            <TabsContent value="fluxo-caixa">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                  <CardDescription>
                    Acompanhe o fluxo de caixa mensal da instituição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={MOCK_DATA.cashFlow}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                            currency: 'BRL'
                          }).format(value)
                        } />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), ""]}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="entradas" 
                          stackId="1"
                          stroke="#4CAF50" 
                          fill="#4CAF50"
                          name="Entradas"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="saidas" 
                          stackId="2"
                          stroke="#f44336" 
                          fill="#f44336"
                          name="Saídas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <TrendingUpIcon className="mr-1 h-4 w-4 text-blue-600" />
                          Análise Comparativa Anual
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Crescimento de receitas
                            </p>
                            <p className="text-2xl font-bold text-green-600">+15%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Redução de despesas
                            </p>
                            <p className="text-2xl font-bold text-red-600">-8%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Saldo líquido
                            </p>
                            <p className="text-2xl font-bold text-blue-600">+23%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center">
                          <LineChartIcon className="mr-1 h-4 w-4 text-blue-600" />
                          Projeção Financeira
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between mb-1">
                            <span>Projeção de receitas (próximo trimestre)</span>
                            <span className="font-medium text-green-600">R$ 320.000,00</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span>Projeção de despesas (próximo trimestre)</span>
                            <span className="font-medium text-red-600">R$ 210.000,00</span>
                          </div>
                          <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                            <span>Saldo projetado</span>
                            <span className="text-blue-600">R$ 110.000,00</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    Alterar Período
                  </Button>
                  <Button variant="outline">
                    <DownloadIcon className="mr-1 h-4 w-4" />
                    Exportar Relatório
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab: Categorias */}
            <TabsContent value="categorias">
              <Card>
                <CardHeader>
                  <CardTitle>Categorias Financeiras</CardTitle>
                  <CardDescription>
                    Visualize e gerencie as categorias de entradas e saídas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="entradas" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="entradas">
                        <ArrowUpIcon className="mr-1 h-4 w-4 text-green-600" />
                        Categorias de Entradas
                      </TabsTrigger>
                      <TabsTrigger value="saidas">
                        <ArrowDownIcon className="mr-1 h-4 w-4 text-red-600" />
                        Categorias de Saídas
                      </TabsTrigger>
                      <TabsTrigger value="analise">
                        <BarChart2Icon className="mr-1 h-4 w-4 text-blue-600" />
                        Análise por Categoria
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="entradas">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Nome da Categoria</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {MOCK_DATA.categorias.entradas.map((categoria) => (
                                  <TableRow key={categoria.id}>
                                    <TableCell>{categoria.id}</TableCell>
                                    <TableCell className="font-medium">{categoria.name}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm">Editar</Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Button className="mt-4">
                            <PlusIcon className="mr-1 h-4 w-4" />
                            Nova Categoria
                          </Button>
                        </div>
                        <Card className="border">
                          <CardHeader>
                            <CardTitle className="text-sm">Distribuição de Entradas por Categoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Mensalidades', valor: 65 },
                                    { name: 'Taxas', valor: 15 },
                                    { name: 'Serviços', valor: 12 },
                                    { name: 'Doações', valor: 5 },
                                    { name: 'Outros', valor: 3 },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis tickFormatter={(value) => `${value}%`} />
                                  <Tooltip formatter={(value) => [`${value}%`, "Percentual"]} />
                                  <Bar dataKey="valor" fill="#4CAF50" name="Percentual" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="saidas">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Nome da Categoria</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {MOCK_DATA.categorias.saidas.map((categoria) => (
                                  <TableRow key={categoria.id}>
                                    <TableCell>{categoria.id}</TableCell>
                                    <TableCell className="font-medium">{categoria.name}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm">Editar</Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Button className="mt-4">
                            <PlusIcon className="mr-1 h-4 w-4" />
                            Nova Categoria
                          </Button>
                        </div>
                        <Card className="border">
                          <CardHeader>
                            <CardTitle className="text-sm">Distribuição de Saídas por Categoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Salários', valor: 45 },
                                    { name: 'Infraestrutura', valor: 20 },
                                    { name: 'Marketing', valor: 15 },
                                    { name: 'Impostos', valor: 12 },
                                    { name: 'Administrativo', valor: 5 },
                                    { name: 'Outros', valor: 3 },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis tickFormatter={(value) => `${value}%`} />
                                  <Tooltip formatter={(value) => [`${value}%`, "Percentual"]} />
                                  <Bar dataKey="valor" fill="#f44336" name="Percentual" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="analise">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Análise Comparativa por Categoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Jan', entradas: 58000, saidas: 45000 },
                                    { name: 'Fev', entradas: 55000, saidas: 48000 },
                                    { name: 'Mar', entradas: 60000, saidas: 51000 },
                                    { name: 'Abr', entradas: 70000, saidas: 55000 },
                                    { name: 'Mai', entradas: 65000, saidas: 52000 },
                                    { name: 'Jun', entradas: 75000, saidas: 58000 },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis tickFormatter={(value) => 
                                    new Intl.NumberFormat('pt-BR', {
                                      notation: 'compact',
                                      compactDisplay: 'short',
                                      currency: 'BRL'
                                    }).format(value)
                                  } />
                                  <Tooltip 
                                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                                    labelFormatter={(label) => `Mês: ${label}`}
                                  />
                                  <Legend />
                                  <Bar dataKey="entradas" fill="#4CAF50" name="Entradas" />
                                  <Bar dataKey="saidas" fill="#f44336" name="Saídas" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Top 3 Fontes de Receita</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ol className="space-y-2 mt-2">
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs mr-2">1</span>
                                    <span>Mensalidades</span>
                                  </div>
                                  <span className="font-medium text-green-600">65%</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs mr-2">2</span>
                                    <span>Taxas</span>
                                  </div>
                                  <span className="font-medium text-green-600">15%</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs mr-2">3</span>
                                    <span>Serviços</span>
                                  </div>
                                  <span className="font-medium text-green-600">12%</span>
                                </li>
                              </ol>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Top 3 Despesas</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ol className="space-y-2 mt-2">
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs mr-2">1</span>
                                    <span>Salários</span>
                                  </div>
                                  <span className="font-medium text-red-600">45%</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs mr-2">2</span>
                                    <span>Infraestrutura</span>
                                  </div>
                                  <span className="font-medium text-red-600">20%</span>
                                </li>
                                <li className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs mr-2">3</span>
                                    <span>Marketing</span>
                                  </div>
                                  <span className="font-medium text-red-600">15%</span>
                                </li>
                              </ol>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog: Nova Transação */}
      <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Transação Financeira</DialogTitle>
            <DialogDescription>
              Registre uma nova transação financeira no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="transaction-type">Tipo de Transação</Label>
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" placeholder="Descreva a transação" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" type="number" placeholder="0,00" min="0" step="0.01" />
              </div>
              <div className="col-span-1">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="category">Categoria</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionType === 'entrada'
                      ? MOCK_DATA.categorias.entradas.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))
                      : MOCK_DATA.categorias.saidas.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="concluído">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concluído">Concluído</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransactionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleNewTransaction}>
              Salvar Transação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}