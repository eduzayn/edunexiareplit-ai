import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  CalendarIcon,
  BookmarkIcon,
  PlayCircleIcon,
  PictureAsPdfIcon,
  MenuBookIcon as BookIcon,
  AssignmentIcon,
  LockIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Interface para disciplina dentro do curso
interface CourseDiscipline {
  id: number;
  name: string;
  code: string;
  description: string;
  workload: number;
  order: number;
  progress: number;
  createdAt?: string;
  updatedAt?: string;
}

// Interface para o curso com detalhes
interface CourseDetail {
  id: number;
  name: string;
  code: string;
  description: string;
  status: string;
  workload: number;
  progress: number;
  enrolledAt: string;
  publishedAt?: string;
  modality?: string;
  evaluationMethod?: string;
  disciplines: CourseDiscipline[];
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: [`/api/student/courses/${id}`],
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

  const renderDisciplineStatus = (progress: number) => {
    if (progress === 0) {
      return (
        <div className="flex items-center text-sm text-gray-500">
          <LockIcon className="h-4 w-4 mr-1" />
          <span>Não iniciado</span>
        </div>
      );
    } else if (progress === 100) {
      return (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          <span>Concluído</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm text-blue-600">
          <Progress value={progress} className="h-1 w-16 mr-2" />
          <span>{progress}%</span>
        </div>
      );
    }
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
            onClick={() => setLocation("/student/courses")}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Meus Cursos
          </Button>

          {isLoading ? (
            <>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Course Header */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{course?.name}</h1>
                  <Badge variant={course?.status === "published" ? "default" : "outline"}>
                    {course?.status === "published" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center text-gray-600 gap-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Carga horária: {course?.workload || 0} horas</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>
                      Matrícula em:{" "}
                      {course?.enrolledAt
                        ? new Date(course.enrolledAt).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col justify-center">
                      <div className="text-center mb-2">
                        <div className="text-3xl font-bold text-primary">{course?.progress || 0}%</div>
                        <div className="text-sm text-gray-600">Progresso geral</div>
                      </div>
                      <Progress value={course?.progress || 0} className="h-2" />
                    </div>

                    <div className="flex flex-col border-l border-gray-200 pl-6">
                      <div className="text-2xl font-bold text-gray-900">{course?.disciplines?.length || 0}</div>
                      <div className="text-sm text-gray-600">Disciplinas</div>
                    </div>

                    <div className="flex flex-col border-l border-gray-200 pl-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {course?.disciplines?.reduce((acc: number, disc: CourseDiscipline) => acc + (disc.progress === 100 ? 1 : 0), 0) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Disciplinas concluídas</div>
                    </div>

                    <div className="flex flex-col border-l border-gray-200 pl-6">
                      <div className="text-2xl font-bold text-gray-900">
                        {course?.workload || 0}h
                      </div>
                      <div className="text-sm text-gray-600">Carga horária total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Tabs defaultValue="content" className="mb-6" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="content">Conteúdo do Curso</TabsTrigger>
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="grades">Notas</TabsTrigger>
                </TabsList>

                <TabsContent value="content">
                  <Card>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {course?.disciplines?.length === 0 ? (
                          <div className="text-center py-6">
                            <BookIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              Nenhuma disciplina disponível
                            </h3>
                            <p className="text-gray-600">
                              Este curso ainda não possui disciplinas.
                            </p>
                          </div>
                        ) : (
                          course?.disciplines?.map((discipline: CourseDiscipline, index: number) => (
                            <AccordionItem key={discipline.id} value={`discipline-${discipline.id}`}>
                              <AccordionTrigger className="hover:bg-gray-50 px-4">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-start">
                                    <div className="w-8 h-8 rounded-full bg-primary-light/20 flex items-center justify-center mr-3 text-primary font-medium">
                                      {index + 1}
                                    </div>
                                    <div className="text-left">
                                      <h3 className="font-medium text-gray-900">{discipline.name}</h3>
                                      <p className="text-sm text-gray-600">
                                        Carga horária: {discipline.workload || 0} horas
                                      </p>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    {renderDisciplineStatus(discipline.progress)}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-4 pt-2">
                                <div className="pl-11">
                                  <ul className="space-y-3">
                                    {/* Video Aula 1 */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 0 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 0}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/video-aula-1`}>
                                          <PlayCircleIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">Vídeo-aula 1</div>
                                          {discipline.progress > 0 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>

                                    {/* Video Aula 2 */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 20 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 20}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/video-aula-2`}>
                                          <PlayCircleIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">Vídeo-aula 2</div>
                                          {discipline.progress >= 40 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>

                                    {/* Material em PDF */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 40 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 40}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/apostila`}>
                                          <PictureAsPdfIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">Apostila em PDF</div>
                                          {discipline.progress >= 60 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>

                                    {/* E-book interativo */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 60 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 60}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/ebook`}>
                                          <BookIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">E-book Interativo</div>
                                          {discipline.progress >= 80 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>

                                    {/* Simulado */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 80 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 80}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/simulado`}>
                                          <AssignmentIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">Simulado (30 questões)</div>
                                          {discipline.progress >= 90 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>

                                    {/* Avaliação Final */}
                                    <li>
                                      <Button
                                        variant={discipline.progress >= 90 ? "default" : "outline"}
                                        size="sm"
                                        className="w-full justify-start text-left"
                                        disabled={discipline.progress < 90}
                                        asChild
                                      >
                                        <Link to={`/student/discipline/${discipline.id}/avaliacao-final`}>
                                          <AssignmentIcon className="h-4 w-4 mr-2" />
                                          <div className="flex-1">Avaliação Final (10 questões)</div>
                                          {discipline.progress >= 100 ? (
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <></>
                                          )}
                                        </Link>
                                      </Button>
                                    </li>
                                  </ul>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))
                        )}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="info">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Sobre o curso</h3>
                          <p className="text-gray-600">{course?.description || "Descrição não disponível."}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Informações adicionais</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Código do curso</h4>
                              <p className="text-gray-600">{course?.code || "N/A"}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Modalidade</h4>
                              <p className="text-gray-600">
                                {course?.modality === "ead" 
                                  ? "Ensino a Distância" 
                                  : course?.modality === "hybrid" 
                                  ? "Híbrido" 
                                  : course?.modality === "presential"
                                  ? "Presencial"
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Avaliação</h4>
                              <p className="text-gray-600">
                                {course?.evaluationMethod === "quiz" 
                                  ? "Questionários" 
                                  : course?.evaluationMethod === "exam" 
                                  ? "Provas" 
                                  : course?.evaluationMethod === "project"
                                  ? "Projetos"
                                  : course?.evaluationMethod === "mixed"
                                  ? "Método misto"
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Data de publicação</h4>
                              <p className="text-gray-600">
                                {course?.publishedAt
                                  ? new Date(course.publishedAt).toLocaleDateString("pt-BR")
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="grades">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900">Suas notas</h3>
                        
                        {course?.disciplines?.length === 0 ? (
                          <div className="text-center py-6">
                            <AssignmentIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              Nenhuma nota disponível
                            </h3>
                            <p className="text-gray-600">
                              Complete as disciplinas para visualizar suas notas.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Disciplina
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Simulado
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avaliação Final
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Média
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {course?.disciplines?.map((discipline) => {
                                  // Simulando notas para demonstração
                                  const simulado = discipline.progress >= 90 ? (Math.floor(Math.random() * 5) + 5) : null;
                                  const avaliacaoFinal = discipline.progress >= 100 ? (Math.floor(Math.random() * 5) + 5) : null;
                                  const media = simulado && avaliacaoFinal ? ((simulado + avaliacaoFinal) / 2).toFixed(1) : null;
                                  
                                  return (
                                    <tr key={discipline.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {discipline.name}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {simulado !== null ? `${simulado.toFixed(1)}` : "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {avaliacaoFinal !== null ? `${avaliacaoFinal.toFixed(1)}` : "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {media !== null ? media : "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {media !== null ? (
                                          parseFloat(media) >= 6 ? (
                                            <Badge variant="default">Aprovado</Badge>
                                          ) : (
                                            <Badge variant="destructive">Reprovado</Badge>
                                          )
                                        ) : (
                                          <Badge variant="outline">Pendente</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}