import { useLocation } from "wouter";
import { useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldIcon, 
  LockIcon, 
  CheckCircleIcon, 
  UserIcon,
  GlobeIcon,
  ClockIcon,
  ServerIcon,
  AlertCircleIcon
} from "lucide-react";

// Componente de Card de Recurso de Privacidade
function PrivacyFeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) {
  return (
    <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start">
          <div className="mr-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
            <p className="text-sm text-neutral-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PrivacidadePage() {
  const [, navigate] = useLocation();
  
  const handleLogin = () => {
    navigate("/portal-selection");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={handleLogin} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-950 to-blue-900 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 inline-flex items-center justify-center p-2 bg-blue-800/50 rounded-full">
                <ShieldIcon className="h-6 w-6 text-blue-200 mr-2" />
                <span className="text-blue-200 text-sm font-medium">Sistema de Privacidade</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Levamos a sério a <span className="text-blue-200">privacidade dos seus dados</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Conheça nosso avançado sistema de permissionamento que protege os dados da sua instituição e dos seus alunos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={() => navigate('/contato')}
                >
                  Falar com especialista
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white/10"
                  onClick={() => navigate('/cadastro')}
                >
                  Experimentar grátis
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Sistema de Permissionamento Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Sistema Híbrido de Permissionamento
              </h2>
              <p className="text-lg text-neutral-600">
                Nosso sistema combina as melhores técnicas de segurança para garantir que apenas pessoas autorizadas tenham acesso aos dados certos no momento certo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* RBAC Card */}
              <Card className="overflow-hidden border-2 border-blue-100">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
                    <h3 className="text-xl font-semibold text-blue-900">Controle Baseado em Papéis (RBAC)</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-neutral-600 mb-4">
                      O RBAC (Role-Based Access Control) associa permissões a papéis específicos no sistema, simplificando o gerenciamento de acessos.
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Perfis pré-definidos para cada função (administrador, diretor, coordenador, tutor)",
                        "Permissões granulares para cada recurso do sistema",
                        "Delegação de acessos por departamento ou unidade",
                        "Controle eficiente de privilégios mínimos"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-neutral-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* ABAC Card */}
              <Card className="overflow-hidden border-2 border-blue-100">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4">
                    <h3 className="text-xl font-semibold text-purple-900">Controle Baseado em Atributos (ABAC)</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-neutral-600 mb-4">
                      O ABAC (Attribute-Based Access Control) permite decisões de acesso dinâmicas baseadas em características específicas do contexto.
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Permissões baseadas na fase da instituição (trial, setup, ativa)",
                        "Controle de acesso baseado no status de pagamento",
                        "Restrições por período acadêmico ou financeiro",
                        "Adaptação dinâmica de acessos conforme mudanças de contexto"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-neutral-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="max-w-3xl mx-auto mt-20">
              <h3 className="text-2xl font-bold text-center text-neutral-900 mb-8">
                Recursos de Privacidade e Segurança
              </h3>
              
              <div className="grid gap-6">
                <PrivacyFeatureCard
                  icon={<UserIcon className="h-6 w-6 text-blue-600" />}
                  title="Isolamento de Dados por Instituição"
                  description="Cada instituição possui acesso apenas aos seus próprios dados, garantindo total separação entre clientes diferentes."
                />
                
                <PrivacyFeatureCard
                  icon={<LockIcon className="h-6 w-6 text-blue-600" />}
                  title="Auditoria de Acessos"
                  description="Registros detalhados de todas as operações realizadas no sistema, permitindo rastreabilidade completa das ações."
                />
                
                <PrivacyFeatureCard
                  icon={<ClockIcon className="h-6 w-6 text-blue-600" />}
                  title="Permissões Baseadas em Tempo"
                  description="Controle de acesso temporário para funções específicas, com expiração automática de privilégios."
                />
                
                <PrivacyFeatureCard
                  icon={<GlobeIcon className="h-6 w-6 text-blue-600" />}
                  title="Conformidade com LGPD"
                  description="Aderência total à Lei Geral de Proteção de Dados, com mecanismos para atender aos direitos dos titulares."
                />
                
                <PrivacyFeatureCard
                  icon={<ServerIcon className="h-6 w-6 text-blue-600" />}
                  title="Criptografia Avançada"
                  description="Dados sensíveis armazenados com criptografia de ponta a ponta, usando os mais altos padrões de segurança."
                />
                
                <PrivacyFeatureCard
                  icon={<AlertCircleIcon className="h-6 w-6 text-blue-600" />}
                  title="Detecção de Anomalias"
                  description="Monitoramento contínuo para identificar padrões suspeitos de acesso ou uso indevido de dados."
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Como Funciona o Sistema de Permissões */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Como Funciona o Sistema de Permissões
              </h2>
              <p className="text-lg text-neutral-600">
                Entenda como nosso sistema de permissionamento híbrido protege os dados da sua instituição em diferentes contextos.
              </p>
            </div>
            
            <div className="space-y-12">
              {/* Fase da Instituição */}
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  Permissões por Fase da Instituição
                </h3>
                <p className="text-neutral-600 mb-6">
                  O acesso às funcionalidades do sistema varia conforme a fase em que a instituição se encontra:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Fase Trial</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso limitado a funcionalidades básicas</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Demonstração com dados de exemplo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">✕</span>
                        <span>Sem acesso a relatórios avançados</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Fase Ativa</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso completo à plataforma</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Possibilidade de criar usuários ilimitados</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Integração com APIs e sistemas externos</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Status de Pagamento */}
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  Permissões por Status de Pagamento
                </h3>
                <p className="text-neutral-600 mb-6">
                  O sistema adapta automaticamente as permissões conforme o status de pagamento da instituição ou do aluno:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Pagamento em Dia</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso completo aos materiais</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Emissão de certificados</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Pagamento Pendente</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso aos conteúdos já liberados</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">✕</span>
                        <span>Restrição a novos módulos</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Pagamento Atrasado</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso restrito a áreas essenciais</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-500 mr-2">✕</span>
                        <span>Bloqueio de funcionalidades premium</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Permissões por Período */}
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  Permissões por Período
                </h3>
                <p className="text-neutral-600 mb-6">
                  O controle de acesso baseado em período permite conceder ou revogar permissões automaticamente em datas específicas:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Período Acadêmico</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso a conteúdos liberados no prazo do curso</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Permissões especiais durante períodos de avaliação</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-neutral-900 mb-2">Período Financeiro</h4>
                    <ul className="text-sm text-neutral-700 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Liberação de relatórios no fechamento do mês</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Acesso temporário para auditoria fiscal</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                Proteja os dados da sua instituição e dos seus alunos
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Garanta a conformidade com a LGPD e ofereça segurança de dados de nível empresarial com o EdunexIA.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={() => navigate('/cadastro')}
                >
                  Começar agora
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white/10"
                  onClick={() => navigate('/contato')}
                >
                  Agendar demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}