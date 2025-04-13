import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  ChartIcon,
  GroupIcon,
  ShowChartIcon,
  AccountBalanceIcon,
  EventNoteIcon,
  SettingsIcon,
  HelpOutlineIcon,
  StorefrontIcon,
  SchoolIcon,
  DownloadIcon,
  PrintIcon,
  RefreshIcon,
  DateRangeIcon,
  FilterIcon,
} from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PoloReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("last30days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Consulta para obter dados dos relatórios
  const { 
    data: reportsData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/polo/reports", searchTerm, courseFilter, statusFilter, dateFilter, startDate, endDate],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", 
          `/api/polo/reports?search=${searchTerm}&course=${courseFilter}&status=${statusFilter}&date=${dateFilter}&startDate=${startDate}&endDate=${endDate}`
        );
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        return {
          students: {
            total: 126,
            active: 98,
            inactive: 28,
            newThisMonth: 15,
            list: [
              { id: 1, name: "Ana Silva", email: "ana.silva@example.com", course: "Administração", status: "active", enrollmentDate: "2023-07-15", progress: 67 },
              { id: 2, name: "Carlos Oliveira", email: "carlos.oliveira@example.com", course: "Ciência da Computação", status: "active", enrollmentDate: "2023-05-22", progress: 82 },
              { id: 3, name: "Mariana Santos", email: "mariana.santos@example.com", course: "Pedagogia", status: "active", enrollmentDate: "2023-08-10", progress: 45 },
              { id: 4, name: "Roberto Alves", email: "roberto.alves@example.com", course: "Engenharia Civil", status: "inactive", enrollmentDate: "2023-03-05", progress: 23 },
              { id: 5, name: "Juliana Costa", email: "juliana.costa@example.com", course: "Psicologia", status: "active", enrollmentDate: "2023-09-01", progress: 12 },
              { id: 6, name: "Fernando Mendes", email: "fernando.mendes@example.com", course: "Direito", status: "active", enrollmentDate: "2023-06-18", progress: 78 },
              { id: 7, name: "Carla Ribeiro", email: "carla.ribeiro@example.com", course: "Medicina", status: "active", enrollmentDate: "2023-01-30", progress: 91 },
              { id: 8, name: "Paulo Santos", email: "paulo.santos@example.com", course: "Administração", status: "inactive", enrollmentDate: "2022-11-12", progress: 100 },
              { id: 9, name: "Amanda Ferreira", email: "amanda.ferreira@example.com", course: "Pedagogia", status: "active", enrollmentDate: "2023-04-20", progress: 34 },
              { id: 10, name: "Lucas Martins", email: "lucas.martins@example.com", course: "Ciência da Computação", status: "active", enrollmentDate: "2023-02-14", progress: 56 }
            ]
          },
          enrollment: {
            totalEnrollments: 150,
            completedEnrollments: 24,
            activeEnrollments: 98,
            inactiveEnrollments: 28,
            byMonth: [
              { month: "Jan", enrollments: 12 },
              { month: "Fev", enrollments: 15 },
              { month: "Mar", enrollments: 8 },
              { month: "Abr", enrollments: 10 },
              { month: "Mai", enrollments: 14 },
              { month: "Jun", enrollments: 18 },
              { month: "Jul", enrollments: 22 },
              { month: "Ago", enrollments: 15 },
              { month: "Set", enrollments: 12 },
              { month: "Out", enrollments: 10 },
              { month: "Nov", enrollments: 8 },
              { month: "Dez", enrollments: 6 }
            ]
          },
          financial: {
            totalRevenue: 240680.00,
            pendingPayments: 15320.00,
            completedPayments: 225360.00,
            byMonth: [
              { month: "Jan", revenue: 18500.00 },
              { month: "Fev", revenue: 19200.00 },
              { month: "Mar", revenue: 17800.00 },
              { month: "Abr", revenue: 18900.00 },
              { month: "Mai", revenue: 21500.00 },
              { month: "Jun", revenue: 22800.00 },
              { month: "Jul", revenue: 24100.00 },
              { month: "Ago", revenue: 23400.00 },
              { month: "Set", revenue: 22600.00 },
              { month: "Out", revenue: 19800.00 },
              { month: "Nov", revenue: 15900.00 },
              { month: "Dez", revenue: 16180.00 }
            ]
          },
          courses: {
            list: [
              { id: 1, name: "Administração", students: 32, revenue: 64000.00 },
              { id: 2, name: "Ciência da Computação", students: 28, revenue: 56000.00 },
              { id: 3, name: "Pedagogia", students: 15, revenue: 30000.00 },
              { id: 4, name: "Engenharia Civil", students: 12, revenue: 24000.00 },
              { id: 5, name: "Psicologia", students: 18, revenue: 36000.00 },
              { id: 6, name: "Direito", students: 10, revenue: 20000.00 },
              { id: 7, name: "Medicina", students: 5, revenue: 10000.00 },
            ]
          }
        };
      }
    },
  });

  // Consulta para obter cursos disponíveis para o filtro
  const { 
    data: coursesData, 
    isLoading: isLoadingCourses, 
  } = useQuery({
    queryKey: ["/api/polo/available-courses"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/polo/available-courses");
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        return [
          { id: 1, name: "Administração", status: "published" },
          { id: 2, name: "Ciência da Computação", status: "published" },
          { id: 3, name: "Pedagogia", status: "published" },
          { id: 4, name: "Engenharia Civil", status: "published" },
          { id: 5, name: "Psicologia", status: "published" },
          { id: 6, name: "Direito", status: "published" },
          { id: 7, name: "Medicina", status: "published" },
        ];
      }
    },
  });

  // Função para exportar relatório em CSV
  const exportReportCSV = () => {
    if (!reportsData || !reportsData.students || !reportsData.students.list) {
      toast({
        title: "Erro ao exportar",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar cabeçalhos e dados
    const headers = ["Nome", "Email", "Curso", "Status", "Data de Matrícula", "Progresso"];
    const csvRows = [
      headers.join(","),
      ...reportsData.students.list.map((student: any) => {
        const status = student.status === "active" ? "Ativo" : "Inativo";
        const date = new Date(student.enrollmentDate).toLocaleDateString("pt-BR");
        return [
          student.name,
          student.email,
          student.course,
          status,
          date,
          `${student.progress}%`
        ].join(",");
      })
    ];

    // Criar blob e link para download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_alunos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para imprimir relatório
  const printReport = () => {
    window.print();
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    refetch();
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setCourseFilter("all");
    setStatusFilter("all");
    setDateFilter("last30days");
    setStartDate("");
    setEndDate("");
    refetch();
  };

  // Função para formatar dinheiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments" },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/polo/reports", active: true },
    { name: "Configurações", icon: <SettingsIcon />, href: "/polo/settings" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/polo/support" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="polo"
        portalColor="#F79009"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8 print:py-2 print:px-2">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 print:hidden">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-gray-600">Informações detalhadas sobre alunos, matrículas e desempenho</p>
            </div>
            <div className="flex flex-wrap mt-4 md:mt-0 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={exportReportCSV}
              >
                <DownloadIcon className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={printReport}
              >
                <PrintIcon className="h-4 w-4" />
                Imprimir
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => refetch()}
              >
                <RefreshIcon className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6 print:hidden">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <Input 
                    id="search" 
                    placeholder="Nome, email..." 
                    className="w-full" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger id="course">
                      <SelectValue placeholder="Todos os cursos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cursos</SelectItem>
                      {!isLoadingCourses && coursesData?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="date">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                      <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                      <SelectItem value="last12months">Últimos 12 meses</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={applyFilters}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <FilterIcon className="h-4 w-4 mr-1" />
                    Filtrar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              
              {dateFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      className="w-full" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      className="w-full" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impressão: Cabeçalho */}
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold text-center">Relatório do Polo</h1>
            <p className="text-center text-gray-600">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            <div className="mt-2 text-center">
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-sm">{reportsData?.students?.total || 0} alunos no total</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erro ao carregar relatórios</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao tentar carregar os relatórios. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total de Alunos</p>
                        <h3 className="text-2xl font-bold mt-1">{reportsData?.students?.total || 0}</h3>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <GroupIcon className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                      <Badge className="mr-1 bg-green-100 text-green-800">
                        +{reportsData?.students?.newThisMonth || 0}
                      </Badge>
                      <span className="text-gray-600">novos este mês</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Matrículas</p>
                        <h3 className="text-2xl font-bold mt-1">{reportsData?.enrollment?.totalEnrollments || 0}</h3>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <SchoolIcon className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="mt-3 flex text-sm">
                      <div className="flex items-center">
                        <Badge className="bg-green-100 text-green-800 mr-1">
                          {reportsData?.enrollment?.activeEnrollments || 0}
                        </Badge>
                        <span className="text-gray-600 mr-3">ativas</span>
                      </div>
                      <div className="flex items-center">
                        <Badge className="bg-red-100 text-red-800 mr-1">
                          {reportsData?.enrollment?.inactiveEnrollments || 0}
                        </Badge>
                        <span className="text-gray-600">inativas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Receita Total</p>
                        <h3 className="text-2xl font-bold mt-1">{formatCurrency(reportsData?.financial?.totalRevenue || 0)}</h3>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <AccountBalanceIcon className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-3 flex text-sm">
                      <div className="flex items-center">
                        <Badge className="bg-green-100 text-green-800 mr-1">
                          {formatCurrency(reportsData?.financial?.completedPayments || 0)}
                        </Badge>
                        <span className="text-gray-600">recebido</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cursos Ativos</p>
                        <h3 className="text-2xl font-bold mt-1">{reportsData?.courses?.list.length || 0}</h3>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <MenuBookIcon className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm">
                      <span className="text-gray-600">
                        {Math.round(reportsData?.students?.total / (reportsData?.courses?.list.length || 1))} alunos/curso em média
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dados principais */}
              <Tabs defaultValue="students" className="print:hidden">
                <TabsList className="mb-4">
                  <TabsTrigger value="students">Alunos</TabsTrigger>
                  <TabsTrigger value="courses">Cursos</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                </TabsList>

                {/* Tabela de Alunos */}
                <TabsContent value="students">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lista de Alunos</CardTitle>
                      <CardDescription>
                        Total de {reportsData?.students?.total || 0} alunos, {reportsData?.students?.active || 0} ativos e {reportsData?.students?.inactive || 0} inativos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data de Matrícula</TableHead>
                            <TableHead>Progresso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportsData?.students?.list?.map((student: any) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>{student.course}</TableCell>
                              <TableCell>
                                {student.status === "active" ? (
                                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                                )}
                              </TableCell>
                              <TableCell>{new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={student.progress} className="h-2 w-20" />
                                  <span className="text-sm">{student.progress}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tabela de Cursos */}
                <TabsContent value="courses">
                  <Card>
                    <CardHeader>
                      <CardTitle>Desempenho por Curso</CardTitle>
                      <CardDescription>
                        Análise detalhada de alunos e receita por curso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Curso</TableHead>
                            <TableHead>Alunos</TableHead>
                            <TableHead>% do Total</TableHead>
                            <TableHead>Receita</TableHead>
                            <TableHead>% da Receita</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportsData?.courses?.list?.map((course: any) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">{course.name}</TableCell>
                              <TableCell>{course.students}</TableCell>
                              <TableCell>
                                {Math.round((course.students / reportsData.students.total) * 100)}%
                              </TableCell>
                              <TableCell>{formatCurrency(course.revenue)}</TableCell>
                              <TableCell>
                                {Math.round((course.revenue / reportsData.financial.totalRevenue) * 100)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tabela Financeira */}
                <TabsContent value="financial">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados Financeiros</CardTitle>
                      <CardDescription>
                        Receita acumulada: {formatCurrency(reportsData?.financial?.totalRevenue || 0)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Receita por Mês</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[300px] bg-gray-100 rounded flex items-center justify-center">
                                <p className="text-gray-500">Gráfico de receita mensal</p>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Matrículas por Mês</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[300px] bg-gray-100 rounded flex items-center justify-center">
                                <p className="text-gray-500">Gráfico de matrículas mensais</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Detalhamento Financeiro Mensal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mês</TableHead>
                                  <TableHead>Receita</TableHead>
                                  <TableHead>Matrículas</TableHead>
                                  <TableHead>Valor Médio</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {reportsData?.financial?.byMonth?.map((month: any, index: number) => (
                                  <TableRow key={month.month}>
                                    <TableCell className="font-medium">{month.month}</TableCell>
                                    <TableCell>{formatCurrency(month.revenue)}</TableCell>
                                    <TableCell>{reportsData?.enrollment?.byMonth[index]?.enrollments || 0}</TableCell>
                                    <TableCell>
                                      {formatCurrency(
                                        reportsData?.enrollment?.byMonth[index]?.enrollments 
                                          ? month.revenue / reportsData?.enrollment?.byMonth[index]?.enrollments 
                                          : 0
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Versão impressa: Tabela de Alunos */}
              <div className="hidden print:block mt-6">
                <h2 className="text-xl font-bold mb-2">Lista de Alunos</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Nome</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Curso</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Data de Matrícula</th>
                      <th className="text-left py-2">Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData?.students?.list?.map((student: any) => (
                      <tr key={student.id} className="border-b">
                        <td className="py-2 font-medium">{student.name}</td>
                        <td className="py-2">{student.email}</td>
                        <td className="py-2">{student.course}</td>
                        <td className="py-2">
                          {student.status === "active" ? "Ativo" : "Inativo"}
                        </td>
                        <td className="py-2">{new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2">{student.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2 className="text-xl font-bold mt-6 mb-2">Desempenho por Curso</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Curso</th>
                      <th className="text-left py-2">Alunos</th>
                      <th className="text-left py-2">% do Total</th>
                      <th className="text-left py-2">Receita</th>
                      <th className="text-left py-2">% da Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData?.courses?.list?.map((course: any) => (
                      <tr key={course.id} className="border-b">
                        <td className="py-2 font-medium">{course.name}</td>
                        <td className="py-2">{course.students}</td>
                        <td className="py-2">
                          {Math.round((course.students / reportsData.students.total) * 100)}%
                        </td>
                        <td className="py-2">{formatCurrency(course.revenue)}</td>
                        <td className="py-2">
                          {Math.round((course.revenue / reportsData.financial.totalRevenue) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}