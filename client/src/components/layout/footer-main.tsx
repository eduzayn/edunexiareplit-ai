import React from 'react';
import { Link } from 'wouter';
import { 
  School as SchoolIcon,
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
    <footer className="bg-blue-950 text-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-bold flex items-center">
              <SchoolIcon className="h-8 w-8 mr-2 text-blue-400" />
              EdunexIA
            </Link>
            <p className="mt-4 text-blue-200 max-w-md">
              A plataforma mais completa para gestão educacional. Transformando a educação à distância com tecnologia e inovação.
            </p>
            
            <div className="mt-6 space-y-2">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center text-blue-200">
                  <span className="mr-3 text-blue-400">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index} 
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-white transition-colors"
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
              <h3 className="text-lg font-medium mb-4 text-white">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-blue-200 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-blue-900/60">
          <div className="flex flex-col sm:flex-row justify-between items-center text-blue-300 text-sm">
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