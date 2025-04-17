import React, { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { PortalType } from "@shared/schema";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { PartnerDashboard } from "@/components/dashboard/partner-dashboard";
import { PoloDashboard } from "@/components/dashboard/polo-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { queryClient } from "@/lib/queryClient";

interface ProtectedRouteProps {
  path: string;
  portalType: PortalType;
}

export function ProtectedRoute({ path, portalType }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Map portal types to their dashboard components
  const dashboardComponents = {
    student: StudentDashboard,
    partner: PartnerDashboard,
    polo: PoloDashboard,
    admin: AdminDashboard,
  };

  const DashboardComponent = dashboardComponents[portalType];

  // Usar useEffect para evitar problemas de renderização e redirecionamento
  useEffect(() => {
    // Se não estiver carregando e o usuário não estiver autenticado, redirecionar manualmente
    if (!isLoading && !user) {
      console.log("useEffect - Usuário não autenticado, redirecionando...");
      
      // Limpar qualquer cache que possa estar interferindo
      queryClient.clear();
      
      // Usar window.location para forçar um recarregamento completo e evitar problemas de estado
      if (window.location.pathname.includes(`/${portalType}/`)) {
        // Pequeno delay para garantir que o efeito não entre em loop
        setTimeout(() => {
          window.location.href = `/${portalType}`;
        }, 300);
      }
    } else if (!isLoading && user && user.portalType !== portalType) {
      // Se o usuário estiver autenticado, mas com o tipo de portal errado
      console.log("useEffect - Portal type incorreto, redirecionando...");
      console.log("Tipo atual:", user.portalType, "Tipo esperado:", portalType);
      
      // Redirecionar para o portal correto
      setTimeout(() => {
        window.location.href = `/${user.portalType}/dashboard`;
      }, 300);
    }
  }, [isLoading, user, portalType]);

  return (
    <Route path={path}>
      {() => {
        // Logs para depuração
        console.log("ProtectedRoute - path:", path);
        console.log("ProtectedRoute - portalType esperado:", portalType);
        console.log("ProtectedRoute - user:", user);
        console.log("ProtectedRoute - user.portalType:", user?.portalType);

        // Se estiver carregando, mostre um indicador de carregamento
        if (isLoading) {
          console.log("ProtectedRoute - Carregando...");
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Se o usuário não estiver autenticado, mostrar mensagem e redirecionar
        // O redirecionamento efetivo é feito pelo useEffect acima
        if (!user) {
          console.log("ProtectedRoute - Usuário não autenticado");
          
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-gray-600">Verificando autenticação...</p>
            </div>
          );
        }

        // Garantir que ambos os valores sejam strings para comparação
        const userPortalType = String(user.portalType).toLowerCase();
        const expectedPortalType = String(portalType).toLowerCase();
        
        console.log("ProtectedRoute - userPortalType:", userPortalType);
        console.log("ProtectedRoute - expectedPortalType:", expectedPortalType);

        // Check if user has access to the requested portal
        if (userPortalType !== expectedPortalType) {
          console.log("ProtectedRoute - Acesso negado. Tipos de portal não coincidem");
          
          setTimeout(() => {
            navigate(`/${user.portalType}/dashboard`);
          }, 100);
          
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
              <p className="text-gray-600 mb-6">
                Você não tem permissão para acessar este portal.
              </p>
              <p className="text-sm text-gray-500">
                Redirecionando para o seu portal...
              </p>
            </div>
          );
        }

        console.log("ProtectedRoute - Acesso autorizado, renderizando dashboard");
        return <DashboardComponent />;
      }}
    </Route>
  );
}
