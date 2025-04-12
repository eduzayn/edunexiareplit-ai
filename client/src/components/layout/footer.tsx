import { Link } from "wouter";
import { SchoolIcon } from "@/components/ui/icons";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Plataforma",
      links: [
        { name: "Módulos", href: "#modules" },
        { name: "Planos", href: "#plans" },
        { name: "Atualizações", href: "#updates" },
        { name: "Roadmap", href: "#roadmap" },
        { name: "API", href: "#api" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { name: "Sobre nós", href: "#about" },
        { name: "Blog", href: "#blog" },
        { name: "Carreiras", href: "#careers" },
        { name: "Parceiros", href: "#partners" },
        { name: "Imprensa", href: "#press" },
      ],
    },
    {
      title: "Suporte",
      links: [
        { name: "Ajuda", href: "#help" },
        { name: "Status", href: "#status" },
        { name: "Contato", href: "#contact" },
        { name: "Privacidade", href: "#privacy" },
        { name: "Termos", href: "#terms" },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, href: "#", label: "Facebook" },
    { icon: <Instagram size={20} />, href: "#", label: "Instagram" },
    { icon: <Linkedin size={20} />, href: "#", label: "LinkedIn" },
    { icon: <Youtube size={20} />, href: "#", label: "YouTube" },
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
                <a 
                  key={index} 
                  href={social.href} 
                  className="text-neutral-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
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
                    <a 
                      href={link.href} 
                      className="hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
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
