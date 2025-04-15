import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  School as SchoolIcon, 
  Menu as MenuIcon,
  X as XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainNavItems = [
  {
    title: 'Soluções',
    items: [
      {
        title: 'Gestão Acadêmica',
        href: '/solucoes/gestao-academica',
        description: 'Gerencie cursos, matrículas e avaliações com facilidade.'
      },
      {
        title: 'Gestão Financeira',
        href: '/solucoes/gestao-financeira',
        description: 'Controle completo de pagamentos, faturas e relatórios.'
      },
      {
        title: 'Portal do Aluno',
        href: '/solucoes/portal-aluno',
        description: 'Experiência completa para seus estudantes em um único lugar.'
      },
      {
        title: 'Portal do Polo',
        href: '/solucoes/portal-polo',
        description: 'Gestão eficiente para seus polos parceiros.'
      },
    ],
  },
  {
    title: 'Recursos',
    items: [
      {
        title: 'Documentação',
        href: '/recursos/documentacao',
        description: 'Manuais e guias para utilizar a plataforma.'
      },
      {
        title: 'Tutoriais',
        href: '/recursos/tutoriais',
        description: 'Vídeos e instruções passo a passo.'
      },
      {
        title: 'API',
        href: '/recursos/api',
        description: 'Documentação técnica para desenvolvedores.'
      },
    ],
  },
  {
    title: 'Planos',
    href: '/planos',
  },
];

export default function NavbarMain() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100/20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 mr-4">
          <Link href="/" className="text-xl font-bold text-blue-950 flex items-center">
            <SchoolIcon className="h-6 w-6 mr-2 text-primary" />
            EdunexIA
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {mainNavItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  {item.items ? (
                    <>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.items.map((subItem, subIndex) => (
                            <ListItem
                              key={subIndex}
                              title={subItem.title}
                              href={subItem.href}
                            >
                              {subItem.description}
                            </ListItem>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <Link href={item.href || '#'} className="font-medium text-sm py-2 px-3 hover:text-primary">
                        {item.title}
                      </Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Experimente Grátis</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 h-full">
                <Link href="/" className="text-xl font-bold text-blue-950 flex items-center mb-6">
                  <SchoolIcon className="h-6 w-6 mr-2 text-primary" />
                  EdunexIA
                </Link>
                
                <div className="space-y-3">
                  {mainNavItems.map((item, index) => (
                    <div key={index} className="pb-2">
                      {item.href ? (
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start font-medium"
                          asChild
                        >
                          <Link href={item.href}>
                            {item.title}
                          </Link>
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="font-medium text-blue-950">{item.title}</div>
                          {item.items?.map((subItem, subIndex) => (
                            <Button 
                              key={subIndex} 
                              variant="ghost" 
                              className="w-full justify-start text-sm pl-4"
                              asChild
                            >
                              <Link href={subItem.href}>
                                {subItem.title}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">
                      Login
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/cadastro">
                      Experimente Grátis
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 hover:text-blue-900 focus:bg-blue-50",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-500">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});