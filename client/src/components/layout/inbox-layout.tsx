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
        <div className="flex h-[calc(100vh-64px)]">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};