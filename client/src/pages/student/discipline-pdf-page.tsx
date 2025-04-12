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
  FileIcon,
  FileTextIcon,
  PictureAsPdfIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function DisciplinePdfPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: discipline, isLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Usar o componente padronizado para os itens da barra lateral
  const [location] = useLocation();
  const sidebarItems = getStudentSidebarItems(location);

  // Função para renderizar o visualizador de PDF
  const renderPdfViewer = () => {
    if (!discipline?.apostilaPdfUrl) {
      return (
        <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
          <PictureAsPdfIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500">PDF não disponível</p>
        </div>
      );
    }

    return (
      <div className="w-full h-[600px] rounded-md overflow-hidden">
        <iframe
          className="w-full h-full"
          src={discipline.apostilaPdfUrl}
          title={`Apostila da disciplina ${discipline.name}`}
        ></iframe>
      </div>
    );
  };

  // Função para navegar entre os conteúdos
  const goToNextContent = () => {
    // Ir para o próximo conteúdo (e-book)
    setLocation(`/student/discipline/${id}/ebook`);
  };

  // Função para marcar a apostila como lida (seria implementado com uma chamada à API)
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
              {/* PDF header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Apostila em PDF - {discipline?.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  <PictureAsPdfIcon className="h-4 w-4 mr-1 text-red-600" />
                  <span>Material complementar da disciplina</span>
                </div>
              </div>

              {/* PDF Viewer */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {renderPdfViewer()}
                </CardContent>
              </Card>

              {/* PDF details and navigation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sobre esta apostila</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      Esta apostila contém o material completo para estudo da disciplina. 
                      Recomendamos a leitura integral e a realização dos exercícios propostos.
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
                      {discipline?.apostilaPdfUrl && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => window.open(discipline.apostilaPdfUrl, "_blank")}
                        >
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Abrir em nova aba
                        </Button>
                      )}
                      
                      <Button 
                        className="w-full justify-start" 
                        onClick={markAsRead}
                      >
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        Marcar como lido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related lessons */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conteúdos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  variant="default"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/apostila`)}
                >
                  <PictureAsPdfIcon className="h-4 w-4 mr-2" />
                  Apostila em PDF
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/ebook`)}
                >
                  <MenuBookIcon className="h-4 w-4 mr-2" />
                  E-book Interativo
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}