import React from 'react';
import { Link } from 'wouter';
import { Logo } from '@/components/ui/logo';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const footerSections = [
  {
    title: 'Empresa',
    links: [
      { name: 'Sobre nós', href: '/sobre' },
      { name: 'Nosso Time', href: '/time' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carreiras', href: '/carreiras' },
    ],
  },
  {
    title: 'Soluções',
    links: [
      { name: 'Gestão Acadêmica', href: '/solucoes/gestao-academica' },
      { name: 'Gestão Financeira', href: '/solucoes/gestao-financeira' },
      { name: 'Portal do Aluno', href: '/solucoes/portal-aluno' },
      { name: 'Portal do Polo', href: '/solucoes/portal-polo' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { name: 'Central de Ajuda', href: '/ajuda' },
      { name: 'Contato', href: '/contato' },
      { name: 'Documentação', href: '/docs' },
      { name: 'Status do Sistema', href: '/status' },
    ],
  },
];

const socialLinks = [
  { 
    icon: <Facebook className="h-5 w-5" />, 
    href: 'https://facebook.com', 
    label: 'Facebook'
  },
  { 
    icon: <Twitter className="h-5 w-5" />, 
    href: 'https://twitter.com', 
    label: 'Twitter'
  },
  { 
    icon: <Instagram className="h-5 w-5" />, 
    href: 'https://instagram.com', 
    label: 'Instagram'
  },
  { 
    icon: <Linkedin className="h-5 w-5" />, 
    href: 'https://linkedin.com', 
    label: 'LinkedIn'
  },
];

const contactInfo = [
  { 
    icon: <Mail className="h-4 w-4" />, 
    text: 'contato@edunexia.com.br'
  },
  { 
    icon: <Phone className="h-4 w-4" />, 
    text: '(11) 4002-8922'
  },
  { 
    icon: <MapPin className="h-4 w-4" />, 
    text: 'São Paulo, SP'
  },
];

export default function FooterMain() {
  return (
    <footer className="bg-gradient-to-br from-primary to-blue-950 text-white">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/">
              <Logo variant="light" size="md" />
            </Link>
            
            <p className="mt-6 text-blue-100 max-w-md leading-relaxed">
              A plataforma mais completa para gestão educacional. Transformando a educação à distância com tecnologia e inovação brasileira.
            </p>
            
            <div className="mt-8 space-y-3">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center text-blue-100 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-800/30 flex items-center justify-center mr-3">
                    <span className="text-white">{item.icon}</span>
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex space-x-3">
              {socialLinks.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-blue-800/30 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/50 transition-colors"
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
              <h3 className="text-lg font-medium mb-5 text-white border-b border-blue-800/40 pb-2">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-blue-100 hover:text-white transition-colors inline-block py-1"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-16 pt-8 border-t border-blue-800/30">
          <div className="flex flex-col sm:flex-row justify-between items-center text-blue-200 text-sm">
            <p>© {new Date().getFullYear()} EdunexIA. Todos os direitos reservados.</p>
            <div className="mt-4 sm:mt-0 space-x-6">
              <Link href="/privacidade" className="hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}