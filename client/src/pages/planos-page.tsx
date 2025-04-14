import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import axios from "axios";

// Interface para os planos retornados pela API
interface SubscriptionPlan {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number;
  billingCycle: string;
  trialDays: number;
  maxStudents: number;
  maxCourses: number | null;
  maxPolos: number | null;
  hasFinanceModule: boolean;
  hasCrmModule: boolean;
  hasMultiChannelChat: boolean;
  hasAdvancedReports: boolean;
  hasApiAccess: boolean;
  hasPrioritySupportl: boolean;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

// Mapeamento das features do plano para texto visível para o usuário
const featureMap = {
  baseFeaturesText: "Portal do Aluno",
  maxStudentsText: (max: number) => `Até ${max} alunos ativos`,
  hasPrioritySupportlText: "Suporte prioritário",
  hasFinanceModuleText: "Módulo financeiro completo",
  hasMultiChannelChatText: "Chat multicanal",
  hasAdvancedReportsText: "Relatórios avançados",
  hasApiAccessText: "API completa",
  maxPolosText: (max: number | null) => max ? `Até ${max} polos` : "Polos ilimitados",
  enterpriseSpecificText: [
    "Personalização total",
    "Onboarding dedicado",
    "Gestor de conta exclusivo",
    "SLA garantido"
  ]
};

export default function PlanosPage() {
  const [, navigate] = useLocation();
  const [planosFormatados, setPlanosFormatados] = useState<any[]>([]);
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  // Buscar planos do backend usando React Query
  const { data: planosData, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/public/subscription-plans/public');
        console.log('API response:', response.data);
        return response.data.plans || [];
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
        return [];  // Retornar array vazio em caso de erro para evitar undefined
      }
    }
  });

  // Formatar recursos do plano com base nas propriedades
  const getPlanoRecursos = (plano: SubscriptionPlan) => {
    const recursos = [];
    
    // Adicionar recursos básicos
    recursos.push(featureMap.baseFeaturesText);
    recursos.push(featureMap.maxStudentsText(plano.maxStudents));
    
    // Adicionar módulos condicionais
    if (plano.hasPrioritySupportl) recursos.push(featureMap.hasPrioritySupportlText);
    if (plano.hasFinanceModule) recursos.push(featureMap.hasFinanceModuleText);
    if (plano.hasMultiChannelChat) recursos.push(featureMap.hasMultiChannelChatText);
    if (plano.hasAdvancedReports) recursos.push(featureMap.hasAdvancedReportsText);
    if (plano.hasApiAccess) recursos.push(featureMap.hasApiAccessText);
    
    // Adicionar informação sobre polos
    if (plano.code !== 'enterprise') {
      recursos.push(featureMap.maxPolosText(plano.maxPolos));
    }
    
    // Adicionar recursos específicos do Enterprise
    if (plano.code === 'enterprise') {
      recursos.push(...featureMap.enterpriseSpecificText);
    }
    
    return recursos;
  };

  // Processar os planos quando os dados chegarem
  useEffect(() => {
    if (planosData) {
      const planos = planosData.map((plano: SubscriptionPlan) => {
        // Formatar preço como R$ XX,XX para exibição
        const precoFormatado = plano.code === 'enterprise' 
          ? "Personalizado" 
          : `R$ ${plano.price.toFixed(2).replace('.', ',')}`;
          
        return {
          id: plano.id,
          nome: plano.name,
          preco: precoFormatado,
          periodo: plano.code === 'enterprise' ? "" : `/${plano.billingCycle === 'monthly' ? 'mês' : 'ano'}`,
          descricao: plano.description,
          recursos: getPlanoRecursos(plano),
          destaque: plano.isFeatured,
          cor: plano.isFeatured ? "border-primary" : "border-neutral-200",
          trial: plano.trialDays
        };
      });
      
      // Ordenar por displayOrder
      planos.sort((a: any, b: any) => {
        const planA = planosData.find((p: SubscriptionPlan) => p.id === a.id);
        const planB = planosData.find((p: SubscriptionPlan) => p.id === b.id);
        return (planA?.displayOrder || 0) - (planB?.displayOrder || 0);
      });
      
      setPlanosFormatados(planos);
    }
  }, [planosData]);

  // Fallback para planos estáticos em caso de erro na API
  const planosEstaticos = [
    {
      nome: "Básico",
      preco: "R$ 99,90",
      periodo: "/mês",
      descricao: "Ideal para instituições que estão iniciando no EAD",
      recursos: [
        "Portal do Aluno",
        "Até 50 alunos ativos",
        "Suporte por e-mail",
        "Painel administrativo básico",
        "Certificados digitais",
      ],
      destaque: false,
      cor: "border-neutral-200",
      trial: 14
    },
    {
      nome: "Intermediário",
      preco: "R$ 199,90",
      periodo: "/mês",
      descricao: "Para instituições em crescimento",
      recursos: [
        "Todos os recursos do plano Básico",
        "Até 200 alunos ativos",
        "Módulo financeiro",
        "Módulo CRM",
        "Até 3 polos",
      ],
      destaque: true,
      cor: "border-primary",
      trial: 14
    },
    {
      nome: "Empresarial",
      preco: "Personalizado",
      periodo: "",
      descricao: "Para grandes instituições de ensino",
      recursos: [
        "Todos os recursos dos outros planos",
        "Alunos ilimitados",
        "Suporte 24/7",
        "API completa",
        "Personalização total",
        "Onboarding dedicado",
        "Gestor de conta exclusivo",
        "SLA garantido",
      ],
      destaque: false,
      cor: "border-neutral-200",
      trial: 14
    }
  ];
  
  // Usar planos da API ou fallback para os planos estáticos
  const planos = planosFormatados.length > 0 ? planosFormatados : planosEstaticos;

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Planos que se adaptam ao seu crescimento
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Escolha o plano ideal para sua instituição de ensino e comece a transformar a experiência dos seus alunos.
              </p>
            </div>
          </div>
        </section>
        
        {/* Pricing Table */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {planos.map((plano, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${plano.destaque ? 'border-primary relative' : plano.cor} hover:shadow-lg transition-shadow`}
                >
                  {plano.destaque && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-2 text-sm font-medium">
                      Mais Popular
                    </div>
                  )}
                  <div className={`p-6 ${plano.destaque ? 'pt-12' : ''}`}>
                    <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">{plano.nome}</h3>
                    <div className="text-center mb-4">
                      <span className="text-3xl font-bold text-gray-900">{plano.preco}</span>
                      <span className="text-gray-500">{plano.periodo}</span>
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-6">
                      {plano.descricao}
                    </p>
                    <ul className="text-sm text-gray-700 mb-6 space-y-3">
                      {plano.recursos.map((recurso, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircleIcon className="text-green-500 mr-2 h-5 w-5 shrink-0" />
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant={plano.destaque ? "default" : "outline"}
                      className={`w-full ${!plano.destaque ? "text-primary border-primary hover:bg-primary hover:text-white" : ""}`}
                      onClick={() => navigate('/contato')}
                    >
                      {plano.nome === "Enterprise" ? "Fale conosco" : "Selecionar plano"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Precisa de algo diferente?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Entre em contato com nossa equipe para criar um plano personalizado que atenda perfeitamente às necessidades da sua instituição.
                </p>
                <Button onClick={() => navigate('/contato')} size="lg">
                  Solicitar orçamento personalizado
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
              <p className="text-gray-600">Tire suas dúvidas sobre nossos planos e serviços</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Posso trocar de plano a qualquer momento?</h3>
                <p className="text-gray-600">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Existe período mínimo de contrato?</h3>
                <p className="text-gray-600">Nossos planos são mensais, sem período mínimo de fidelidade. Para contratos anuais, oferecemos descontos especiais.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Como funciona o suporte técnico?</h3>
                <p className="text-gray-600">Todos os planos incluem suporte por e-mail. Os planos Profissional e Enterprise possuem canais de atendimento prioritários e tempos de resposta garantidos em contrato.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">É necessário instalar algum software?</h3>
                <p className="text-gray-600">Não, nossa plataforma é 100% em nuvem e pode ser acessada de qualquer dispositivo com conexão à internet. Não é necessário instalar nenhum software adicional.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}