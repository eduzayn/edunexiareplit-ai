/**
 * Hook para gerenciamento de operações do módulo Financeiro
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Types
export interface Product {
  id: number;
  name: string;
  description: string;
  type: string;
  price: number;
  isRecurring: boolean;
  recurringPeriod?: string;
  durationDays?: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  contractId?: number;
  number: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  notes?: string;
  externalId?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

/**
 * Hook para gerenciamento de produtos/serviços
 */
export function useProducts(category?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar produtos
  const productsQuery = useQuery({
    queryKey: ['/api/finance/products', { category }],
    queryFn: () => apiRequest<Product[]>(category 
      ? `/api/finance/products?category=${category}` 
      : '/api/finance/products'),
  });

  // Buscar produto por ID
  const useProduct = (id: number) => useQuery({
    queryKey: ['/api/finance/products', id],
    queryFn: () => apiRequest<Product>(`/api/finance/products/${id}`),
    enabled: !!id
  });

  // Criar produto
  const createProductMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<Product>('/api/finance/products', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/products'] });
      toast({
        title: "Produto criado",
        description: "O produto/serviço foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Ocorreu um erro ao criar o produto/serviço.",
        variant: "destructive",
      });
    }
  });

  // Atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Product> }) => 
      apiRequest<Product>(`/api/finance/products/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/products', data.id] });
      toast({
        title: "Produto atualizado",
        description: "O produto/serviço foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro ao atualizar o produto/serviço.",
        variant: "destructive",
      });
    }
  });

  // Excluir produto
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/finance/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/products'] });
      toast({
        title: "Produto excluído",
        description: "O produto/serviço foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao excluir o produto/serviço.",
        variant: "destructive",
      });
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    useProduct,
    createProduct: createProductMutation.mutate,
    isPendingCreate: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutate,
    isPendingUpdate: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutate,
    isPendingDelete: deleteProductMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de faturas
 */
export function useInvoices(clientId?: number, status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Construir query string para filtros
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId.toString());
    if (status) params.append('status', status);
    return params.toString() ? `?${params.toString()}` : '';
  };
  
  // Listar faturas
  const invoicesQuery = useQuery({
    queryKey: ['/api/finance/invoices', { clientId, status }],
    queryFn: () => apiRequest<Invoice[]>(`/api/finance/invoices${buildQueryString()}`),
  });

  // Buscar fatura por ID
  const useInvoice = (id: number) => useQuery({
    queryKey: ['/api/finance/invoices', id],
    queryFn: () => apiRequest<Invoice>(`/api/finance/invoices/${id}`),
    enabled: !!id
  });

  // Buscar itens de uma fatura
  const useInvoiceItems = (invoiceId: number) => useQuery({
    queryKey: ['/api/finance/invoices', invoiceId, 'items'],
    queryFn: () => apiRequest<InvoiceItem[]>(`/api/finance/invoices/${invoiceId}/items`),
    enabled: !!invoiceId
  });

  // Criar fatura
  const createInvoiceMutation = useMutation({
    mutationFn: (data: { 
      invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'createdById'>, 
      items: Omit<InvoiceItem, 'id' | 'invoiceId'>[] 
    }) => apiRequest<Invoice>('/api/finance/invoices', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Fatura criada",
        description: "A fatura foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar fatura",
        description: error.message || "Ocorreu um erro ao criar a fatura.",
        variant: "destructive",
      });
    }
  });

  // Atualizar fatura
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Invoice> }) => 
      apiRequest<Invoice>(`/api/finance/invoices/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', data.id] });
      toast({
        title: "Fatura atualizada",
        description: "A fatura foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar fatura",
        description: error.message || "Ocorreu um erro ao atualizar a fatura.",
        variant: "destructive",
      });
    }
  });

  // Excluir fatura
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/finance/invoices/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Fatura excluída",
        description: "A fatura foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir fatura",
        description: error.message || "Ocorreu um erro ao excluir a fatura.",
        variant: "destructive",
      });
    }
  });

  // Gerar link de pagamento
  const generatePaymentLinkMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<{ paymentUrl: string }>(`/api/finance/invoices/${id}/payment-link`, { method: 'POST' }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', id] });
      toast({
        title: "Link de pagamento gerado",
        description: "O link de pagamento foi gerado com sucesso.",
      });
      return data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar link de pagamento",
        description: error.message || "Ocorreu um erro ao gerar o link de pagamento.",
        variant: "destructive",
      });
      return null;
    }
  });

  // Cancelar fatura
  const cancelInvoiceMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/finance/invoices/${id}/cancel`, { method: 'POST' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', id] });
      toast({
        title: "Fatura cancelada",
        description: "A fatura foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar fatura",
        description: error.message || "Ocorreu um erro ao cancelar a fatura.",
        variant: "destructive",
      });
    }
  });

  return {
    invoices: invoicesQuery.data || [],
    isLoading: invoicesQuery.isLoading,
    isError: invoicesQuery.isError,
    error: invoicesQuery.error,
    useInvoice,
    useInvoiceItems,
    createInvoice: createInvoiceMutation.mutate,
    isPendingCreate: createInvoiceMutation.isPending,
    updateInvoice: updateInvoiceMutation.mutate,
    isPendingUpdate: updateInvoiceMutation.isPending,
    deleteInvoice: deleteInvoiceMutation.mutate,
    isPendingDelete: deleteInvoiceMutation.isPending,
    generatePaymentLink: generatePaymentLinkMutation.mutate,
    isPendingPaymentLink: generatePaymentLinkMutation.isPending,
    cancelInvoice: cancelInvoiceMutation.mutate,
    isPendingCancel: cancelInvoiceMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de pagamentos
 */
export function usePayments(invoiceId?: number, status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Construir query string para filtros
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (invoiceId) params.append('invoiceId', invoiceId.toString());
    if (status) params.append('status', status);
    return params.toString() ? `?${params.toString()}` : '';
  };
  
  // Listar pagamentos
  const paymentsQuery = useQuery({
    queryKey: ['/api/finance/payments', { invoiceId, status }],
    queryFn: () => apiRequest<Payment[]>(`/api/finance/payments${buildQueryString()}`),
  });

  // Buscar pagamento por ID
  const usePayment = (id: number) => useQuery({
    queryKey: ['/api/finance/payments', id],
    queryFn: () => apiRequest<Payment>(`/api/finance/payments/${id}`),
    enabled: !!id
  });

  // Registrar pagamento
  const registerPaymentMutation = useMutation({
    mutationFn: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<Payment>('/api/finance/payments', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments'] });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', invoiceId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Ocorreu um erro ao registrar o pagamento.",
        variant: "destructive",
      });
    }
  });

  // Atualizar pagamento
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Payment> }) => 
      apiRequest<Payment>(`/api/finance/payments/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments', data.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', data.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Pagamento atualizado",
        description: "O pagamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: error.message || "Ocorreu um erro ao atualizar o pagamento.",
        variant: "destructive",
      });
    }
  });

  // Excluir pagamento
  const deletePaymentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/finance/payments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments'] });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices', invoiceId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir pagamento",
        description: error.message || "Ocorreu um erro ao excluir o pagamento.",
        variant: "destructive",
      });
    }
  });

  // Reembolsar pagamento
  const refundPaymentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number, reason: string }) => 
      apiRequest(`/api/finance/payments/${id}/refund`, { method: 'POST', data: { reason } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/payments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/invoices'] });
      toast({
        title: "Pagamento reembolsado",
        description: "O pagamento foi reembolsado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reembolsar pagamento",
        description: error.message || "Ocorreu um erro ao reembolsar o pagamento.",
        variant: "destructive",
      });
    }
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    isError: paymentsQuery.isError,
    error: paymentsQuery.error,
    usePayment,
    registerPayment: registerPaymentMutation.mutate,
    isPendingRegister: registerPaymentMutation.isPending,
    updatePayment: updatePaymentMutation.mutate,
    isPendingUpdate: updatePaymentMutation.isPending,
    deletePayment: deletePaymentMutation.mutate,
    isPendingDelete: deletePaymentMutation.isPending,
    refundPayment: refundPaymentMutation.mutate,
    isPendingRefund: refundPaymentMutation.isPending,
  };
}