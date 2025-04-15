/**
 * Hook para gerenciamento de operações do módulo de Contratos
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Types
export interface Contract {
  id: number;
  number: string;
  title: string;
  clientId: number;
  studentId: number;
  courseId?: number;
  productId?: number;
  status: string;
  startDate: string;
  endDate?: string;
  totalValue: number;
  numberOfInstallments: number;
  content: string;
  signatureDate?: string;
  signatureType?: string;
  signatureIp?: string;
  clientSignature?: string;
  institutionSignature?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

/**
 * Hook para gerenciamento de contratos
 */
export function useContracts(clientId?: number, status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Construir query string para filtros
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (clientId) params.append('clientId', clientId.toString());
    if (status) params.append('status', status);
    return params.toString() ? `?${params.toString()}` : '';
  };
  
  // Listar contratos
  const contractsQuery = useQuery({
    queryKey: ['/api/contracts', { clientId, status }],
    queryFn: () => apiRequest<Contract[]>(`/api/contracts${buildQueryString()}`),
  });

  // Buscar contrato por ID
  const useContract = (id: number) => useQuery({
    queryKey: ['/api/contracts', id],
    queryFn: () => apiRequest<Contract>(`/api/contracts/${id}`),
    enabled: !!id
  });

  // Criar contrato
  const createContractMutation = useMutation({
    mutationFn: (data: Omit<Contract, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<Contract>('/api/contracts', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message || "Ocorreu um erro ao criar o contrato.",
        variant: "destructive",
      });
    }
  });

  // Atualizar contrato
  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Contract> }) => 
      apiRequest<Contract>(`/api/contracts/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', data.id] });
      toast({
        title: "Contrato atualizado",
        description: "O contrato foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message || "Ocorreu um erro ao atualizar o contrato.",
        variant: "destructive",
      });
    }
  });

  // Excluir contrato
  const deleteContractMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/contracts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contrato",
        description: error.message || "Ocorreu um erro ao excluir o contrato.",
        variant: "destructive",
      });
    }
  });

  // Gerar PDF do contrato
  const generateContractPdfMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<{ pdfUrl: string }>(`/api/contracts/${id}/pdf`, { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: "PDF gerado",
        description: "O PDF do contrato foi gerado com sucesso.",
      });
      return data.pdfUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Ocorreu um erro ao gerar o PDF do contrato.",
        variant: "destructive",
      });
      return null;
    }
  });

  // Assinar contrato
  const signContractMutation = useMutation({
    mutationFn: ({ id, signatureData }: { id: number, signatureData: { 
      signatureType: string, 
      signatureIp?: string, 
      signature: string 
    }}) => 
      apiRequest<Contract>(`/api/contracts/${id}/sign`, { method: 'POST', data: signatureData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', data.id] });
      toast({
        title: "Contrato assinado",
        description: "O contrato foi assinado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao assinar contrato",
        description: error.message || "Ocorreu um erro ao assinar o contrato.",
        variant: "destructive",
      });
    }
  });

  // Cancelar contrato
  const cancelContractMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number, reason: string }) => 
      apiRequest<Contract>(`/api/contracts/${id}/cancel`, { method: 'POST', data: { reason } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', data.id] });
      toast({
        title: "Contrato cancelado",
        description: "O contrato foi cancelado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar contrato",
        description: error.message || "Ocorreu um erro ao cancelar o contrato.",
        variant: "destructive",
      });
    }
  });

  return {
    contracts: contractsQuery.data || [],
    isLoading: contractsQuery.isLoading,
    isError: contractsQuery.isError,
    error: contractsQuery.error,
    useContract,
    createContract: createContractMutation.mutate,
    isPendingCreate: createContractMutation.isPending,
    updateContract: updateContractMutation.mutate,
    isPendingUpdate: updateContractMutation.isPending,
    deleteContract: deleteContractMutation.mutate,
    isPendingDelete: deleteContractMutation.isPending,
    generateContractPdf: generateContractPdfMutation.mutate,
    isPendingGeneratePdf: generateContractPdfMutation.isPending,
    signContract: signContractMutation.mutate,
    isPendingSign: signContractMutation.isPending,
    cancelContract: cancelContractMutation.mutate,
    isPendingCancel: cancelContractMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de modelos de contrato
 */
export function useContractTemplates(type?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar modelos de contrato
  const templatesQuery = useQuery({
    queryKey: ['/api/contracts/templates', { type }],
    queryFn: () => apiRequest<ContractTemplate[]>(type 
      ? `/api/contracts/templates?type=${type}` 
      : '/api/contracts/templates'),
  });

  // Buscar modelo por ID
  const useContractTemplate = (id: number) => useQuery({
    queryKey: ['/api/contracts/templates', id],
    queryFn: () => apiRequest<ContractTemplate>(`/api/contracts/templates/${id}`),
    enabled: !!id
  });

  // Criar modelo de contrato
  const createTemplateMutation = useMutation({
    mutationFn: (data: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<ContractTemplate>('/api/contracts/templates', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/templates'] });
      toast({
        title: "Modelo criado",
        description: "O modelo de contrato foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar modelo",
        description: error.message || "Ocorreu um erro ao criar o modelo de contrato.",
        variant: "destructive",
      });
    }
  });

  // Atualizar modelo de contrato
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ContractTemplate> }) => 
      apiRequest<ContractTemplate>(`/api/contracts/templates/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/templates', data.id] });
      toast({
        title: "Modelo atualizado",
        description: "O modelo de contrato foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar modelo",
        description: error.message || "Ocorreu um erro ao atualizar o modelo de contrato.",
        variant: "destructive",
      });
    }
  });

  // Excluir modelo de contrato
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/contracts/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/templates'] });
      toast({
        title: "Modelo excluído",
        description: "O modelo de contrato foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir modelo",
        description: error.message || "Ocorreu um erro ao excluir o modelo de contrato.",
        variant: "destructive",
      });
    }
  });

  // Pré-visualizar modelo de contrato
  const previewTemplateMutation = useMutation({
    mutationFn: ({
      templateId,
      replacementData
    }: {
      templateId: number,
      replacementData: Record<string, any>
    }) => 
      apiRequest<{ content: string }>(`/api/contracts/templates/${templateId}/preview`, { 
        method: 'POST', 
        data: replacementData 
      }),
    onSuccess: (data) => {
      return data.content;
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao pré-visualizar modelo",
        description: error.message || "Ocorreu um erro ao pré-visualizar o modelo de contrato.",
        variant: "destructive",
      });
      return null;
    }
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    isError: templatesQuery.isError,
    error: templatesQuery.error,
    useContractTemplate,
    createTemplate: createTemplateMutation.mutate,
    isPendingCreate: createTemplateMutation.isPending,
    updateTemplate: updateTemplateMutation.mutate,
    isPendingUpdate: updateTemplateMutation.isPending,
    deleteTemplate: deleteTemplateMutation.mutate,
    isPendingDelete: deleteTemplateMutation.isPending,
    previewTemplate: previewTemplateMutation.mutate,
    isPendingPreview: previewTemplateMutation.isPending,
  };
}