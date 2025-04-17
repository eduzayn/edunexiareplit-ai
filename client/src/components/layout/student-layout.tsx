import React from 'react';
import { useLocation, Link } from 'wouter';
import StudentSidebar from './student-sidebar';
import { Menu, X } from 'lucide-react';

interface StudentLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal para as páginas do portal do estudante
 */
const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [location] = useLocation();
  
  // Fecha a barra lateral quando a localização muda (navegação em dispositivos móveis)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar para desktop (visível em telas maiores) */}
      <div className="hidden md:block">
        <StudentSidebar />
      </div>

      {/* Overlay para quando a sidebar está aberta em dispositivos móveis */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar para dispositivos móveis (visível quando isSidebarOpen=true) */}
      {isSidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
          <StudentSidebar 
            isMobile={true} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Cabeçalho para dispositivos móveis */}
        <header className="bg-white border-b border-gray-200 py-3 px-4 flex items-center justify-between md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          
          <Link href="/student" className="flex items-center space-x-1">
            <span className="font-semibold text-gray-800">Portal do Aluno</span>
          </Link>
          
          <div className="w-8" /> {/* Espaço para equilibrar o layout */}
        </header>

        {/* Área de rolagem do conteúdo */}
        <div className="flex-1 overflow-y-auto pb-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;