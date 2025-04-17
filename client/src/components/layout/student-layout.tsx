import React, { useState } from 'react';
import { StudentSidebar } from './student-sidebar';
import { Menu, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface StudentLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout principal para o portal do estudante
 */
export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Barra lateral (visível apenas em desktop) */}
      <StudentSidebar className="hidden md:block" />

      {/* Menu móvel (visível apenas em dispositivos móveis) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <StudentSidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Barra de navegação */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              {/* Botão de menu hamburger para dispositivos móveis */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="ml-4 md:ml-0">
                <h1 className="text-xl font-semibold text-gray-800">Portal do Aluno</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notificações */}
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Menu de usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={user?.profileImage || ''} alt={user?.name || "Usuário"} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {(user?.name || "U").substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
                      <p className="text-xs leading-none text-gray-500">{user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/student/perfil">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/student/configuracoes">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className={cn("flex-1 p-4 md:p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};