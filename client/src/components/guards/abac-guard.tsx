/**
 * Componente para verificação de permissões contextuais ABAC
 */

import React, { useEffect, useState } from 'react';
import { useABAC } from '@/hooks/use-abac';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';

interface AbacGuardProps {
  /* Recurso a ser verificado */
  resource: string;
  
  /* Ação a ser verificada */
  action: string;
  
  /* Condições ABAC */
  condition: {
    entityId?: number;
    institutionId?: number;
    poloId?: number;
    subscriptionStatus?: string;
    paymentStatus?: string;
    institutionPhase?: string;
    entityOwnerId?: number;
    dateRange?: { start: Date; end: Date };
  };
  
  /* Conteúdo a ser renderizado quando a permissão for concedida */
  children: React.ReactNode;
  
  /* Conteúdo a ser renderizado quando a permissão for negada */
  fallback?: React.ReactNode;
  
  /* Componente de carregamento personalizado */
  loadingComponent?: React.ReactNode;
}

/**
 * Componente AbacGuard para verificação de permissões contextuais
 * 
 * Exemplo de uso:
 * <AbacGuard 
 *   resource="invoices" 
 *   action="create" 
 *   condition={{ 
 *     institutionId: 5, 
 *     paymentStatus: "pending" 
 *   }}
 * >
 *   <RestrictedComponent />
 * </AbacGuard>
 */
export const AbacGuard: React.FC<AbacGuardProps> = ({
  resource,
  action,
  condition,
  children,
  fallback = null,
  loadingComponent
}) => {
  const { hasPermission } = usePermissions();
  const { checkContextualPermission, isCheckingPermission } = useABAC();
  const [hasAbacPermission, setHasAbacPermission] = useState<boolean | null>(null);
  
  // Verificar permissão RBAC básica primeiro
  const hasRbacPermission = hasPermission(resource, action);
  
  // Verificar permissão ABAC se a permissão RBAC básica for concedida
  useEffect(() => {
    const checkPermission = async () => {
      if (!hasRbacPermission) {
        setHasAbacPermission(false);
        return;
      }
      
      try {
        const result = await checkContextualPermission({
          resource,
          action,
          ...condition
        });
        
        setHasAbacPermission(result);
      } catch (error) {
        console.error('Erro ao verificar permissão ABAC:', error);
        setHasAbacPermission(false);
      }
    };
    
    checkPermission();
  }, [resource, action, condition, hasRbacPermission, checkContextualPermission]);
  
  // Componente de carregamento durante verificação ABAC
  if (isCheckingPermission || hasAbacPermission === null) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <Skeleton className="h-24 w-full" />;
  }
  
  // Renderizar conteúdo com base na permissão
  if (hasAbacPermission) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default AbacGuard;