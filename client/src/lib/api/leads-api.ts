import { apiRequest } from "@/lib/queryClient";

/**
 * Interface para representar um lead
 */
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  source?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  converted_to_client_id?: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Interface para representar uma atividade de lead
 */
export interface LeadActivity {
  id: number;
  lead_id: number;
  type: 'note' | 'contact' | 'email' | 'checkout';
  description: string;
  metadata?: any;
  created_by_id?: number;
  created_at: string;
}

/**
 * Interface para os dados de criação de um lead
 */
export interface CreateLeadData {
  name: string;
  email: string;
  phone?: string;
  course?: string;
  source?: string;
  notes?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'unqualified';
}

/**
 * Interface para os dados de atualização de um lead
 */
export interface UpdateLeadData extends Partial<CreateLeadData> {}

/**
 * Interface para a resposta com detalhes completos de um lead
 */
export interface LeadDetailResponse {
  lead: Lead;
  activities: LeadActivity[];
  checkoutLinks: any[];
}

/**
 * Interface para os dados de criação de atividade de lead
 */
export interface CreateLeadActivityData {
  type: 'note' | 'contact' | 'email' | 'checkout';
  description: string;
  metadata?: any;
}

/**
 * Interface para a resposta paginada de leads
 */
export interface PaginatedLeadsResponse {
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * API Client para gerenciamento de leads
 */
export const leadsApi = {
  /**
   * Busca leads com paginação e filtros
   */
  getLeads: async (
    page = 1, 
    limit = 20, 
    search?: string, 
    status?: string
  ): Promise<PaginatedLeadsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    
    return apiRequest<PaginatedLeadsResponse>(`/api/v2/leads?${queryParams.toString()}`);
  },
  
  /**
   * Busca um lead específico pelo ID
   */
  getLeadById: async (id: number): Promise<LeadDetailResponse> => {
    return apiRequest<LeadDetailResponse>(`/api/v2/leads/${id}`);
  },
  
  /**
   * Cria um novo lead
   */
  createLead: async (data: CreateLeadData): Promise<Lead> => {
    const response = await apiRequest<{ data: Lead }>('/api/v2/leads', {
      method: 'POST',
      data
    });
    
    return response.data;
  },
  
  /**
   * Atualiza um lead existente
   */
  updateLead: async (id: number, data: UpdateLeadData): Promise<Lead> => {
    const response = await apiRequest<{ data: Lead }>(`/api/v2/leads/${id}`, {
      method: 'PATCH',
      data
    });
    
    return response.data;
  },
  
  /**
   * Adiciona uma atividade a um lead
   */
  addLeadActivity: async (leadId: number, data: CreateLeadActivityData): Promise<LeadActivity> => {
    const response = await apiRequest<{ data: LeadActivity }>(`/api/v2/leads/${leadId}/activities`, {
      method: 'POST',
      data
    });
    
    return response.data;
  }
};