import React from "react";
import { CircleIcon } from "@/components/ui/circle-icon";
import {
  DashboardIcon,
  BusinessIcon,
  GroupIcon,
  MenuBookIcon,
  HandshakeIcon,
  StorefrontIcon,
  MonetizationOnIcon,
  BarChartAltIcon,
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
  GraduationCapAltIcon,
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
import { CircleDollarSign } from "lucide-react";

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
    {
      name: "Financeiro Empresarial",
      icon: <CircleDollarSign />,
      href: "/admin/financeiro-empresarial",
      active: currentPath === "/admin/financeiro-empresarial" || 
              (currentPath && currentPath.includes("/admin/financeiro-empresarial"))
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
          icon: <BookIcon />, 
          href: "/admin/disciplines",
          active: currentPath === "/admin/disciplines" || (currentPath && currentPath.includes("/admin/disciplines/"))
        },
        { 
          name: "Cursos", 
          icon: <GraduationCapAltIcon />, 
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
        icon: <GraduationCapAltIcon />, 
        href: "/admin/courses",
        active: currentPath === "/admin/courses" || (currentPath && currentPath.includes("/admin/courses/"))
      },
    ]
  };

  // Categoria: Institucional
  const institutionalCategory: SidebarCategory = {
    name: "Institucional",
    icon: <BuildingIcon />,
    expanded: hasCategoryActiveItem({
      name: "Institucional",
      icon: <BuildingIcon />,
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
          href: "/admin/pessoas/usuarios",
          active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
        },
        { 
          name: "Papéis & Permissões", 
          icon: <SecurityIcon />, 
          href: "/admin/pessoas/roles",
          active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
        },
        { 
          name: "Permissões Contextuais", 
          icon: <BadgeCheckIcon />, 
          href: "/admin/pessoas/abac-permissions",
          active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Usuários", 
        icon: <CircleIcon />, 
        href: "/admin/pessoas/usuarios",
        active: currentPath === "/admin/pessoas/usuarios" || (currentPath && currentPath.includes("/admin/pessoas/usuarios/"))
      },
      { 
        name: "Papéis & Permissões", 
        icon: <CircleIcon />, 
        href: "/admin/pessoas/roles",
        active: currentPath === "/admin/pessoas/roles" || (currentPath && currentPath.includes("/admin/pessoas/roles"))
      },
      { 
        name: "Permissões Contextuais", 
        icon: <CircleIcon />, 
        href: "/admin/pessoas/abac-permissions",
        active: currentPath === "/admin/pessoas/abac-permissions" || (currentPath && currentPath.includes("/admin/pessoas/abac"))
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
          name: "Relatórios", 
          icon: <BarChartAltIcon />, 
          href: "/admin/reports",
          active: currentPath === "/admin/reports"
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Relatórios", 
        icon: <BarChartAltIcon />, 
        href: "/admin/reports",
        active: currentPath === "/admin/reports"
      },
    ]
  };

  // Categoria: Certificação
  const certificationCategory: SidebarCategory = {
    name: "Certificação",
    icon: <AwardIcon />,
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
        icon: <CircleIcon />, 
        href: "/admin/certification/templates",
        active: currentPath === "/admin/certification/templates" || (currentPath && currentPath.includes("/admin/certification/templates/"))
      },
      { 
        name: "Signatários", 
        icon: <CircleIcon />, 
        href: "/admin/certification/signers",
        active: currentPath === "/admin/certification/signers" || (currentPath && currentPath.includes("/admin/certification/signers/"))
      },
      { 
        name: "Emissão de Certificados", 
        icon: <CircleIcon />, 
        href: "/admin/certification/issue",
        active: currentPath === "/admin/certification/issue" || (currentPath && currentPath.includes("/admin/certification/issue/"))
      },
    ]
  };

  // Categoria: CRM & Gestão
  const crmCategory: SidebarCategory = {
    name: "CRM & Gestão",
    icon: <CRMIcon />,
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
        href: "/admin/finance/charges",
        active: currentPath === "/admin/finance/charges" || (currentPath && currentPath.includes("/admin/finance/charges/"))
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
    name: "Comunicação",
    icon: <MessageSquareIcon />,
    expanded: hasCategoryActiveItem({
      name: "Comunicação",
      icon: <MessageSquareIcon />,
      items: [
        { 
          name: "Canais", 
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
        name: "Canais", 
        icon: <CircleIcon />, 
        href: "/admin/comunicacao/inbox",
        active: currentPath === "/admin/comunicacao/inbox" || (currentPath && currentPath.includes("/admin/comunicacao/inbox/"))
      },
      { 
        name: "WhatsApp", 
        icon: <CircleIcon />, 
        href: "/admin/comunicacao/whatsapp",
        active: currentPath === "/admin/comunicacao/whatsapp" || (currentPath && currentPath.includes("/admin/comunicacao/whatsapp/"))
      },
      { 
        name: "Email", 
        icon: <CircleIcon />, 
        href: "/admin/comunicacao/email",
        active: currentPath === "/admin/comunicacao/email" || (currentPath && currentPath.includes("/admin/comunicacao/email/"))
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
        { 
          name: "Configurações da Instituição", 
          icon: <Settings2Icon />, 
          href: "/admin/sistema/institution-settings",
          active: currentPath === "/admin/sistema/institution-settings" || (currentPath && currentPath.includes("/admin/sistema/institution-settings"))
        },
      ]
    }, currentPath),
    items: [
      { 
        name: "Integrações", 
        icon: <CircleIcon />, 
        href: "/admin/integracoes/integrations",
        active: currentPath === "/admin/integracoes/integrations" || (currentPath && currentPath.includes("/admin/integracoes/"))
      },
      { 
        name: "Segurança", 
        icon: <CircleIcon />, 
        href: "/admin/sistema/security",
        active: currentPath === "/admin/sistema/security" || (currentPath && currentPath.includes("/admin/sistema/security"))
      },
      { 
        name: "Auditoria", 
        icon: <CircleIcon />, 
        href: "/admin/auditoria/logs",
        active: currentPath === "/admin/auditoria/logs" || (currentPath && currentPath.includes("/admin/auditoria/"))
      },
      { 
        name: "Configurações", 
        icon: <SettingsIcon />, 
        href: "/admin/sistema/settings",
        active: currentPath === "/admin/sistema/settings" || (currentPath && currentPath.includes("/admin/sistema/settings"))
      },
      { 
        name: "Configurações da Instituição", 
        icon: <Settings2Icon />, 
        href: "/admin/sistema/institution-settings",
        active: currentPath === "/admin/sistema/institution-settings" || (currentPath && currentPath.includes("/admin/sistema/institution-settings"))
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