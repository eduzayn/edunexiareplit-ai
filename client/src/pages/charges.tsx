import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
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
import { 
  ArrowDownwardIcon as ArrowDownIcon,
  ArrowUpwardIcon as ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EyeIcon,
  ExternalLinkIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Tipo para as cobranças da API Asaas
interface AsaasCharge {
  id: string;
  dateCreated: string;
  customer: string;
  customerName?: string;
  value: number;
  netValue: number;
  status: string;
  dueDate: string;
  description: string | null;
  installment: number | null;
  installmentCount: number | null;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
}

// Tipo para as cobranças exibidas na UI
type Charge = {
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
};

export default function ChargesPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  
  // Funções para gerenciar os links de pagamento
  const openPaymentLink = (url: string | undefined) => {
    if (!url) {
      toast({
        title: "Link indisponível",
        description: "O link de pagamento não está disponível para esta cobrança.",
        variant: "destructive"
      });
      return;
    }
    window.open(url, '_blank');
  };
  
  const copyPaymentLink = (url: string | undefined) => {
    if (!url) {
      toast({
        title: "Link indisponível",
        description: "O link de pagamento não está disponível para esta cobrança.",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link copiado!",
          description: "O link de pagamento foi copiado para a área de transferência.",
        });
      })
      .catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive"
        });
      });
  };

  // Buscar dados da API Asaas com a rota alternativa (não autenticada)
  const { data: asaasCharges, isLoading, error } = useQuery({
    queryKey: ["/api/debug/asaas-charges"],
    enabled: true,
  });

  // Mapeamento dos dados do Asaas para o formato da UI
  const mapAsaasToCharges = (asaasData: any): Charge[] => {
    if (!asaasData?.data) return [];
    
    return asaasData.data.map((charge: AsaasCharge) => {
      // Mapear o status do Asaas para nosso formato
      let status: Charge['status'] = 'pending';
      switch(charge.status) {
        case 'CONFIRMED':
        case 'RECEIVED':
        case 'RECEIVED_IN_CASH':
          status = 'paid';
          break;
        case 'PENDING':
          status = 'pending';
          break;
        case 'OVERDUE':
          status = 'overdue';
          break;
        case 'REFUNDED':
        case 'REFUND_REQUESTED':
        case 'CHARGEBACK_REQUESTED':
        case 'CHARGEBACK_DISPUTE':
        case 'AWAITING_CHARGEBACK_REVERSAL':
        case 'DUNNING_REQUESTED':
        case 'DUNNING_RECEIVED':
        case 'AWAITING_RISK_ANALYSIS':
          status = 'partial';
          break;
        case 'PAYMENT_DELETED':
        case 'CANCELED':
          status = 'cancelled';
          break;
      }
      
      // Mapear o tipo de pagamento
      const getBillingTypeText = (billingType: string) => {
        switch(billingType) {
          case 'BOLETO': return 'Boleto Bancário';
          case 'CREDIT_CARD': return 'Cartão de Crédito';
          case 'PIX': return 'Pix';
          case 'UNDEFINED': return 'Indefinido';
          default: return billingType;
        }
      };
      
      // Formatar a data de vencimento
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
      };
      
      // Construir a informação de parcela (se houver)
      let installmentInfo;
      if (charge.installment && charge.installmentCount) {
        installmentInfo = {
          number: charge.installment,
          total: charge.installmentCount
        };
      }
      
      return {
        id: charge.id,
        name: charge.customerName || 'Cliente',
        value: charge.value,
        description: charge.description,
        paymentType: getBillingTypeText(charge.billingType),
        dueDate: formatDate(charge.dueDate),
        status,
        installment: installmentInfo,
        invoiceUrl: charge.invoiceUrl,
        bankSlipUrl: charge.bankSlipUrl
      };
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 rounded-full flex items-center gap-1 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Recebida
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          Pendente
        </Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 rounded-full flex items-center gap-1 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          Vencida
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 rounded-full flex items-center gap-1 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
          Cancelada
        </Badge>;
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          Parcial
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
  };

  // Mapear dados do Asaas
  const asaasChargesList = mapAsaasToCharges(asaasCharges);
  
  // Filtrar cobranças com base na pesquisa
  const filteredCharges = asaasChargesList.filter(charge => 
    charge.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (charge.description && charge.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    formatCurrency(charge.value).includes(searchTerm)
  );

  // Ordenação dos resultados
  const sortedCharges = [...filteredCharges].sort((a, b) => {
    if (!sortField) return 0;
    
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'value') {
      comparison = a.value - b.value;
    } else if (sortField === 'dueDate') {
      const dateA = new Date(a.dueDate.split('/').reverse().join('-'));
      const dateB = new Date(b.dueDate.split('/').reverse().join('-'));
      comparison = dateA.getTime() - dateB.getTime();
    } else if (sortField === 'description') {
      comparison = (a.description || '').localeCompare(b.description || '');
    } else if (sortField === 'paymentType') {
      comparison = a.paymentType.localeCompare(b.paymentType);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao carregar cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foi possível carregar as cobranças do Asaas. Por favor, tente novamente mais tarde.</p>
            <p className="text-sm text-gray-500 mt-2">
              Detalhes do erro: {error instanceof Error ? error.message : String(error)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        {/* Cabeçalho com título e botão para criar nova cobrança */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-gray-600">Cobranças</div>
            <div className="text-gray-400">〉</div>
            <div className="font-medium">Todas</div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/create-charge")}
            >
              <span className="flex items-center">
                <PlusIcon className="h-4 w-4 mr-2" />
                Emitir cobrança
              </span>
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta página exibe todas as cobranças disponíveis no sistema Asaas.</p>
          </CardContent>
        </Card>

        <div className="bg-white rounded-md p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Procurar por nome ou email do cliente"
                className="pl-9 pr-4 h-10 w-full max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center text-gray-600">
                <FilterIcon className="mr-2 h-4 w-4" />
                Filtros
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              // Estado de carregamento
              <div className="space-y-2 p-4">
                {Array(5)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              // Tabela estilo Asaas
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Nome {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer text-right"
                        onClick={() => handleSort('value')}
                      >
                        <div className="flex items-center justify-end">
                          Valor {getSortIcon('value')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center">
                          Descrição {getSortIcon('description')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('paymentType')}
                      >
                        <div className="flex items-center">
                          Forma de pagamento {getSortIcon('paymentType')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('dueDate')}
                      >
                        <div className="flex items-center">
                          Data de vencimento {getSortIcon('dueDate')}
                        </div>
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCharges.map((charge) => (
                      <TableRow key={charge.id} className="border-t">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-6 mr-2">
                              <UserIcon className="h-5 w-5 text-teal-600" />
                            </div>
                            <span className="font-medium text-teal-600">
                              {charge.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(charge.value)}
                        </TableCell>
                        <TableCell>
                          {charge.description || (
                            <span className="text-gray-500">Descrição não informada</span>
                          )}
                          {charge.installment && (
                            <div className="text-xs text-gray-500 mt-1">
                              Parcela {charge.installment.number} de {charge.installment.total}.
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {charge.paymentType}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="mr-2">
                              {charge.dueDate}
                            </div>
                            {getStatusIcon(charge.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-500 hover:text-gray-800"
                                  onClick={() => openPaymentLink(charge.invoiceUrl)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar pagamento</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-gray-800"
                                  onClick={() => copyPaymentLink(charge.invoiceUrl)}
                                >
                                  <CopyIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar link</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-500 hover:text-gray-800"
                                  onClick={() => openPaymentLink(charge.invoiceUrl)}
                                >
                                  <ExternalLinkIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Abrir em nova aba</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedCharges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhuma cobrança encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}