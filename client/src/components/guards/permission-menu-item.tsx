/**
 * Componente de item de menu com verificação de permissão integrada
 */

import React from 'react';
import { 
  DropdownMenuItem,
  DropdownMenuItemProps
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useABAC } from '@/hooks/use-abac';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionMenuItemProps extends DropdownMenuItemProps {
  /* Recurso a ser verificado */
  resource: string;
  
  /* Ação a ser verificada */
  action: string;
  
  /* Texto de tooltip quando o acesso for negado */
  deniedTooltip?: string;
  
  /* Condição ABAC (opcional) */
  abacCondition?: {
    entityId?: number;
    institutionId?: number;
    poloId?: number;
    subscriptionStatus?: string;
    paymentStatus?: string;
    institutionPhase?: string;
    entityOwnerId?: number;
    dateRange?: { start: Date; end: Date };
  };
  
  /* Renderiza ou não quando o acesso for negado */
  renderWhenDenied?: boolean;

  /* Função callback para o clique */
  onClick?: () => void;

  /* Conteúdo do item de menu */
  children: React.ReactNode;
}

export const PermissionMenuItem: React.FC<PermissionMenuItemProps> = ({
  resource,
  action,
  deniedTooltip = 'Você não tem permissão para realizar esta ação',
  abacCondition,
  renderWhenDenied = false, // Por padrão, não renderiza quando negado
  onClick,
  children,
  ...menuItemProps
}) => {
  const { hasPermission } = usePermissions();
  const { checkContextualPermission, isCheckingPermission } = useABAC();
  const [hasAbacPermission, setHasAbacPermission] = React.useState<boolean | null>(null);
  
  // Verificar permissão RBAC básica
  const hasRbacPermission = hasPermission(resource, action);
  
  // Verificar permissão ABAC se necessário
  React.useEffect(() => {
    const checkAbacPermission = async () => {
      if (!abacCondition || !hasRbacPermission) {
        setHasAbacPermission(hasRbacPermission);
        return;
      }
      
      const result = await checkContextualPermission({
        resource,
        action,
        ...abacCondition
      });
      
      setHasAbacPermission(result);
    };
    
    checkAbacPermission();
  }, [resource, action, abacCondition, hasRbacPermission, checkContextualPermission]);
  
  // Verificar se a permissão foi concedida (RBAC + ABAC)
  const isAllowed = abacCondition 
    ? hasAbacPermission 
    : hasRbacPermission;
  
  // Mostrar esqueleto durante a verificação ABAC
  if (abacCondition && (isCheckingPermission || hasAbacPermission === null)) {
    return <Skeleton className="h-8 w-full" />;
  }
  
  // Não renderizar nada se o acesso for negado e renderWhenDenied for false
  if (!isAllowed && !renderWhenDenied) {
    return null;
  }
  
  return (
    <MenuItem
      {...menuItemProps}
      onClick={isAllowed ? onClick : undefined}
      disabled={!isAllowed || menuItemProps.disabled}
      title={!isAllowed ? deniedTooltip : menuItemProps.title}
    >
      {children}
    </MenuItem>
  );
};

export default PermissionMenuItem;