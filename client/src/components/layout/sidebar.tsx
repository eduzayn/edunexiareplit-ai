import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarItem, SidebarCategory, SidebarItemOrCategory, isCategory } from "./admin-sidebar-items";

interface SidebarProps {
  items: SidebarItemOrCategory[];
  user: User | null;
  portalType: string;
  portalColor: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const portalTypeLabels = {
  student: "Portal do Aluno",
  partner: "Portal do Parceiro",
  polo: "Portal do Polo",
  admin: "Portal Administrativo",
};

export function Sidebar({
  items,
  user,
  portalType,
  portalColor,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const { logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [currentPath, setCurrentPath] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Atualizar o caminho atual quando a página mudar
  useEffect(() => {
    setCurrentPath(window.location.pathname);

    // Inicializar o estado das categorias expandidas com base nas categorias ativas
    const initialExpandedState: Record<string, boolean> = {};
    items.forEach(item => {
      if (isCategory(item)) {
        initialExpandedState[item.name] = item.expanded || false;
      }
    });
    setExpandedCategories(initialExpandedState);
  }, [items]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getUserInitials = (fullName: string | undefined): string => {
    if (!fullName) return "U";
    
    const names = fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const portalLabel = (portalType && portalTypeLabels[portalType as keyof typeof portalTypeLabels]) || "Portal";

  // Função para aplicar cor por tipo de portal
  const getPortalColor = () => {
    switch(portalType) {
      case "student": return "bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] border-r border-blue-100";
      case "partner": return "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe] border-r border-purple-100";
      case "polo": return "bg-gradient-to-b from-[#ecfdf5] to-[#d1fae5] border-r border-green-100";
      case "admin": return "bg-gradient-to-b from-[#f0f9ff] to-[#dbeafe] border-r border-blue-100";
      default: return "bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200";
    }
  };

  // Função para aplicar cor de destaque por tipo de portal
  const getHighlightColor = () => {
    switch(portalType) {
      case "student": return "text-blue-700 bg-blue-100 hover:bg-blue-200";
      case "partner": return "text-purple-700 bg-purple-100 hover:bg-purple-200";
      case "polo": return "text-green-700 bg-green-100 hover:bg-green-200";
      case "admin": return "text-blue-700 bg-blue-100 hover:bg-blue-200";
      default: return "text-gray-700 bg-gray-100 hover:bg-gray-200";
    }
  };
  
  // Função para colorir ícones com base no nome da seção
  const getColoredIcon = (name: string, icon: React.ReactNode, isActive: boolean) => {
    const iconClasses = {
      // Portal do Aluno
      "Dashboard": "text-blue-500",
      "Meus Cursos": "text-green-500",
      "Progresso": "text-purple-500",
      "Credencial": "text-indigo-500",
      "Calendário": "text-amber-500",
      "Documentos": "text-red-500",
      "Biblioteca": "text-teal-500",
      "Secretaria": "text-cyan-500",
      "Financeiro": "text-emerald-500",
      "Suporte": "text-orange-500",
      
      // Portal Administrativo - Categorias
      "Acadêmico": "text-indigo-500",
      "Institucional": "text-blue-600",
      "Pessoas": "text-purple-500",
      "Operacional": "text-teal-500",
      "Sistema": "text-slate-500",
      
      // Portal Administrativo - Itens
      "Disciplinas": "text-indigo-500",
      "Cursos": "text-green-500",
      "Instituições": "text-blue-600",
      "Usuários": "text-purple-500",
      "Parceiros": "text-yellow-600",
      "Polos": "text-teal-500",
      "Matrículas": "text-orange-500",
      "Financeiro Empresarial": "text-emerald-500",
      "Relatórios": "text-pink-500",
      "Integrações": "text-violet-500",
      "Segurança": "text-red-500",
      "Configurações": "text-gray-500",
    };
    
    // Aplica a classe de cor correspondente ao nome da seção
    const colorClass = iconClasses[name as keyof typeof iconClasses] || "text-gray-500";
    
    // Clona o elemento React com a nova classe
    return React.cloneElement(icon as React.ReactElement, {
      className: `h-5 w-5 ${colorClass} ${isActive ? 'text-primary' : ''}`
    });
  };

  // Verifica se um item de categoria tem algum item ativo
  const isCategoryActive = (category: SidebarCategory): boolean => {
    return category.items.some(item => 
      item.active || 
      currentPath === item.href || 
      (currentPath.includes(item.href) && item.href !== '/admin/dashboard')
    );
  };

  // Função para controlar a expansão/redução de uma categoria
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Renderiza um item simples da barra lateral
  const renderSidebarItem = (item: SidebarItem, closeOnClick = false) => {
    const isActive = item.active || currentPath === item.href;
    return (
      <Link 
        key={item.name} 
        href={item.href}
        className={`flex items-center px-4 py-2.5 rounded-md transition-all duration-150 ${
          isActive
            ? getHighlightColor()
            : `text-gray-600 hover:bg-gray-100 hover:text-gray-800`
        }`}
        onClick={closeOnClick ? () => setIsMobileMenuOpen(false) : undefined}
      >
        <span className="mr-3">{getColoredIcon(item.name, item.icon, isActive)}</span>
        {item.name}
      </Link>
    );
  };

  // Renderiza uma categoria com seus itens filhos
  const renderSidebarCategory = (category: SidebarCategory, closeOnClick = false) => {
    const isActive = isCategoryActive(category);
    const isExpanded = expandedCategories[category.name] || false;
    
    return (
      <div key={category.name} className="mb-1">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleCategory(category.name)}
        >
          <CollapsibleTrigger asChild>
            <button
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-md transition-all duration-150 ${
                isActive
                  ? `${getHighlightColor()} font-medium`
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">{getColoredIcon(category.name, category.icon, isActive)}</span>
                {category.name}
              </div>
              {isExpanded ? 
                <ChevronDownIcon className="h-4 w-4 opacity-70" /> : 
                <ChevronRightIcon className="h-4 w-4 opacity-70" />
              }
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pl-6 mt-1 space-y-1">
              {category.items.map(item => renderSidebarItem(item, closeOnClick))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Função que renderiza um item da barra lateral, seja um item ou uma categoria
  const renderSidebarItemOrCategory = (item: SidebarItemOrCategory, closeOnClick = false) => {
    if (isCategory(item)) {
      return renderSidebarCategory(item, closeOnClick);
    } else {
      return renderSidebarItem(item, closeOnClick);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`w-64 ${getPortalColor()} text-gray-700 hidden md:block`}>
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <SchoolIcon className="h-6 w-6 mr-2 text-primary" />
            <span className="text-xl font-bold text-gray-800">EdunexIA</span>
          </Link>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-6">
            <Avatar className="w-10 h-10 mr-3" style={{ backgroundColor: portalColor }}>
              <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-800">{user?.fullName || "Usuário"}</h3>
              <p className="text-xs text-gray-500">{portalLabel}</p>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-180px)]">
            <nav className="space-y-1 pr-4">
              {items.map(item => renderSidebarItemOrCategory(item))}
            </nav>
          </ScrollArea>
        </div>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="flex items-center w-full justify-start text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {logoutMutation.isPending ? "Saindo..." : "Sair"}
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>
          
          <Link href="/" className="flex items-center">
            <SchoolIcon className="h-5 w-5 mr-2 text-primary" />
            <span className="text-xl font-bold text-primary">EdunexIA</span>
          </Link>
          
          <Avatar className="w-8 h-8" style={{ backgroundColor: portalColor }}>
            <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className={`w-64 h-full ${getPortalColor()} p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center">
                <SchoolIcon className="h-6 w-6 mr-2 text-primary" />
                <span className="text-xl font-bold text-gray-800">EdunexIA</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center mb-6">
              <Avatar className="w-10 h-10 mr-3" style={{ backgroundColor: portalColor }}>
                <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-800">{user?.fullName || "Usuário"}</h3>
                <p className="text-xs text-gray-500">{portalLabel}</p>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-180px)]">
              <nav className="space-y-1 pr-4">
                {items.map(item => renderSidebarItemOrCategory(item, true))}
              </nav>
            </ScrollArea>
            
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-3 h-5 w-5" />
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
