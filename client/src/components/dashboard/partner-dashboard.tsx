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
import {
  ChartIcon,
  PaymentsIcon,
  PeopleIcon,
  TrendingUpIcon,
  GroupIcon,
  AccountBalanceIcon,
  ComputerIcon,
  ShowChartIcon,
  SettingsIcon,
  HelpOutlineIcon,
  PersonAddIcon,
  MonetizationOnIcon,
  ArrowUpwardIcon,
  ReceiptIcon
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PartnerDashboard() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/partner"],
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

  // Sidebar items for partner portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, active: true, href: "/partner/dashboard" },
    { name: "Referências", icon: <PeopleIcon />, href: "/partner/referrals" },
    { name: "Comissões", icon: <MonetizationOnIcon />, href: "/partner/commissions" },
    { name: "Materiais", icon: <ComputerIcon />, href: "/partner/materials" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/partner/reports" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/partner/support" },
    { name: "Configurações", icon: <SettingsIcon />, href: "/partner/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="partner"
        portalColor="#7C4DFC"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Parceiro</h1>
            <p className="text-gray-600">Bem-vindo(a) de volta{user ? `, ${user.fullName}` : ''}! Aqui está um resumo das suas parcerias.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Alunos Indicados</h3>
                  <PeopleIcon className="text-purple-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">42</p>
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
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 text-sm font-medium">Comissões do Mês</h3>
                  <MonetizationOnIcon className="text-green-600 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-40 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">R$ 1.250,00</p>
                    <div className="flex items-center text-sm mt-2">
                      <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <ArrowUpwardIcon className="h-3 w-3 mr-1" />
                        +18%
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
                  <h3 className="text-gray-500 text-sm font-medium">Pagamento Pendente</h3>
                  <ReceiptIcon className="text-orange-500 h-5 w-5" />
                </div>
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-28 mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">R$ 750,00</p>
                    <p className="text-gray-600 text-sm mt-2">Próximo pagamento: 15/07/2023</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Referrals */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Indicações Recentes</h2>
              <Button variant="link" className="text-sm text-purple-600">Ver todas</Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6">
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-full mb-4" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Maria Silva</TableCell>
                        <TableCell>MBA em Gestão</TableCell>
                        <TableCell>10/06/2023</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                        </TableCell>
                        <TableCell>R$ 240,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">João Oliveira</TableCell>
                        <TableCell>Tecnologia da Informação</TableCell>
                        <TableCell>05/06/2023</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                        </TableCell>
                        <TableCell>R$ 180,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Ana Pereira</TableCell>
                        <TableCell>Marketing Digital</TableCell>
                        <TableCell>01/06/2023</TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pendente</Badge>
                        </TableCell>
                        <TableCell>R$ 150,00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Carlos Santos</TableCell>
                        <TableCell>Desenvolvimento Web</TableCell>
                        <TableCell>28/05/2023</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                        </TableCell>
                        <TableCell>R$ 180,00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance & Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Desempenho Mensal</CardTitle>
                <CardDescription>Suas estatísticas de conversão dos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <div className="h-60 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">Gráfico de desempenho mensal</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Materiais Promocionais</CardTitle>
                <CardDescription>Recursos para auxiliar suas indicações</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                        <ComputerIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Apresentação Comercial</h3>
                        <Button variant="link" className="p-0 h-auto text-sm text-purple-600">Download</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-green-100 text-green-600 flex items-center justify-center mr-3">
                        <PersonAddIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Kit de Afiliado</h3>
                        <Button variant="link" className="p-0 h-auto text-sm text-purple-600">Download</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                        <TrendingUpIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Guia de Conversão</h3>
                        <Button variant="link" className="p-0 h-auto text-sm text-purple-600">Download</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
