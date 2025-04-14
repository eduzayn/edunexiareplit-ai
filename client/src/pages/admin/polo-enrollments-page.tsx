import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
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
  LinkIcon,
  CopyIcon,
  MailIcon,
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
  paymentUrl?: string; // Link para pagamento
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

export default function AdminPoloEnrollmentsPage() {
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

  // Consulta para listar matrículas - Note que usamos a rota de admin
  const { 
    data: enrollmentsData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/admin/polo-enrollments", searchTerm, statusFilter, courseFilter, dateFilter],
    queryFn: async () => {
      try {
        const res = await apiRequest(
          "GET", 
          `/api/admin/polo-enrollments?search=${searchTerm}&status=${statusFilter}&course=${courseFilter}&date=${dateFilter}`
        );
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar matrículas:", error);
        throw new Error("Não foi possível carregar as matrículas. Tente novamente mais tarde.");
      }
    },
  });

  // Consulta para listar cursos disponíveis - Note que usamos a rota de admin
  const { data: coursesData } = useQuery({
    queryKey: ["/api/admin/available-courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/available-courses");
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
  
  // Funções para manipulação de link de pagamento
  const handleCopyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link copiado!",
          description: "O link de pagamento foi copiado para a área de transferência",
        });
      })
      .catch((error) => {
        console.error("Erro ao copiar link:", error);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive",
        });
      });
  };
  
  const handleSendPaymentLinkByEmail = (enrollment: Enrollment) => {
    if (!enrollment.paymentUrl) {
      toast({
        title: "Link indisponível",
        description: "Não há link de pagamento disponível para esta matrícula.",
        variant: "destructive",
      });
      return;
    }
    
    // Na implementação real, aqui faria a requisição para enviar o email - usando rota de admin
    apiRequest("POST", `/api/admin/polo-enrollments/${enrollment.id}/send-payment-link`, {
      studentEmail: enrollment.studentEmail,
      paymentUrl: enrollment.paymentUrl
    })
      .then(async (response) => {
        if (response.ok) {
          toast({
            title: "Email enviado com sucesso",
            description: `Link de pagamento enviado para ${enrollment.studentEmail}`,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao enviar email");
        }
      })
      .catch((error) => {
        console.error("Erro ao enviar email:", error);
        toast({
          title: "Erro ao enviar email",
          description: error.message || "Não foi possível enviar o email. Tente novamente.",
          variant: "destructive",
        });
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={getAdminSidebarItems(location || "")}
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Matrículas (Interface Polo)</h1>
              <p className="text-gray-600">Gerencie as matrículas de alunos usando a interface do polo</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                onClick={() => navigate("/admin/enrollments/new")}
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
                    className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
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
                <div className="p-8 text-center">
                  <AlertCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Erro ao carregar matrículas</h3>
                  <p className="mt-1 text-sm text-gray-500">Não foi possível carregar os dados. Tente novamente mais tarde.</p>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : enrollmentsData?.enrollments?.length === 0 ? (
                <div className="p-8 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma matrícula encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Não foram encontradas matrículas com os filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentsData?.enrollments?.map((enrollment: Enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">{enrollment.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>{enrollment.studentName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{enrollment.studentName}</div>
                                <div className="text-xs text-gray-500">{enrollment.studentEmail}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{enrollment.courseName}</TableCell>
                          <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                          <TableCell>{handleEnrollmentStatus(enrollment.status)}</TableCell>
                          <TableCell>{handlePaymentStatus(enrollment.paymentStatus)}</TableCell>
                          <TableCell>{formatCurrency(enrollment.amount)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleViewDetails(enrollment)}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                              {enrollment.paymentUrl && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCopyPaymentLink(enrollment.paymentUrl!)}
                                  >
                                    <span className="sr-only">Copiar link</span>
                                    <CopyIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleSendPaymentLinkByEmail(enrollment)}
                                  >
                                    <span className="sr-only">Enviar por email</span>
                                    <MailIcon className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {enrollment.hasContract && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleGenerateDocument(enrollment, 'contrato')}
                                >
                                  <span className="sr-only">Ver contrato</span>
                                  <FileTextIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between p-4">
              <div className="text-sm text-gray-500">
                Mostrando {enrollmentsData?.enrollments?.length || 0} de {enrollmentsData?.total || 0} resultados
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!enrollmentsData?.previousPage}
                  onClick={() => {
                    // Implementar paginação
                  }}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!enrollmentsData?.nextPage}
                  onClick={() => {
                    // Implementar paginação
                  }}
                >
                  Próxima
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Diálogos para detalhes e outras ações */}
      {/* Exemplo de diálogo de detalhes */}
      <Dialog open={isEnrollmentDetailsOpen} onOpenChange={setIsEnrollmentDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Matrícula</DialogTitle>
            <DialogDescription>
              Informações completas sobre a matrícula
            </DialogDescription>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Código</p>
                  <p>{selectedEnrollment.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p>{handleEnrollmentStatus(selectedEnrollment.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Aluno</p>
                  <p>{selectedEnrollment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{selectedEnrollment.studentEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Curso</p>
                  <p>{selectedEnrollment.courseName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data</p>
                  <p>{formatDate(selectedEnrollment.enrollmentDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p>{formatCurrency(selectedEnrollment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Método</p>
                  <p>{selectedEnrollment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status do Pagamento</p>
                  <p>{handlePaymentStatus(selectedEnrollment.paymentStatus)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Documentação</p>
                  <p>{handleDocumentStatus(selectedEnrollment.documentsStatus)}</p>
                </div>
              </div>
              
              {selectedEnrollment.paymentUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Link de Pagamento</p>
                  <div className="flex items-center mt-1">
                    <Input value={selectedEnrollment.paymentUrl} readOnly className="flex-1" />
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => handleCopyPaymentLink(selectedEnrollment.paymentUrl!)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollmentDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedEnrollment?.hasContract && (
              <Button onClick={() => handleGenerateDocument(selectedEnrollment, 'contrato')}>
                Ver Contrato
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}