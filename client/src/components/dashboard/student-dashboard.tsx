import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartIcon,
  SchoolIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  WavingHandIcon,
  TrendingUpIcon,
  AssignmentIcon,
  GroupIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function StudentDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/student"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar items for student portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, active: true, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, href: "/student/courses" },
    { name: "Progresso", icon: <TrendingUpIcon />, href: "/student/learning" },
    { name: "Credencial", icon: <SchoolIcon />, href: "/student/credencial" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Biblioteca", icon: <AssignmentIcon />, href: "/student/library" },
    { name: "Secretaria", icon: <GroupIcon />, href: "/student/secretaria" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Aluno</h1>
            <p className="text-gray-600">Bem-vindo(a) de volta{user ? `, ${user.fullName}` : ''}! Aqui está um resumo da sua conta.</p>
          </div>

          {/* Welcome Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
                  <WavingHandIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Olá, {user?.fullName?.split(' ')[0] || 'Aluno'}!</h2>
                  <p className="text-gray-600">
                    {isLoading ? (
                      <Skeleton className="h-4 w-52 mt-1" />
                    ) : (
                      "Você tem 3 atividades pendentes essa semana."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Progresso Geral</h3>
                  <TrendingUpIcon className="text-primary h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">78%</p>
                    <Progress value={78} className="h-2.5 mt-2" />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Cursos Ativos</h3>
                  <SchoolIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">3 cursos</p>
                    <p className="text-gray-600 text-sm mt-2">2 em andamento, 1 não iniciado</p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Próximo Vencimento</h3>
                  <CalendarIcon className="text-orange-500 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-28 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">15/07/2023</p>
                    <p className="text-gray-600 text-sm mt-2">Mensalidade: R$ 197,00</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Courses Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Meus Cursos</h2>
              <Button variant="link" className="text-sm text-primary">Ver todos</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i}>
                    <div className="h-36 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-32 mb-3" />
                      <Skeleton className="h-2 w-full mb-3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <>
                  <Card className="overflow-hidden">
                    <div className="h-36 bg-primary-light flex items-center justify-center">
                      <MenuBookIcon className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">Administração de Empresas</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Duração: 12 meses</span>
                      </div>
                      <Progress value={65} className="h-2 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progresso: 65%</span>
                        <Button variant="link" className="p-0 h-auto text-primary">Continuar</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="h-36 bg-green-200 flex items-center justify-center">
                      <MenuBookIcon className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">Desenvolvimento Web</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Duração: 6 meses</span>
                      </div>
                      <Progress value={25} className="h-2 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progresso: 25%</span>
                        <Button variant="link" className="p-0 h-auto text-primary">Continuar</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="h-36 bg-orange-200 flex items-center justify-center">
                      <MenuBookIcon className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">Gestão de Projetos</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Duração: 4 meses</span>
                      </div>
                      <Progress value={0} className="h-2 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Não iniciado</span>
                        <Button variant="link" className="p-0 h-auto text-primary">Começar</Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Calendar & Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Próximos Eventos</CardTitle>
                  <Button variant="link" className="text-sm text-primary p-0">Ver calendário</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start mb-4">
                      <Skeleton className="h-10 w-10 rounded flex-shrink-0 mr-4" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start border-l-4 border-primary pl-4 py-1">
                      <div className="w-10 h-10 rounded bg-primary-light/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <CalendarIcon className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Prova Final - Módulo 3</h3>
                        <p className="text-gray-500 text-sm">Hoje, 19:00 - 21:00</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start border-l-4 border-green-500 pl-4 py-1">
                      <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <GroupIcon className="text-green-600 h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Webinar: Tendências de Mercado</h3>
                        <p className="text-gray-500 text-sm">Amanhã, 15:00 - 16:30</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start border-l-4 border-orange-500 pl-4 py-1">
                      <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <AssignmentIcon className="text-orange-500 h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Entrega de Trabalho</h3>
                        <p className="text-gray-500 text-sm">20/07/2023, 23:59</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Avisos</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                ) : (
                  <>
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-4">
                        <div className="pb-4 border-b border-gray-200">
                          <h3 className="font-medium text-gray-900 mb-1">Manutenção Programada</h3>
                          <p className="text-gray-600 text-sm mb-1">O sistema ficará indisponível no dia 10/07 das 02:00 às 04:00.</p>
                          <p className="text-gray-500 text-xs">03/07/2023</p>
                        </div>
                        
                        <div className="pb-4 border-b border-gray-200">
                          <h3 className="font-medium text-gray-900 mb-1">Novos Cursos Disponíveis</h3>
                          <p className="text-gray-600 text-sm mb-1">Confira os novos cursos de Marketing Digital e UX/UI.</p>
                          <p className="text-gray-500 text-xs">28/06/2023</p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">Atualização da Plataforma</h3>
                          <p className="text-gray-600 text-sm mb-1">Novos recursos disponíveis! Confira as novidades.</p>
                          <p className="text-gray-500 text-xs">15/06/2023</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
