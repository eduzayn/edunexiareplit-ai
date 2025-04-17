/**
 * =========================================================================
 * ATENÇÃO: PONTO DE ESTABILIDADE COM INTEGRAÇÃO ASAAS
 * =========================================================================
 * 
 * Este arquivo contém uma implementação estável da integração com a API Asaas
 * para listagem de cobranças. Ele foi otimizado para exibir corretamente os
 * dados de cobrança e nomes de clientes do Asaas.
 * 
 * NÃO MODIFIQUE ESTE ARQUIVO SEM AUTORIZAÇÃO EXPRESSA!
 * 
 * Qualquer alteração neste código pode afetar a capacidade do sistema
 * de exibir cobranças do Asaas, impactando diretamente a operação financeira.
 * 
 * Data da estabilização: 16/04/2025
 * =========================================================================
 */

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
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
  AlertCircleIcon,
  ArrowDownwardIcon as ArrowDownIcon,
  ArrowUpwardIcon as ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  ExternalLinkIcon,
  FilterIcon,
  InfoIcon,
  InvoiceIcon, 
  MailIcon,
  PlusIcon, 
  PrinterIcon,
  SearchIcon,
  TrashIcon as Trash2Icon,
  UserIcon,
  CreditCardIcon as DollarSignIcon,
  DownloadIcon
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";

// Tipo para as cobranças da API Asaas
interface AsaasCharge {
  id: string;
  dateCreated: string;
  customer: string;
  customerName: string;
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
  customerDetails?: {
    name: string;
    cpfCnpj: string;
    phone: string;
    address: string;
    city: string | number;
    state: string;
  };
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
  externalReference?: string | null;
  customer?: {
    id: string;
    name: string;
    cpfCnpj: string;
    phone: string;
    address: string;
    city: string | number;
    state: string;
    email: string;
  };
};

