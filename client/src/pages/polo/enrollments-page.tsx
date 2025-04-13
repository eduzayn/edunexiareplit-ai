import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChartIcon,
  GroupIcon,
  ShowChartIcon,
  AccountBalanceIcon,
  EventNoteIcon,
  SettingsIcon,
  HelpOutlineIcon,
  SchoolIcon,
  StorefrontIcon,
  FilterIcon,
  SearchIcon,
  CalendarIcon,
  PlusCircleIcon,
  DownloadIcon,
  EyeIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon,
  CheckCircleIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface para matrícula
interface Enrollment {
  id: number;
  code: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  status: "pending_payment" | "active" | "completed" | "cancelled" | "inactive";
  enrollmentDate: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "overdue" | "cancelled";
  paymentDueDate?: string;
  documentsStatus: "pending" | "incomplete" | "complete";
  hasContract: boolean;
}

// Status formatados em português
const statusLabels: Record<string, string> = {
  "pending_payment": "Pagamento Pendente",
  "active": "Ativa",
  "completed": "Concluída",
  "cancelled": "Cancelada",
  "inactive": "Inativa",
  "paid": "Pago",
  "pending": "Pendente",
  "overdue": "Atrasado",
  "complete": "Completa",
  "incomplete": "Incompleta"
};

