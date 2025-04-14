import React from "react";
import AdminLayout from "./admin-layout";

interface InboxLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const InboxLayout: React.FC<InboxLayoutProps> = ({ children, showSidebar = false }) => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        {showSidebar ? (
          <div className="flex h-[calc(100vh-64px)]">
            <div className="w-80 border-r shrink-0 overflow-y-auto">
              {/* Sidebar de conversas */}
              <div className="py-2 px-3 h-full flex flex-col">
                <div className="sticky top-0 bg-background pb-2 z-10">
                  <h2 className="font-semibold text-lg mb-2">Caixa de entrada</h2>
                  <div className="relative mb-2">
                    <input 
                      type="text" 
                      placeholder="Buscar conversas..." 
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {/* Componente será preenchido dinamicamente com as conversas */}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </AdminLayout>
  );
};