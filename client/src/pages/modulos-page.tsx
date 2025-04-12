import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon, MenuBookIcon } from "@/components/ui/icons";

export default function ModulosPage() {
  const [, navigate] = useLocation();
  
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
                      onClick={() => navigate('/portal-selection')}
                    >
                      Começar agora
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
    </div>
  );
}