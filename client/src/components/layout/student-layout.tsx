import React, { useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header do portal do estudante */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="mr-3 md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
            <Link href="/student/dashboard">
              <a className="flex items-center">
                <span className="text-xl font-bold text-primary">Edunexia</span>
                <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Aluno
                </span>
              </a>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/student/profile">
              <a className="text-sm text-gray-600 hover:text-primary">Meu Perfil</a>
            </Link>
          </div>
        </div>
      </header>

      {/* Container principal */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <StudentSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Conteúdo principal */}
        <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 min-h-[calc(100vh-150px)]">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay para fechar o sidebar em telas pequenas */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default StudentLayout;