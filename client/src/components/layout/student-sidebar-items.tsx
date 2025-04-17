import React from 'react';
import { 
  Home, 
  BookOpen, 
  CalendarClock, 
  Medal, 
  FileText, 
  FileQuestion, 
  User,
  CreditCard,
  HelpCircle,
  Settings,
  MessageSquare
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
      label: 'Dashboard',
      icon: <Home size={20} />,
      href: '/student',
      active: pathname === '/student',
    },
    {
      label: 'Meus Cursos',
      icon: <BookOpen size={20} />,
      href: '/student/cursos',
      active: pathname.startsWith('/student/cursos'),
      submenu: [
        {
          label: 'Aulas e Conteúdos',
          icon: <FileText size={16} />,
          href: '/student/cursos/aulas',
          active: pathname.startsWith('/student/cursos/aulas'),
        },
        {
          label: 'Materiais Didáticos',
          icon: <FileText size={16} />,
          href: '/student/cursos/materiais',
          active: pathname.startsWith('/student/cursos/materiais'),
        },
      ],
    },
    {
      label: 'Avaliações',
      icon: <FileQuestion size={20} />,
      href: '/student/avaliacoes',
      active: pathname.startsWith('/student/avaliacoes'),
      submenu: [
        {
          label: 'Simulados',
          icon: <FileQuestion size={16} />,
          href: '/student/avaliacoes/simulados',
          active: pathname.startsWith('/student/avaliacoes/simulados'),
        },
        {
          label: 'Avaliações Finais',
          icon: <FileQuestion size={16} />,
          href: '/student/avaliacoes/finais',
          active: pathname.startsWith('/student/avaliacoes/finais'),
        },
      ],
    },
    {
      label: 'Calendário',
      icon: <CalendarClock size={20} />,
      href: '/student/calendario',
      active: pathname.startsWith('/student/calendario'),
    },
    {
      label: 'Certificados',
      icon: <Medal size={20} />,
      href: '/student/certificados',
      active: pathname.startsWith('/student/certificados'),
    },
    {
      label: 'Financeiro',
      icon: <CreditCard size={20} />,
      href: '/student/financial',
      active: pathname.startsWith('/student/financial'),
      submenu: [
        {
          label: 'Cobranças',
          icon: <CreditCard size={16} />,
          href: '/student/financial',
          active: pathname.startsWith('/student/financial'),
        },
        {
          label: 'Histórico de Pagamentos',
          icon: <FileText size={16} />,
          href: '/student/financial/history',
          active: pathname.startsWith('/student/financial/history'),
        },
      ],
    },
    {
      label: 'Meu Perfil',
      icon: <User size={20} />,
      href: '/student/perfil',
      active: pathname.startsWith('/student/perfil'),
    },
    {
      label: 'Suporte',
      icon: <HelpCircle size={20} />,
      href: '/student/suporte',
      active: pathname.startsWith('/student/suporte'),
      submenu: [
        {
          label: 'Tutoria e Mentoria',
          icon: <MessageSquare size={16} />,
          href: '/student/suporte/tutoria',
          active: pathname.startsWith('/student/suporte/tutoria'),
        },
        {
          label: 'Perguntas Frequentes',
          icon: <HelpCircle size={16} />,
          href: '/student/suporte/faq',
          active: pathname.startsWith('/student/suporte/faq'),
        },
      ],
    },
    {
      label: 'Configurações',
      icon: <Settings size={20} />,
      href: '/student/configuracoes',
      active: pathname.startsWith('/student/configuracoes'),
    },
  ];
};