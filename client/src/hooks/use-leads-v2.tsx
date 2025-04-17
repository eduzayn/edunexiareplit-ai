import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  leadsApi, 
  Lead, 
  CreateLeadData, 
  UpdateLeadData, 
  CreateLeadActivityData, 
  LeadActivity 
} from '@/lib/api/leads-api';
import { 
  checkoutApi, 
  CheckoutLinkData, 
  CheckoutLinkResponse, 
  CheckoutStatus 
} from '@/lib/api/checkout-api';

/**
 * Hook customizado para gerenciamento de leads com a nova API v2
 * Este hook fornece todas as funcionalidades para listar, criar, atualizar leads
 * e gerenciar links de checkout
 */
export function useLeadsV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  /**
   * Consulta para listar leads com paginação e filtros
   */
  const useLeadsList = (page = currentPage, limit = pageSize, search?: string, status?: string) => {
    return useQuery({
      queryKey: ['/api/leads', { page, limit, search, status }],
      queryFn: () => leadsApi.getLeads(page, limit, search, status),
    });
  };
  
  /**
   * Consulta para buscar um lead específico com todas as informações
   */
  const useLead = (id?: number) => {
    return useQuery({
      queryKey: ['/api/leads', id],
      queryFn: () => leadsApi.getLeadById(id!),
      enabled: !!id,
    });
  };
  
  /**
   * Mutação para criar um novo lead
   */
  const createLeadMutation = useMutation({
    mutationFn: (data: CreateLeadData) => leadsApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Lead criado',
        description: 'O lead foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar lead',
        description: error.message || 'Ocorreu um erro ao criar o lead.',
        variant: 'destructive',
      });
    },
  });
  
  /**
   * Mutação para atualizar um lead
   */
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLeadData }) => 
      leadsApi.updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads', variables.id] });
      toast({
        title: 'Lead atualizado',
        description: 'O lead foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar lead',
        description: error.message || 'Ocorreu um erro ao atualizar o lead.',
        variant: 'destructive',
      });
    },
  });
  
  /**
   * Mutação para adicionar uma atividade a um lead
   */
  const addLeadActivityMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: number; data: CreateLeadActivityData }) => 
      leadsApi.addLeadActivity(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', variables.leadId] });
      toast({
        title: 'Atividade registrada',
        description: 'A atividade foi registrada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar atividade',
        description: error.message || 'Ocorreu um erro ao registrar a atividade.',
        variant: 'destructive',
      });
    },
  });
  
  /**
   * Mutação para criar um link de checkout para um lead
   */
  const createCheckoutLinkMutation = useMutation({
    mutationFn: (data: CheckoutLinkData) => checkoutApi.createCheckoutLink(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', data.leadId] });
      toast({
        title: 'Link de pagamento criado',
        description: 'O link de pagamento foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar link de pagamento',
        description: error.message || 'Ocorreu um erro ao criar o link de pagamento.',
        variant: 'destructive',
      });
    },
  });
  
  /**
   * Mutação para cancelar um link de checkout
   */
  const cancelCheckoutLinkMutation = useMutation({
    mutationFn: ({ checkoutId, leadId }: { checkoutId: string; leadId: number }) => 
      checkoutApi.cancelCheckoutLink(checkoutId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads', variables.leadId] });
      toast({
        title: 'Link de pagamento cancelado',
        description: 'O link de pagamento foi cancelado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar link de pagamento',
        description: error.message || 'Ocorreu um erro ao cancelar o link de pagamento.',
        variant: 'destructive',
      });
    },
  });
  
  /**
   * Consulta para verificar o status de um link de checkout
   */
  const useCheckoutStatus = (checkoutId?: string) => {
    return useQuery({
      queryKey: ['/api/checkout/status', checkoutId],
      queryFn: () => checkoutApi.getCheckoutStatus(checkoutId!),
      enabled: !!checkoutId,
      // Refresh a cada 30 segundos para verificar mudanças de status
      refetchInterval: 30000,
    });
  };
  
  return {
    // Hooks para consultas
    useLeadsList,
    useLead,
    useCheckoutStatus,
    
    // Funções de mutação
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    addLeadActivity: addLeadActivityMutation.mutate,
    createCheckoutLink: createCheckoutLinkMutation.mutate,
    cancelCheckoutLink: cancelCheckoutLinkMutation.mutate,
    
    // Estados de loading
    isCreatingLead: createLeadMutation.isPending,
    isUpdatingLead: updateLeadMutation.isPending,
    isAddingActivity: addLeadActivityMutation.isPending,
    isCreatingCheckoutLink: createCheckoutLinkMutation.isPending,
    isCancelingCheckoutLink: cancelCheckoutLinkMutation.isPending,
    
    // Funções de paginação
    setCurrentPage,
    setPageSize,
    currentPage,
    pageSize,
  };
}