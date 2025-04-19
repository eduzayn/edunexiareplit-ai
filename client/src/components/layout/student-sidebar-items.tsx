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
  MessagesSquare,
  Home, 
  BookOpen, 
  CalendarClock, 
  Medal
} from 'lucide-react';

export interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems?: SidebarItem[];
}

export const getStudentSidebarItems = (): SidebarItem[] => {
  return studentSidebarItems;
};

export const studentSidebarItems: SidebarItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/student/dashboard',
  },
  {
    icon: BookOpenText,
    label: 'Meus Cursos',
    href: '/student/courses',
  },
  {
    icon: CalendarClock,
    label: 'Calendário',
    href: '/student/calendar',
  },
  {
    icon: FileText,
    label: 'Materiais',
    href: '/student/materials',
  },
  {
    icon: Medal,
    label: 'Certificados',
    href: '/student/certificates',
  },
  {
    icon: Banknote,
    label: 'Financeiro',
    href: '/student/financial',
  },
  {
    icon: User,
    label: 'Meu Perfil',
    href: '/student/profile',
  },
  {
    icon: MessagesSquare,
    label: 'Mensagens',
    href: '/student/messages',
  },
];

export default studentSidebarItems;