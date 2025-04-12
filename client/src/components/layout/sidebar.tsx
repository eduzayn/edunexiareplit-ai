import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
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

  useEffect(() => {
    // Get current path to highlight active sidebar item
    setCurrentPath(window.location.pathname);
  }, []);

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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-neutral-950 text-white hidden md:block">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/" className="flex items-center">
            <SchoolIcon className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">EdunexIA</span>
          </Link>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-6">
            <Avatar className="w-10 h-10 mr-3" style={{ backgroundColor: portalColor }}>
              <AvatarFallback>{getUserInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">{user?.fullName || "Usuário"}</h3>
              <p className="text-xs text-neutral-400">{portalLabel}</p>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-180px)]">
            <nav className="space-y-1 pr-4">
              {items.map((item) => {
                const isActive = item.active || currentPath === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-md ${
                      isActive
                        ? `text-white bg-primary`
                        : `text-neutral-400 hover:text-white hover:bg-neutral-800`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-neutral-800">
          <Button
            variant="ghost"
            className="flex items-center w-full justify-start text-neutral-400 hover:text-white"
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
            <Menu className="h-5 w-5 text-neutral-500" />
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
            className="w-64 h-full bg-neutral-950 text-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center">
                <SchoolIcon className="h-6 w-6 mr-2" />
                <span className="text-xl font-bold">EdunexIA</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-white"
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
                <h3 className="font-medium text-white">{user?.fullName || "Usuário"}</h3>
                <p className="text-xs text-neutral-400">{portalLabel}</p>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-180px)]">
              <nav className="space-y-1 pr-4">
                {items.map((item) => {
                  const isActive = item.active || currentPath === item.href;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-md ${
                        isActive
                          ? `text-white bg-primary`
                          : `text-neutral-400 hover:text-white hover:bg-neutral-800`
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
            
            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-neutral-800">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start text-neutral-400 hover:text-white"
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
