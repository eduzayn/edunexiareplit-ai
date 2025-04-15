/**
 * Hook para verificação de permissões contextuais ABAC
 */

import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { apiRequest } from '@/lib/queryClient';

interface ABACCondition {
  resource: string;
  action: string;
  entityId?: number;
  institutionId?: number;
  poloId?: number;
  subscriptionStatus?: string;
  paymentStatus?: string;
  institutionPhase?: string;
  entityOwnerId?: number;
  dateRange?: { start: Date; end: Date };
}

export const useABAC = () => {
  const { user } = useAuth();
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  /**
   * Verifica se o usuário possui permissão baseada em contexto específico
   * @param condition Condição ABAC a ser verificada
   * @returns {Promise<boolean>} Permissão concedida ou não
   */
  const checkContextualPermission = useCallback(
    async (condition: ABACCondition): Promise<boolean> => {
      if (!user) return false;
      
      setIsCheckingPermission(true);
      
      try {
        const response = await apiRequest<{ hasPermission: boolean }>('/api/permissions/abac/check', {
          method: 'POST',
          data: {
            ...condition,
            userId: user.id
          }
        });
        
        return response.hasPermission;
      } catch (error) {
        console.error('Erro ao verificar permissão contextual:', error);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    },
    [user]
  );

  /**
   * Verifica se o usuário é proprietário de um recurso específico
   * @param resourceType Tipo do recurso (ex: 'courses', 'products', etc)
   * @param entityId ID da entidade
   * @returns {Promise<boolean>} É o proprietário ou não
   */
  const checkEntityOwnership = useCallback(
    async (resourceType: string, entityId: number): Promise<boolean> => {
      if (!user) return false;
      
      setIsCheckingPermission(true);
      
      try {
        const response = await apiRequest<{ isOwner: boolean }>('/api/permissions/abac/check-ownership', {
          method: 'POST',
          data: {
            userId: user.id,
            resourceType,
            entityId
          }
        });
        
        return response.isOwner;
      } catch (error) {
        console.error('Erro ao verificar propriedade do recurso:', error);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    },
    [user]
  );

  /**
   * Verifica permissões baseadas na fase da instituição
   * @param resource Nome do recurso
   * @param action Ação a ser verificada
   * @param institutionId ID da instituição
   * @returns {Promise<boolean>} Permissão concedida ou não
   */
  const checkInstitutionPhasePermission = useCallback(
    async (resource: string, action: string, institutionId: number): Promise<boolean> => {
      if (!user) return false;
      
      setIsCheckingPermission(true);
      
      try {
        const response = await apiRequest<{ hasPermission: boolean }>(
          '/api/permissions/abac/check-institution-phase', 
          {
            method: 'POST',
            data: {
              userId: user.id,
              resource,
              action,
              institutionId
            }
          }
        );
        
        return response.hasPermission;
      } catch (error) {
        console.error('Erro ao verificar permissão baseada na fase da instituição:', error);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    },
    [user]
  );

  /**
   * Verifica permissões baseadas no status do pagamento
   * @param resource Nome do recurso
   * @param action Ação a ser verificada
   * @param entityId ID da entidade
   * @returns {Promise<boolean>} Permissão concedida ou não
   */
  const checkPaymentStatusPermission = useCallback(
    async (resource: string, action: string, entityId: number): Promise<boolean> => {
      if (!user) return false;
      
      setIsCheckingPermission(true);
      
      try {
        const response = await apiRequest<{ hasPermission: boolean }>(
          '/api/permissions/abac/check-payment-status', 
          {
            method: 'POST',
            data: {
              userId: user.id,
              resource,
              action,
              entityId
            }
          }
        );
        
        return response.hasPermission;
      } catch (error) {
        console.error('Erro ao verificar permissão baseada no status do pagamento:', error);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    },
    [user]
  );

  /**
   * Verifica permissões baseadas no período acadêmico/financeiro
   * @param resource Nome do recurso
   * @param action Ação a ser verificada
   * @param targetDate Data alvo a ser verificada
   * @param institutionId ID da instituição (opcional)
   * @returns {Promise<boolean>} Permissão concedida ou não
   */
  const checkPeriodPermission = useCallback(
    async (
      resource: string, 
      action: string, 
      targetDate: Date, 
      institutionId?: number
    ): Promise<boolean> => {
      if (!user) return false;
      
      setIsCheckingPermission(true);
      
      try {
        const response = await apiRequest<{ hasPermission: boolean }>(
          '/api/permissions/abac/check-period', 
          {
            method: 'POST',
            data: {
              userId: user.id,
              resource,
              action,
              targetDate: targetDate.toISOString(),
              institutionId
            }
          }
        );
        
        return response.hasPermission;
      } catch (error) {
        console.error('Erro ao verificar permissão baseada no período:', error);
        return false;
      } finally {
        setIsCheckingPermission(false);
      }
    },
    [user]
  );

  return {
    checkContextualPermission,
    checkEntityOwnership,
    checkInstitutionPhasePermission,
    checkPaymentStatusPermission,
    checkPeriodPermission,
    isCheckingPermission
  };
};

export default useABAC;