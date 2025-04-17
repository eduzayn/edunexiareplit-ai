import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { BreadcrumbWithBackButton } from "@/components/ui/breadcrumb-with-back-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Funções utilitárias para formatação
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

interface Charge {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  dueDate: string;
  status: string;
  invoiceUrl: string;
  invoiceNumber: string;
  description: string;
  externalReference: string;
  paymentDate?: string;
}

export default function AdminStudentFinancialPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("charges");
  const [studentId, setStudentId] = useState<number | null>(null);
  
  // Simulando a obtenção do ID do aluno a partir da URL ou estado global
  useEffect(() => {
    // Em uma implementação real, obteríamos o ID do aluno da URL ou estado
    setStudentId(1); // ID fixo apenas para exemplo
  }, []);

  const {
    data: charges,
    isLoading,
    isError,
    refetch,
  } = useQuery<Charge[]>({
    queryKey: ["/api/student-charges"],
    enabled: !!studentId,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Dados atualizados",
      description: "As informações financeiras foram atualizadas.",
    });
  };

  const getStatusBadge = (status: string) => {
    // Criando tipos personalizados para o sistema
    type BadgeVariant = "default" | "outline" | "secondary" | "destructive";
    interface StatusBadge {
      label: string;
      variant: BadgeVariant;
      className?: string;
    }
    
    const statusMap: Record<string, StatusBadge> = {
      PENDING: { label: "Pendente", variant: "outline" },
      RECEIVED: { label: "Recebido", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      CONFIRMED: { label: "Confirmado", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      OVERDUE: { label: "Vencido", variant: "destructive" },
      REFUNDED: { label: "Reembolsado", variant: "secondary" },
      REFUND_REQUESTED: { label: "Reembolso Solicitado", variant: "secondary" },
      CHARGEBACK_REQUESTED: { label: "Contestação Solicitada", variant: "destructive" },
      CHARGEBACK_DISPUTE: { label: "Em Disputa", variant: "destructive" },
      AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando Reversão", variant: "secondary" },
      DUNNING_REQUESTED: { label: "Cobrança Solicitada", variant: "outline" },
      DUNNING_RECEIVED: { label: "Cobrança Recebida", variant: "default", className: "bg-green-500 hover:bg-green-600" },
      AWAITING_RISK_ANALYSIS: { label: "Análise de Risco", variant: "outline" },
    };

    const defaultBadge: StatusBadge = { label: status, variant: "outline" };
    const badgeConfig = statusMap[status] || defaultBadge;

    return (
      <Badge 
        variant={badgeConfig.variant}
        className={badgeConfig.className}
      >
        {badgeConfig.label}
      </Badge>
    );
  };

  const getBillingTypeBadge = (billingType: string) => {
    // Usando o mesmo tipo de Badge definido na função anterior
    type BadgeVariant = "default" | "outline" | "secondary" | "destructive";
    interface StatusBadge {
      label: string;
      variant: BadgeVariant;
      className?: string;
    }
    
    const typeMap: Record<string, StatusBadge> = {
      BOLETO: { label: "Boleto", variant: "outline" },
      CREDIT_CARD: { label: "Cartão de Crédito", variant: "secondary" },
      PIX: { label: "PIX", variant: "default", className: "bg-blue-500 hover:bg-blue-600" },
      UNDEFINED: { label: "Não definido", variant: "outline" },
    };

    const defaultBadge: StatusBadge = { label: billingType, variant: "outline" };
    const badgeConfig = typeMap[billingType] || defaultBadge;

    return (
      <Badge 
        variant={badgeConfig.variant}
        className={badgeConfig.className}
      >
        {badgeConfig.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex justify-between items-center">
          <BreadcrumbWithBackButton
            items={[
              { title: "Dashboard", link: "/admin/dashboard" },
              { title: "Alunos", link: "/admin/alunos" },
              { title: "Financeiro", link: "/admin/alunos/financeiro" },
            ]}
          />
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(charges?.filter(c => c.status === "PENDING").reduce((acc, charge) => acc + charge.value, 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cobranças pendentes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(charges?.filter(c => c.status === "RECEIVED" || c.status === "CONFIRMED").reduce((acc, charge) => acc + charge.value, 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cobranças pagas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cobranças Vencidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(charges?.filter(c => c.status === "OVERDUE").reduce((acc, charge) => acc + charge.value, 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {charges?.filter(c => c.status === "OVERDUE").length || 0} cobrança(s) vencida(s)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próx. Vencimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : charges?.filter(c => c.status === "PENDING").length ? (
                  formatDate(
                    charges
                      .filter(c => c.status === "PENDING")
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate || ""
                  )
                ) : (
                  "Nenhum"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Próxima data de vencimento
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-full mb-6">
          <CardHeader>
            <CardTitle>Informações Financeiras do Aluno</CardTitle>
            <CardDescription>
              Visualize e gerencie os dados financeiros do aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="charges" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="charges">Cobranças</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="statements">Extratos</TabsTrigger>
              </TabsList>
              <TabsContent value="charges">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : isError ? (
                  <div className="text-center p-8 text-destructive">
                    Erro ao carregar os dados financeiros. Por favor, tente novamente.
                  </div>
                ) : charges && charges.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Forma de Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {charges.map((charge) => (
                          <TableRow key={charge.id}>
                            <TableCell>
                              {charge.description || "Mensalidade"}
                            </TableCell>
                            <TableCell>{formatDate(charge.dueDate)}</TableCell>
                            <TableCell>{formatCurrency(charge.value)}</TableCell>
                            <TableCell>
                              {getBillingTypeBadge(charge.billingType)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(charge.status)}
                            </TableCell>
                            <TableCell>
                              {charge.invoiceUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(charge.invoiceUrl, "_blank")}
                                >
                                  Visualizar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    Nenhuma cobrança encontrada para este aluno.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="payments">
                <div className="text-center p-8 text-muted-foreground">
                  Funcionalidade em desenvolvimento.
                </div>
              </TabsContent>
              <TabsContent value="statements">
                <div className="text-center p-8 text-muted-foreground">
                  Funcionalidade em desenvolvimento.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}