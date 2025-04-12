import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { getStudentSidebarItems } from "@/components/layout/student-sidebar-items";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  ClockIcon,
  ChevronLeftIcon,
  PlayCircleIcon,
  BookIcon,
  PictureAsPdfIcon,
  AssignmentIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interface para detalhes da disciplina
interface DisciplineDetail {
  id: number;
  name: string;
  code: string;
  description: string;
  workload: number;
  progress: number;
  videoAula1Url?: string;
  videoAula1Source?: string;
  videoAula2Url?: string;
  videoAula2Source?: string;
  apostilaPdfUrl?: string;
  ebookInterativoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DisciplineEbookPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("chapter1");

  const { data: discipline, isLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Usar o componente padronizado para os itens da barra lateral
  const [location] = useLocation();
  const sidebarItems = getStudentSidebarItems(location);

  // Função para renderizar o eBook interativo
  const renderEbook = () => {
    if (!discipline?.ebookInterativoUrl) {
      return (
        <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
          <BookIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500">E-book não disponível</p>
        </div>
      );
    }

    // Se tivermos uma URL externa, mostrar um iframe ou botão para acessar
    if (discipline.ebookInterativoUrl.startsWith("http")) {
      return (
        <div className="w-full h-[600px] rounded-md overflow-hidden">
          <iframe
            className="w-full h-full"
            src={discipline.ebookInterativoUrl}
            title={`E-book interativo de ${discipline.name}`}
          ></iframe>
        </div>
      );
    }

    // Caso contrário, renderizar uma versão simulada do eBook
    return (
      <div className="p-6 bg-white rounded-md">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="chapter1">Capítulo 1</TabsTrigger>
            <TabsTrigger value="chapter2">Capítulo 2</TabsTrigger>
            <TabsTrigger value="chapter3">Capítulo 3</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chapter1" className="space-y-4">
            <h3 className="text-lg font-medium">Introdução à {discipline.name}</h3>
            <p className="text-gray-700">
              Este capítulo introduz os conceitos fundamentais da disciplina, estabelecendo
              a base teórica que será expandida nos próximos módulos. Através de uma abordagem
              gradual, apresentaremos as principais ideias e metodologias.
            </p>
            <p className="text-gray-700">
              Ao finalizar este capítulo, você terá compreendido:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Os princípios básicos da disciplina</li>
              <li>A terminologia essencial para estudos avançados</li>
              <li>O contexto histórico e evolução da área</li>
              <li>As aplicações práticas no cenário atual</li>
            </ul>
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Exercício Interativo</h4>
              <p className="mb-4">Complete a frase abaixo escolhendo a opção correta:</p>
              <p className="mb-2">A principal característica desta disciplina é:</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  a) Sua abordagem experimental
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  b) Sua base teórica sólida
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  c) Sua aplicação tecnológica
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chapter2" className="space-y-4">
            <h3 className="text-lg font-medium">Aprofundamento Teórico</h3>
            <p className="text-gray-700">
              Neste capítulo, avançamos no estudo da disciplina, explorando conceitos 
              mais complexos e suas inter-relações. Utilizaremos exemplos práticos para
              ilustrar a aplicação da teoria em situações reais.
            </p>
            <div className="my-4 p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium mb-2">Conceito-chave:</h4>
              <p className="italic">
                "A compreensão aprofundada dos princípios teóricos é essencial para 
                o domínio das aplicações práticas da disciplina."
              </p>
            </div>
            <p className="text-gray-700">
              Os tópicos deste capítulo incluem:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Metodologias avançadas de análise</li>
              <li>Técnicas de resolução de problemas complexos</li>
              <li>Estudos de caso e aplicações práticas</li>
            </ul>
          </TabsContent>
          
          <TabsContent value="chapter3" className="space-y-4">
            <h3 className="text-lg font-medium">Aplicações Práticas</h3>
            <p className="text-gray-700">
              O capítulo final da disciplina foca nas aplicações práticas dos 
              conceitos e teorias estudados anteriormente. Aqui, você terá a oportunidade
              de aplicar o conhecimento em projetos e estudos de caso reais.
            </p>
            <div className="my-4">
              <img 
                src="https://placehold.co/600x400/e2e8f0/475569?text=Diagrama+Ilustrativo" 
                alt="Diagrama ilustrativo" 
                className="w-full rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">
                Figura 1: Diagrama ilustrativo dos componentes da disciplina
              </p>
            </div>
            <p className="text-gray-700">
              Ao concluir este capítulo, você estará preparado para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Desenvolver projetos completos utilizando os conceitos da disciplina</li>
              <li>Analisar casos reais e propor soluções fundamentadas</li>
              <li>Integrar o conhecimento desta disciplina com outras áreas correlatas</li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Função para navegar entre os conteúdos
  const goToNextContent = () => {
    // Ir para o próximo conteúdo (simulado)
    setLocation(`/student/discipline/${id}/simulado`);
  };

  // Função para marcar o e-book como lido (seria implementado com uma chamada à API)
  const markAsRead = () => {
    // Simulação: navegar para o próximo conteúdo automaticamente
    goToNextContent();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-900"
            onClick={() => window.history.back()}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Voltar para o curso
          </Button>

          {isLoading ? (
            <>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="w-full h-[600px]" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Ebook header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  E-book Interativo - {discipline?.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  <BookIcon className="h-4 w-4 mr-1 text-blue-600" />
                  <span>Material interativo da disciplina</span>
                </div>
              </div>

              {/* Ebook Content */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {renderEbook()}
                </CardContent>
              </Card>

              {/* Ebook details and navigation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sobre este e-book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      Este e-book interativo complementa o aprendizado fornecendo conteúdo
                      dinâmico e exercícios práticos que ajudam na fixação do conhecimento.
                      Navegue pelos capítulos e interaja com os elementos para um aprendizado completo.
                    </p>
                    <Progress value={discipline?.progress || 0} className="h-2 mb-1" />
                    <p className="text-sm text-gray-600">
                      Progresso na disciplina: {discipline?.progress || 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Navegação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {discipline?.ebookInterativoUrl && discipline.ebookInterativoUrl.startsWith("http") && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => window.open(discipline.ebookInterativoUrl, "_blank")}
                        >
                          <BookIcon className="h-4 w-4 mr-2" />
                          Abrir em nova aba
                        </Button>
                      )}
                      
                      <Button 
                        className="w-full justify-start" 
                        onClick={markAsRead}
                      >
                        <BookIcon className="h-4 w-4 mr-2" />
                        Marcar como lido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related lessons */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conteúdos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/video/1`)}
                >
                  <PlayCircleIcon className="h-4 w-4 mr-2" />
                  Vídeo-aula 1
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/video/2`)}
                >
                  <PlayCircleIcon className="h-4 w-4 mr-2" />
                  Vídeo-aula 2
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/apostila`)}
                >
                  <PictureAsPdfIcon className="h-4 w-4 mr-2" />
                  Apostila em PDF
                </Button>
                
                <Button
                  variant="default"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/ebook`)}
                >
                  <BookIcon className="h-4 w-4 mr-2" />
                  E-book Interativo
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/simulado`)}
                >
                  <AssignmentIcon className="h-4 w-4 mr-2" />
                  Simulado
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}