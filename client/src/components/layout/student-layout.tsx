import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import StudentSidebar from './student-sidebar';

interface StudentLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal para as páginas do portal do estudante
 */
const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <div className="hidden md:block">
        <StudentSidebar />
      </div>

      {/* Sidebar móvel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop com efeito blur */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Sidebar slide-in */}
          <div className="fixed inset-y-0 left-0 z-40 w-full max-w-xs">
            <StudentSidebar isMobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Header móvel */}
        <div className="block md:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-primary">EdunexIA</span>
              <span className="text-sm text-gray-500">| Portal do Aluno</span>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;