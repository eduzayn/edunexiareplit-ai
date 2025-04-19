import React, { ReactNode } from 'react';
import AdminLayout from './admin-layout';
import { useAuth } from '@/hooks/use-auth';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Componente de layout que direciona para o layout apropriado
 * com base no tipo de usuário logado
 */
export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  // Se for admin, usa o layout de admin
  if (user?.portalType === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Layout padrão para quando não tiver um layout específico
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">{children}</main>
    </div>
  );
}