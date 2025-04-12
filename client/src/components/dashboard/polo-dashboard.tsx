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
  CardFooter,
} from "@/components/ui/card";
import {
  ChartIcon,
  GroupIcon,
  ShowChartIcon,
  AccountBalanceIcon,
  EventNoteIcon,
  SettingsIcon,
  HelpOutlineIcon,
  TrendingUpIcon,
  MapPinIcon,
  PersonAddIcon,
  SchoolIcon,
  MonetizationOnIcon,
  ArrowUpwardIcon,
  StorefrontIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export function PoloDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/polo"],
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

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, active: true, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments" },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/polo/calendar" },
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Polo</h1>
            <p className="text-gray-600">Bem-vindo(a) de volta{user ? `, ${user.fullName}` : ''}! Aqui está um resumo das suas unidades.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Alunos Ativos</h3>
                  <GroupIcon className="text-orange-500 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">126</p>
                    <div className="flex items-center text-sm mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +8%
                      </Badge>
                      <span className="text-gray-600">Desde o mês passado</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Novas Matrículas</h3>
                  <PersonAddIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-12 mb-2" />
                    <Skeleton className="h-4 w-40 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">15</p>
                    <p className="text-gray-600 text-sm mt-2">Novos alunos este mês</p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Faturamento</h3>
                  <MonetizationOnIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-28 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">R$ 24.680,00</p>
                    <div className="flex items-center text-sm mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +12%
                      </Badge>
                      <span className="text-gray-600">Desde o mês passado</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Units Performance */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Desempenho por Unidade</h2>
              <Button variant="link" className="text-sm text-orange-500">Ver detalhes</Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Meta</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Faturamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">São Paulo - Centro</TableCell>
                        <TableCell>48</TableCell>
                        <TableCell>50</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress value={96} className="h-2 w-24 mr-2" />
                            <span>96%</span>
                          </div>
                        </TableCell>
                        <TableCell>R$ 9.600,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">São Paulo - Zona Sul</TableCell>
                        <TableCell>36</TableCell>
                        <TableCell>40</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress value={90} className="h-2 w-24 mr-2" />
                            <span>90%</span>
                          </div>
                        </TableCell>
                        <TableCell>R$ 7.200,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Campinas</TableCell>
                        <TableCell>30</TableCell>
                        <TableCell>30</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress value={100} className="h-2 w-24 mr-2" />
                            <span>100%</span>
                          </div>
                        </TableCell>
                        <TableCell>R$ 6.000,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Ribeirão Preto</TableCell>
                        <TableCell>12</TableCell>
                        <TableCell>20</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress value={60} className="h-2 w-24 mr-2" />
                            <span>60%</span>
                          </div>
                        </TableCell>
                        <TableCell>R$ 1.880,00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Enrollments & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Matrículas Recentes</CardTitle>
                <CardDescription>Últimas 5 matrículas realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Ana Oliveira</TableCell>
                          <TableCell>Administração</TableCell>
                          <TableCell>São Paulo - Centro</TableCell>
                          <TableCell>12/06/2023</TableCell>
                          <TableCell>R$ 580,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Marcos Silva</TableCell>
                          <TableCell>Ciência da Computação</TableCell>
                          <TableCell>São Paulo - Zona Sul</TableCell>
                          <TableCell>10/06/2023</TableCell>
                          <TableCell>R$ 680,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Juliana Costa</TableCell>
                          <TableCell>Pedagogia</TableCell>
                          <TableCell>Campinas</TableCell>
                          <TableCell>08/06/2023</TableCell>
                          <TableCell>R$ 480,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Roberto Santos</TableCell>
                          <TableCell>Engenharia Civil</TableCell>
                          <TableCell>São Paulo - Centro</TableCell>
                          <TableCell>05/06/2023</TableCell>
                          <TableCell>R$ 780,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Carla Mendes</TableCell>
                          <TableCell>Psicologia</TableCell>
                          <TableCell>Ribeirão Preto</TableCell>
                          <TableCell>02/06/2023</TableCell>
                          <TableCell>R$ 580,00</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Ver todas as matrículas</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geográfica</CardTitle>
                <CardDescription>Alunos por região</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <div className="h-[250px] flex items-center justify-center bg-gray-100 rounded-md">
                    <div className="text-center">
                      <MapPinIcon className="h-12 w-12 mx-auto text-orange-500 mb-2" />
                      <p className="text-gray-500">Mapa de distribuição de alunos</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Abrir mapa completo</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
