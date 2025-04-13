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
  StorefrontIcon,
  SchoolIcon,
  FilterIcon,
  SearchIcon,
  MailIcon,
  PhoneIcon,
  ListBulletedIcon,
  FilterAltIcon,
  EyeIcon,
  DownloadIcon,
  WhatsAppIcon,
  MenuBookIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Interface para os estudantes
interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  enrollmentDate: string;
  status: "active" | "inactive" | "completed" | "pending_payment";
  courseName: string;
  courseProgress: number;
  nextBillingDate?: string;
  lastPaymentDate?: string;
  paymentStatus?: "paid" | "pending" | "overdue";
  lastLogin?: string;
}

export default function PoloStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  
  // Estado para modais
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);

  // Consulta para listar alunos
  const { 
    data: studentsData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/polo/students", searchTerm, statusFilter, courseFilter],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/polo/students?search=${searchTerm}&status=${statusFilter}&course=${courseFilter}`);
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        const mockStudents: Student[] = [
          {
            id: 1,
            name: "Ana Silva",
            email: "ana.silva@example.com",
            phone: "(11) 98765-4321",
            enrollmentDate: "2023-07-15",
            status: "active",
            courseName: "Administração",
            courseProgress: 67,
            nextBillingDate: "2023-11-15",
            lastPaymentDate: "2023-10-15",
            paymentStatus: "paid",
            lastLogin: "2023-10-22"
          },
          {
            id: 2,
            name: "Carlos Oliveira",
            email: "carlos.oliveira@example.com",
            phone: "(11) 97654-3210",
            enrollmentDate: "2023-05-22",
            status: "active",
            courseName: "Ciência da Computação",
            courseProgress: 82,
            nextBillingDate: "2023-11-22",
            lastPaymentDate: "2023-10-22",
            paymentStatus: "paid",
            lastLogin: "2023-10-20"
          },
          {
            id: 3,
            name: "Mariana Santos",
            email: "mariana.santos@example.com",
            phone: "(11) 91234-5678",
            enrollmentDate: "2023-08-10",
            status: "active",
            courseName: "Pedagogia",
            courseProgress: 45,
            nextBillingDate: "2023-11-10",
            lastPaymentDate: "2023-10-10",
            paymentStatus: "paid",
            lastLogin: "2023-10-18"
          },
          {
            id: 4,
            name: "Roberto Alves",
            email: "roberto.alves@example.com",
            phone: "(11) 98876-5432",
            enrollmentDate: "2023-03-05",
            status: "inactive",
            courseName: "Engenharia Civil",
            courseProgress: 23,
            nextBillingDate: "2023-11-05",
            lastPaymentDate: "2023-09-05",
            paymentStatus: "overdue",
            lastLogin: "2023-09-20"
          },
          {
            id: 5,
            name: "Juliana Costa",
            email: "juliana.costa@example.com",
            phone: "(11) 94567-8901",
            enrollmentDate: "2023-09-01",
            status: "pending_payment",
            courseName: "Psicologia",
            courseProgress: 12,
            nextBillingDate: "2023-11-01",
            lastPaymentDate: "2023-09-01",
            paymentStatus: "pending",
            lastLogin: "2023-10-10"
          },
          {
            id: 6,
            name: "Fernando Mendes",
            email: "fernando.mendes@example.com",
            phone: "(11) 93456-7890",
            enrollmentDate: "2023-06-18",
            status: "active",
            courseName: "Direito",
            courseProgress: 78,
            nextBillingDate: "2023-11-18",
            lastPaymentDate: "2023-10-18",
            paymentStatus: "paid",
            lastLogin: "2023-10-21"
          },
          {
            id: 7,
            name: "Carla Ribeiro",
            email: "carla.ribeiro@example.com",
            phone: "(11) 92345-6789",
            enrollmentDate: "2023-01-30",
            status: "active",
            courseName: "Medicina",
            courseProgress: 91,
            nextBillingDate: "2023-11-30",
            lastPaymentDate: "2023-10-30",
            paymentStatus: "paid",
            lastLogin: "2023-10-23"
          },
          {
            id: 8,
            name: "Paulo Santos",
            email: "paulo.santos@example.com",
            phone: "(11) 99876-5432",
            enrollmentDate: "2022-11-12",
            status: "completed",
            courseName: "Administração",
            courseProgress: 100,
            nextBillingDate: undefined,
            lastPaymentDate: "2023-10-12",
            paymentStatus: "paid",
            lastLogin: "2023-10-15"
          }
        ];

        // Filtrar alunos simulados baseado nos filtros
        let filteredStudents = [...mockStudents];
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredStudents = filteredStudents.filter(student => 
            student.name.toLowerCase().includes(searchLower) || 
            student.email.toLowerCase().includes(searchLower) ||
            student.phone.includes(searchTerm)
          );
        }
        
        if (statusFilter !== "all") {
          filteredStudents = filteredStudents.filter(student => student.status === statusFilter);
        }
        
        if (courseFilter !== "all") {
          filteredStudents = filteredStudents.filter(student => student.courseName.toLowerCase() === courseFilter.toLowerCase());
        }
        
        return {
          students: filteredStudents,
          total: mockStudents.length,
          filtered: filteredStudents.length,
          courses: ["Administração", "Ciência da Computação", "Pedagogia", "Engenharia Civil", "Psicologia", "Direito", "Medicina"]
        };
      }
    },
  });

  // Funções de ação
  const handleViewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentDetailsOpen(true);
  };

  const handleContactStudent = (student: Student, method: 'email' | 'phone' | 'whatsapp') => {
    switch (method) {
      case 'email':
        window.open(`mailto:${student.email}`, '_blank');
        break;
      case 'phone':
        window.open(`tel:${student.phone}`, '_blank');
        break;
      case 'whatsapp':
        // Limpar o número, remover caracteres não numéricos
        const cleanPhone = student.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        break;
    }
  };

  const handleDownloadCertificate = (studentId: number) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O download de certificados estará disponível em breve.",
    });
  };

  // Função para renderizar o status com cores
  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-100 text-yellow-800">Pagamento Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Função para renderizar o status de pagamento com cores
  const renderPaymentStatus = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments" },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students", active: true },
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
              <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
              <p className="text-gray-600">Gerencie os alunos vinculados ao seu polo</p>
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
                      placeholder="Buscar por nome, email ou telefone..." 
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
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="completed">Concluídos</SelectItem>
                      <SelectItem value="pending_payment">Pagamento Pendente</SelectItem>
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
                      {studentsData?.courses?.map((course: string) => (
                        <SelectItem key={course} value={course.toLowerCase()}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="flex items-center gap-1"
                  >
                    <ListBulletedIcon className="h-4 w-4" />
                    Tabela
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="flex items-center gap-1"
                  >
                    <GroupIcon className="h-4 w-4" />
                    Cards
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCourseFilter("all");
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

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar alunos</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao tentar carregar a lista de alunos. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : studentsData?.students?.length === 0 ? (
            <div className="text-center py-12">
              <GroupIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum aluno encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar seus filtros ou aguarde novas matrículas.
              </p>
            </div>
          ) : (
            <>
              {/* Exibição do número total */}
              <div className="text-sm text-gray-500 mb-4">
                Exibindo {studentsData?.filtered} de {studentsData?.total} alunos
              </div>

              {/* Tabela de Alunos */}
              {viewMode === "table" && (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Data de Matrícula</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progresso</TableHead>
                          <TableHead>Status de Pagamento</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentsData?.students?.map((student: Student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={student.avatar} />
                                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{student.courseName}</TableCell>
                            <TableCell>{new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{renderStatus(student.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={student.courseProgress} className="h-2 w-20" />
                                <span className="text-sm">{student.courseProgress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{renderPaymentStatus(student.paymentStatus)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleContactStudent(student, 'email')}
                                >
                                  <MailIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleContactStudent(student, 'whatsapp')}
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleViewStudentDetails(student)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Cards de Alunos */}
              {viewMode === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsData?.students?.map((student: Student) => (
                    <Card key={student.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{student.name}</CardTitle>
                              <CardDescription className="text-xs">{student.email}</CardDescription>
                            </div>
                          </div>
                          <div>{renderStatus(student.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Curso:</span>
                            <span className="font-medium">{student.courseName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Matrícula:</span>
                            <span>{new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Progresso:</span>
                            <div className="flex items-center gap-2">
                              <Progress value={student.courseProgress} className="h-2 w-16" />
                              <span>{student.courseProgress}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Pagamento:</span>
                            <span>{renderPaymentStatus(student.paymentStatus)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleContactStudent(student, 'email')}
                          >
                            <MailIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleContactStudent(student, 'whatsapp')}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleContactStudent(student, 'phone')}
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStudentDetails(student)}
                          className="text-orange-500 border-orange-500 hover:bg-orange-50"
                        >
                          Ver Detalhes
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Dialog de Detalhes do Aluno */}
          {selectedStudent && (
            <Dialog open={isStudentDetailsOpen} onOpenChange={setIsStudentDetailsOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">Detalhes do Aluno</DialogTitle>
                  <DialogDescription>
                    Informações completas e histórico do aluno
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="md:w-1/3">
                      <div className="flex flex-col items-center">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={selectedStudent.avatar} />
                          <AvatarFallback className="text-xl">{getInitials(selectedStudent.name)}</AvatarFallback>
                        </Avatar>
                        <h3 className="mt-2 font-semibold text-lg">{selectedStudent.name}</h3>
                        <div className="mt-1">{renderStatus(selectedStudent.status)}</div>
                        <div className="mt-2 flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleContactStudent(selectedStudent, 'email')}
                          >
                            <MailIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleContactStudent(selectedStudent, 'whatsapp')}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleContactStudent(selectedStudent, 'phone')}
                          >
                            <PhoneIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-2/3">
                      <Tabs defaultValue="info">
                        <TabsList className="w-full">
                          <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
                          <TabsTrigger value="course" className="flex-1">Curso</TabsTrigger>
                          <TabsTrigger value="financial" className="flex-1">Financeiro</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info" className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Email</label>
                              <p>{selectedStudent.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Telefone</label>
                              <p>{selectedStudent.phone}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Data de Matrícula</label>
                              <p>{new Date(selectedStudent.enrollmentDate).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Último Acesso</label>
                              <p>{selectedStudent.lastLogin ? new Date(selectedStudent.lastLogin).toLocaleDateString("pt-BR") : "N/A"}</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="course" className="mt-4 space-y-3">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Curso</label>
                              <p className="font-medium">{selectedStudent.courseName}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Progresso do Curso</label>
                              <div className="mt-1 flex items-center gap-3">
                                <Progress 
                                  value={selectedStudent.courseProgress} 
                                  className="h-2 flex-1" 
                                />
                                <span className="font-medium">{selectedStudent.courseProgress}%</span>
                              </div>
                            </div>
                            {selectedStudent.courseProgress >= 100 && (
                              <div className="mt-2">
                                <Button 
                                  className="flex items-center gap-1"
                                  onClick={() => handleDownloadCertificate(selectedStudent.id)}
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                  Baixar Certificado
                                </Button>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="financial" className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Status de Pagamento</label>
                              <p>{renderPaymentStatus(selectedStudent.paymentStatus)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Último Pagamento</label>
                              <p>{selectedStudent.lastPaymentDate ? new Date(selectedStudent.lastPaymentDate).toLocaleDateString("pt-BR") : "N/A"}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Próximo Vencimento</label>
                              <p>{selectedStudent.nextBillingDate ? new Date(selectedStudent.nextBillingDate).toLocaleDateString("pt-BR") : "N/A"}</p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsStudentDetailsOpen(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}