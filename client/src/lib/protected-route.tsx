import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { PortalType } from "@shared/schema";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { PartnerDashboard } from "@/components/dashboard/partner-dashboard";
import { PoloDashboard } from "@/components/dashboard/polo-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

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

        // Se o usuário não estiver autenticado, redirecione para a página de autenticação
        if (!user) {
          console.log("ProtectedRoute - Usuário não autenticado");
          
          // Usando setTimeout para evitar redirecionamentos imediatos que podem ser
          // interrompidos por atualizações de estado subsequentes
          setTimeout(() => {
            navigate(`/auth?portal=${portalType}`);
          }, 100);
          
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-gray-600">Redirecionando para página de autenticação...</p>
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
