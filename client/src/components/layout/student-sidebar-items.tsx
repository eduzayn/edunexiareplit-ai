import {
  ChartIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  LayersIcon,
  FileTextIcon,
  AssignmentIcon,
} from "@/components/ui/icons";

/**
 * Retorna uma lista completa de itens para a barra lateral do portal do aluno
 * Essa função garante que todos os itens da navegação estejam sempre presentes
 * independente da página atual
 */
export function getStudentSidebarItems(currentPath: string) {
  return [
    { 
      name: "Dashboard", 
      icon: <ChartIcon />, 
      href: "/student/dashboard",
      active: currentPath === "/student/dashboard"
    },
    { 
      name: "Meus Cursos", 
      icon: <MenuBookIcon />, 
      href: "/student/courses",
      active: currentPath === "/student/courses"
    },
    { 
      name: "Progresso", 
      icon: <AssignmentIcon />, 
      href: "/student/learning",
      active: currentPath === "/student/learning"
    },
    { 
      name: "Calendário", 
      icon: <EventNoteIcon />, 
      href: "/student/calendar",
      active: currentPath === "/student/calendar"
    },
    { 
      name: "Documentos", 
      icon: <DescriptionIcon />, 
      href: "/student/documents",
      active: currentPath === "/student/documents"
    },
    { 
      name: "Biblioteca", 
      icon: <LayersIcon />, 
      href: "/student/library",
      active: currentPath === "/student/library"
    },
    { 
      name: "Secretaria", 
      icon: <FileTextIcon />, 
      href: "/student/secretaria",
      active: currentPath === "/student/secretaria"
    },
    { 
      name: "Credencial", 
      icon: <DescriptionIcon />, 
      href: "/student/credencial",
      active: currentPath === "/student/credencial"
    },
    { 
      name: "Financeiro", 
      icon: <PaymentsIcon />, 
      href: "/student/financial",
      active: currentPath === "/student/financial"
    },
    { 
      name: "Suporte", 
      icon: <HelpOutlineIcon />, 
      href: "/student/support",
      active: currentPath === "/student/support"
    },
  ];
}