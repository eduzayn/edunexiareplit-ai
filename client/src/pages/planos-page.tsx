import NavbarMain from "@/components/layout/navbar-main";
import FooterMain from "@/components/layout/footer-main";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <NavbarMain />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-blue-950 mb-6">
                Planos que se adaptam ao seu crescimento
              </h1>
              <p className="text-lg md:text-xl text-blue-700/80 max-w-3xl mx-auto">
                Escolha o plano ideal para sua instituição de ensino e comece a transformar a experiência dos seus alunos.
              </p>
            </div>
          </div>
        </section>
        
        {/* Pricing Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Alternador de ciclo de cobrança (opcional) */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center bg-blue-100/50 p-1 rounded-full">
                <button className="px-6 py-2 rounded-full bg-white shadow text-blue-700 font-medium">
                  Mensal
                </button>
                <button className="px-6 py-2 rounded-full text-blue-600 font-medium">
                  Anual (2 meses grátis)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {planos.map((plano, index) => (
                <div 
                  key={index} 
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                    plano.destaque 
                      ? 'border-2 border-primary ring-4 ring-primary/10 transform md:-translate-y-4' 
                      : 'border border-gray-200'
                  } hover:shadow-xl transition-all duration-300`}
                >
                  {plano.destaque && (
                    <div className="absolute top-0 inset-x-0 bg-primary text-white text-center py-2 text-sm font-medium">
                      Recomendado
                    </div>
                  )}
                  <div className={`p-8 ${plano.destaque ? 'pt-14' : 'pt-8'}`}>
                    <h3 className="text-2xl font-bold text-center text-blue-950 mb-3">{plano.nome}</h3>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-blue-900">{plano.preco}</span>
                      <span className="text-blue-600">{plano.periodo}</span>
                    </div>
                    <div className="h-16">
                      <p className="text-sm text-blue-600 text-center mb-6">
                        {plano.descricao}
                      </p>
                    </div>
                    {plano.trial > 0 && (
                      <div className="text-center mb-6">
                        <Badge variant="outline" className="px-3 py-1 border-primary/30 bg-primary/5 text-primary">
                          {plano.trial} dias de teste grátis
                        </Badge>
                      </div>
                    )}
                    <div className="mb-8">
                      <Button 
                        variant={plano.destaque ? "default" : "outline"}
                        size="lg"
                        className={`w-full ${!plano.destaque 
                          ? "text-primary border-primary hover:bg-primary hover:text-white" 
                          : "shadow-md shadow-primary/20"}`}
                        onClick={() => navigate(plano.nome === "Empresarial" 
                          ? '/contato' 
                          : '/cadastro?plano=' + plano.id)}
                      >
                        {plano.nome === "Empresarial" 
                          ? "Fale conosco" 
                          : "Começar período de teste"}
                      </Button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="font-medium text-blue-900 mb-4">O que está incluído:</h4>
                      <ul className="space-y-4">
                        {plano.recursos.map((recurso, i) => (
                          <li key={i} className="flex items-start">
                            <div className="mr-3 mt-1">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <span className="text-gray-700">{recurso}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-20 bg-blue-50 rounded-2xl p-10 border border-blue-100">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-950 mb-4">Precisa de uma solução personalizada?</h3>
                <p className="text-blue-700 mb-8 max-w-2xl mx-auto">
                  Entre em contato com nossa equipe para criar um plano customizado que atenda perfeitamente às necessidades da sua instituição.
                </p>
                <Button variant="outline" onClick={() => navigate('/contato')} size="lg" className="px-8 border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-white">
                  Solicitar orçamento
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Comparação de recursos */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-950 mb-4">Compare os recursos</h2>
              <p className="text-blue-600 max-w-3xl mx-auto">
                Veja em detalhes o que cada plano oferece para sua instituição
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-left text-blue-900 font-medium">Recursos</th>
                    {planos.map((plano, idx) => (
                      <th key={idx} className="py-4 px-4 text-center text-blue-900 font-medium">
                        {plano.nome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">Alunos ativos</td>
                    <td className="py-4 px-4 text-center">50</td>
                    <td className="py-4 px-4 text-center">200</td>
                    <td className="py-4 px-4 text-center">Ilimitados</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">Portal do Aluno</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">Módulo financeiro</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">Módulo CRM</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">Chat multicanal</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">API completa</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">Suporte prioritário</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-20 bg-blue-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-950 mb-4">Perguntas Frequentes</h2>
              <p className="text-blue-700">Tire suas dúvidas sobre nossos planos e serviços</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Posso trocar de plano a qualquer momento?</h3>
                <p className="text-gray-700">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança.</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Existe período mínimo de contrato?</h3>
                <p className="text-gray-700">Nossos planos são mensais, sem período mínimo de fidelidade. Para contratos anuais, oferecemos descontos especiais.</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Como funciona o suporte técnico?</h3>
                <p className="text-gray-700">Todos os planos incluem suporte por e-mail. Os planos Profissional e Enterprise possuem canais de atendimento prioritários e tempos de resposta garantidos em contrato.</p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-lg font-medium text-blue-900 mb-3">É necessário instalar algum software?</h3>
                <p className="text-gray-700">Não, nossa plataforma é 100% em nuvem e pode ser acessada de qualquer dispositivo com conexão à internet. Não é necessário instalar nenhum software adicional.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-blue-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Pronto para transformar sua instituição?</h2>
            <p className="text-blue-100 mb-8 text-lg max-w-3xl mx-auto">
              Experimente o EdunexIA gratuitamente por 14 dias e descubra como nossa plataforma pode ajudar sua instituição a crescer.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/cadastro')}
              className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-6 text-lg"
            >
              Começar período de teste grátis
            </Button>
          </div>
        </section>
      </main>
      
      <FooterMain />
    </div>
  );
}