import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronDown, LogOut, X } from 'lucide-react';
import studentSidebarItems, { SidebarItem } from './student-sidebar-items';
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
  isOpen: boolean;
  toggleSidebar: () => void;
}

const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isOpen,
  toggleSidebar,
}) => {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { user, logoutMutation } = useAuth();
  
  // Tipo do usuário pode variar, então usamos nomes alternativos
  const userName = user?.fullName || user?.username || 'Aluno';
  
  // Extrair iniciais do nome do usuário
  const initials = user?.fullName 
    ? user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() || 'EA';

  const toggleExpandItem = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = location === item.href;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.label];

    return (
      <div key={item.href} className="mb-1">
        <Link href={item.href}>
          <a
            className={cn(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-700 hover:bg-primary/10 hover:text-primary',
              depth > 0 && 'ml-4'
            )}
            onClick={(e) => {
              if (hasSubItems) {
                e.preventDefault();
                toggleExpandItem(item.label);
              }
            }}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {hasSubItems && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'transform rotate-180'
                )}
              />
            )}
          </a>
        </Link>
        {hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.subItems?.map((subItem) => renderSidebarItem(subItem, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Versão mobile usando Sheet
  const mobileSidebar = (
    <Sheet open={isOpen} onOpenChange={toggleSidebar}>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center">
            <span className="text-xl font-bold text-primary">Edunexia</span>
            <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              Aluno
            </span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {studentSidebarItems.map((item) => renderSidebarItem(item))}
            </div>
          </div>
          
          <div className="border-t p-4">
            <div className="flex items-center mb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Versão desktop
  const desktopSidebar = (
    <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:min-h-screen">
      <div className="p-4 border-b">
        <Link href="/student/dashboard">
          <a className="flex items-center">
            <span className="text-xl font-bold text-primary">Edunexia</span>
            <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
              Aluno
            </span>
          </a>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {studentSidebarItems.map((item) => renderSidebarItem(item))}
        </div>
      </div>
      
      <div className="border-t p-4">
        <div className="flex items-center mb-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt={userName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {mobileSidebar}
      {desktopSidebar}
    </>
  );
};

export default StudentSidebar;