import { useCallback, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { 
  FileTextIcon, 
  GraduationCapIcon, 
  HomeIcon, 
  BookOpenIcon,
  CreditCardIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
  UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/stores/user-store";

export default function StudentSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUserStore();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fazer logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }, [logout]);

  // Fechar sidebar em telas menores ao clicar em um link
  const handleNavClick = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <>
      {/* Botão do menu mobile */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white shadow-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <XIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Overlay para quando o menu estiver aberto no mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-br from-blue-50 to-blue-100 shadow-md transition-transform lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo e perfil */}
        <div className="flex flex-col items-center p-4 gap-3">
          <h1 className="text-xl font-bold text-primary mt-3">
            EdunexIA
          </h1>
          <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
            <UserIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-semibold">{user?.name || "Estudante"}</h2>
            <p className="text-sm text-gray-600">{user?.email || ""}</p>
          </div>
        </div>

        <Separator className="mb-2" />

        {/* Links */}
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 py-2">
            <NavItem
              href="/student"
              icon={<HomeIcon className="h-5 w-5" />}
              label="Início"
              isActive={location === "/student"}
              onClick={handleNavClick}
            />
            
            <NavItem
              href="/student/cursos"
              icon={<GraduationCapIcon className="h-5 w-5" />}
              label="Meus Cursos"
              isActive={location.startsWith("/student/cursos")}
              onClick={handleNavClick}
            />
            
            <NavItem
              href="/student/materiais"
              icon={<BookOpenIcon className="h-5 w-5" />}
              label="Materiais"
              isActive={location.startsWith("/student/materiais")}
              onClick={handleNavClick}
            />
            
            <NavItem
              href="/student/certificados"
              icon={<FileTextIcon className="h-5 w-5" />}
              label="Certificados"
              isActive={location.startsWith("/student/certificados")}
              onClick={handleNavClick}
            />
            
            <NavItem
              href="/student/financeiro"
              icon={<CreditCardIcon className="h-5 w-5" />}
              label="Financeiro"
              isActive={location.startsWith("/student/financeiro")}
              onClick={handleNavClick}
            />
          </nav>
        </ScrollArea>

        {/* Rodapé com botão de logout */}
        <div className="p-4">
          <Separator className="mb-4" />
          <Button 
            variant="outline" 
            className="w-full justify-between bg-white hover:bg-red-50"
            onClick={handleLogout}
          >
            <span className="flex items-center">
              <LogOutIcon className="h-5 w-5 mr-3 text-red-500" />
              Sair
            </span>
            <ChevronRightIcon className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </aside>
    </>
  );
}

// Componente para os itens de navegação
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive 
            ? "bg-blue-200 text-primary hover:bg-blue-200" 
            : "text-gray-700 hover:bg-blue-200/50 hover:text-primary"
        )}
        onClick={onClick}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
}