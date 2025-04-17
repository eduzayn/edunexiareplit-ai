import React from 'react';
import { useLocation, Link } from 'wouter';
import { SidebarItem, getStudentSidebarItems } from './student-sidebar-items';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';

interface StudentSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Componente para exibir a barra lateral do portal do estudante
 */
const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isMobile = false,
  onClose,
  className = '',
}) => {
  const [location] = useLocation();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  
  // Obtém os itens da barra lateral baseado na localização atual
  const sidebarItems = getStudentSidebarItems(location);

  // Alterna o estado de abertura/fechamento do submenu
  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  // Renderiza um item do menu
  const renderMenuItem = (item: SidebarItem, index: number) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenu === item.label;
    
    // Define a classe do item do menu baseada no estado ativo e hover
    const itemClass = `
      flex items-center justify-between rounded-md px-3 py-2.5 cursor-pointer
      ${item.active ? 'bg-blue-100 text-primary-700 font-medium' : 'text-gray-700 hover:bg-blue-50'}
      ${isMobile ? 'text-base' : 'text-sm'}
      transition-all duration-200 ease-in-out
    `;

    // Renderiza o item como um botão se tiver submenu, ou como um link se não tiver
    return (
      <div key={index} className="my-1">
        {hasSubmenu ? (
          <>
            <div
              className={itemClass}
              onClick={() => toggleSubmenu(item.label)}
              data-testid={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {isSubmenuOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </div>
            
            {isSubmenuOpen && item.submenu && (
              <div className="ml-6 mt-1">
                {item.submenu.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    href={subItem.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm
                      ${subItem.active ? 'bg-blue-100 text-primary-700 font-medium' : 'text-gray-700 hover:bg-blue-50'}
                      transition-all duration-200 ease-in-out
                    `}
                    data-testid={`sidebar-subitem-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {subItem.icon}
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <Link
            href={item.href}
            onClick={() => {
              if (item.onClick) item.onClick();
              if (onClose) onClose();
            }}
            className={itemClass}
            data-testid={`sidebar-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <aside 
      className={`flex flex-col pb-4 ${className} ${
        isMobile ? 'w-full' : 'w-64 border-r border-gray-200'
      }`}
    >
      {/* Cabeçalho da barra lateral */}
      <div className="flex flex-col p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center space-y-1 my-3">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            <div className="text-2xl font-bold text-primary">
              {/* Iniciais do usuário ou avatar */}
              ES
            </div>
          </div>
          <h3 className="font-semibold text-gray-800">Estudante</h3>
          <span className="text-xs text-gray-500">Portal do Aluno</span>
        </div>
      </div>

      {/* Lista de itens do menu */}
      <nav className="flex-1 px-3 mt-3">
        {sidebarItems.map(renderMenuItem)}
      </nav>

      {/* Botão de logout na barra lateral */}
      <div className="px-3 mt-auto">
        <Link
          href="/auth/logout"
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 ease-in-out"
          data-testid="sidebar-logout"
        >
          <LogOut size={18} />
          <span>Sair da conta</span>
        </Link>
      </div>
    </aside>
  );
};

export default StudentSidebar;