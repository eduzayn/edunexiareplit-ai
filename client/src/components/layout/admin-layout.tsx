import { ReactNode } from "react";
import { useLocation } from "wouter";
import { getAdminSidebarItems } from "./admin-sidebar-items";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/ui/page-transition";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Verificar se o usuário tem permissão para acessar o portal admin
  if (!user || user.portalType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  // Gerar itens da barra lateral com base na rota atual
  const sidebarItems = getAdminSidebarItems(location);

  return (
    <div className="flex h-screen bg-background">
      {/* Barra lateral */}
      <Sidebar 
        items={sidebarItems} 
        user={user}
        portalType="admin"
        portalColor="#4CAF50" 
        isMobileMenuOpen={false}
        setIsMobileMenuOpen={() => {}}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}