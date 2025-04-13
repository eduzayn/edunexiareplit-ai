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
} from "@/components/ui/icons";

/**
 * Retorna uma lista completa de itens para a barra lateral do portal administrativo
 * Essa função garante que todos os itens da navegação estejam sempre presentes
 * independente da página atual
 */
export function getAdminSidebarItems(currentPath: string) {
  return [
    { 
      name: "Dashboard", 
      icon: <DashboardIcon />, 
      href: "/admin/dashboard",
      active: currentPath === "/admin/dashboard"
    },
    { 
      name: "Disciplinas", 
      icon: <MenuBookIcon />, 
      href: "/admin/disciplines",
      active: currentPath === "/admin/disciplines" || currentPath.includes("/admin/disciplines/")
    },
    { 
      name: "Cursos", 
      icon: <SchoolIcon />, 
      href: "/admin/courses",
      active: currentPath === "/admin/courses" || currentPath.includes("/admin/courses/")
    },
    { 
      name: "Instituições", 
      icon: <BusinessIcon />, 
      href: "/admin/institutions",
      active: currentPath === "/admin/institutions"
    },
    { 
      name: "Usuários", 
      icon: <GroupIcon />, 
      href: "/admin/users",
      active: currentPath === "/admin/users"
    },
    { 
      name: "Parceiros", 
      icon: <HandshakeIcon />, 
      href: "/admin/partners",
      active: currentPath === "/admin/partners"
    },
    { 
      name: "Polos", 
      icon: <StorefrontIcon />, 
      href: "/admin/polos",
      active: currentPath === "/admin/polos"
    },
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
    { 
      name: "Integrações", 
      icon: <CloudIcon />, 
      href: "/admin/integrations",
      active: currentPath === "/admin/integrations"
    },
    { 
      name: "Sistema", 
      icon: <BuildIcon />, 
      href: "/admin/system",
      active: currentPath === "/admin/system"
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
  ];
}