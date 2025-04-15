import React, { useState, useEffect, ReactNode } from 'react';
import { useABAC } from '@/hooks/use-abac';

interface ABACGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  // Condições contextuais opcionais
  entityId?: number;
  institutionId?: number;
  poloId?: number;
  subscriptionStatus?: string;
  paymentStatus?: string;
  institutionPhase?: string;
  entityOwnerId?: number;
  dateRange?: { start: Date; end: Date };
  // Callback para erros
  onError?: (error: Error) => void;
}

/**
 * Componente de guarda para verificação contextual de permissões
 * Implementa o padrão ABAC (Attribute-Based Access Control)
 */
export function ABACGuard({
  resource,
  action,
  children,
  fallback = null,
  entityId,
  institutionId,
  poloId,
  subscriptionStatus,
  paymentStatus,
  institutionPhase,
  entityOwnerId,
  dateRange,
  onError
}: ABACGuardProps) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { checkCondition } = useABAC();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const allowed = await checkCondition({
          resource,
          action,
          entityId,
          institutionId,
          poloId,
          subscriptionStatus,
          paymentStatus,
          institutionPhase,
          entityOwnerId,
          dateRange
        });
        
        setIsAllowed(allowed);
        setError(null);
      } catch (err) {
        console.error('Erro na verificação ABAC:', err);
        setIsAllowed(false);
        setError(err instanceof Error ? err : new Error('Erro desconhecido na verificação de permissão'));
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    };

    verifyAccess();
  }, [
    resource, 
    action, 
    entityId, 
    institutionId, 
    poloId,
    subscriptionStatus,
    paymentStatus,
    institutionPhase,
    entityOwnerId,
    dateRange,
    checkCondition,
    onError
  ]);

  // Estado de carregamento inicial
  if (isAllowed === null) {
    return null; // Não renderiza nada durante a verificação inicial
  }

  // Renderização condicional baseada na permissão
  return isAllowed ? <>{children}</> : <>{fallback}</>;
}