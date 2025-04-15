import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { usePermissions } from './use-permissions';

interface ContextCondition {
  resource: string;
  action: string;
  entityId?: number;
  institutionId?: number;
  poloId?: number;
  // Condições dinâmicas específicas
  subscriptionStatus?: string;
  paymentStatus?: string;
  institutionPhase?: string;
  entityOwnerId?: number;
  dateRange?: { start: Date; end: Date };
}

/**
 * Hook para verificação de permissões baseadas em contexto (ABAC)
 * Implementa o componente Attribute-Based Access Control do sistema híbrido
 */
export function useABAC() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [contextCache, setContextCache] = useState<Record<string, boolean>>({});

  // Função para verificar condições baseadas em contexto
  const checkCondition = async (condition: ContextCondition): Promise<boolean> => {
    // Gera uma chave única para a condição para cache
    const cacheKey = JSON.stringify(condition);
    
    // Verifica se já temos este resultado em cache
    if (contextCache[cacheKey] !== undefined) {
      return contextCache[cacheKey];
    }
    
    // Verificação básica de permissão RBAC primeiro
    const hasBasicPermission = await hasPermission(condition.resource, condition.action);
    
    if (!hasBasicPermission || !user) {
      setContextCache(prev => ({ ...prev, [cacheKey]: false }));
      return false;
    }
    
    try {
      // Fazer a verificação contextual no servidor
      const response = await fetch('/api/permissions/check-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          condition,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        setContextCache(prev => ({ ...prev, [cacheKey]: false }));
        return false;
      }
      
      const { allowed } = await response.json();
      setContextCache(prev => ({ ...prev, [cacheKey]: allowed }));
      return allowed;
    } catch (error) {
      console.error('Erro ao verificar permissão contextual:', error);
      setContextCache(prev => ({ ...prev, [cacheKey]: false }));
      return false;
    }
  };
  
  // Função para verificar se o usuário é proprietário de uma entidade
  const isEntityOwner = async (resource: string, entityId: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/permissions/is-owner/${resource}/${entityId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) return false;
      
      const { isOwner } = await response.json();
      return isOwner;
    } catch (error) {
      console.error('Erro ao verificar propriedade da entidade:', error);
      return false;
    }
  };
  
  // Função para verificar permissões de período financeiro/acadêmico
  const checkPeriodAccess = async (
    resource: string, 
    action: string, 
    targetDate: Date,
    institutionId?: number
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/permissions/check-period`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          resource,
          action,
          targetDate: targetDate.toISOString(),
          institutionId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) return false;
      
      const { allowed } = await response.json();
      return allowed;
    } catch (error) {
      console.error('Erro ao verificar acesso por período:', error);
      return false;
    }
  };
  
  // Função para verificar permissões baseadas na fase da instituição
  const checkInstitutionPhase = async (
    resource: string,
    action: string,
    institutionId: number
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/permissions/check-institution-phase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          resource,
          action,
          institutionId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) return false;
      
      const { allowed } = await response.json();
      return allowed;
    } catch (error) {
      console.error('Erro ao verificar permissão baseada na fase da instituição:', error);
      return false;
    }
  };
  
  // Função para verificar permissões baseadas no status do pagamento
  const checkPaymentStatus = async (
    resource: string,
    action: string,
    entityId: number
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`/api/permissions/check-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          resource,
          action,
          entityId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) return false;
      
      const { allowed } = await response.json();
      return allowed;
    } catch (error) {
      console.error('Erro ao verificar permissão baseada no status de pagamento:', error);
      return false;
    }
  };
  
  // Limpar cache quando o usuário mudar
  useEffect(() => {
    setContextCache({});
  }, [user]);
  
  return {
    checkCondition,
    isEntityOwner,
    checkPeriodAccess,
    checkInstitutionPhase,
    checkPaymentStatus
  };
}