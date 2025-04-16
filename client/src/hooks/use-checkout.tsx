/**
 * Hook para gerenciamento de cobranças (checkout links)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

/**
 * Estrutura de um link de checkout
 */
export interface CheckoutLink {
  id: number;
  leadId: number;
  leadName?: string;
  leadEmail?: string;
  clientId?: number; 
  courseId?: number;
  productId?: number;
  asaasCheckoutId: string;
  description: string;
  value: number;
  dueDate: string;
  expirationTime: number;
  status: string;
  url: string;
  is_used?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Hook para gerenciamento de cobranças (checkout links) de um cliente
 */
export function useClientCheckouts(clientId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Interface para a resposta da API de cobranças do cliente
  interface ClientCheckoutsResponse {
    success: boolean;
    data: CheckoutLink[];
  }
  
  // Listar cobranças do cliente
  const checkoutsQuery = useQuery({
    queryKey: [`/api/v2/clients/${clientId}/checkout-links`],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await apiRequest<ClientCheckoutsResponse>(`/api/v2/clients/${clientId}/checkout-links`);
      return response.data; 
    },
    enabled: !!clientId
  });

  // Verificar status de um checkout
  const checkCheckoutStatusMutation = useMutation({
    mutationFn: (checkoutId: string | number) => 
      apiRequest(`/api/v2/checkout/status/${checkoutId}`),
    onSuccess: (response) => {
      // Log para debug
      console.log("Resposta da verificação de status:", response);
      
      // Invalidar o cache para atualizar a listagem
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/checkout-links`] });
      
      // Notificar o usuário sobre o sucesso
      toast({
        title: "Status atualizado",
        description: "O status da cobrança foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      // Log para debug
      console.error("Erro ao verificar status:", error);
      
      toast({
        title: "Erro ao verificar status",
        description: error.message || "Ocorreu um erro ao verificar o status da cobrança.",
        variant: "destructive",
      });
    }
  });

  // Cancelar checkout
  const cancelCheckoutMutation = useMutation({
    mutationFn: (checkoutId: string | number) => 
      apiRequest(`/api/v2/checkout/links/${checkoutId}/cancel`, { method: 'POST' }),
    onSuccess: (response) => {
      // Invalidar o cache para atualizar a listagem
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/checkout-links`] });
      
      // Notificar o usuário
      toast({
        title: "Cobrança cancelada",
        description: response.message || "A cobrança foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("Erro ao cancelar cobrança:", error);
      
      toast({
        title: "Erro ao cancelar cobrança",
        description: error.message || "Ocorreu um erro ao cancelar a cobrança.",
        variant: "destructive",
      });
    }
  });

  return {
    checkouts: checkoutsQuery.data || [],
    isLoading: checkoutsQuery.isLoading,
    isError: checkoutsQuery.isError,
    error: checkoutsQuery.error,
    checkStatus: checkCheckoutStatusMutation.mutate,
    isPendingCheckStatus: checkCheckoutStatusMutation.isPending,
    cancelCheckout: cancelCheckoutMutation.mutate,
    isPendingCancel: cancelCheckoutMutation.isPending,
  };
}