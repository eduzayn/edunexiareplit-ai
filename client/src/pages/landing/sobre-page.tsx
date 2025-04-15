import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldIcon, HandshakeIcon, CalendarIcon, TrendingUpIcon } from "@/components/ui/icons";

export default function SobrePage() {
  const [, navigate] = useLocation();
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  const valores = [
    {
      nome: "Inovação",
      descricao: "Estamos sempre à frente, integrando as tecnologias mais avançadas em nossa plataforma.",
      icon: <TrendingUpIcon className="h-10 w-10 text-primary" />
    },
    {
      nome: "Confiança",
      descricao: "Construímos relacionamentos duradouros com base em transparência e resultados consistentes.",
      icon: <ShieldIcon className="h-10 w-10 text-primary" />
    },
    {
      nome: "Parceria",
      descricao: "Trabalhamos lado a lado com nossas instituições para garantir seu crescimento e sucesso.",
      icon: <HandshakeIcon className="h-10 w-10 text-primary" />
    },
    {
      nome: "Compromisso",
      descricao: "Estamos comprometidos com a excelência em cada aspecto da experiência educacional.",
      icon: <CalendarIcon className="h-10 w-10 text-primary" />
    }
  ];

  const timeline = [
    {
      ano: "2018",
      titulo: "Fundação",
      descricao: "A EdunexIA nasce com a missão de transformar a educação a distância no Brasil."
    },
    {
      ano: "2019",
      titulo: "Primeira versão",
      descricao: "Lançamento da primeira versão da plataforma com foco em cursos técnicos."
    },
    {
      ano: "2020",
      titulo: "Expansão nacional",
      descricao: "Aumento significativo de clientes durante a pandemia, alcançando todo o território nacional."
    },
    {
      ano: "2021",
      titulo: "Integração com IA",
      descricao: "Implementação de inteligência artificial para personalizar a experiência de aprendizado."
    },
    {
      ano: "2022",
      titulo: "Portal do Polo",
      descricao: "Lançamento do módulo de gestão de polos e parceiros educacionais."
    },
    {
      ano: "2023",
      titulo: "Internacionalização",
      descricao: "Início das operações em países da América Latina, com suporte a múltiplos idiomas."
    },
    {
      ano: "2024",
      titulo: "Nova plataforma",
      descricao: "Lançamento da versão completamente renovada, com foco em escalabilidade e experiência do usuário."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50 py-16 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Nossa História
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                Transformando a educação a distância com tecnologia e inovação desde 2018.
              </p>
            </div>
          </div>
        </section>
        
        {/* Mission & Vision */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Missão</h2>
                <p className="text-gray-600">
                  Democratizar o acesso à educação de qualidade através de tecnologias inovadoras, 
                  proporcionando ferramentas que transformam a experiência de aprendizado e 
                  impulsionam o crescimento das instituições de ensino brasileiras.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Visão</h2>
                <p className="text-gray-600">
                  Ser reconhecida como a plataforma educacional mais inovadora da América Latina, 
                  estabelecendo novos padrões de excelência em tecnologia aplicada à educação e 
                  ajudando instituições a alcançarem seu potencial máximo.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Valores</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Princípios que orientam todas as nossas decisões e relacionamentos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {valores.map((valor, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                  <div className="mb-4">
                    {valor.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{valor.nome}</h3>
                  <p className="text-gray-600">{valor.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Timeline */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossa Trajetória</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Uma história de crescimento, inovação e impacto na educação brasileira
              </p>
            </div>
            
            <div className="relative">
              {/* Central line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
              
              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-1/2" />
                    <div className="z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary shrink-0">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-sm font-semibold text-primary mb-1">{item.ano}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.titulo}</h3>
                        <p className="text-gray-600">{item.descricao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Team */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nosso Time</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Profissionais apaixonados por educação e tecnologia, trabalhando para transformar o aprendizado
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200"></div>
                  <div className="p-5 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">Nome do Profissional</h3>
                    <p className="text-sm text-primary mb-2">Cargo na Empresa</p>
                    <p className="text-sm text-gray-600">Breve descrição do profissional e sua expertise na área de educação e tecnologia.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Junte-se a nós nessa jornada</h2>
            <p className="text-xl opacity-90 mb-8">
              Transforme a experiência educacional da sua instituição com a plataforma mais moderna do Brasil.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
                onClick={() => navigate('/portal-selection')}
              >
                Começar agora
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => navigate('/contato')}
              >
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