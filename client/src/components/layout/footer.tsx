import { Link } from "wouter";
import { SchoolIcon } from "@/components/ui/icons";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Plataforma",
      links: [
        { name: "Módulos", href: "/modulos" },
        { name: "Planos", href: "/planos" },
        { name: "Atualizações", href: "/atualizacoes" },
        { name: "Roadmap", href: "/roadmap" },
        { name: "API", href: "/api-docs" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { name: "Sobre nós", href: "/sobre" },
        { name: "Blog", href: "/blog" },
        { name: "Carreiras", href: "/carreiras" },
        { name: "Parceiros", href: "/parceiros" },
        { name: "Imprensa", href: "/imprensa" },
      ],
    },
    {
      title: "Suporte",
      links: [
        { name: "Ajuda", href: "/ajuda" },
        { name: "Status", href: "/status" },
        { name: "Contato", href: "/contato" },
        { name: "Privacidade", href: "/privacidade" },
        { name: "Termos", href: "/termos" },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, href: "https://facebook.com", label: "Facebook" },
    { icon: <Instagram size={20} />, href: "https://instagram.com", label: "Instagram" },
    { icon: <Linkedin size={20} />, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: <Youtube size={20} />, href: "https://youtube.com", label: "YouTube" },
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white flex items-center">
              <SchoolIcon className="h-8 w-8 mr-2" />
              EdunexIA
            </Link>
            <p className="mt-4 text-sm">
              A plataforma mais moderna do Brasil para instituições de ensino a distância.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link 
                  key={index} 
                  href={social.href} 
                  className="text-neutral-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-medium mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-neutral-800 text-sm text-center">
          <p>&copy; {currentYear} EdunexIA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
