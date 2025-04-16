import { apiRequest } from "@/lib/queryClient";

/**
 * Interface para os dados necessários para criação de um link de checkout
 */
export interface CheckoutLinkData {
  leadId: number;
  description: string;
  value: number;
  dueDate: string; // Formato YYYY-MM-DD
  expirationTime?: number; // Tempo de expiração em minutos (padrão: 30)
  courseId?: number;
  productId?: number;
}

/**
 * Interface para a resposta de criação de link de checkout
 */
export interface CheckoutLinkResponse {
  id: number;
  leadId: number;
  asaasCheckoutId: string;
  description: string;
  value: number;
  dueDate: string;
  expirationTime: number;
  status: string;
  url: string;
  createdAt: string;
}

/**
 * Interface para o status do checkout
 */
export interface CheckoutStatus {
  id: string;
  status: string;
  value: number;
  description: string;
  billingType?: string;
  dueDate: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  payment?: {
    id: string;
    status: string;
    value: number;
    netValue: number;
    description: string;
    billingType: string;
    dueDate: string;
    paymentDate?: string;
  };
}

/**
 * API Client para integração com serviços de checkout
 */
export const checkoutApi = {
  /**
   * Cria um novo link de checkout para um lead
   */
  createCheckoutLink: async (data: CheckoutLinkData): Promise<CheckoutLinkResponse> => {
    const response = await apiRequest<{ 
      success: boolean;
      data: CheckoutLinkResponse;
      message?: string;
    }>('/api/v2/checkout/links', {
      method: 'POST',
      data
    });
    
    return response.data;
  },
  
  /**
   * Obtém o status de um link de checkout
   */
  getCheckoutStatus: async (checkoutId: string): Promise<CheckoutStatus> => {
    const response = await apiRequest<{
      success: boolean;
      data: CheckoutStatus;
    }>(`/api/v2/checkout/status/${checkoutId}`);
    
    return response.data;
  },
  
  /**
   * Cancela um link de checkout ativo
   */
  cancelCheckoutLink: async (checkoutId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/api/v2/checkout/links/${checkoutId}/cancel`, {
      method: 'POST'
    });
  },
  
  /**
   * Lista todos os links de checkout para um lead
   */
  getCheckoutLinksForLead: async (leadId: number): Promise<CheckoutLinkResponse[]> => {
    const response = await apiRequest<{
      success: boolean;
      data: CheckoutLinkResponse[];
    }>(`/api/v2/checkout/links/lead/${leadId}`);
    
    return response.data;
  }
};