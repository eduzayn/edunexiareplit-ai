import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  SchoolIcon, 
  PlayCircleIcon, 
  CalendarIcon, 
  ChatIcon, 
  PaymentsIcon, 
  MapPinIcon,
  ChartIcon,
  BarChartIcon,
  ShieldIcon,
  GraduationCapIcon
} from "@/components/ui/icons";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [animatedCounter, setAnimatedCounter] = useState(0);
  
  useEffect(() => {
    // Simples animação de contador para estatísticas
    const targetValue = 5000;
    const duration = 2000; // ms
    const frameRate = 60;
    const totalFrames = Math.floor(duration / (1000 / frameRate));
    const increment = Math.ceil(targetValue / totalFrames);
    
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const value = Math.min(increment * frame, targetValue);
      setAnimatedCounter(value);
      
      if (frame >= totalFrames) {
        clearInterval(counter);
      }
    }, 1000 / frameRate);
    
    return () => clearInterval(counter);
  }, []);
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary-dark to-blue-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0">
                <div className="inline-block bg-blue-900/30 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-white/10">
                  ✨ A revolução na educação a distância
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Transforme sua <span className="text-yellow-300">instituição educacional</span> com tecnologia avançada
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto lg:mx-0 mb-8">
                  A plataforma mais moderna do Brasil para instituições EAD, com tecnologia avançada e inteligência artificial que potencializa a aprendizagem.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    variant="secondary"
                    size="lg"
                    className="bg-white text-primary hover:bg-gray-100 font-medium shadow-lg transition-all hover:scale-105"
                    onClick={() => navigate('/modulos')}
                  >
                    <PlayCircleIcon className="mr-2 h-5 w-5" />
                    Assistir demonstração
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-[#12B76A] hover:bg-[#0E9355] text-white font-medium shadow-lg transition-all hover:scale-105"
                    onClick={() => navigate('/contato')}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Agendar demonstração
                  </Button>
                </div>
              </div>
              
              {/* Stats cards */}
              <div className="lg:w-1/2 lg:pl-12">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
                        <SchoolIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white">{animatedCounter.toLocaleString('pt-BR')}+</div>
                      <p className="text-white/80 text-sm">Alunos ativos</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
                        <SchoolIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white">100+</div>
                      <p className="text-white/80 text-sm">Instituições</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
                        <BarChartIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white">97%</div>
                      <p className="text-white/80 text-sm">Taxa de satisfação</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mb-3">
                        <ShieldIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-white">100%</div>
                      <p className="text-white/80 text-sm">LGPD Compliant</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          
          {/* Abstract shapes for background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-white/10"></div>
            <div className="absolute right-0 top-1/3 w-64 h-64 rounded-full bg-white/10"></div>
            <div className="absolute left-1/4 bottom-0 w-80 h-80 rounded-full bg-white/10"></div>
            
            {/* Animated dots */}
            <div className="absolute w-full h-full">
              <div className="absolute top-20 right-40 w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></div>
              <div className="absolute top-60 left-40 w-3 h-3 rounded-full bg-green-300 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute bottom-20 right-1/4 w-2 h-2 rounded-full bg-blue-300 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </section>
        
        {/* Modules Section */}
        <section className="py-12 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold text-neutral-900 mb-4">Módulos Integrados</h2>
              <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                Soluções completas para gestão educacional inteligente, tudo em uma única plataforma.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Student Portal Module */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
                    <SchoolIcon className="h-8 w-8 text-[#12B76A]" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-neutral-900 mb-2">Portal do Aluno</h3>
                  <p className="text-sm text-neutral-600 text-center mb-4">
                    Experiência completa para alunos com acesso a todos os recursos educacionais.
                  </p>
                  <ul className="text-sm text-neutral-700 mb-6 space-y-2">
                    {['Credencial digital', 'Certificados online', 'Ambiente virtual de aprendizagem'].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[#12B76A] mr-2 h-5 w-5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() => navigate('/modulos')}
                  >
                    Saiba mais
                  </Button>
                </div>
              </div>

              {/* Chat Module */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100">
                    <ChatIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-neutral-900 mb-2">Chat Multicanal</h3>
                  <p className="text-sm text-neutral-600 text-center mb-4">
                    Comunicação integrada com alunos através de múltiplos canais.
                  </p>
                  <ul className="text-sm text-neutral-700 mb-6 space-y-2">
                    {['Integração com WhatsApp', 'E-mail automatizado', 'Kanban de leads'].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[#12B76A] mr-2 h-5 w-5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() => navigate('/modulos')}
                  >
                    Saiba mais
                  </Button>
                </div>
              </div>

              {/* Financial Module */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-purple-100">
                    <PaymentsIcon className="h-8 w-8 text-[#7C4DFC]" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-neutral-900 mb-2">Financeiro</h3>
                  <p className="text-sm text-neutral-600 text-center mb-4">
                    Gestão financeira completa para instituições educacionais.
                  </p>
                  <ul className="text-sm text-neutral-700 mb-6 space-y-2">
                    {['Pagamentos online', 'Contratos digitais', 'Relatórios gerenciais'].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[#12B76A] mr-2 h-5 w-5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() => navigate('/modulos')}
                  >
                    Saiba mais
                  </Button>
                </div>
              </div>

              {/* Polo Module */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-neutral-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-orange-100">
                    <MapPinIcon className="h-8 w-8 text-[#F79009]" />
                  </div>
                  <h3 className="text-xl font-semibold text-center text-neutral-900 mb-2">Polos</h3>
                  <p className="text-sm text-neutral-600 text-center mb-4">
                    Gestão completa de polos educacionais e unidades descentralizadas.
                  </p>
                  <ul className="text-sm text-neutral-700 mb-6 space-y-2">
                    {['Gestão de unidades', 'Comissões automatizadas', 'Captação de alunos'].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[#12B76A] mr-2 h-5 w-5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() => navigate('/modulos')}
                  >
                    Saiba mais
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button 
                variant="link" 
                className="text-primary hover:text-primary-dark"
                onClick={() => navigate('/modulos')}
              >
                Ver todos os módulos
                <span className="ml-1">→</span>
              </Button>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-neutral-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold text-white mb-4">Pronto para transformar sua instituição?</h2>
                <p className="text-lg text-white/80 mb-8">
                  Explore todos os recursos da plataforma mais moderna do Brasil para ensino a distância.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg"
                    onClick={handleLogin}
                  >
                    <span className="mr-2">🔑</span>
                    Acessar sistema
                  </Button>
                  <Button 
                    variant="secondary"
                    size="lg"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={() => navigate('/contato')}
                  >
                    <span className="mr-2">📞</span>
                    Fale conosco
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block lg:w-2/5">
                <div className="rounded-lg shadow-2xl bg-gradient-to-r from-gray-700 to-gray-900 h-72 flex items-center justify-center">
                  <div className="text-white text-center">
                    <SchoolIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-medium">EdunexIA</p>
                    <p className="text-sm opacity-80">Transformando a educação a distância</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
