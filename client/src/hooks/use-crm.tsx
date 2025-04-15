/**
 * Hook para gerenciamento de operações do módulo CRM
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Types
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  interest: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface Client {
  id: number;
  name: string;
  type: 'pf' | 'pj';
  cpfCnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
}

export interface Contact {
  id: number;
  clientId: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook para gerenciamento de leads
 */
export function useLeads(search?: string, status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar leads
  const leadsQuery = useQuery({
    queryKey: ['/api/crm/leads', { search, status }],
    queryFn: () => apiRequest<Lead[]>(`/api/crm/leads?search=${search || ''}&status=${status || ''}`),
  });

  // Buscar lead por ID
  const useLead = (id: number) => useQuery({
    queryKey: ['/api/crm/leads', id],
    queryFn: () => apiRequest<Lead>(`/api/crm/leads/${id}`),
    enabled: !!id
  });

  // Criar lead
  const createLeadMutation = useMutation({
    mutationFn: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<Lead>('/api/crm/leads', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Lead criado",
        description: "O lead foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar lead",
        description: error.message || "Ocorreu um erro ao criar o lead.",
        variant: "destructive",
      });
    }
  });

  // Atualizar lead
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Lead> }) => 
      apiRequest<Lead>(`/api/crm/leads/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', data.id] });
      toast({
        title: "Lead atualizado",
        description: "O lead foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message || "Ocorreu um erro ao atualizar o lead.",
        variant: "destructive",
      });
    }
  });

  // Excluir lead
  const deleteLeadMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/crm/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message || "Ocorreu um erro ao excluir o lead.",
        variant: "destructive",
      });
    }
  });

  // Converter lead para cliente
  const convertLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest<Client>(`/api/crm/leads/${id}/convert`, { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Lead convertido",
        description: "O lead foi convertido em cliente com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao converter lead",
        description: error.message || "Ocorreu um erro ao converter o lead.",
        variant: "destructive",
      });
    }
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    isError: leadsQuery.isError,
    error: leadsQuery.error,
    useLead,
    createLead: createLeadMutation.mutate,
    isPendingCreate: createLeadMutation.isPending,
    updateLead: updateLeadMutation.mutate,
    isPendingUpdate: updateLeadMutation.isPending,
    deleteLead: deleteLeadMutation.mutate,
    isPendingDelete: deleteLeadMutation.isPending,
    convertLead: convertLeadMutation.mutate,
    isPendingConvert: convertLeadMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de clientes
 */
export function useClients(search?: string, status?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar clientes
  const clientsQuery = useQuery({
    queryKey: ['/api/crm/clients', { search, status }],
    queryFn: () => apiRequest<Client[]>(`/api/crm/clients?search=${search || ''}&status=${status || ''}`),
  });

  // Buscar cliente por ID
  const useClient = (id: number) => useQuery({
    queryKey: ['/api/crm/clients', id],
    queryFn: () => apiRequest<Client>(`/api/crm/clients/${id}`),
    enabled: !!id
  });

  // Criar cliente
  const createClientMutation = useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<Client>('/api/crm/clients', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Cliente criado",
        description: "O cliente foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Ocorreu um erro ao criar o cliente.",
        variant: "destructive",
      });
    }
  });

  // Atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Client> }) => 
      apiRequest<Client>(`/api/crm/clients/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', data.id] });
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    }
  });

  // Excluir cliente
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/crm/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    }
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    useClient,
    createClient: createClientMutation.mutate,
    isPendingCreate: createClientMutation.isPending,
    updateClient: updateClientMutation.mutate,
    isPendingUpdate: updateClientMutation.isPending,
    deleteClient: deleteClientMutation.mutate,
    isPendingDelete: deleteClientMutation.isPending,
  };
}

/**
 * Hook para gerenciamento de contatos
 */
export function useContacts(clientId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Listar contatos
  const contactsQuery = useQuery({
    queryKey: ['/api/crm/contacts', { clientId }],
    queryFn: () => apiRequest<Contact[]>(clientId 
      ? `/api/crm/contacts?clientId=${clientId}` 
      : '/api/crm/contacts'),
  });

  // Buscar contato por ID
  const useContact = (id: number) => useQuery({
    queryKey: ['/api/crm/contacts', id],
    queryFn: () => apiRequest<Contact>(`/api/crm/contacts/${id}`),
    enabled: !!id
  });

  // Criar contato
  const createContactMutation = useMutation({
    mutationFn: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest<Contact>('/api/crm/contacts', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato criado",
        description: "O contato foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contato",
        description: error.message || "Ocorreu um erro ao criar o contato.",
        variant: "destructive",
      });
    }
  });

  // Atualizar contato
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Contact> }) => 
      apiRequest<Contact>(`/api/crm/contacts/${id}`, { method: 'PATCH', data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts', data.id] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato atualizado",
        description: "O contato foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message || "Ocorreu um erro ao atualizar o contato.",
        variant: "destructive",
      });
    }
  });

  // Excluir contato
  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/crm/contacts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir contato",
        description: error.message || "Ocorreu um erro ao excluir o contato.",
        variant: "destructive",
      });
    }
  });

  return {
    contacts: contactsQuery.data || [],
    isLoading: contactsQuery.isLoading,
    isError: contactsQuery.isError,
    error: contactsQuery.error,
    useContact,
    createContact: createContactMutation.mutate,
    isPendingCreate: createContactMutation.isPending,
    updateContact: updateContactMutation.mutate,
    isPendingUpdate: updateContactMutation.isPending,
    deleteContact: deleteContactMutation.mutate,
    isPendingDelete: deleteContactMutation.isPending,
  };
}