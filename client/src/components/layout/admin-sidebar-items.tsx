import React from "react";
import {
  DashboardIcon,
  BusinessIcon,
  GroupIcon,
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
  GraduationCapIcon,
  BookIcon,
  BuildingIcon,
  AwardIcon,
  FileCheckIcon,
  ScrollTextIcon,
  Settings2Icon,
  BadgeCheckIcon,
  CRMIcon,
  UserPlusIcon,
  ContactIcon,
  BuildingStoreIcon,
  ContractIcon,
  InvoiceIcon,
  ShoppingBagIcon,
  PaymentsIcon,
  InboxIcon,
  MessageSquareIcon,
  WhatsAppIcon,
  MailIcon,
  InstagramIcon,
  FacebookIcon,
  TelegramIcon,
  WidgetIcon,
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
      name: "DASHBOARD", 
      icon: <DashboardIcon className="text-blue-500" />, 
      href: "/admin/dashboard",
      active: currentPath === "/admin/dashboard"
    },
  ];

  // Categoria: Acadêmico
  const academicCategory: SidebarCategory = {
    name: "ACADÊMICO",
    icon: <MenuBookIcon className="text-green-500" />,
    expanded: hasCategoryActiveItem({
      name: "Acadêmico",
      icon: <MenuBookIcon />,
      items: [
        { 
          name: "Disciplinas", 
          icon: <BookIcon className="text-muted-foreground" />, 
          href: "/admin/disciplines",
          active: currentPath === "/admin/disciplines" || (currentPath && currentPath.includes("/admin/disciplines/"))
        },
        { 
          name: "Cursos", 
          icon: <GraduationCapIcon className="text-muted-foreground" />, 
          href: "/admin/courses",
          active: currentPath === "/admin/courses" || (currentPath && currentPath.includes("/admin/courses/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Disciplinas", 
        icon: <BookIcon />, 
        href: "/admin/disciplines",
        active: currentPath === "/admin/disciplines" || (currentPath && currentPath.includes("/admin/disciplines/"))
      },
      { 
        name: "Cursos", 
        icon: <GraduationCapIcon />, 
        href: "/admin/courses",
        active: currentPath === "/admin/courses" || (currentPath && currentPath.includes("/admin/courses/"))
      },
    ]
  };

  // Categoria: Institucional
  const institutionalCategory: SidebarCategory = {
    name: "INSTITUCIONAL",
    icon: <BuildingIcon className="text-purple-500" />,
    expanded: hasCategoryActiveItem({
      name: "Institucional",
      icon: <BuildingIcon />,
      items: [
        { 
          name: "Instituições", 
          icon: <BusinessIcon className="text-muted-foreground" />, 
          href: "/admin/institutions",
          active: currentPath === "/admin/institutions"
        },
        { 
          name: "Polos", 
          icon: <StorefrontIcon className="text-muted-foreground" />, 
          href: "/admin/polos",
          active: currentPath === "/admin/polos"
        },
        { 
          name: "Parceiros", 
          icon: <HandshakeIcon className="text-muted-foreground" />, 
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
    name: "PESSOAS",
    icon: <UsersIcon className="text-orange-500" />,
    expanded: hasCategoryActiveItem({
      name: "Pessoas",
      icon: <UsersIcon />,
      items: [
        { 
          name: "Usuários", 
          icon: <GroupIcon className="text-muted-foreground" />, 
          href: "/admin/pessoas/usuarios",
          active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
        },
        { 
          name: "Papéis & Permissões", 
          icon: <SecurityIcon className="text-muted-foreground" />, 
          href: "/admin/pessoas/roles",
          active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
        },
        { 
          name: "Permissões Contextuais", 
          icon: <BadgeCheckIcon className="text-muted-foreground" />, 
          href: "/admin/pessoas/abac-permissions",
          active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Usuários", 
        icon: <GroupIcon className="text-muted-foreground" />, 
        href: "/admin/pessoas/usuarios",
        active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
      },
      { 
        name: "Papéis & Permissões", 
        icon: <SecurityIcon className="text-muted-foreground" />, 
        href: "/admin/pessoas/roles",
        active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
      },
      { 
        name: "Permissões Contextuais", 
        icon: <BadgeCheckIcon className="text-muted-foreground" />, 
        href: "/admin/pessoas/abac-permissions",
        active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
      },
    ]
  };

  // Categoria: Operacional
  const operationalCategory: SidebarCategory = {
    name: "OPERACIONAL",
    icon: <FolderIcon className="text-blue-500" />,
    expanded: hasCategoryActiveItem({
      name: "Operacional",
      icon: <FolderIcon />,
      items: [
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

  // Categoria: Certificação
  const certificationCategory: SidebarCategory = {
    name: "CERTIFICAÇÃO",
    icon: <AwardIcon className="text-amber-500" />,
    expanded: hasCategoryActiveItem({
      name: "Certificação",
      icon: <AwardIcon />,
      items: [
        { 
          name: "Templates", 
          icon: <ScrollTextIcon />, 
          href: "/admin/certification/templates",
          active: currentPath === "/admin/certification/templates" || (currentPath && currentPath.includes("/admin/certification/templates/"))
        },
        { 
          name: "Signatários", 
          icon: <FileCheckIcon />, 
          href: "/admin/certification/signers",
          active: currentPath === "/admin/certification/signers" || (currentPath && currentPath.includes("/admin/certification/signers/"))
        },
        { 
          name: "Emissão de Certificados", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/certification/issue",
          active: currentPath === "/admin/certification/issue" || (currentPath && currentPath.includes("/admin/certification/issue/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Templates", 
        icon: <ScrollTextIcon />, 
        href: "/admin/certification/templates",
        active: currentPath === "/admin/certification/templates" || (currentPath && currentPath.includes("/admin/certification/templates/"))
      },
      { 
        name: "Signatários", 
        icon: <FileCheckIcon />, 
        href: "/admin/certification/signers",
        active: currentPath === "/admin/certification/signers" || (currentPath && currentPath.includes("/admin/certification/signers/"))
      },
      { 
        name: "Emissão de Certificados", 
        icon: <BadgeCheckIcon />, 
        href: "/admin/certification/issue",
        active: currentPath === "/admin/certification/issue" || (currentPath && currentPath.includes("/admin/certification/issue/"))
      },
    ]
  };

  // Categoria: CRM & Gestão
  const crmCategory: SidebarCategory = {
    name: "CRM & GESTÃO",
    icon: <CRMIcon className="text-purple-500" />,
    expanded: hasCategoryActiveItem({
      name: "CRM & Gestão",
      icon: <CRMIcon />,
      items: [
        // Submódulo CRM
        { 
          name: "Leads", 
          icon: <UserPlusIcon />, 
          href: "/admin/crm/leads",
          active: currentPath === "/admin/crm/leads" || (currentPath && currentPath.includes("/admin/crm/leads/"))
        },
        { 
          name: "Clientes", 
          icon: <BuildingStoreIcon />, 
          href: "/admin/crm/clients",
          active: currentPath === "/admin/crm/clients" || (currentPath && currentPath.includes("/admin/crm/clients/"))
        },
        { 
          name: "Contatos", 
          icon: <ContactIcon />, 
          href: "/admin/crm/contacts",
          active: currentPath === "/admin/crm/contacts" || (currentPath && currentPath.includes("/admin/crm/contacts/"))
        },
        // Submódulo Financeiro
        { 
          name: "Cursos e Serviços", 
          icon: <ShoppingBagIcon />, 
          href: "/admin/finance/products",
          active: currentPath === "/admin/finance/products" || (currentPath && currentPath.includes("/admin/finance/products/"))
        },
        { 
          name: "Cobranças", 
          icon: <InvoiceIcon />, 
          href: "/admin/finance/invoices",
          active: currentPath === "/admin/finance/invoices" || (currentPath && currentPath.includes("/admin/finance/invoices/"))
        },
        { 
          name: "Pagamentos", 
          icon: <PaymentsIcon />, 
          href: "/admin/finance/payments",
          active: currentPath === "/admin/finance/payments" || (currentPath && currentPath.includes("/admin/finance/payments/"))
        },
        // Submódulo Contratos
        { 
          name: "Contratos", 
          icon: <ContractIcon />, 
          href: "/admin/contratos/contratos",
          active: currentPath === "/admin/contratos/contratos" || (currentPath && currentPath.includes("/admin/contratos/contratos/"))
        },
      ]
    }, currentPath),
    items: [
      // Submódulo CRM
      { 
        name: "Leads", 
        icon: <UserPlusIcon />, 
        href: "/admin/crm/leads",
        active: currentPath === "/admin/crm/leads" || (currentPath && currentPath.includes("/admin/crm/leads/"))
      },
      { 
        name: "Clientes", 
        icon: <BuildingStoreIcon />, 
        href: "/admin/crm/clients",
        active: currentPath === "/admin/crm/clients" || (currentPath && currentPath.includes("/admin/crm/clients/"))
      },
      { 
        name: "Contatos", 
        icon: <ContactIcon />, 
        href: "/admin/crm/contacts",
        active: currentPath === "/admin/crm/contacts" || (currentPath && currentPath.includes("/admin/crm/contacts/"))
      },
      // Submódulo Financeiro
      { 
        name: "Cursos e Serviços", 
        icon: <ShoppingBagIcon />, 
        href: "/admin/finance/products",
        active: currentPath === "/admin/finance/products" || (currentPath && currentPath.includes("/admin/finance/products/"))
      },
      { 
        name: "Cobranças", 
        icon: <InvoiceIcon />, 
        href: "/admin/finance/invoices",
        active: currentPath === "/admin/finance/invoices" || (currentPath && currentPath.includes("/admin/finance/invoices/"))
      },
      { 
        name: "Pagamentos", 
        icon: <PaymentsIcon />, 
        href: "/admin/finance/payments",
        active: currentPath === "/admin/finance/payments" || (currentPath && currentPath.includes("/admin/finance/payments/"))
      },
      // Submódulo Contratos
      { 
        name: "Contratos", 
        icon: <ContractIcon />, 
        href: "/admin/contratos/contratos",
        active: currentPath === "/admin/contratos/contratos" || (currentPath && currentPath.includes("/admin/contratos/contratos/"))
      },
    ]
  };
  
  // Categoria: Comunicação
  const communicationCategory: SidebarCategory = {
    name: "COMUNICAÇÃO",
    icon: <MessageSquareIcon className="text-green-500" />,
    expanded: hasCategoryActiveItem({
      name: "Comunicação",
      icon: <MessageSquareIcon />,
      items: [
        { 
          name: "CANAIS", 
          icon: <InboxIcon />, 
          href: "/admin/comunicacao/inbox",
          active: currentPath === "/admin/comunicacao/inbox" || (currentPath && currentPath.includes("/admin/comunicacao/inbox/"))
        },
        { 
          name: "WhatsApp", 
          icon: <WhatsAppIcon />, 
          href: "/admin/comunicacao/whatsapp",
          active: currentPath === "/admin/comunicacao/whatsapp" || (currentPath && currentPath.includes("/admin/comunicacao/whatsapp/"))
        },
        { 
          name: "Email", 
          icon: <MailIcon />, 
          href: "/admin/comunicacao/email",
          active: currentPath === "/admin/comunicacao/email" || (currentPath && currentPath.includes("/admin/comunicacao/email/"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "CANAIS", 
        icon: <InboxIcon />, 
        href: "/admin/comunicacao/inbox",
        active: currentPath === "/admin/comunicacao/inbox" || (currentPath && currentPath.includes("/admin/comunicacao/inbox/"))
      },
      { 
        name: "WhatsApp", 
        icon: <WhatsAppIcon />, 
        href: "/admin/comunicacao/whatsapp",
        active: currentPath === "/admin/comunicacao/whatsapp" || (currentPath && currentPath.includes("/admin/comunicacao/whatsapp/"))
      },
      { 
        name: "Email", 
        icon: <MailIcon />, 
        href: "/admin/comunicacao/email",
        active: currentPath === "/admin/comunicacao/email" || (currentPath && currentPath.includes("/admin/comunicacao/email/"))
      },
    ]
  };

  // Categoria: Sistema
  const systemCategory: SidebarCategory = {
    name: "SISTEMA",
    icon: <BuildIcon className="text-gray-600" />,
    expanded: hasCategoryActiveItem({
      name: "Sistema",
      icon: <BuildIcon />,
      items: [
        { 
          name: "Integrações", 
          icon: <CloudIcon />, 
          href: "/admin/integracoes/integrations",
          active: currentPath === "/admin/integracoes/integrations" || (currentPath && currentPath.includes("/admin/integracoes/"))
        },
        { 
          name: "Segurança", 
          icon: <SecurityIcon />, 
          href: "/admin/sistema/security",
          active: currentPath === "/admin/sistema/security" || (currentPath && currentPath.includes("/admin/sistema/security"))
        },
        { 
          name: "Auditoria", 
          icon: <FileCheckIcon />, 
          href: "/admin/auditoria/logs",
          active: currentPath === "/admin/auditoria/logs" || (currentPath && currentPath.includes("/admin/auditoria/"))
        },
        { 
          name: "Configurações", 
          icon: <SettingsIcon />, 
          href: "/admin/sistema/settings",
          active: currentPath === "/admin/sistema/settings" || (currentPath && currentPath.includes("/admin/sistema/settings"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Integrações", 
        icon: <CloudIcon />, 
        href: "/admin/integracoes/integrations",
        active: currentPath === "/admin/integracoes/integrations" || (currentPath && currentPath.includes("/admin/integracoes/"))
      },
      { 
        name: "Segurança", 
        icon: <SecurityIcon />, 
        href: "/admin/sistema/security",
        active: currentPath === "/admin/sistema/security" || (currentPath && currentPath.includes("/admin/sistema/security"))
      },
      { 
        name: "Auditoria", 
        icon: <FileCheckIcon />, 
        href: "/admin/auditoria/logs",
        active: currentPath === "/admin/auditoria/logs" || (currentPath && currentPath.includes("/admin/auditoria/"))
      },
      { 
        name: "Configurações", 
        icon: <SettingsIcon />, 
        href: "/admin/sistema/settings",
        active: currentPath === "/admin/sistema/settings" || (currentPath && currentPath.includes("/admin/sistema/settings"))
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
    crmCategory,
    communicationCategory,
    certificationCategory,
    systemCategory,
  ];
}