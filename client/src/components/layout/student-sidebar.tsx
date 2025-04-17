import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown, LogOut } from 'lucide-react';
import { getStudentSidebarItems, SidebarItem } from './student-sidebar-items';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

interface StudentSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Componente para exibir a barra lateral do portal do estudante
 */
export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isMobile = false,
  onClose,
  className = '',
}) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const items = getStudentSidebarItems(location);

  const toggleSubmenu = (label: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const renderMenuItem = (item: SidebarItem, index: number) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openMenus[item.label] || false;

    return (
      <li key={index} className="w-full">
        {hasSubmenu ? (
          <>
            <button
              onClick={() => toggleSubmenu(item.label)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-colors',
                item.active
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-blue-50'
              )}
            >
              <div className="flex items-center">
                <span className="mr-3 text-blue-600">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'transition-transform',
                  isSubmenuOpen ? 'transform rotate-180' : ''
                )}
              />
            </button>
            {isSubmenuOpen && (
              <ul className="ml-8 mt-1 space-y-1">
                {item.submenu!.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <Link href={subItem.href}>
                      <a
                        className={cn(
                          'flex items-center px-4 py-2 rounded-lg transition-colors text-sm',
                          subItem.active
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-blue-50'
                        )}
                        onClick={isMobile ? onClose : undefined}
                      >
                        <span className="mr-2 text-blue-600">{subItem.icon}</span>
                        <span>{subItem.label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Link href={item.href}>
            <a
              className={cn(
                'flex items-center px-4 py-3 rounded-lg transition-colors',
                item.active
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-blue-50'
              )}
              onClick={isMobile ? onClose : undefined}
            >
              <span className="mr-3 text-blue-600">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </a>
          </Link>
        )}
      </li>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center mb-6">
          <Avatar className="h-12 w-12 border border-gray-200">
            <AvatarImage src={user?.profileImage || ''} alt={user?.name || "Usuário"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              {(user?.name || "U").substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-800">{user?.name || "Usuário"}</h3>
            <p className="text-sm text-gray-500">Estudante</p>
          </div>
        </div>
        <ul className="space-y-1">
          {items.map(renderMenuItem)}
        </ul>
      </div>
      <div className="mt-auto border-t border-gray-200 py-4 px-4">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="px-4 py-3 border-b border-gray-200">
            <SheetTitle className="text-blue-600">Portal do Aluno</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 h-screen w-64 flex-shrink-0 fixed z-10',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-blue-600">Portal do Aluno</h2>
      </div>
      {sidebarContent}
    </aside>
  );
};