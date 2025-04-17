import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  onLogin?: () => void;
}

export default function Header({ onLogin }: HeaderProps) {
  const [, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else {
      navigate("/portal-selection");
    }
  };

  const navItems = [
    { name: "MÓDULOS", href: "/modulos" },
    { name: "PLANOS", href: "/planos" },
    { name: "SOBRE", href: "/sobre" },
    { name: "BLOG", href: "/blog" },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-slate-600 hover:text-primary hover:bg-slate-50 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Login Button - Desktop */}
          <div className="hidden md:flex items-center">
            <Button 
              variant="default"
              size="sm"
              className="ml-4 px-6 shadow-sm"
              onClick={handleLoginClick}
            >
              LOGIN
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] p-0">
                <div className="flex flex-col h-full">
                  <div className="px-6 py-4 flex justify-between items-center border-b">
                    <Link href="/">
                      <Logo size="sm" />
                    </Link>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5 text-slate-500" />
                      </Button>
                    </SheetClose>
                  </div>
                  <div className="px-2 pt-4 pb-8 flex-1 overflow-auto">
                    <nav className="flex flex-col space-y-1">
                      {navItems.map((item) => (
                        <SheetClose key={item.name} asChild>
                          <Link 
                            href={item.href} 
                            className="px-3 py-3 rounded-md text-base font-medium text-slate-700 hover:text-primary hover:bg-slate-50"
                          >
                            {item.name}
                          </Link>
                        </SheetClose>
                      ))}
                      <div className="pt-6 px-2">
                        <SheetClose asChild>
                          <Button 
                            className="w-full"
                            onClick={handleLoginClick}
                          >
                            LOGIN
                          </Button>
                        </SheetClose>
                      </div>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
