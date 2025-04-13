import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  ActivityIcon,
  BookOpenIcon,
  UsersIcon,
  GraduationCapIcon,
  BuildingIcon,
  HandshakeIcon,
  DollarSignIcon,
  TrendingUpIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AdminLayout from "@/components/layout/admin-layout";

// Dados simulados para os gráficos
const COLORS = ['#4CAF50', '#8884d8', '#FF8042', '#FFBB28', '#0088FE', '#00C49F', '#708090'];

const matriculasData = [
  { mes: 'Jan', quantidade: 150 },
  { mes: 'Fev', quantidade: 180 },
  { mes: 'Mar', quantidade: 220 },
  { mes: 'Abr', quantidade: 240 },
  { mes: 'Mai', quantidade: 210 },
  { mes: 'Jun', quantidade: 260 },
  { mes: 'Jul', quantidade: 270 },
  { mes: 'Ago', quantidade: 290 },
  { mes: 'Set', quantidade: 310 },
  { mes: 'Out', quantidade: 330 },
  { mes: 'Nov', quantidade: 360 },
  { mes: 'Dez', quantidade: 380 },
];

const receitaData = [
  { mes: 'Jan', valor: 25000 },
  { mes: 'Fev', valor: 30000 },
  { mes: 'Mar', valor: 35000 },
  { mes: 'Abr', valor: 40000 },
  { mes: 'Mai', valor: 38000 },
  { mes: 'Jun', valor: 42000 },
  { mes: 'Jul', valor: 45000 },
  { mes: 'Ago', valor: 48000 },
  { mes: 'Set', valor: 52000 },
  { mes: 'Out', valor: 55000 },
  { mes: 'Nov', valor: 60000 },
  { mes: 'Dez', valor: 65000 },
];

const categoriasCursosData = [
  { nome: 'Engenharia', valor: 35 },
  { nome: 'Administração', valor: 25 },
  { nome: 'Saúde', valor: 20 },
  { nome: 'TI', valor: 15 },
  { nome: 'Outros', valor: 5 },
];

const instituicoesPolosData = [
  { nome: 'UniA', polos: 12, alunos: 3500 },
  { nome: 'UniB', polos: 8, alunos: 2800 },
  { nome: 'UniC', polos: 5, alunos: 1900 },
  { nome: 'UniD', polos: 3, alunos: 1200 },
  { nome: 'UniE', polos: 2, alunos: 800 },
];

const parceiroIndicacoesData = [
  { nome: 'ConsultoriaA', indicacoes: 120 },
  { nome: 'ConsultoriaB', indicacoes: 85 },
  { nome: 'EscolaC', indicacoes: 60 },
  { nome: 'EmpresaD', indicacoes: 45 },
  { nome: 'AssociacaoE', indicacoes: 30 },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [academicPeriod, setAcademicPeriod] = useState("anual");
  const [financePeriod, setFinancePeriod] = useState("anual");
  const [partnersPeriod, setPartnersPeriod] = useState("anual");
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
            <Select value={academicPeriod} onValueChange={setAcademicPeriod}>
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
            <Select value={financePeriod} onValueChange={setFinancePeriod}>
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
                  data={parceiroIndicacoesData}
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
          <CardFooter className="flex justify-between">
            <Select value={partnersPeriod} onValueChange={setPartnersPeriod}>
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

        {/* Distribuição de Parceiros por Tipo */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de Parceiros por Tipo</CardTitle>
            <CardDescription>Categorias de parceiros na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { nome: 'Consultorias', valor: 45 },
                      { nome: 'Escolas', valor: 25 },
                      { nome: 'Empresas', valor: 20 },
                      { nome: 'Associações', valor: 10 },
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
                    {[...Array(4)].map((_, index) => (
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

  // Blocos resumo para o topo da página
  const cardItens = [
    {
      title: "Total de Alunos",
      value: "8.942",
      percentual: "+8.5%",
      aumento: true,
      color: "bg-green-100",
      icon: <UsersIcon className="h-5 w-5 text-green-600" />,
    },
    {
      title: "Cursos Ativos",
      value: "246",
      percentual: "+12.3%",
      aumento: true,
      color: "bg-blue-100",
      icon: <BookOpenIcon className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Receita Mensal",
      value: "R$ 358.000",
      percentual: "+5.2%",
      aumento: true,
      color: "bg-purple-100",
      icon: <DollarSignIcon className="h-5 w-5 text-purple-600" />,
    },
    {
      title: "Taxa de Conclusão",
      value: "78.5%",
      percentual: "-2.1%",
      aumento: false,
      color: "bg-orange-100",
      icon: <GraduationCapIcon className="h-5 w-5 text-orange-600" />,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Relatórios</h1>
            <p className="text-muted-foreground">
              Monitore as principais métricas e indicadores da plataforma
            </p>
          </div>
          
          {/* Menu Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>Relatórios</SheetTitle>
                <SheetDescription>
                  Selecione a categoria de relatórios que deseja visualizar
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Tabs 
                  defaultValue="academico"
                  className="w-full" 
                  onValueChange={setSelectedTab}
                  value={selectedTab}
                >
                  <TabsList className="grid grid-cols-2 gap-2 mb-4">
                    <TabsTrigger value="academico">Acadêmico</TabsTrigger>
                    <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                    <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
                    <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Cards resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {cardItens.map((card, i) => (
            <Card key={i}>
              <CardContent className="flex justify-between items-center p-6">
                <div>
                  <p className="text-sm font-medium">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                  <div className="flex items-center mt-1">
                    {card.aumento ? (
                      <ChevronUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={card.aumento ? "text-green-500 text-sm" : "text-red-500 text-sm"}>
                      {card.percentual}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">desde o mês anterior</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  {card.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs e conteúdo principal */}
        <div className="flex flex-col space-y-6">
          <Tabs 
            defaultValue="academico"
            className="w-full" 
            onValueChange={setSelectedTab}
            value={selectedTab}
          >
            <TabsList className="hidden lg:inline-flex mb-6">
              <TabsTrigger value="academico">Acadêmico</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
              <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
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
      </div>
    </AdminLayout>
  );
}