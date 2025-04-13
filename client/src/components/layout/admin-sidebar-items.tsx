import React from "react";
import {
  DashboardIcon,
  BusinessIcon,
  GroupIcon,
  SchoolIcon,
  MenuBookIcon,
  HandshakeIcon,
  StorefrontIcon,
  MonetizationOnIcon,
  BarChartIcon,
  CloudIcon,
  BuildIcon,
  SecurityIcon,
  SettingsIcon,
  AssignmentIcon,
  LayersIcon,
  UsersIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

// Interfaces para definir a estrutura dos itens da barra lateral
export interface SidebarItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

export interface SidebarCategory {
  name: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  expanded?: boolean;
}

export type SidebarItemOrCategory = SidebarItem | SidebarCategory;

// Função para verificar se um item é uma categoria
export function isCategory(item: SidebarItemOrCategory): item is SidebarCategory {
  return 'items' in item;
}

// Função para verificar se algum item dentro de uma categoria está ativo
function hasCategoryActiveItem(category: SidebarCategory, currentPath: string): boolean {
  return category.items.some(item => 
    item.active || 
    currentPath === item.href || 
    (currentPath && currentPath.includes(item.href) && item.href !== '/admin/dashboard')
  );
}

/**
 * Retorna uma lista estruturada de itens para a barra lateral do portal administrativo
 * com categorias e subcategorias para melhor organização
 */
export function getAdminSidebarItems(currentPath: string): SidebarItemOrCategory[] {
  // Item principal sempre visível no topo
  const mainItems: SidebarItemOrCategory[] = [
    { 
      name: "Dashboard", 
      icon: <DashboardIcon />, 
      href: "/admin/dashboard",
      active: currentPath === "/admin/dashboard"
    },
  ];

  // Categoria: Acadêmico
  const academicCategory: SidebarCategory = {
    name: "Acadêmico",
    icon: <MenuBookIcon />,
    expanded: hasCategoryActiveItem({
      name: "Acadêmico",
      icon: <MenuBookIcon />,
      items: [
        { 
          name: "Disciplinas", 
          icon: <MenuBookIcon />, 
          href: "/admin/disciplines",
          active: currentPath === "/admin/disciplines" || (currentPath && currentPath.includes("/admin/disciplines/"))
        },
        { 
          name: "Cursos", 
          icon: <SchoolIcon />, 
          href: "/admin/courses",
          active: currentPath === "/admin/courses" || (currentPath && currentPath.includes("/admin/courses/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Disciplinas", 
        icon: <MenuBookIcon />, 
        href: "/admin/disciplines",
        active: currentPath === "/admin/disciplines" || (currentPath && currentPath.includes("/admin/disciplines/"))
      },
      { 
        name: "Cursos", 
        icon: <SchoolIcon />, 
        href: "/admin/courses",
        active: currentPath === "/admin/courses" || (currentPath && currentPath.includes("/admin/courses/"))
      },
    ]
  };

  // Categoria: Institucional
  const institutionalCategory: SidebarCategory = {
    name: "Institucional",
    icon: <LayersIcon />,
    expanded: hasCategoryActiveItem({
      name: "Institucional",
      icon: <LayersIcon />,
      items: [
        { 
          name: "Instituições", 
          icon: <BusinessIcon />, 
          href: "/admin/institutions",
          active: currentPath === "/admin/institutions"
        },
        { 
          name: "Polos", 
          icon: <StorefrontIcon />, 
          href: "/admin/polos",
          active: currentPath === "/admin/polos"
        },
        { 
          name: "Parceiros", 
          icon: <HandshakeIcon />, 
          href: "/admin/partners",
          active: currentPath === "/admin/partners"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Instituições", 
        icon: <BusinessIcon />, 
        href: "/admin/institutions",
        active: currentPath === "/admin/institutions"
      },
      { 
        name: "Polos", 
        icon: <StorefrontIcon />, 
        href: "/admin/polos",
        active: currentPath === "/admin/polos"
      },
      { 
        name: "Parceiros", 
        icon: <HandshakeIcon />, 
        href: "/admin/partners",
        active: currentPath === "/admin/partners"
      },
    ]
  };

  // Categoria: Pessoas
  const peopleCategory: SidebarCategory = {
    name: "Pessoas",
    icon: <UsersIcon />,
    expanded: hasCategoryActiveItem({
      name: "Pessoas",
      icon: <UsersIcon />,
      items: [
        { 
          name: "Usuários", 
          icon: <GroupIcon />, 
          href: "/admin/users",
          active: currentPath === "/admin/users"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Usuários", 
        icon: <GroupIcon />, 
        href: "/admin/users",
        active: currentPath === "/admin/users"
      },
    ]
  };

  // Categoria: Operacional
  const operationalCategory: SidebarCategory = {
    name: "Operacional",
    icon: <FolderIcon />,
    expanded: hasCategoryActiveItem({
      name: "Operacional",
      icon: <FolderIcon />,
      items: [
        {
          name: "Matrículas",
          icon: <AssignmentIcon />,
          href: "/admin/enrollments",
          active: currentPath === "/admin/enrollments" || (currentPath && currentPath.includes("/admin/enrollments/"))
        },
        { 
          name: "Financeiro Empresarial", 
          icon: <MonetizationOnIcon />, 
          href: "/admin/financial",
          active: currentPath === "/admin/financial"
        },
        { 
          name: "Relatórios", 
          icon: <BarChartIcon />, 
          href: "/admin/reports",
          active: currentPath === "/admin/reports"
        },
      ]
    }, currentPath),
    items: [
      {
        name: "Matrículas",
        icon: <AssignmentIcon />,
        href: "/admin/enrollments",
        active: currentPath === "/admin/enrollments" || currentPath.includes("/admin/enrollments/")
      },
      { 
        name: "Financeiro Empresarial", 
        icon: <MonetizationOnIcon />, 
        href: "/admin/financial",
        active: currentPath === "/admin/financial"
      },
      { 
        name: "Relatórios", 
        icon: <BarChartIcon />, 
        href: "/admin/reports",
        active: currentPath === "/admin/reports"
      },
    ]
  };

  // Categoria: Sistema
  const systemCategory: SidebarCategory = {
    name: "Sistema",
    icon: <BuildIcon />,
    expanded: hasCategoryActiveItem({
      name: "Sistema",
      icon: <BuildIcon />,
      items: [
        { 
          name: "Integrações", 
          icon: <CloudIcon />, 
          href: "/admin/integrations",
          active: currentPath === "/admin/integrations"
        },
        { 
          name: "Segurança", 
          icon: <SecurityIcon />, 
          href: "/admin/security",
          active: currentPath === "/admin/security"
        },
        { 
          name: "Configurações", 
          icon: <SettingsIcon />, 
          href: "/admin/settings",
          active: currentPath === "/admin/settings"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Integrações", 
        icon: <CloudIcon />, 
        href: "/admin/integrations",
        active: currentPath === "/admin/integrations"
      },
      { 
        name: "Segurança", 
        icon: <SecurityIcon />, 
        href: "/admin/security",
        active: currentPath === "/admin/security"
      },
      { 
        name: "Configurações", 
        icon: <SettingsIcon />, 
        href: "/admin/settings",
        active: currentPath === "/admin/settings"
      },
    ]
  };

  // Combinar todos os itens e categorias
  return [
    ...mainItems,
    academicCategory,
    institutionalCategory,
    peopleCategory,
    operationalCategory,
    systemCategory,
  ];
}