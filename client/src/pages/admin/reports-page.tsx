import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Users, 
  Book, 
  School, 
  Building, 
  Store, 
  DollarSign 
} from "lucide-react";

// Dados de exemplo para os gráficos
const matriculasData = [
  { mes: 'Jan', quantidade: 65 },
  { mes: 'Fev', quantidade: 75 },
  { mes: 'Mar', quantidade: 110 },
  { mes: 'Abr', quantidade: 87 },
  { mes: 'Mai', quantidade: 92 },
  { mes: 'Jun', quantidade: 105 },
  { mes: 'Jul', quantidade: 120 },
  { mes: 'Ago', quantidade: 132 },
  { mes: 'Set', quantidade: 145 },
  { mes: 'Out', quantidade: 155 },
  { mes: 'Nov', quantidade: 180 },
  { mes: 'Dez', quantidade: 160 },
];

const categoriasCursosData = [
  { nome: 'Tecnologia', valor: 40 },
  { nome: 'Saúde', valor: 25 },
  { nome: 'Gestão', valor: 20 },
  { nome: 'Educação', valor: 15 },
  { nome: 'Outros', valor: 10 },
];

const receitaData = [
  { mes: 'Jan', valor: 50000 },
  { mes: 'Fev', valor: 65000 },
  { mes: 'Mar', valor: 90000 },
  { mes: 'Abr', valor: 75000 },
  { mes: 'Mai', valor: 80000 },
  { mes: 'Jun', valor: 95000 },
  { mes: 'Jul', valor: 100000 },
  { mes: 'Ago', valor: 120000 },
  { mes: 'Set', valor: 140000 },
  { mes: 'Out', valor: 155000 },
  { mes: 'Nov', valor: 190000 },
  { mes: 'Dez', valor: 175000 },
];

