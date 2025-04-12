import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
  ChartIcon,
  GroupIcon,
  SchoolIcon,
  SettingsIcon,
  HelpOutlineIcon,
  MonetizationOnIcon,
  StorefrontIcon,
  BarChartIcon,
  SecurityIcon,
  NotificationsIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
  BuildIcon,
  AnalyticsIcon,
  BusinessIcon,
  CloudIcon,
  DashboardIcon,
  HandshakeIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export function AdminDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/admin"],
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

  // Usar o componente padronizado para os itens da barra lateral
  const [location] = useLocation();
  const sidebarItems = getAdminSidebarItems(location);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="admin"
        portalColor="#3451B2"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Bem-vindo(a) de volta{user ? `, ${user.fullName}` : ''}! Aqui está um resumo completo do sistema.</p>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Total de Usuários</h3>
                  <GroupIcon className="text-blue-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">1,528</p>
                    <div className="flex items-center text-xs mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +12%
                      </Badge>
                      <span className="text-gray-600">este mês</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Instituições</h3>
                  <BusinessIcon className="text-indigo-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mb-2" />
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">23</p>
                    <div className="flex items-center text-xs mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +4%
                      </Badge>
                      <span className="text-gray-600">este mês</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Faturamento Mensal</h3>
                  <MonetizationOnIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-24 mb-2" />
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">R$ 156.400</p>
                    <div className="flex items-center text-xs mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +8%
                      </Badge>
                      <span className="text-gray-600">este mês</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Saúde do Sistema</h3>
                  <ShieldIcon className="text-blue-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-20 mb-2" />
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-green-600">99.8%</p>
                    <div className="flex items-center text-xs mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        Estável
                      </Badge>
                      <span className="text-gray-600">último uptime</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Contents */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 md:grid-cols-4 h-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="institutions">Instituições</TabsTrigger>
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Performance do Sistema</CardTitle>
                    <CardDescription>Métricas de uso nas últimas 24 horas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <AnalyticsIcon className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                          <p className="text-gray-600">Gráfico de performance do sistema</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Atividades Recentes</CardTitle>
                    <CardDescription>Últimas ações no sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2">
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-start mb-4 px-4">
                          <Skeleton className="h-8 w-8 rounded-full mr-2" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-auto px-4">
                        <div className="flex items-start">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <BusinessIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Nova instituição cadastrada</p>
                            <p className="text-xs text-gray-500">há 35 minutos</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-green-100 rounded-full p-2 mr-3">
                            <MonetizationOnIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Pagamento processado</p>
                            <p className="text-xs text-gray-500">há 1 hora</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-purple-100 rounded-full p-2 mr-3">
                            <SecurityIcon className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Atualização de segurança</p>
                            <p className="text-xs text-gray-500">há 2 horas</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-orange-100 rounded-full p-2 mr-3">
                            <GroupIcon className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">10 novos usuários registrados</p>
                            <p className="text-xs text-gray-500">há 3 horas</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-red-100 rounded-full p-2 mr-3">
                            <NotificationsIcon className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Alerta de sistema</p>
                            <p className="text-xs text-gray-500">há 5 horas</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos Ativos</CardTitle>
                    <CardDescription>Uso dos módulos por instituições</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Módulo</TableHead>
                            <TableHead>Instituições</TableHead>
                            <TableHead>Usuários</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Utilização</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Portal do Aluno</TableCell>
                            <TableCell>23/23</TableCell>
                            <TableCell>1283</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={98} className="h-2 w-24 mr-2" />
                                <span>98%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell className="font-medium">Chat Multicanal</TableCell>
                            <TableCell>20/23</TableCell>
                            <TableCell>845</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={86} className="h-2 w-24 mr-2" />
                                <span>86%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell className="font-medium">Financeiro</TableCell>
                            <TableCell>21/23</TableCell>
                            <TableCell>356</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={92} className="h-2 w-24 mr-2" />
                                <span>92%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell className="font-medium">Professora Ana (IA)</TableCell>
                            <TableCell>18/23</TableCell>
                            <TableCell>723</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={78} className="h-2 w-24 mr-2" />
                                <span>78%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell className="font-medium">Portal do Professor</TableCell>
                            <TableCell>22/23</TableCell>
                            <TableCell>489</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Progress value={95} className="h-2 w-24 mr-2" />
                                <span>95%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Ver todos os módulos</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Usuários</CardTitle>
                  <CardDescription>Distribuição por tipo de portal</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-gray-500 text-xs font-medium">Alunos</h3>
                              <SchoolIcon className="text-green-600 h-4 w-4" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">1,238</p>
                            <div className="flex items-center text-xs mt-1">
                              <span className="text-green-600 mr-1">81%</span>
                              <span className="text-gray-500">do total</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-gray-500 text-xs font-medium">Parceiros</h3>
                              <HandshakeIcon className="text-purple-600 h-4 w-4" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">124</p>
                            <div className="flex items-center text-xs mt-1">
                              <span className="text-purple-600 mr-1">8%</span>
                              <span className="text-gray-500">do total</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-gray-500 text-xs font-medium">Polos</h3>
                              <StorefrontIcon className="text-orange-500 h-4 w-4" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">86</p>
                            <div className="flex items-center text-xs mt-1">
                              <span className="text-orange-500 mr-1">6%</span>
                              <span className="text-gray-500">do total</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-gray-500 text-xs font-medium">Administradores</h3>
                              <ShieldIcon className="text-blue-600 h-4 w-4" />
                            </div>
                            <p className="text-xl font-bold text-gray-900">80</p>
                            <div className="flex items-center text-xs mt-1">
                              <span className="text-blue-600 mr-1">5%</span>
                              <span className="text-gray-500">do total</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center mb-6">
                        <div className="text-center">
                          <GroupIcon className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                          <p className="text-gray-600">Gráfico de distribuição de usuários</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline">Exportar Dados</Button>
                        <Button>Gerenciar Usuários</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Institutions Tab */}
            <TabsContent value="institutions">
              <Card>
                <CardHeader>
                  <CardTitle>Instituições Cadastradas</CardTitle>
                  <CardDescription>Visão geral de todas as instituições</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instituição</TableHead>
                          <TableHead>Usuários</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Módulos Ativos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Último Acesso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Universidade Alpha</TableCell>
                          <TableCell>312</TableCell>
                          <TableCell>Enterprise</TableCell>
                          <TableCell>12/12</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell>Hoje, 09:45</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium">Faculdade Beta</TableCell>
                          <TableCell>186</TableCell>
                          <TableCell>Professional</TableCell>
                          <TableCell>10/12</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell>Hoje, 08:12</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium">Instituto Gamma</TableCell>
                          <TableCell>94</TableCell>
                          <TableCell>Standard</TableCell>
                          <TableCell>8/12</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell>Ontem, 15:30</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium">Centro Educacional Delta</TableCell>
                          <TableCell>142</TableCell>
                          <TableCell>Professional</TableCell>
                          <TableCell>9/12</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell>Hoje, 10:12</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="font-medium">Escola Técnica Omega</TableCell>
                          <TableCell>78</TableCell>
                          <TableCell>Standard</TableCell>
                          <TableCell>7/12</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Pendente
                            </Badge>
                          </TableCell>
                          <TableCell>3 dias atrás</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Exportar Dados</Button>
                  <Button>Adicionar Instituição</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Visão Geral Financeira</CardTitle>
                    <CardDescription>Receita dos últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
                        <div className="text-center">
                          <BarChartIcon className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                          <p className="text-gray-600">Gráfico de receita mensal</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transações Recentes</CardTitle>
                    <CardDescription>Últimos pagamentos recebidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full mr-2" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <BusinessIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Universidade Alpha</p>
                              <p className="text-xs text-gray-500">Hoje, 08:42</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-600">+ R$ 12.500</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <BusinessIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Faculdade Beta</p>
                              <p className="text-xs text-gray-500">Ontem, 14:30</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-600">+ R$ 8.750</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <BusinessIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Instituto Gamma</p>
                              <p className="text-xs text-gray-500">2 dias atrás</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-600">+ R$ 4.200</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <BusinessIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Centro Educacional Delta</p>
                              <p className="text-xs text-gray-500">3 dias atrás</p>
                            </div>
                          </div>
                          <p className="font-medium text-green-600">+ R$ 7.350</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Ver todas as transações</Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
