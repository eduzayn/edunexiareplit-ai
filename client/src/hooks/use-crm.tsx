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
  rgIe?: string;
  email: string;
  phone: string;
  birthDate?: string; // Data de nascimento
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  observation?: string; // Observações
  asaasId?: string;
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
  
  // Interface para a resposta da API de leads
  interface LeadsResponse {
    success: boolean;
    data: Lead[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }
  
  // Listar leads
  const leadsQuery = useQuery({
    queryKey: ['/api/crm/leads', { search, status }],
    queryFn: async () => {
      const response = await apiRequest<LeadsResponse>(`/api/crm/leads?search=${search || ''}&status=${status || ''}`);
      return response.data; // Retorna apenas o array de leads
    },
  });

  // Interface para a resposta detalhada do lead
  interface LeadDetailResponse {
    success: boolean;
    data: Lead;
  }

  // Buscar lead por ID
  const useLead = (id: number) => useQuery({
    queryKey: ['/api/crm/leads', id],
    queryFn: async () => {
      const response = await apiRequest<LeadDetailResponse>(`/api/crm/leads/${id}`);
      return response.data; // Retorna os dados detalhados do lead
    },
    enabled: !!id
  });

  // Interface para a resposta da criação de lead
  interface LeadCreateResponse {
    success: boolean;
    data: Lead;
    message: string;
  }

  // Criar lead
  const createLeadMutation = useMutation({
    mutationFn: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<LeadCreateResponse>('/api/crm/leads', { method: 'POST', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Lead criado",
        description: response.message || "O lead foi criado com sucesso.",
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

  // Interface para a resposta da atualização de lead
  interface LeadUpdateResponse {
    success: boolean;
    data: Lead;
    message: string;
  }

  // Atualizar lead
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Lead> }) => 
      apiRequest<LeadUpdateResponse>(`/api/crm/leads/${id}`, { method: 'PUT', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', response.data.id] });
      toast({
        title: "Lead atualizado",
        description: response.message || "O lead foi atualizado com sucesso.",
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

  // Interface para a resposta da exclusão de lead
  interface LeadDeleteResponse {
    success: boolean;
    message: string;
  }

  // Excluir lead
  const deleteLeadMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<LeadDeleteResponse>(`/api/crm/leads/${id}`, { method: 'DELETE' }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      toast({
        title: "Lead excluído",
        description: response.message || "O lead foi excluído com sucesso.",
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

  // Interface para a resposta da conversão de lead para cliente
  interface LeadConvertResponse {
    success: boolean;
    data: {
      client: Client;
      contact: Contact;
    };
    message: string;
  }

  // Converter lead para cliente
  const convertLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest<LeadConvertResponse>(`/api/crm/leads/${id}/convert`, { method: 'POST', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Lead convertido",
        description: response.message || "O lead foi convertido em cliente com sucesso.",
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
  
  // Interface para a resposta da API
  interface ClientsResponse {
    success: boolean;
    data: Client[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }
  
  // Listar clientes
  const clientsQuery = useQuery({
    queryKey: ['/api/crm/clients', { search, status }],
    queryFn: async () => {
      const response = await apiRequest<ClientsResponse>(`/api/crm/clients?search=${search || ''}&status=${status || ''}`);
      return response.data; // Retorna apenas o array de clientes
    },
  });

  // Interface para a resposta detalhada do cliente
  interface ClientDetailResponse {
    success: boolean;
    data: {
      client: Client;
      contacts: any[];
    };
  }

  // Buscar cliente por ID
  const useClient = (id: number) => useQuery({
    queryKey: ['/api/crm/clients', id],
    queryFn: async () => {
      const response = await apiRequest<ClientDetailResponse>(`/api/crm/clients/${id}`);
      return response.data; // Retorna os dados detalhados do cliente
    },
    enabled: !!id
  });

  // Interface para a resposta da criação de cliente
  interface ClientCreateResponse {
    success: boolean;
    data: Client;
    message: string;
  }

  // Criar cliente
  const createClientMutation = useMutation({
    mutationFn: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdById'>) => 
      apiRequest<ClientCreateResponse>('/api/crm/clients', { method: 'POST', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Cliente criado",
        description: response.message || "O cliente foi criado com sucesso.",
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

  // Interface para a resposta da atualização de cliente
  interface ClientUpdateResponse {
    success: boolean;
    data: Client;
    message: string;
  }

  // Atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Client> }) => 
      apiRequest<ClientUpdateResponse>(`/api/crm/clients/${id}`, { method: 'PUT', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', response.data.id] });
      toast({
        title: "Cliente atualizado",
        description: response.message || "O cliente foi atualizado com sucesso.",
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

  // Interface para a resposta da exclusão de cliente
  interface ClientDeleteResponse {
    success: boolean;
    message: string;
  }

  // Excluir cliente
  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<ClientDeleteResponse>(`/api/crm/clients/${id}`, { method: 'DELETE' }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/clients'] });
      toast({
        title: "Cliente excluído",
        description: response.message || "O cliente foi excluído com sucesso.",
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
  
  // Interface para a resposta da API de contatos
  interface ContactsResponse {
    success: boolean;
    data: Contact[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }
  
  // Listar contatos
  const contactsQuery = useQuery({
    queryKey: ['/api/crm/contacts', { clientId }],
    queryFn: async () => {
      const response = await apiRequest<ContactsResponse>(clientId 
        ? `/api/crm/contacts?clientId=${clientId}` 
        : '/api/crm/contacts');
      return response.data; // Retorna apenas o array de contatos
    },
  });

  // Interface para a resposta detalhada do contato
  interface ContactDetailResponse {
    success: boolean;
    data: Contact;
  }

  // Buscar contato por ID
  const useContact = (id: number) => useQuery({
    queryKey: ['/api/crm/contacts', id],
    queryFn: async () => {
      const response = await apiRequest<ContactDetailResponse>(`/api/crm/contacts/${id}`);
      return response.data; // Retorna os dados detalhados do contato
    },
    enabled: !!id
  });

  // Interface para a resposta da criação de contato
  interface ContactCreateResponse {
    success: boolean;
    data: Contact;
    message: string;
  }

  // Criar contato
  const createContactMutation = useMutation({
    mutationFn: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest<ContactCreateResponse>('/api/crm/contacts', { method: 'POST', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato criado",
        description: response.message || "O contato foi criado com sucesso.",
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

  // Interface para a resposta da atualização de contato
  interface ContactUpdateResponse {
    success: boolean;
    data: Contact;
    message: string;
  }

  // Atualizar contato
  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Contact> }) => 
      apiRequest<ContactUpdateResponse>(`/api/crm/contacts/${id}`, { method: 'PUT', data }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts', response.data.id] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato atualizado",
        description: response.message || "O contato foi atualizado com sucesso.",
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

  // Interface para a resposta da exclusão de contato
  interface ContactDeleteResponse {
    success: boolean;
    message: string;
  }

  // Excluir contato
  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest<ContactDeleteResponse>(`/api/crm/contacts/${id}`, { method: 'DELETE' }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/contacts'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/clients', clientId] });
      }
      toast({
        title: "Contato excluído",
        description: response.message || "O contato foi excluído com sucesso.",
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