export default function PoloEnrollmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  // Modal states
  const [isNewEnrollmentOpen, setIsNewEnrollmentOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEnrollmentDetailsOpen, setIsEnrollmentDetailsOpen] = useState(false);
  const [isGenerateDocumentOpen, setIsGenerateDocumentOpen] = useState(false);

  // Consulta para listar matrículas
  const { 
    data: enrollmentsData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/polo/enrollments", searchTerm, statusFilter, courseFilter, dateFilter],
    queryFn: async () => {
      try {
        const res = await apiRequest(
          "GET", 
          `/api/polo/enrollments?search=${searchTerm}&status=${statusFilter}&course=${courseFilter}&date=${dateFilter}`
        );
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar matrículas:", error);
        throw new Error("Não foi possível carregar as matrículas. Tente novamente mais tarde.");
      }
    },
  });

  // Consulta para listar cursos disponíveis
  const { data: coursesData } = useQuery({
    queryKey: ["/api/polo/available-courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/polo/available-courses");
      return await res.json();
    },
  });

  // Funções de ação
  const handleViewDetails = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setIsEnrollmentDetailsOpen(true);
  };

  const handleGenerateDocument = (enrollment: Enrollment, documentType: string) => {
    setSelectedEnrollment(enrollment);
    setIsGenerateDocumentOpen(true);
    
    // Na implementação real, aqui faria a requisição para gerar o documento
    toast({
      title: "Gerando documento",
      description: `Preparando ${documentType} para ${enrollment.studentName}`,
    });
  };

  const handlePaymentStatus = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleEnrollmentStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-100 text-yellow-800">Pgto. Pendente</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluída</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inativa</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleDocumentStatus = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800">Completa</Badge>;
      case "incomplete":
        return <Badge className="bg-yellow-100 text-yellow-800">Incompleta</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments", active: true },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/polo/reports" },
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
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
              <p className="text-gray-600">Gerencie as matrículas de alunos do seu polo</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
                onClick={() => navigate("/polo/enrollments/new")}
              >
                <PlusCircleIcon className="h-4 w-4" />
                Nova Matrícula
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input 
                      placeholder="Buscar por nome, código ou email..." 
                      className="pl-10" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="pending_payment">Pagamento Pendente</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cursos</SelectItem>
                      {coursesData?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <div className="flex items-center">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="last3months">Últimos 3 meses</SelectItem>
                      <SelectItem value="last6months">Últimos 6 meses</SelectItem>
                      <SelectItem value="last12months">Últimos 12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCourseFilter("all");
                      setDateFilter("all");
                    }}
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => refetch()}
                    className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1"
                  >
                    <FilterIcon className="h-4 w-4" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Matrículas
                  {enrollmentsData?.total && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({enrollmentsData.filtered} de {enrollmentsData.total})
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <DownloadIcon className="h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : isError ? (
                <div className="p-6 text-center">
                  <AlertCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-600">Ocorreu um erro ao carregar as matrículas</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => refetch()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : enrollmentsData?.enrollments?.length === 0 ? (
                <div className="p-6 text-center">
                  <SchoolIcon className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma matrícula encontrada</p>
                  <Button 
                    className="mt-2 bg-orange-500 hover:bg-orange-600"
                    onClick={() => navigate("/polo/enrollments/new")}
                  >
                    Criar Nova Matrícula
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data da Matrícula</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Documentos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentsData?.enrollments?.map((enrollment: Enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{enrollment.studentName}</span>
                              <span className="text-xs text-gray-500">{enrollment.studentEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>{enrollment.courseName}</TableCell>
                          <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                          <TableCell>{formatCurrency(enrollment.amount)}</TableCell>
                          <TableCell>{handleEnrollmentStatus(enrollment.status)}</TableCell>
                          <TableCell>{handlePaymentStatus(enrollment.paymentStatus)}</TableCell>
                          <TableCell>{handleDocumentStatus(enrollment.documentsStatus)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewDetails(enrollment)}
                                title="Ver detalhes"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleGenerateDocument(enrollment, "Contrato")}
                                title="Documentos"
                              >
                                <FileTextIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalhes da Matrícula */}
      {selectedEnrollment && (
        <Dialog open={isEnrollmentDetailsOpen} onOpenChange={setIsEnrollmentDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SchoolIcon className="h-5 w-5 text-orange-500" />
                Detalhes da Matrícula
              </DialogTitle>
              <DialogDescription>
                Código da matrícula: {selectedEnrollment.code}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="info">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="info">Informações Gerais</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Dados do Aluno</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Nome:</span>
                          <p className="font-medium">{selectedEnrollment.studentName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <p>{selectedEnrollment.studentEmail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500">Dados do Curso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Nome do Curso:</span>
                          <p className="font-medium">{selectedEnrollment.courseName}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Status da Matrícula:</span>
                          <p>{handleEnrollmentStatus(selectedEnrollment.status)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Cronologia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="w-0.5 h-full bg-gray-200"></div>
                        </div>
                        <div>
                          <p className="font-medium">Matrícula Criada</p>
                          <p className="text-sm text-gray-500">{formatDate(selectedEnrollment.enrollmentDate)}</p>
                          <p className="text-sm mt-1">Matrícula registrada no sistema pelo polo</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileTextIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="w-0.5 h-full bg-gray-200"></div>
                        </div>
                        <div>
                          <p className="font-medium">Documentos Enviados</p>
                          <p className="text-sm text-gray-500">{formatDate(selectedEnrollment.enrollmentDate)}</p>
                          <p className="text-sm mt-1">Envio de documentação {selectedEnrollment.documentsStatus}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <ClockIcon className="h-4 w-4 text-yellow-600" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Status Atual</p>
                          <p className="text-sm text-gray-500">
                            Matrícula {statusLabels[selectedEnrollment.status]} | 
                            Documentos {statusLabels[selectedEnrollment.documentsStatus]} | 
                            Pagamento {statusLabels[selectedEnrollment.paymentStatus]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="financial" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Informações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Valor Total:</span>
                        <p className="font-medium">{formatCurrency(selectedEnrollment.amount)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Método de Pagamento:</span>
                        <p className="font-medium">{selectedEnrollment.paymentMethod}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status do Pagamento:</span>
                        <p>{handlePaymentStatus(selectedEnrollment.paymentStatus)}</p>
                      </div>
                    </div>
                    {selectedEnrollment.paymentDueDate && (
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">Próximo Vencimento:</span>
                        <p className="font-medium">{formatDate(selectedEnrollment.paymentDueDate)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Ações Financeiras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => {
                          toast({
                            title: "Gerando boleto",
                            description: "Boleto sendo gerado para envio ao aluno",
                          });
                        }}
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Gerar Boleto
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => {
                          toast({
                            title: "Gerando recibo",
                            description: "Recibo sendo gerado para envio ao aluno",
                          });
                        }}
                      >
                        <FileTextIcon className="h-4 w-4" />
                        Gerar Recibo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Documentos da Matrícula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <FileTextIcon className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">Contrato de Matrícula</p>
                            <p className="text-xs text-gray-500">Gerado em {formatDate(selectedEnrollment.enrollmentDate)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGenerateDocument(selectedEnrollment, "Contrato")}
                        >
                          Baixar
                        </Button>
                      </div>
                      
                      {selectedEnrollment.hasContract && (
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            <FileTextIcon className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">Contrato Assinado</p>
                              <p className="text-xs text-gray-500">Enviado pelo aluno</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Visualizando contrato",
                                description: "Abrindo contrato assinado pelo aluno",
                              });
                            }}
                          >
                            Visualizar
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <FileTextIcon className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Declaração de Matrícula</p>
                            <p className="text-xs text-gray-500">Disponível para geração</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGenerateDocument(selectedEnrollment, "Declaração")}
                        >
                          Gerar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Documentação do Aluno</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Documento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>RG / CPF</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Enviado</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Visualizando documento",
                                  description: "Abrindo documento do aluno",
                                });
                              }}
                            >
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Comprovante de Residência</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Notificação enviada",
                                  description: "Notificação enviada ao aluno para envio do documento",
                                });
                              }}
                            >
                              Solicitar
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Histórico Escolar</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Notificação enviada",
                                  description: "Notificação enviada ao aluno para reenvio do documento",
                                });
                              }}
                            >
                              Solicitar Novamente
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEnrollmentDetailsOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal para geração de documentos */}
      {selectedEnrollment && (
        <Dialog open={isGenerateDocumentOpen} onOpenChange={setIsGenerateDocumentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Documento</DialogTitle>
              <DialogDescription>
                Escolha o tipo de documento para gerar para {selectedEnrollment.studentName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setIsGenerateDocumentOpen(false);
                  toast({
                    title: "Contrato Gerado",
                    description: "O contrato foi gerado e está disponível para download",
                  });
                }}
              >
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Contrato de Matrícula</p>
                    <p className="text-xs text-gray-500">Documento oficial para assinatura</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setIsGenerateDocumentOpen(false);
                  toast({
                    title: "Declaração Gerada",
                    description: "A declaração foi gerada e está disponível para download",
                  });
                }}
              >
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Declaração de Matrícula</p>
                    <p className="text-xs text-gray-500">Para fins de comprovação</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setIsGenerateDocumentOpen(false);
                  toast({
                    title: "Boleto Gerado",
                    description: "O boleto foi gerado e está disponível para download",
                  });
                }}
              >
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Boleto de Pagamento</p>
                    <p className="text-xs text-gray-500">Para pagamento da matrícula</p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsGenerateDocumentOpen(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}