const instituicoesPolosData = [
  { nome: 'Instituição A', polos: 12, alunos: 3500 },
  { nome: 'Instituição B', polos: 8, alunos: 2200 },
  { nome: 'Instituição C', polos: 5, alunos: 1800 },
  { nome: 'Instituição D', polos: 3, alunos: 950 },
  { nome: 'Instituição E', polos: 2, alunos: 670 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("anual");
  const [selectedTab, setSelectedTab] = useState("academico");

  // Simulação de carregamento de dados dos módulos
  const { data: disciplinasData, isLoading: isDisciplinasLoading } = useQuery({
    queryKey: ["/api/admin/disciplines/stats"],
    enabled: false, // Desabilitado pois endpoint não existe ainda
  });

  const { data: cursosData, isLoading: isCursosLoading } = useQuery({
    queryKey: ["/api/admin/courses/stats"],
    enabled: false, // Desabilitado pois endpoint não existe ainda
  });

  const { data: instituicoesData, isLoading: isInstituicoesLoading } = useQuery({
    queryKey: ["/api/admin/institutions/stats"],
    enabled: false, // Desabilitado pois endpoint não existe ainda
  });

  const renderAcademicoReports = () => {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Matrículas por Período */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Matrículas por Período</CardTitle>
            <CardDescription>Evolução de matrículas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={matriculasData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#4CAF50"
                    activeDot={{ r: 8 }}
                    name="Matrículas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Distribuição de Cursos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Cursos por Categoria</CardTitle>
            <CardDescription>Categorias mais populares</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriasCursosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="nome"
                    label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoriasCursosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Aproveitamento de Disciplinas */}
        <Card>
          <CardHeader>
            <CardTitle>Aproveitamento de Disciplinas</CardTitle>
            <CardDescription>Taxa de aprovação por disciplina</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { nome: "Matemática", aprovacao: 78 },
                    { nome: "Física", aprovacao: 65 },
                    { nome: "Programação", aprovacao: 85 },
                    { nome: "Biologia", aprovacao: 92 },
                    { nome: "História", aprovacao: 88 },
                  ]}
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="nome" type="category" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="aprovacao" fill="#8884d8" name="Taxa de Aprovação (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderFinanceiroReports = () => {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receita por Período */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Receita por Período</CardTitle>
            <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={receitaData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Bar dataKey="valor" fill="#4CAF50" name="Receita (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Distribuição de Receita por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Fonte</CardTitle>
            <CardDescription>Distribuição da receita por origem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { nome: 'Matrículas', valor: 60 },
                      { nome: 'Mensalidades', valor: 25 },
                      { nome: 'Material', valor: 8 },
                      { nome: 'Parceiros', valor: 5 },
                      { nome: 'Outros', valor: 2 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="nome"
                    label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoriasCursosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Distribuição de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Principais categorias de despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { nome: 'Pessoal', valor: 45 },
                      { nome: 'Infraestrutura', valor: 20 },
                      { nome: 'Marketing', valor: 15 },
                      { nome: 'Comissões', valor: 12 },
                      { nome: 'Outros', valor: 8 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="nome"
                    label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[...Array(5)].map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderInstituicoesReports = () => {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Instituições por Número de Polos */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Instituições por Número de Polos</CardTitle>
            <CardDescription>Distribuição de polos por instituição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={instituicoesPolosData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="polos" fill="#8884d8" name="Número de Polos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Instituições por Número de Alunos */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Instituições por Número de Alunos</CardTitle>
            <CardDescription>Distribuição de alunos por instituição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={instituicoesPolosData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="alunos" fill="#4CAF50" name="Número de Alunos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderParceirosReports = () => {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Indicações por Parceiro */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Indicações por Parceiro</CardTitle>
            <CardDescription>Número de alunos indicados por parceiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nome: "Parceiro A", indicacoes: 125 },
                    { nome: "Parceiro B", indicacoes: 98 },
                    { nome: "Parceiro C", indicacoes: 85 },
                    { nome: "Parceiro D", indicacoes: 65 },
                    { nome: "Parceiro E", indicacoes: 42 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="indicacoes" fill="#8884d8" name="Indicações" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2 ml-auto">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Comissões Pagas */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Comissões Pagas a Parceiros</CardTitle>
            <CardDescription>Evolução de comissões pagas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { mes: "Jan", valor: 12500 },
                    { mes: "Fev", valor: 14200 },
                    { mes: "Mar", valor: 16800 },
                    { mes: "Abr", valor: 15600 },
                    { mes: "Mai", valor: 17500 },
                    { mes: "Jun", valor: 19200 },
                    { mes: "Jul", valor: 22500 },
                    { mes: "Ago", valor: 24800 },
                    { mes: "Set", valor: 26500 },
                    { mes: "Out", valor: 28900 },
                    { mes: "Nov", valor: 32500 },
                    { mes: "Dez", valor: 30200 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#4CAF50"
                    activeDot={{ r: 8 }}
                    name="Comissões (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Cards de resumo com overview geral
  const renderSummaryCards = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.543</div>
            <p className="text-xs text-muted-foreground">
              +18% em relação ao ano anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">
              +5 cursos nos últimos 30 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas Ativas</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              85% com aprovação acima de 70%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Acumulada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.240.560</div>
            <p className="text-xs text-muted-foreground">
              +23% em relação ao mesmo período do ano anterior
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        items={getAdminSidebarItems("/admin/reports")} 
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Relatórios e Análises</h1>
                <p className="text-muted-foreground">
                  Visualize dados estatísticos de todas as áreas do sistema
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatórios
                </Button>
              </div>
            </div>

            {/* Cards de resumo */}
            {renderSummaryCards()}

            <Separator className="my-6" />

            {/* Abas para diferentes tipos de relatórios */}
            <Tabs defaultValue="academico" onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="academico" className="flex items-center">
                  <School className="h-4 w-4 mr-2" />
                  Acadêmico
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Financeiro
                </TabsTrigger>
                <TabsTrigger value="instituicoes" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Instituições
                </TabsTrigger>
                <TabsTrigger value="parceiros" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Parceiros
                </TabsTrigger>
              </TabsList>
              <TabsContent value="academico">
                {renderAcademicoReports()}
              </TabsContent>
              <TabsContent value="financeiro">
                {renderFinanceiroReports()}
              </TabsContent>
              <TabsContent value="instituicoes">
                {renderInstituicoesReports()}
              </TabsContent>
              <TabsContent value="parceiros">
                {renderParceirosReports()}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}