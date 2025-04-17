import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Components
import StudentLayout from "@/components/layout/student-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DownloadIcon,
  ExternalLinkIcon,
  PrinterIcon,
  SearchIcon,
  ReceiptIcon,
  AlertCircleIcon,
  CalendarIcon,
  ChevronRightIcon,
  InfoIcon,
} from "@/components/ui/icons";

// Tipo para as cobranças retornadas da API
interface Charge {
  id: string;
  name: string;
  value: number;
  description: string | null;
  paymentType: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  installment?: {
    number: number;
    total: number;
  };
  invoiceUrl?: string;
  bankSlipUrl?: string | null;
  externalReference?: string | null;
}

export default function FinancialPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("charges");
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Buscar cobranças do aluno
  const { data: charges, isLoading, isError, error } = useQuery({
    queryKey: ["/api/student/charges"],
    enabled: !!user?.id
  });

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Filtrar cobranças pelo termo de busca
  const filteredCharges = charges?.data?.filter((charge: Charge) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      (charge.description?.toLowerCase().includes(term) || false) ||
      charge.id.toLowerCase().includes(term) ||
      formatDate(charge.dueDate).includes(term) ||
      formatCurrency(charge.value).includes(term)
    );
  }) || [];

  // Renderizar etiqueta de status da cobrança
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Aguardando Pagamento</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Vencido</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcialmente Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para abrir a URL de pagamento
  const openPaymentLink = (url: string) => {
    window.open(url, '_blank');
  };

  // Função para imprimir boleto
  const printBoleto = (charge: Charge) => {
    if (charge.bankSlipUrl) {
      window.open(charge.bankSlipUrl, '_blank');
    } else if (charge.invoiceUrl) {
      window.open(charge.invoiceUrl, '_blank');
    } else {
      toast({
        title: "Boleto indisponível",
        description: "Não há um boleto disponível para impressão.",
        variant: "destructive"
      });
    }
  };

  // Função para download de boleto
  const downloadBoleto = (charge: Charge) => {
    if (charge.bankSlipUrl) {
      window.open(charge.bankSlipUrl, '_blank');
    } else if (charge.invoiceUrl) {
      window.open(charge.invoiceUrl, '_blank');
    } else {
      toast({
        title: "Boleto indisponível",
        description: "Não há um boleto disponível para download.",
        variant: "destructive"
      });
    }
  };

  // Função para abrir detalhes da cobrança
  const openChargeDetails = (charge: Charge) => {
    setSelectedCharge(charge);
    setDetailsOpen(true);
  };

  return (
    <StudentLayout>
      <div className="container mx-auto py-4">
        <div className="flex flex-col space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-gray-600">Financeiro</div>
              <div className="text-gray-400">〉</div>
              <div className="font-medium">Minhas Cobranças</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-2">
              <TabsTrigger value="charges">Cobranças</TabsTrigger>
              <TabsTrigger value="history">Histórico de Pagamentos</TabsTrigger>
            </TabsList>

            {/* Conteúdo da Tab Cobranças */}
            <TabsContent value="charges" className="space-y-4 mt-4">
              {/* Barra de pesquisa */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="search"
                    placeholder="Buscar cobranças..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Erro ao carregar cobranças</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao carregar suas cobranças. Por favor, tente novamente mais tarde.
                  </AlertDescription>
                </Alert>
              ) : filteredCharges.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
                    <ReceiptIcon className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">Nenhuma cobrança encontrada</h3>
                    <p className="text-gray-500 mt-1">
                      {searchTerm 
                        ? "Nenhuma cobrança corresponde à sua busca. Tente outros termos." 
                        : "Você não possui cobranças registradas."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCharges.map((charge: Charge) => (
                          <TableRow key={charge.id}>
                            <TableCell className="font-medium">
                              {formatDate(charge.dueDate)}
                            </TableCell>
                            <TableCell>{charge.description || "Cobrança #" + charge.id.substring(0, 8)}</TableCell>
                            <TableCell>{formatCurrency(charge.value)}</TableCell>
                            <TableCell>{renderStatusBadge(charge.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openChargeDetails(charge)}
                                  title="Ver detalhes"
                                >
                                  <InfoIcon className="h-4 w-4" />
                                </Button>
                                {charge.bankSlipUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => printBoleto(charge)}
                                    title="Imprimir boleto"
                                  >
                                    <PrinterIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {charge.invoiceUrl && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openPaymentLink(charge.invoiceUrl!)}
                                    title="Abrir link de pagamento"
                                  >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Conteúdo da Tab Histórico */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">Histórico de Pagamentos</h3>
                  <p className="text-gray-500 mt-1">
                    Aqui você encontrará o histórico de todos os seus pagamentos realizados.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Detalhes da Cobrança */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Cobrança</DialogTitle>
            <DialogDescription>
              Informações completas sobre a cobrança.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCharge && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vencimento</p>
                  <p className="font-medium">{formatDate(selectedCharge.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <div>{renderStatusBadge(selectedCharge.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor</p>
                  <p className="font-medium">{formatCurrency(selectedCharge.value)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Forma de Pagamento</p>
                  <p className="font-medium">{selectedCharge.paymentType || "Diversos"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Descrição</p>
                <p>{selectedCharge.description || "Cobrança #" + selectedCharge.id.substring(0, 8)}</p>
              </div>
              
              {selectedCharge.installment && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Parcelamento</p>
                  <p className="font-medium">Parcela {selectedCharge.installment.number} de {selectedCharge.installment.total}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                {selectedCharge.bankSlipUrl && (
                  <Button
                    variant="outline"
                    onClick={() => downloadBoleto(selectedCharge)}
                    className="flex items-center gap-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Baixar Boleto
                  </Button>
                )}
                {selectedCharge.invoiceUrl && (
                  <Button
                    variant="default"
                    onClick={() => openPaymentLink(selectedCharge.invoiceUrl!)}
                    className="flex items-center gap-2"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    Ir para Pagamento
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}