import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
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
  YoutubeIcon,
  OneDriveIcon,
  GoogleDriveIcon,
  VimeoIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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

export default function DisciplineVideoPage() {
  const { id, videoNumber } = useParams<{ id: string; videoNumber: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: discipline, isLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sidebar items for student portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, active: true, href: "/student/courses" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

  // Determinar o vídeo a ser exibido baseado no parâmetro videoNumber
  const isVideoAula1 = videoNumber === "1";
  const videoUrl = isVideoAula1 ? discipline?.videoAula1Url : discipline?.videoAula2Url;
  const videoSource = isVideoAula1 ? discipline?.videoAula1Source : discipline?.videoAula2Source;
  const videoTitle = isVideoAula1 ? "Vídeo-aula 1" : "Vídeo-aula 2";

  // Função para renderizar o player de vídeo de acordo com a fonte
  const renderVideoPlayer = () => {
    if (!videoUrl) {
      return (
        <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
          <PlayCircleIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500">Vídeo não disponível</p>
        </div>
      );
    }

    // Verificar a origem do vídeo e renderizar o player apropriado
    switch (videoSource) {
      case "youtube":
        // Extrair o ID do vídeo do YouTube
        const youtubeId = videoUrl.includes("youtu.be") 
          ? videoUrl.split("/").pop() 
          : videoUrl.includes("v=") 
            ? new URLSearchParams(videoUrl.split("?")[1]).get("v") 
            : videoUrl;
        
        return (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-md"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={videoTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      case "vimeo":
        // Extrair o ID do vídeo do Vimeo
        const vimeoId = videoUrl.split("/").pop();
        
        return (
          <div className="aspect-video">
            <iframe 
              className="w-full h-full rounded-md"
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={videoTitle}
              frameBorder="0" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        );
      case "onedrive":
      case "google_drive":
      default:
        // Para outros serviços, apenas fornecer um link
        return (
          <div className="bg-gray-100 p-6 rounded-md flex items-center justify-center flex-col h-96">
            {videoSource === "onedrive" && <OneDriveIcon className="h-16 w-16 text-blue-500 mb-4" />}
            {videoSource === "google_drive" && <GoogleDriveIcon className="h-16 w-16 text-blue-500 mb-4" />}
            {!videoSource && <PlayCircleIcon className="h-16 w-16 text-gray-400 mb-4" />}
            <p className="text-gray-700 mb-4">Este vídeo está hospedado externamente</p>
            <Button variant="secondary" onClick={() => window.open(videoUrl, "_blank")}>
              Assistir no site original
            </Button>
          </div>
        );
    }
  };

  // Função para determinar o ícone da fonte de vídeo
  const getVideoSourceIcon = () => {
    switch (videoSource) {
      case "youtube":
        return <YoutubeIcon className="h-4 w-4 mr-1 text-red-600" />;
      case "vimeo":
        return <VimeoIcon className="h-4 w-4 mr-1 text-blue-600" />;
      case "onedrive":
        return <OneDriveIcon className="h-4 w-4 mr-1 text-blue-500" />;
      case "google_drive":
        return <GoogleDriveIcon className="h-4 w-4 mr-1 text-green-500" />;
      default:
        return <PlayCircleIcon className="h-4 w-4 mr-1" />;
    }
  };

  // Função para navegar entre os conteúdos
  const goToNextContent = () => {
    // Se for a primeira vídeo-aula, ir para a segunda
    if (isVideoAula1) {
      setLocation(`/student/discipline/${id}/video/2`);
    } else {
      // Se for a segunda, ir para a apostila em PDF
      setLocation(`/student/discipline/${id}/apostila`);
    }
  };

  // Função para marcar o vídeo como assistido (seria implementado com uma chamada à API)
  const markAsWatched = () => {
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
                  <Skeleton className="aspect-video w-full" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Video header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {videoTitle} - {discipline?.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  {getVideoSourceIcon()}
                  <span>Fonte: {videoSource === "google_drive" ? "Google Drive" : videoSource === "onedrive" ? "OneDrive" : videoSource || "Desconhecida"}</span>
                </div>
              </div>

              {/* Video Player */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  {renderVideoPlayer()}
                </CardContent>
              </Card>

              {/* Video details and navigation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sobre esta vídeo-aula</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      {isVideoAula1 
                        ? "Esta é a primeira vídeo-aula da disciplina. Assista com atenção para compreender os conceitos iniciais."
                        : "Esta é a segunda vídeo-aula da disciplina. Os tópicos avançados são explorados neste vídeo."}
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
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setLocation(`/student/discipline/${id}/video/${isVideoAula1 ? "2" : "1"}`)}
                      >
                        <PlayCircleIcon className="h-4 w-4 mr-2" />
                        {isVideoAula1 ? "Ir para Vídeo-aula 2" : "Voltar para Vídeo-aula 1"}
                      </Button>
                      
                      <Button 
                        className="w-full justify-start" 
                        onClick={markAsWatched}
                      >
                        <PlayCircleIcon className="h-4 w-4 mr-2" />
                        Marcar como assistido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related lessons */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conteúdos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Button
                  variant={isVideoAula1 ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setLocation(`/student/discipline/${id}/video/1`)}
                >
                  <PlayCircleIcon className="h-4 w-4 mr-2" />
                  Vídeo-aula 1
                </Button>
                
                <Button
                  variant={!isVideoAula1 ? "default" : "outline"}
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
                  <DescriptionIcon className="h-4 w-4 mr-2" />
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