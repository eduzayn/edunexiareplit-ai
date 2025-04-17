/**
 * Módulo Financeiro Empresarial - Página Principal
 * 
 * Dashboard financeiro avançado para super admins com funcionalidades 
 * empresariais integradas com o Asaas.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Sidebar } from "@/components/layout/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRightIcon, 
  BarChart3, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Download, 
  LineChart, 
  PieChart, 
  Plus, 
  PlusCircle, 
  RefreshCw, 
  Repeat, 
  Share, 
  SlidersHorizontal,
  TrendingUp, 
  Users 
} from "lucide-react";

/**
 * Página principal do módulo Financeiro Empresarial
 */
export default function FinanceiroEmpresarialPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Verificação de acesso exclusivo para administradores
  if (user?.portalType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar o módulo Financeiro Empresarial.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    document.title = "Financeiro Empresarial | EdunexIA";
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar para navegação */}
      <Sidebar
        items={getAdminSidebarItems(location)}
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro Empresarial</h1>
            <p className="text-muted-foreground">
              Gestão financeira avançada com integração Asaas
            </p>
          </div>

          {/* Resumo financeiro */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total (Mês)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 45.231,89</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assinaturas Ativas
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">
                  +12 novas assinaturas hoje
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Média de Ticket
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 890,50</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Inadimplência
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.3%</div>
                <p className="text-xs text-muted-foreground">
                  -1.1% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navegação para módulos financeiros */}
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
              <TabsTrigger value="antecipacao">Antecipação</TabsTrigger>
              <TabsTrigger value="subcontas">Subcontas</TabsTrigger>
              <TabsTrigger value="transferencias">Transferências</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visão Geral Financeira</CardTitle>
                  <CardDescription>
                    Resumo consolidado das operações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-md">
                    <div className="text-center space-y-2">
                      <BarChart3 className="h-16 w-16 text-slate-400 mx-auto" />
                      <p className="text-sm text-muted-foreground">Dados financeiros serão carregados da API Asaas</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar Dados
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Button variant="outline" className="justify-start">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nova Assinatura
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Share className="mr-2 h-4 w-4" />
                      Solicitar Antecipação
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Relatórios
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Configurar Split
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Operações Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Antecipação #4832</p>
                          <p className="text-xs text-muted-foreground">R$ 32.150,00</p>
                        </div>
                        <Badge>Em análise</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Transferência #9211</p>
                          <p className="text-xs text-muted-foreground">R$ 7.500,00</p>
                        </div>
                        <Badge>Agendada</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Split #6322</p>
                          <p className="text-xs text-muted-foreground">R$ 12.430,50</p>
                        </div>
                        <Badge>Processando</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Calendário Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="text-center space-y-2">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto" />
                        <p className="text-sm text-muted-foreground">Eventos financeiros programados</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Evento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="assinaturas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Assinaturas</CardTitle>
                  <CardDescription>
                    Gerencie assinaturas e planos recorrentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Repeat className="h-16 w-16 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Assinaturas e planos recorrentes</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure e gerencie assinaturas automáticas para seus clientes
                      </p>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Assinatura
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="antecipacao" className="h-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Antecipação de Recebíveis</CardTitle>
                  <CardDescription>
                    Antecipe seus recebimentos para melhorar seu fluxo de caixa
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <ArrowUpRightIcon className="h-16 w-16 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Antecipe seus recebíveis</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Solicite antecipação dos valores a receber e melhore seu capital de giro
                      </p>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Solicitação de Antecipação
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="subcontas" className="h-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Subcontas</CardTitle>
                  <CardDescription>
                    Organize sua operação financeira com subcontas por departamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <PieChart className="h-16 w-16 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Subcontas departamentais</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Crie e gerencie subcontas para melhor organização financeira
                      </p>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Subconta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transferencias" className="h-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Transferências Bancárias</CardTitle>
                  <CardDescription>
                    Realize pagamentos a fornecedores e colaboradores
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <LineChart className="h-16 w-16 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Transferências automáticas</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Agende e realize transferências bancárias diretamente pelo sistema
                      </p>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Transferência
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="relatorios" className="h-[400px]">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios Financeiros</CardTitle>
                  <CardDescription>
                    Análises e relatórios detalhados do seu negócio
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3 className="h-16 w-16 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Relatórios financeiros avançados</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visualize e exporte relatórios detalhados de sua operação financeira
                      </p>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Relatórios
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}