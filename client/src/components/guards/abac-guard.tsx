/**
 * Componente de guarda ABAC (Attribute-Based Access Control)
 * Protege componentes dinamicamente com base em permissões contextuais
 */

import { useState, useEffect, ReactNode } from 'react';
import { useABAC } from '@/hooks/use-abac';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

interface ABACGuardProps {
  /* Condição ABAC a ser verificada */
  condition: ABACCondition;
  
  /* Conteúdo a ser renderizado se a permissão for concedida */
  children: ReactNode;
  
  /* Conteúdo alternativo a ser renderizado se a permissão for negada (opcional) */
  fallback?: ReactNode;
  
  /* Se deve mostrar um alerta de acesso negado (padrão: false) */
  showAccessDenied?: boolean;
  
  /* Mensagem personalizada de acesso negado (opcional) */
  accessDeniedMessage?: string;
  
  /* Se deve mostrar um skeleton de carregamento durante a verificação (padrão: true) */
  showSkeleton?: boolean;
}

export const ABACGuard: React.FC<ABACGuardProps> = ({
  condition,
  children,
  fallback,
  showAccessDenied = false,
  accessDeniedMessage = 'Você não tem permissão para acessar este recurso.',
  showSkeleton = true
}) => {
  const { checkContextualPermission, isCheckingPermission } = useABAC();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await checkContextualPermission(condition);
      setHasPermission(result);
    };

    checkPermission();
  }, [checkContextualPermission, condition]);

  // Mostrar skeleton durante a verificação (se ativado)
  if ((hasPermission === null || isCheckingPermission) && showSkeleton) {
    return (
      <div className="w-full space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  // Acesso negado
  if (hasPermission === false) {
    // Se tiver conteúdo fallback, use-o
    if (fallback) {
      return <>{fallback}</>;
    }

    // Se showAccessDenied for true, mostre o alerta
    if (showAccessDenied) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>{accessDeniedMessage}</AlertDescription>
        </Alert>
      );
    }

    // Caso contrário, não renderize nada
    return null;
  }

  // Acesso concedido
  return <>{children}</>;
};

export default ABACGuard;