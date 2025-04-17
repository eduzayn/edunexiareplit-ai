import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCardIcon, 
  FileTextIcon, 
  InfoIcon, 
  PrinterIcon,
  BanknotesIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Spinner } from "@/components/ui/spinner";
import StudentLayout from "@/components/layout/student-layout";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";

export default function FinancialPage() {
  const { toast } = useToast();
  const [selectedBilling, setSelectedBilling] = useState(null);

  // Consulta as cobranças do aluno
  const {
    data: charges,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/student/charges"],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para baixar o boleto
  const handleDownloadBoleto = (boletoUrl: string) => {
    if (!boletoUrl) {
      toast({
        title: "Erro",
        description: "Boleto não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    window.open(boletoUrl, "_blank");
  };

  // Função para imprimir o boleto
  const handlePrintBoleto = (boletoUrl: string) => {
    if (!boletoUrl) {
      toast({
        title: "Erro",
        description: "Boleto não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    const printWindow = window.open(boletoUrl, "_blank");
    if (printWindow) {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  // Função para copiar o código PIX
  const handleCopyPix = (pixCode: string) => {
    if (!pixCode) {
      toast({
        title: "Erro",
        description: "Código PIX não disponível para esta cobrança",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(pixCode).then(
      () => {
        toast({
          title: "Sucesso",
          description: "Código PIX copiado para a área de transferência",
        });
      },
      () => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o código PIX",
          variant: "destructive",
        });
      }
    );
  };

  // Função para mostrar detalhes da cobrança
  const handleViewDetails = (billing: any) => {
    setSelectedBilling(billing);
  };

  // Determina o status visual da cobrança
  const getBillingStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
      PENDING: { label: "Pendente", variant: "secondary" },
      RECEIVED: { label: "Recebido", variant: "success" },
      CONFIRMED: { label: "Confirmado", variant: "success" },
      OVERDUE: { label: "Vencido", variant: "destructive" },
      REFUNDED: { label: "Reembolsado", variant: "outline" },
      RECEIVED_IN_CASH: { label: "Recebido em dinheiro", variant: "success" },
      REFUND_REQUESTED: { label: "Reembolso solicitado", variant: "outline" },
      CHARGEBACK_REQUESTED: { label: "Contestação solicitada", variant: "destructive" },
      CHARGEBACK_DISPUTE: { label: "Em disputa", variant: "destructive" },
      AWAITING_CHARGEBACK_REVERSAL: { label: "Aguardando reversão", variant: "secondary" },
      DUNNING_REQUESTED: { label: "Cobrança solicitada", variant: "secondary" },
      DUNNING_RECEIVED: { label: "Cobrança recebida", variant: "success" },
      AWAITING_RISK_ANALYSIS: { label: "Em análise de risco", variant: "secondary" },
    };
    
    return statusMap[status] || { label: status, variant: "default" };
  };

  // Renderiza o conteúdo conforme o estado da consulta
  let content;
  
  if (isLoading) {
    content = (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  } else if (isError) {
    content = (
      <Alert variant="destructive" className="my-4">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Erro ao carregar dados financeiros</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message || "Não foi possível obter as informações de pagamento. Tente novamente mais tarde."}
        </AlertDescription>
      </Alert>
    );
  } else if (!charges || charges.length === 0) {
    content = (
      <Alert className="my-4">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Nenhuma cobrança encontrada</AlertTitle>
        <AlertDescription>
          Você não possui cobranças registradas no sistema. Se acredita que isso é um erro, entre em contato com a secretaria.
        </AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Suas Cobranças</CardTitle>
          <CardDescription>
            Visualize todas as suas cobranças e realize pagamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge: any) => (
                  <TableRow key={charge.id}>
                    <TableCell className="font-medium">{charge.description || "Mensalidade"}</TableCell>
                    <TableCell>{formatDate(new Date(charge.dueDate))}</TableCell>
                    <TableCell>{formatCurrency(charge.value)}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = getBillingStatusBadge(charge.status);
                        return (
                          <Badge variant={status.variant as any}>{status.label}</Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Botão para visualizar detalhes */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(charge)}
                          title="Ver Detalhes"
                        >
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                        
                        {/* Botão para baixar boleto */}
                        {charge.bankSlipUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBoleto(charge.bankSlipUrl)}
                            title="Baixar Boleto"
                          >
                            <FileTextIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Botão para imprimir boleto */}
                        {charge.bankSlipUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintBoleto(charge.bankSlipUrl)}
                            title="Imprimir Boleto"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Botão para copiar PIX */}
                        {charge.pixQrCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyPix(charge.pixQrCode)}
                            title="Copiar código PIX"
                          >
                            <BanknotesIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CreditCardIcon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-xl">Pagamentos</CardTitle>
                <CardDescription>Visão geral dos seus pagamentos</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de cobranças</p>
                  <p className="text-2xl font-bold">{charges?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cobranças pendentes</p>
                  <p className="text-2xl font-bold">
                    {charges?.filter((charge: any) => 
                      charge.status === "PENDING" || 
                      charge.status === "AWAITING_RISK_ANALYSIS" || 
                      charge.status === "DUNNING_REQUESTED"
                    ).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle className="text-xl">Pagos</CardTitle>
                <CardDescription>Pagamentos confirmados</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Total de pagamentos confirmados</p>
                <p className="text-2xl font-bold">
                  {charges?.filter((charge: any) => 
                    charge.status === "RECEIVED" || 
                    charge.status === "CONFIRMED" || 
                    charge.status === "RECEIVED_IN_CASH" ||
                    charge.status === "DUNNING_RECEIVED"
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle className="text-xl">Vencidos</CardTitle>
                <CardDescription>Pagamentos em atraso</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">Total de pagamentos vencidos</p>
                <p className="text-2xl font-bold">
                  {charges?.filter((charge: any) => 
                    charge.status === "OVERDUE"
                  ).length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {content}
        
        {/* Modal de detalhes (simplificado) */}
        {selectedBilling && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detalhes da Cobrança</CardTitle>
              <CardDescription>
                Informações detalhadas sobre a cobrança selecionada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID da Cobrança</dt>
                  <dd className="mt-1 text-sm">{selectedBilling.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                  <dd className="mt-1 text-sm">{selectedBilling.description || "Mensalidade"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data de Vencimento</dt>
                  <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.dueDate))}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Valor</dt>
                  <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.value)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data de Criação</dt>
                  <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.dateCreated))}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm">
                    <Badge variant={getBillingStatusBadge(selectedBilling.status).variant as any}>
                      {getBillingStatusBadge(selectedBilling.status).label}
                    </Badge>
                  </dd>
                </div>
                {selectedBilling.paymentDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Data de Pagamento</dt>
                    <dd className="mt-1 text-sm">{formatDate(new Date(selectedBilling.paymentDate))}</dd>
                  </div>
                )}
                {selectedBilling.fine && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Multa</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.fine)}</dd>
                  </div>
                )}
                {selectedBilling.interest && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Juros</dt>
                    <dd className="mt-1 text-sm">{formatCurrency(selectedBilling.interest)}</dd>
                  </div>
                )}
              </dl>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedBilling(null)}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}