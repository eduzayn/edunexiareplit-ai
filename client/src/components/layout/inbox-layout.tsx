import React from "react";
import AdminLayout from "./admin-layout";

interface InboxLayoutProps {
  children: React.ReactNode;
}

export const InboxLayout: React.FC<InboxLayoutProps> = ({ children }) => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AdminLayout>
  );
};