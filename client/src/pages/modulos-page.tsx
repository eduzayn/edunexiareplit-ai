import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon, MenuBookIcon } from "@/components/ui/icons";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function ModulosPage() {
  const [, navigate] = useLocation();
  const [openModulo, setOpenModulo] = useState<number | null>(null);
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  const modulos = [
    {
      titulo: "Portal do Aluno",
      descricao: "Experiência completa para alunos com acesso a todos os recursos educacionais.",
      icon: <SchoolIcon className="h-8 w-8 text-[#12B76A]" />,
      recursos: [
        "Credencial digital",
        "Certificados online",
        "Ambiente virtual de aprendizagem",
        "Biblioteca digital",
        "Provas online",
        "Tutoria especializada",
      ],
      cor: "bg-green-100"
    },
    {
      titulo: "Chat Multicanal",
      descricao: "Comunicação integrada com alunos através de múltiplos canais.",
      icon: <MenuBookIcon className="h-8 w-8 text-primary" />,
      recursos: [
        "Integração com WhatsApp",
        "E-mail automatizado",
        "Kanban de leads",
        "Chatbot com IA",
        "Notificações em tempo real",
        "Relatórios de conversão",
      ],
      cor: "bg-blue-100"
    },
    {
      titulo: "Financeiro",
      descricao: "Gestão financeira completa para instituições educacionais.",
      icon: <MenuBookIcon className="h-8 w-8 text-[#7C4DFC]" />,
      recursos: [
        "Pagamentos online",
        "Contratos digitais",
        "Relatórios gerenciais",
        "Integração com ERPs",
        "Gestão de bolsas",
        "Notas fiscais automáticas",
      ],
      cor: "bg-purple-100"
    },
    {
      titulo: "Polos",
      descricao: "Gestão completa de polos educacionais e unidades descentralizadas.",
      icon: <MenuBookIcon className="h-8 w-8 text-[#F79009]" />,
      recursos: [
        "Gestão de unidades",
        "Comissões automatizadas",
        "Captação de alunos",
        "Monitoramento em tempo real",
        "Relatórios de desempenho",
        "Comunicação centralizada",
      ],
      cor: "bg-orange-100"
    },
    {
      titulo: "Cursos",
      descricao: "Plataforma completa para criação e gestão de cursos online.",
      icon: <MenuBookIcon className="h-8 w-8 text-[#D2266B]" />,
      recursos: [
        "Editor de conteúdo",
        "Vídeo-aulas",
        "Materiais interativos",
        "Quiz e avaliações",
        "Certificados personalizados",
        "Análise de desempenho",
      ],
      cor: "bg-pink-100"
    },
    {
      titulo: "Avaliações",
      descricao: "Sistema completo para criação e aplicação de provas online.",
      icon: <MenuBookIcon className="h-8 w-8 text-[#00A779]" />,
      recursos: [
        "Banco de questões",
        "Provas personalizadas",
        "Anti-fraude",
        "Correção automática",
        "Simulados adaptativos",
        "Feedback detalhado",
      ],
      cor: "bg-emerald-100"
    },
  ];

  const getModuloDescricaoDetalhada = (index: number) => {
    const modulo = modulos[index];
    if (!modulo) return null;
    
    // Descrições mais detalhadas para cada módulo
    const descricoes = {
      "Portal do Aluno": `O Portal do Aluno da Edunexia oferece uma experiência educacional completa, com interface amigável e adaptada às necessidades de cada estudante. Nele, o aluno encontra:

• Acesso a todos os seus cursos matriculados
• Acompanhamento detalhado de seu progresso acadêmico
• Certificados digitais com validação e autenticidade
• Biblioteca digital completa com materiais complementares
• Sistema de provas online com correção automática
• Tutoria especializada com professores qualificados

Este módulo é perfeito para instituições de todos os portes que desejam oferecer uma experiência digital completa para seus alunos.`,
      
      "Chat Multicanal": `O módulo de Chat Multicanal da Edunexia integra diversos canais de comunicação em uma única plataforma. Este sistema permite:

• Integração nativa com WhatsApp, possibilitando atendimento via API oficial
• Sistema de e-mail automatizado para comunicações em massa
• Kanban de leads para acompanhamento de potenciais alunos
• Chatbot com Inteligência Artificial para responder dúvidas frequentes
• Notificações em tempo real para alunos e equipe administrativa
• Relatórios detalhados de conversão e eficiência no atendimento

Ideal para instituições que desejam centralizar e otimizar sua comunicação com alunos.`,
      
      "Financeiro": `O módulo Financeiro da Edunexia é uma solução completa para gestão financeira de instituições educacionais. Com ele, você obtém:

• Sistema de pagamentos online integrado com os principais gateways
• Geração e gestão de contratos digitais com assinatura eletrônica
• Relatórios gerenciais detalhados com métricas financeiras
• Integração nativa com os principais ERPs do mercado
• Gestão de bolsas e descontos com regras personalizáveis
• Emissão automática de notas fiscais e documentos contábeis

Uma solução robusta para instituições de qualquer porte que desejam otimizar seus processos financeiros.`,
      
      "Polos": `O módulo de Polos da Edunexia permite a gestão completa de unidades descentralizadas. Com este módulo é possível:

• Gerenciar múltiplas unidades educacionais de forma centralizada
• Configurar comissões automatizadas para parceiros e franqueados
• Implementar estratégias de captação de alunos específicas por região
• Monitorar em tempo real o desempenho de cada polo
• Gerar relatórios comparativos de desempenho entre unidades
• Manter comunicação centralizada com todas as unidades

Perfeito para redes de ensino, franquias educacionais e instituições com múltiplas unidades.`,
      
      "Cursos": `O módulo de Cursos da Edunexia oferece uma plataforma completa para criação e gestão de conteúdo educacional. Com ele, é possível:

• Utilizar um editor de conteúdo intuitivo com recursos avançados
• Hospedar e gerenciar vídeo-aulas com player otimizado
• Criar materiais interativos que engajam os estudantes
• Desenvolver avaliações e quizzes personalizados
• Emitir certificados personalizados com sua marca
• Analisar o desempenho dos alunos com métricas detalhadas

Uma solução completa para instituições que desejam criar e gerenciar seu próprio conteúdo educacional.`,
      
      "Avaliações": `O módulo de Avaliações da Edunexia é um sistema completo para criação, aplicação e correção de provas online. Ele oferece:

• Banco de questões categorizado e com níveis de dificuldade
• Sistema para criação de provas personalizadas por turma ou aluno
• Tecnologia anti-fraude com monitoramento durante as avaliações
• Correção automática com feedback imediato para o aluno
• Simulados adaptativos que se ajustam ao nível do estudante
• Feedback detalhado que auxilia no processo de aprendizagem

Ideal para instituições que valorizam a avaliação como parte essencial do processo educativo.`
    };
    
    return descricoes[modulo.titulo as keyof typeof descricoes] || modulo.descricao;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Módulos Integrados
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Conheça todos os módulos disponíveis na plataforma mais moderna de educação a distância do Brasil.
              </p>
            </div>
          </div>
        </section>
        
        {/* Modules Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modulos.map((modulo, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full ${modulo.cor}`}>
                      {modulo.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">{modulo.titulo}</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      {modulo.descricao}
                    </p>
                    <ul className="text-sm text-gray-700 mb-6 space-y-2">
                      {modulo.recursos.map((recurso, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-[#12B76A] mr-2 h-5 w-5">✓</span>
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                      onClick={() => setOpenModulo(index)}
                    >
                      Saiba mais
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-lg text-gray-600 mb-6">
                Não encontrou o que estava procurando? Entre em contato conosco para saber mais.
              </p>
              <Button onClick={() => navigate('/contato')} size="lg">
                Fale conosco
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      {/* Diálogo de detalhes do módulo */}
      {openModulo !== null && (
        <Dialog open={openModulo !== null} onOpenChange={() => setOpenModulo(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {modulos[openModulo]?.titulo}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 mb-6 whitespace-pre-wrap">
              {getModuloDescricaoDetalhada(openModulo)}
            </div>
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setOpenModulo(null)}
              >
                Fechar
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 mb-3 sm:mb-0">
                <Button onClick={() => navigate('/planos')}>
                  Ver planos
                </Button>
                <Button onClick={() => navigate('/contato')}>
                  Fale conosco
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}