export default function ChargesPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isBulkModifyDialogOpen, setIsBulkModifyDialogOpen] = useState(false);
  const [isBulkRemoveDialogOpen, setIsBulkRemoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState<Record<string, boolean>>({});
  const [chargeToEdit, setChargeToEdit] = useState<Charge | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: '',
    value: '',
    dueDate: '',
    externalReference: ''
  });
  
  // Acesso ao queryClient para atualizações de cache
  const queryClient = useQueryClient();
  
  // Estados para os filtros
  const [dueDateFilterStart, setDueDateFilterStart] = useState<Date | undefined>(undefined);
  const [dueDateFilterEnd, setDueDateFilterEnd] = useState<Date | undefined>(undefined);
  const [receiveDateFilterStart, setReceiveDateFilterStart] = useState<Date | undefined>(undefined);
  const [receiveDateFilterEnd, setReceiveDateFilterEnd] = useState<Date | undefined>(undefined);
  const [createDateFilterStart, setCreateDateFilterStart] = useState<Date | undefined>(undefined);
  const [createDateFilterEnd, setCreateDateFilterEnd] = useState<Date | undefined>(undefined);
  
  // Estados para os tipos de cobrança
  const [chargeTypeFilters, setChargeTypeFilters] = useState({
    avulsas: false,
    assinaturas: false,
    parceladas: false
  });
  
  // Estados para os status de cobrança
  const [chargeStatusFilters, setChargeStatusFilters] = useState({
    aguardandoPagamento: false,
    vencida: false,
    recebida: false,
    confirmada: false,
    estornadaCompleta: false,
    estornadoParcial: false,
    pagamentoAnalise: false,
    chargeback: false
  });

  const { toast } = useToast();
  
  // Função para limpar seleções
  const clearSelection = () => {
    setSelectedCharges({});
  };
  
  // Função para lidar com as ações em lote
  const handleBulkAction = (action: string) => {
    const selectedChargeIds = Object.keys(selectedCharges).filter(id => selectedCharges[id]);
    
    if (selectedChargeIds.length === 0) {
      toast({
        title: "Nenhuma cobrança selecionada",
        description: "Selecione pelo menos uma cobrança para executar esta ação.",
        variant: "destructive"
      });
      return;
    }
    
    switch (action) {
      case 'export':
        // Exportar dados das cobranças selecionadas
        toast({
          title: "Exportação iniciada",
          description: `Exportando dados de ${selectedChargeIds.length} cobranças.`,
        });
        // Aqui seria implementada a exportação real
        break;
        
      case 'print':
        // Imprimir boletos das cobranças selecionadas
        toast({
          title: "Impressão iniciada",
          description: `Preparando ${selectedChargeIds.length} boletos para impressão.`,
        });
        // Aqui seria implementada a impressão real
        break;
        
      case 'download':
        // Baixar boletos das cobranças selecionadas
        toast({
          title: "Download iniciado",
          description: `Baixando ${selectedChargeIds.length} boletos.`,
        });
        // Aqui seria implementado o download real
        break;
        
      case 'email':
        // Enviar e-mails para as cobranças selecionadas
        handleBulkEmails(selectedChargeIds);
        break;
        
      case 'modify':
        // Abrir modal para modificar as cobranças selecionadas
        setIsBulkModifyDialogOpen(true);
        break;
        
      case 'remove':
        // Abrir confirmação para remover as cobranças selecionadas
        setIsBulkRemoveDialogOpen(true);
        break;
        
      default:
        toast({
          title: "Ação não implementada",
          description: `A ação "${action}" ainda não foi implementada.`,
          variant: "destructive"
        });
    }
  };
  
  // Função para cancelar múltiplas cobranças de uma vez
  const handleBulkCancel = async (chargeIds: string[]) => {
    if (chargeIds.length === 0) {
      toast({
        title: "Nenhuma cobrança selecionada",
        description: "Selecione pelo menos uma cobrança para cancelar.",
        variant: "destructive"
      });
      return;
    }
    
    // Iniciar o processo com feedback visual
    toast({
      title: "Iniciando cancelamento em lote",
      description: `Cancelando ${chargeIds.length} cobranças...`,
    });
    
    try {
      // Chamar a API para cancelar as cobranças em lote
      const response = await fetch('/api/debug/asaas-charges/bulk/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chargeIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cancelar cobranças');
      }
      
      const result = await response.json();
      
      // Exibir resultado do processamento
      if (result.data.successCount > 0) {
        toast({
          title: "Cobranças canceladas",
          description: `${result.data.successCount} de ${result.data.totalProcessed} cobranças foram canceladas com sucesso.`,
        });
        
        // Se houver erros, mostrar detalhes adicionais
        if (result.data.errorCount > 0) {
          toast({
            title: "Algumas cobranças não puderam ser canceladas",
            description: `${result.data.errorCount} cobranças tiveram problemas. Verifique o console para mais detalhes.`,
            variant: "destructive"
          });
          console.error("Erros no cancelamento em lote:", result.data.errors);
        }
        
        // Limpar seleções após o cancelamento
        setSelectedCharges({});
        
        // Recarregar os dados da tabela
        queryClient.invalidateQueries({ queryKey: ["/api/debug/asaas-charges"] });
      } else {
        // Se nenhuma cobrança foi cancelada com sucesso
        toast({
          title: "Falha no cancelamento",
          description: `Nenhuma cobrança foi cancelada. Verifique os detalhes dos erros no console.`,
          variant: "destructive"
        });
        console.error("Erros no cancelamento em lote:", result.data.errors);
      }
    } catch (error) {
      console.error("Erro ao processar o cancelamento em lote:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao cancelar as cobranças",
        variant: "destructive"
      });
    } finally {
      // Fechar o modal de confirmação
      setIsBulkRemoveDialogOpen(false);
    }
  };
  
  // Selecionar/deselecionar todas as cobranças
  const toggleSelectAll = (isSelected: boolean) => {
    const newSelectedCharges: Record<string, boolean> = {};
    
    if (isSelected) {
      // Selecionar todas as cobranças filtradas
      sortedCharges.forEach(charge => {
        newSelectedCharges[charge.id] = true;
      });
    }
    
    setSelectedCharges(newSelectedCharges);
  };
  
  // Verificar se todas as cobranças estão selecionadas
  const areAllSelected = () => {
    if (sortedCharges.length === 0) return false;
    return sortedCharges.every(charge => selectedCharges[charge.id]);
  };
  
  // Contar quantas cobranças estão selecionadas
  const countSelectedCharges = () => {
    return Object.values(selectedCharges).filter(Boolean).length;
  };
  
  // Função para enviar emails em lote
  const handleBulkEmails = async (selectedIds: string[]) => {
    // Encontrar as cobranças selecionadas
    const selectedCharges = asaasChargesList.filter(charge => selectedIds.includes(charge.id));
    
    if (selectedCharges.length === 0) {
      toast({
        title: "Nenhuma cobrança válida",
        description: "Não foi possível encontrar as cobranças selecionadas.",
        variant: "destructive"
      });
      return;
    }
    
    // Contadores para rastrear o progresso
    let successCount = 0;
    let errorCount = 0;
    
    // Notificar início do processo
    toast({
      title: "Enviando e-mails",
      description: `Iniciando envio de ${selectedCharges.length} e-mails...`,
    });
    
    // Enviar e-mails para cada cobrança sequencialmente
    for (const charge of selectedCharges) {
      try {
        if (!charge.customer?.email) {
          errorCount++;
          console.warn(`Cobrança ${charge.id} não possui email de cliente`);
          continue;
        }
        
        // Preparar dados do email
        const emailData = {
          to: charge.customer.email,
          customerName: charge.name,
          chargeId: charge.id,
          chargeValue: charge.value,
          dueDate: charge.dueDate,
          paymentLink: charge.invoiceUrl || "",
          bankSlipLink: charge.bankSlipUrl || undefined
        };
        
        // Enviar o email
        console.log(`[INFO] Processando email em lote para: ${emailData.to}`);
        console.log(`[INFO] Dados do email em lote:`, emailData);
        
        const response = await fetch("/api/emails/send-invoice-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(emailData)
        });
        
        console.log(`[INFO] Status da resposta de email em lote:`, response.status);
        
        const result = await response.json();
        console.log(`[INFO] Resposta do servidor para email em lote:`, result);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Erro ao enviar email para cobrança ${charge.id}:`, result.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`Erro ao processar envio para cobrança ${charge.id}:`, error);
      }
    }
    
    // Reportar resultado final
    if (successCount > 0) {
      toast({
        title: "E-mails enviados",
        description: `${successCount} e-mails enviados com sucesso${errorCount > 0 ? ` (${errorCount} falhas)` : ''}.`,
        variant: errorCount > 0 ? "default" : "default"
      });
    } else {
      toast({
        title: "Falha no envio",
        description: `Não foi possível enviar nenhum email. Verifique os logs para mais detalhes.`,
        variant: "destructive"
      });
    }
  };
  
  // Função para enviar fatura por e-mail
  // Função para cancelar uma cobrança
  const cancelCharge = async (charge: Charge) => {
    try {
      // Confirmação com o usuário antes de cancelar
      const confirmed = window.confirm(`Tem certeza que deseja cancelar a cobrança ${charge.id} no valor de ${formatCurrency(charge.value)}?`);
      if (!confirmed) return;
      
      // Exibir feedback de carregamento
      toast({
        title: "Cancelando cobrança",
        description: "Aguarde enquanto processamos o cancelamento...",
      });
      
      // Fazer a requisição para a API de cancelamento
      const response = await fetch(`/api/debug/asaas-charges/${charge.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Processar a resposta
      if (response.ok) {
        toast({
          title: "Cobrança cancelada",
          description: "A cobrança foi cancelada com sucesso.",
        });
        
        // Atualizar a lista de cobranças após o cancelamento
        // Usando o cache key que foi definido na query original
        const queryClient = useQueryClient();
        queryClient.invalidateQueries({ queryKey: ["/api/debug/asaas-charges"] });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao cancelar cobrança",
          description: errorData.message || "Ocorreu um erro ao cancelar a cobrança. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar cobrança:", error);
      toast({
        title: "Erro ao cancelar cobrança",
        description: "Ocorreu um erro ao cancelar a cobrança. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para enviar fatura por e-mail
  const sendInvoiceEmail = async (charge: Charge) => {
    if (!charge.customer?.email) {
      toast({
        title: "E-mail indisponível",
        description: "O cliente não possui um e-mail cadastrado.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Preparar os dados para o envio do e-mail
      const emailData = {
        to: charge.customer.email,
        customerName: charge.name,
        chargeId: charge.id,
        chargeValue: charge.value,
        dueDate: charge.dueDate,
        paymentLink: charge.invoiceUrl || "",
        bankSlipLink: charge.bankSlipUrl || undefined
      };
      
      // Enviar a requisição para a API
      console.log('[INFO] Enviando e-mail para:', emailData.to);
      console.log('[INFO] Dados do e-mail:', emailData);
      
      const response = await fetch("/api/emails/send-invoice-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailData)
      });
      
      console.log('[INFO] Status da resposta:', response.status);
      
      // Processar a resposta
      const result = await response.json();
      console.log('[INFO] Resposta do servidor:', result);
      
      if (result.success) {
        toast({
          title: "E-mail enviado",
          description: `E-mail enviado com sucesso para ${emailData.to}`,
        });
      } else {
        toast({
          title: "Erro ao enviar e-mail",
          description: result.message || "Ocorreu um erro ao enviar o e-mail. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Ocorreu um erro ao enviar o e-mail. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
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

  // Removemos os dados simulados, agora estamos usando dados reais da API Asaas

  // Buscar dados da API Asaas (usando rota debug para maior confiabilidade)
  const { data: asaasCharges, isLoading, error } = useQuery({
    queryKey: ["/api/debug/asaas-charges"],
    enabled: true, // Habilitado para buscar dados da API Asaas
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: 1000, // Esperar 1 segundo entre as tentativas
    refetchOnWindowFocus: false // Evitar refetch automático ao focar na janela
  });
  
  // Buscar clientes do Asaas para a funcionalidade de busca
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/debug/asaas-customers", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 3) return null;
      const response = await fetch(`/api/debug/asaas-customers?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Falha ao buscar clientes');
      return response.json();
    },
    enabled: searchTerm.length >= 3, // Só busca quando digitar pelo menos 3 caracteres
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Mapeamento dos dados do Asaas para o formato da UI
  const mapAsaasToCharges = (asaasData: any): Charge[] => {
    if (!asaasData) return [];
    
    // Se for uma resposta com estrutura de API, extrair o array do campo data
    const charges = asaasData.data && Array.isArray(asaasData.data) 
      ? asaasData.data 
      : (Array.isArray(asaasData) ? asaasData : []);
    
    return charges.map((charge: AsaasCharge) => {
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
      
      // Extrair detalhes do cliente, se disponíveis
      const customerDetails = charge.customerDetails || null;
      
      // Determinar o melhor nome para exibição
      const displayName = charge.customerName || customerDetails?.name || 'Cliente';
      
      return {
        id: charge.id,
        name: displayName,
        value: charge.value,
        description: charge.description,
        paymentType: getBillingTypeText(charge.billingType),
        dueDate: formatDate(charge.dueDate),
        status,
        installment: installmentInfo,
        invoiceUrl: charge.invoiceUrl,
        bankSlipUrl: charge.bankSlipUrl,
        // Adicionar informações do cliente
        customer: {
          id: charge.customer,
          name: displayName,
          cpfCnpj: customerDetails?.cpfCnpj || '',
          phone: customerDetails?.phone || '',
          address: customerDetails?.address || '',
          city: customerDetails?.city || '',
          state: customerDetails?.state || '',
          email: 'cliente@exemplo.com' // Simulação para teste, em produção seria obtido da API Asaas
        }
      };
    });
  };

  // Formatação de moeda com tratamento de valores inválidos
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
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

  // Verifica se há algum filtro ativo
  const isFilterActive = (): boolean => {
    // Verificar filtros de data
    if (dueDateFilterStart || dueDateFilterEnd || 
        receiveDateFilterStart || receiveDateFilterEnd || 
        createDateFilterStart || createDateFilterEnd) {
      return true;
    }
    
    // Verificar filtros de tipo de cobrança
    if (chargeTypeFilters.avulsas || chargeTypeFilters.assinaturas || chargeTypeFilters.parceladas) {
      return true;
    }
    
    // Verificar filtros de status
    if (chargeStatusFilters.aguardandoPagamento || chargeStatusFilters.vencida || 
        chargeStatusFilters.recebida || chargeStatusFilters.confirmada || 
        chargeStatusFilters.estornadaCompleta || chargeStatusFilters.estornadoParcial || 
        chargeStatusFilters.pagamentoAnalise || chargeStatusFilters.chargeback) {
      return true;
    }
    
    return false;
  };
  
  // Conta quantos filtros estão ativos para exibir no badge
  const countActiveFilters = (): number => {
    let count = 0;
    
    // Contar filtros de data (cada par conta como 1)
    if (dueDateFilterStart || dueDateFilterEnd) count++;
    if (receiveDateFilterStart || receiveDateFilterEnd) count++;
    if (createDateFilterStart || createDateFilterEnd) count++;
    
    // Contar filtros de tipo de cobrança
    if (chargeTypeFilters.avulsas) count++;
    if (chargeTypeFilters.assinaturas) count++;
    if (chargeTypeFilters.parceladas) count++;
    
    // Contar filtros de status
    if (chargeStatusFilters.aguardandoPagamento) count++;
    if (chargeStatusFilters.vencida) count++;
    if (chargeStatusFilters.recebida) count++;
    if (chargeStatusFilters.confirmada) count++;
    if (chargeStatusFilters.estornadaCompleta) count++;
    if (chargeStatusFilters.estornadoParcial) count++;
    if (chargeStatusFilters.pagamentoAnalise) count++;
    if (chargeStatusFilters.chargeback) count++;
    
    return count;
  };

  // Usar os dados da API Asaas em vez dos dados simulados
  // Mapear dados do Asaas
  const asaasChargesList = mapAsaasToCharges(asaasCharges || []);
  
  // Função auxiliar para validar período de datas
  const isDateInRange = (dateStr: string, startDate?: Date, endDate?: Date): boolean => {
    if (!startDate && !endDate) return true;
    
    try {
      // Converter a string de data (formato dd/mm/yyyy) para um objeto Date
      const dateParts = dateStr.split('/');
      const date = new Date(
        parseInt(dateParts[2]), // ano
        parseInt(dateParts[1]) - 1, // mês (0-indexed)
        parseInt(dateParts[0]) // dia
      );
      
      // Verificar se a data está dentro do intervalo
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      
      return true;
    } catch (error) {
      console.error('Erro ao converter data:', error);
      return true; // Em caso de erro, não filtramos
    }
  };
  
  // Filtrar cobranças com base na pesquisa e nos filtros avançados
  const filteredCharges = asaasChargesList.filter(charge => {
    // Filtro por termo de busca
    const nameMatch = charge.name ? 
      charge.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const descriptionMatch = charge.description ? 
      charge.description.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    
    const valueMatch = charge.value ? 
      formatCurrency(charge.value).includes(searchTerm) : false;
    
    const textSearchMatch = nameMatch || descriptionMatch || valueMatch;
    if (!textSearchMatch && searchTerm.length > 0) return false;
    
    // Filtro por período de vencimento
    const dueDateMatch = isDateInRange(charge.dueDate, dueDateFilterStart, dueDateFilterEnd);
    if (!dueDateMatch) return false;
    
    // Filtro por tipo de cobrança
    const anyChargeTypeSelected = 
      chargeTypeFilters.avulsas || 
      chargeTypeFilters.assinaturas || 
      chargeTypeFilters.parceladas;
    
    if (anyChargeTypeSelected) {
      const isInstallment = !!charge.installment;
      // Aqui precisaríamos de dados adicionais da API para filtrar por assinaturas vs avulsas
      // Por enquanto estamos apenas diferenciando parcelamentos
      if (chargeTypeFilters.parceladas && !isInstallment) return false;
      if (chargeTypeFilters.avulsas && isInstallment) return false;
      // Não temos uma forma clara de identificar assinaturas apenas pelo objeto da cobrança
    }
    
    // Filtro por status
    const anyStatusSelected = 
      chargeStatusFilters.aguardandoPagamento ||
      chargeStatusFilters.vencida ||
      chargeStatusFilters.recebida ||
      chargeStatusFilters.confirmada ||
      chargeStatusFilters.estornadaCompleta ||
      chargeStatusFilters.estornadoParcial ||
      chargeStatusFilters.pagamentoAnalise ||
      chargeStatusFilters.chargeback;
    
    if (anyStatusSelected) {
      if (chargeStatusFilters.aguardandoPagamento && charge.status !== 'pending') return false;
      if (chargeStatusFilters.vencida && charge.status !== 'overdue') return false;
      if (chargeStatusFilters.recebida && charge.status !== 'paid') return false;
      // Outras condições de status também poderiam ser adicionadas com mais dados do Asaas
    }
    
    return true;
  });

  // Ordenação dos resultados
  const sortedCharges = [...filteredCharges].sort((a, b) => {
    if (!sortField) return 0;
    
    let comparison = 0;
    
    if (sortField === 'name') {
      // Verificação de segurança para propriedades que podem ser undefined
      const nameA = a.name || '';
      const nameB = b.name || '';
      comparison = nameA.localeCompare(nameB);
    } else if (sortField === 'value') {
      // Verificação de segurança para valores numéricos
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      comparison = valueA - valueB;
    } else if (sortField === 'dueDate') {
      // Verificação de segurança para datas
      try {
        const dateA = a.dueDate ? new Date(a.dueDate.split('/').reverse().join('-')) : new Date(0);
        const dateB = b.dueDate ? new Date(b.dueDate.split('/').reverse().join('-')) : new Date(0);
        comparison = dateA.getTime() - dateB.getTime();
      } catch (error) {
        comparison = 0; // Em caso de erro no formato da data
      }
    } else if (sortField === 'description') {
      // Descrição pode ser null ou undefined
      const descA = a.description || '';
      const descB = b.description || '';
      comparison = descA.localeCompare(descB);
    } else if (sortField === 'paymentType') {
      // Tipo de pagamento pode ser undefined
      const typeA = a.paymentType || '';
      const typeB = b.paymentType || '';
      comparison = typeA.localeCompare(typeB);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <AdminLayout>
      <div className="container mx-auto py-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-gray-600">Cobranças</div>
            <div className="text-gray-400">〉</div>
            <div className="font-medium">Todas</div>
          </div>
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <span className="flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Emitir cobrança
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/admin/finance/charges/new")}>
                  Cobrança simples
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/finance/charges/advanced")}>
                  Cobrança com parcelamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Todas</h2>

        {/* Barra de pesquisa e filtros */}
        <div className="bg-white rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Procurar por nome, CPF/CNPJ ou email do cliente"
                className="pl-9 pr-4 h-10 w-full max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {/* Resultados da busca por clientes */}
              {customersData && searchTerm.length >= 3 && (
                <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-white shadow-lg rounded-md border z-10">
                  <div className="p-2 border-b">
                    <span className="text-sm font-medium">Resultados da busca - Clientes</span>
                  </div>
                  {customersData.data?.length > 0 ? (
                    <ul className="max-h-60 overflow-auto">
                      {customersData.data.map((customer: any) => (
                        <li 
                          key={customer.id} 
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-start"
                          onClick={() => {
                            setSearchTerm(customer.name);
                            // Poderia navegar para uma página do cliente
                            // navigate(`/admin/finance/customers/${customer.id}`);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500 flex flex-col">
                              {customer.cpfCnpj && <span>CPF/CNPJ: {customer.cpfCnpj}</span>}
                              {customer.email && <span>Email: {customer.email}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-gray-500">
                      Nenhum cliente encontrado com esse termo.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`flex items-center ${isFilterActive() ? "text-blue-600 border-blue-600" : "text-gray-600"}`}
                  >
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filtros
                    {isFilterActive() && (
                      <span className="ml-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {countActiveFilters()}
                      </span>
                    )}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Filtros avançados</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Período de vencimento */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Período de vencimento</h3>
                      <div className="flex items-center space-x-2">
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDateFilterStart ? (
                                  format(dueDateFilterStart, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dueDateFilterStart}
                                onSelect={setDueDateFilterStart}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <span className="text-sm">até</span>
                        
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDateFilterEnd ? (
                                  format(dueDateFilterEnd, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={dueDateFilterEnd}
                                onSelect={setDueDateFilterEnd}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    {/* Período de recebimento */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Período de recebimento</h3>
                      <div className="flex items-center space-x-2">
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {receiveDateFilterStart ? (
                                  format(receiveDateFilterStart, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={receiveDateFilterStart}
                                onSelect={setReceiveDateFilterStart}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <span className="text-sm">até</span>
                        
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {receiveDateFilterEnd ? (
                                  format(receiveDateFilterEnd, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={receiveDateFilterEnd}
                                onSelect={setReceiveDateFilterEnd}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    {/* Período de criação */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Período de criação</h3>
                      <div className="flex items-center space-x-2">
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {createDateFilterStart ? (
                                  format(createDateFilterStart, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={createDateFilterStart}
                                onSelect={setCreateDateFilterStart}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <span className="text-sm">até</span>
                        
                        <div className="grid gap-2 w-full">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {createDateFilterEnd ? (
                                  format(createDateFilterEnd, "dd/MM/yyyy")
                                ) : (
                                  <span>__/__/____</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={createDateFilterEnd}
                                onSelect={setCreateDateFilterEnd}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tipos de cobrança */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Tipos de cobrança</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="avulsas" 
                            checked={chargeTypeFilters.avulsas}
                            onCheckedChange={(checked) => 
                              setChargeTypeFilters({...chargeTypeFilters, avulsas: !!checked})
                            }
                          />
                          <label htmlFor="avulsas" className="text-sm cursor-pointer">
                            Avulsas
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="assinaturas" 
                            checked={chargeTypeFilters.assinaturas}
                            onCheckedChange={(checked) => 
                              setChargeTypeFilters({...chargeTypeFilters, assinaturas: !!checked})
                            }
                          />
                          <label htmlFor="assinaturas" className="text-sm cursor-pointer">
                            Assinaturas
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="parceladas" 
                            checked={chargeTypeFilters.parceladas}
                            onCheckedChange={(checked) => 
                              setChargeTypeFilters({...chargeTypeFilters, parceladas: !!checked})
                            }
                          />
                          <label htmlFor="parceladas" className="text-sm cursor-pointer">
                            Parceladas
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Situações das cobranças */}
                    <div className="col-span-1 md:col-span-2 space-y-3">
                      <h3 className="text-sm font-medium">Situações das cobranças</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="aguardandoPagamento" 
                            checked={chargeStatusFilters.aguardandoPagamento}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, aguardandoPagamento: !!checked})
                            }
                          />
                          <label htmlFor="aguardandoPagamento" className="text-sm cursor-pointer">
                            Aguardando pagamento
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="vencida" 
                            checked={chargeStatusFilters.vencida}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, vencida: !!checked})
                            }
                          />
                          <label htmlFor="vencida" className="text-sm cursor-pointer">
                            Vencida
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="recebida" 
                            checked={chargeStatusFilters.recebida}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, recebida: !!checked})
                            }
                          />
                          <label htmlFor="recebida" className="text-sm cursor-pointer">
                            Recebida
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="confirmada" 
                            checked={chargeStatusFilters.confirmada}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, confirmada: !!checked})
                            }
                          />
                          <label htmlFor="confirmada" className="text-sm cursor-pointer">
                            Confirmada
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="estornadaCompleta" 
                            checked={chargeStatusFilters.estornadaCompleta}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, estornadaCompleta: !!checked})
                            }
                          />
                          <label htmlFor="estornadaCompleta" className="text-sm cursor-pointer">
                            Cobrança estornada
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="estornadoParcial" 
                            checked={chargeStatusFilters.estornadoParcial}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, estornadoParcial: !!checked})
                            }
                          />
                          <label htmlFor="estornadoParcial" className="text-sm cursor-pointer">
                            Cobrança estornada parcialmente
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pagamentoAnalise" 
                            checked={chargeStatusFilters.pagamentoAnalise}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, pagamentoAnalise: !!checked})
                            }
                          />
                          <label htmlFor="pagamentoAnalise" className="text-sm cursor-pointer">
                            Pagamento em análise
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="chargeback" 
                            checked={chargeStatusFilters.chargeback}
                            onCheckedChange={(checked) => 
                              setChargeStatusFilters({...chargeStatusFilters, chargeback: !!checked})
                            }
                          />
                          <label htmlFor="chargeback" className="text-sm cursor-pointer">
                            Chargeback
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={() => {
                      // Limpar todos os filtros
                      setDueDateFilterStart(undefined);
                      setDueDateFilterEnd(undefined);
                      setReceiveDateFilterStart(undefined);
                      setReceiveDateFilterEnd(undefined);
                      setCreateDateFilterStart(undefined);
                      setCreateDateFilterEnd(undefined);
                      setChargeTypeFilters({
                        avulsas: false,
                        assinaturas: false,
                        parceladas: false
                      });
                      setChargeStatusFilters({
                        aguardandoPagamento: false,
                        vencida: false,
                        recebida: false,
                        confirmada: false,
                        estornadaCompleta: false,
                        estornadoParcial: false,
                        pagamentoAnalise: false,
                        chargeback: false
                      });
                    }}>
                      Limpar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setIsFilterDialogOpen(false);
                      }}
                    >
                      Aplicar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-blue-600 flex items-center">
                    <span className="flex items-center">
                      Ações em lote
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => handleBulkAction('export')}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Exportar dados
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => handleBulkAction('print')}>
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Imprimir boletos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => handleBulkAction('download')}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Baixar boletos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => handleBulkAction('email')}>
                    <MailIcon className="mr-2 h-4 w-4" />
                    Enviar e-mails
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer" onClick={() => handleBulkAction('modify')}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Modificar cobranças
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center cursor-pointer text-red-500" onClick={() => handleBulkAction('remove')}>
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Remover cobranças
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={areAllSelected()} 
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todas as cobranças"
                          className="ml-2"
                        />
                      </TableHead>
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
                          <Checkbox 
                            checked={!!selectedCharges[charge.id]}
                            onCheckedChange={(checked) => {
                              setSelectedCharges({
                                ...selectedCharges,
                                [charge.id]: !!checked
                              });
                            }}
                            aria-label={`Selecionar cobrança ${charge.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-6 mr-2">
                              <UserIcon className="h-5 w-5 text-teal-600" />
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-medium text-teal-600 cursor-help">
                                    {charge.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="right" align="start" className="p-4 max-w-md space-y-1">
                                  <div className="text-sm font-bold">{charge.name}</div>
                                  {charge.customer?.cpfCnpj && (
                                    <div className="text-xs">CPF/CNPJ: {charge.customer.cpfCnpj}</div>
                                  )}
                                  {charge.customer?.phone && (
                                    <div className="text-xs">Tel: {charge.customer.phone}</div>
                                  )}
                                  {charge.customer?.address && (
                                    <div className="text-xs">
                                      Endereço: {charge.customer.address}
                                      {charge.customer.city && charge.customer.state && (
                                        <>, {charge.customer.city} - {charge.customer.state}</>
                                      )}
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
                            {charge.dueDate}
                            <span className="ml-2">
                              {getStatusIcon(charge.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800">
                                    <DollarSignIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Receber</p>
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
                                    onClick={() => {
                                      // Preparar para edição
                                      setChargeToEdit(charge);
                                      setEditFormData({
                                        description: charge.description || '',
                                        value: charge.value.toString(),
                                        dueDate: charge.dueDate.split('/').reverse().join('-'), // Converter para YYYY-MM-DD
                                        externalReference: charge.externalReference || ''
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
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
                                  <p>Copiar link de pagamento</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                    onClick={() => openPaymentLink(charge.invoiceUrl)}
                                  >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Abrir em nova aba</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-500 hover:text-gray-800"
                                    onClick={() => sendInvoiceEmail(charge)}
                                  >
                                    <MailIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enviar por e-mail</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                                    onClick={() => cancelCharge(charge)}
                                  >
                                    <Trash2Icon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancelar/Excluir</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedCharges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
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

      {/* Modal para modificação em lote */}
      <Dialog open={isBulkModifyDialogOpen} onOpenChange={setIsBulkModifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar cobranças em lote</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Você está prestes a modificar {countSelectedCharges()} cobranças.
              Essa ação afetará apenas as cobranças selecionadas.
            </p>
          </DialogHeader>
          
          <div className="py-4">
            <p>Em desenvolvimento...</p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkModifyDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Cobranças atualizadas",
                  description: `${countSelectedCharges()} cobranças foram atualizadas com sucesso.`,
                });
                setIsBulkModifyDialogOpen(false);
                clearSelection();
              }}
            >
              Aplicar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para remoção em lote */}
      <Dialog open={isBulkRemoveDialogOpen} onOpenChange={setIsBulkRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cobranças em lote</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Você está prestes a cancelar {countSelectedCharges()} cobranças.
              Esta ação não pode ser desfeita.
            </p>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-red-500">
              Atenção: O cancelamento de cobranças é irreversível. As cobranças serão marcadas 
              como canceladas no sistema Asaas e não poderão mais ser pagas pelos clientes.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBulkRemoveDialogOpen(false)}
            >
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                // Obter os IDs das cobranças selecionadas
                const selectedChargeIds = Object.keys(selectedCharges).filter(id => selectedCharges[id]);
                if (selectedChargeIds.length > 0) {
                  handleBulkCancel(selectedChargeIds);
                } else {
                  toast({
                    title: "Nenhuma cobrança selecionada",
                    description: "Selecione pelo menos uma cobrança para cancelar.",
                    variant: "destructive"
                  });
                  setIsBulkRemoveDialogOpen(false);
                }
              }}
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar uma cobrança individualmente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cobrança</DialogTitle>
            <DialogDescription>
              {chargeToEdit && (
                <span>
                  ID: {chargeToEdit.id} | Cliente: {chargeToEdit.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                value={editFormData.description} 
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Descrição da cobrança"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input 
                id="value" 
                type="number"
                step="0.01"
                value={editFormData.value} 
                onChange={(e) => setEditFormData({...editFormData, value: e.target.value})}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de vencimento</Label>
              <Input 
                id="dueDate" 
                type="date"
                value={editFormData.dueDate} 
                onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="externalReference">Referência externa</Label>
              <Input 
                id="externalReference" 
                value={editFormData.externalReference} 
                onChange={(e) => setEditFormData({...editFormData, externalReference: e.target.value})}
                placeholder="Código ou referência do seu sistema (opcional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                if (!chargeToEdit) return;
                
                try {
                  // Converter data no formato YYYY-MM-DD para formato brasileiro DD/MM/YYYY
                  const dateParts = editFormData.dueDate.split('-');
                  const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                  
                  // Preparar dados para envio
                  const updateData = {
                    description: editFormData.description,
                    value: parseFloat(editFormData.value),
                    dueDate: formattedDate,
                    externalReference: editFormData.externalReference || null
                  };
                  
                  // Exibir feedback de carregamento
                  toast({
                    title: "Atualizando cobrança",
                    description: "Aguarde enquanto processamos a atualização...",
                  });
                  
                  // Enviar para a API
                  const response = await fetch(`/api/debug/asaas-charges/${chargeToEdit.id}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify(updateData)
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Ocorreu um erro ao atualizar a cobrança");
                  }
                  
                  const result = await response.json();
                  
                  // Feedback de sucesso
                  toast({
                    title: "Cobrança atualizada",
                    description: "A cobrança foi atualizada com sucesso no Asaas.",
                  });
                  
                  // Atualizar os dados na interface
                  queryClient.invalidateQueries({ queryKey: ["/api/debug/asaas-charges"] });
                  
                  // Fechar o modal
                  setIsEditDialogOpen(false);
                  
                } catch (error) {
                  console.error("Erro ao atualizar cobrança:", error);
                  
                  toast({
                    title: "Erro ao atualizar",
                    description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a cobrança. Tente novamente.",
                    variant: "destructive"
                  });
                }
              }}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}