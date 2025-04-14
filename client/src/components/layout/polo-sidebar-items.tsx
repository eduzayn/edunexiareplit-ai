import {
  ChartIcon,
  AssignmentIcon,
  GroupIcon,
  BarChartIcon,
  SettingsIcon,
  ShareIcon,
  FolderIcon,
  CreditCardIcon,
  HelpOutlineIcon,
  LaptopIcon,
} from "@/components/ui/icons";

/**
 * Retorna uma lista completa de itens para a barra lateral do portal do polo
 * @param currentPath - O caminho atual da aplicação
 */
export function getPoloSidebarItems(currentPath: string) {
  return [
    { 
      name: "Dashboard", 
      icon: <ChartIcon />, 
      href: "/polo/dashboard",
      active: currentPath === "/polo/dashboard"
    },
    { 
      name: "Matrículas", 
      icon: <AssignmentIcon />, 
      href: "/polo/enrollments",
      active: currentPath === "/polo/enrollments" || currentPath === "/polo/enrollments/new"
    },
    { 
      name: "Alunos", 
      icon: <GroupIcon />, 
      href: "/polo/students",
      active: currentPath === "/polo/students"
    },
    { 
      name: "Relatórios", 
      icon: <BarChartIcon />, 
      href: "/polo/reports",
      active: currentPath === "/polo/reports"
    },
    { 
      name: "Links de Venda", 
      icon: <ShareIcon />, 
      href: "/polo/sales-links",
      active: currentPath === "/polo/sales-links"
    },
    { 
      name: "Financeiro", 
      icon: <CreditCardIcon />,

      href: "/polo/financial",
      active: currentPath === "/polo/financial"
    },
    { 
      name: "Materiais", 
      icon: <FolderIcon />, 
      href: "/polo/materials",
      active: currentPath === "/polo/materials"
    },
    { 
      name: "Capacitação", 
      icon: <LaptopIcon />, 
      href: "/polo/training",
      active: currentPath === "/polo/training"
    },
    { 
      name: "Suporte", 
      icon: <HelpOutlineIcon />, 
      href: "/polo/support",
      active: currentPath === "/polo/support"
    },
    { 
      name: "Configurações", 
      icon: <SettingsIcon />, 
      href: "/polo/settings",
      active: currentPath === "/polo/settings"
    },
  ];
}