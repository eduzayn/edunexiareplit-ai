import React from 'react';
import { 
  BookOpenText, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  GraduationCap,
  User, 
  FileQuestion, 
  BriefcaseBusiness,
  Handshake,
  Banknote,
  MessagesSquare
} from 'lucide-react';

export type SidebarItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  submenu?: SidebarItem[];
  onClick?: () => void;
};

/**
 * Retorna os itens do menu da barra lateral do estudante
 * @param pathname Caminho atual da rota
 * @returns Array de itens do menu
 */
export const getStudentSidebarItems = (pathname: string): SidebarItem[] => {
  return [
    {
      label: 'Início',
      icon: <LayoutDashboard size={18} />,
      href: '/student',
      active: pathname === '/student',
    },
    {
      label: 'Meus cursos',
      icon: <BookOpenText size={18} />,
      href: '/student/courses',
      active: pathname === '/student/courses' || pathname.startsWith('/student/courses/'),
    },
    {
      label: 'Meus certificados',
      icon: <GraduationCap size={18} />,
      href: '/student/certificates',
      active: pathname === '/student/certificates',
    },
    {
      label: 'Avaliações',
      icon: <FileQuestion size={18} />,
      href: '/student/assessments',
      active: pathname === '/student/assessments',
    },
    {
      label: 'Meus estágios',
      icon: <BriefcaseBusiness size={18} />,
      href: '/student/internships',
      active: pathname === '/student/internships',
    },
    {
      label: 'Contratos',
      icon: <Handshake size={18} />,
      href: '/student/contracts',
      active: pathname === '/student/contracts',
    },
    {
      label: 'Financeiro',
      icon: <Banknote size={18} />,
      href: '/student/financial',
      active: pathname === '/student/financial',
    },
    {
      label: 'Calendário',
      icon: <Calendar size={18} />,
      href: '/student/calendar',
      active: pathname === '/student/calendar',
    },
    {
      label: 'Mensagens',
      icon: <MessagesSquare size={18} />,
      href: '/student/messages',
      active: pathname === '/student/messages',
    },
    {
      label: 'Minhas informações',
      icon: <User size={18} />,
      href: '/student/profile',
      active: pathname === '/student/profile',
    },
  ];
};