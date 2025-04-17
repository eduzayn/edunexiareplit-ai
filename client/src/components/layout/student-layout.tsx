import { ReactNode } from "react";
import { useLocation } from "wouter";
import StudentSidebar from "./student-sidebar";

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();

  // Verificar se o usuário está na página de login, caso esteja, renderizar sem o sidebar
  if (location === "/login" || location === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <StudentSidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}