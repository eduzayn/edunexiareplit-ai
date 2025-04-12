import { useState } from "react";
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
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  LayersIcon,
  FileTextIcon,
} from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  Award,
  Target,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Sparkles,
  Zap,
  ChevronsUp,
  Flame,
  Medal,
  Crown,
  Brain,
  GraduationCap,
  BookMarked,
  Rocket,
  Lightbulb,
  BarChart,
  PieChart,
  LineChart,
  TrendingUp,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";

// Definição das interfaces
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  progress: number; // 0-100
  achieved: boolean;
  unlockedAt?: string;
  category: "course" | "activity" | "assessment" | "special";
  points: number;
  level: number;
}

interface StudentProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalCourses: number;
  completedCourses: number;
  totalActivities: number;
  completedActivities: number;
  streak: number; // dias consecutivos de estudo
  totalTimeSpent: number; // em minutos
  badges: string[];
}

interface StudentRanking {
  position: number;
  totalStudents: number;
  classPosition: number;
  totalClassStudents: number;
}

interface Activity {
  id: string;
  name: string;
  type: "video" | "reading" | "exercise" | "exam" | "project";
  completed: boolean;
  score?: number;
  maxScore?: number;
  deadline?: string;
  completedAt?: string;
  courseId: string;
  courseName: string;
}

export default function LearningPage() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Simular dados do aluno
  const studentName = user?.username || "Aluno";
  const studentProgress: StudentProgress = {
    level: 12,
    xp: 3450,
    xpToNextLevel: 5000,
    totalCourses: 8,
    completedCourses: 2,
    totalActivities: 134,
    completedActivities: 89,
    streak: 7,
    totalTimeSpent: 4320, // 72 horas
    badges: ["explorador", "persistente", "social", "pontual", "sábio"],
  };

  const studentRanking: StudentRanking = {
    position: 45,
    totalStudents: 350,
    classPosition: 3,
    totalClassStudents: 28,
  };

  // Simulação de atividades recentes
  const recentActivities: Activity[] = [
    {
      id: "act-1",
      name: "Vídeo-aula: Introdução à Anatomia Humana",
      type: "video",
      completed: true,
      score: 10,
      maxScore: 10,
      completedAt: "2023-04-01T15:30:00",
      courseId: "med-101",
      courseName: "Anatomia Humana"
    },
    {
      id: "act-2",
      name: "Leitura: Sistemas Corporais e Funções",
      type: "reading",
      completed: true,
      completedAt: "2023-04-02T10:15:00",
      courseId: "med-101",
      courseName: "Anatomia Humana"
    },
    {
      id: "act-3",
      name: "Exercícios: Nomenclatura Anatômica",
      type: "exercise",
      completed: true,
      score: 85,
      maxScore: 100,
      completedAt: "2023-04-03T14:40:00",
      courseId: "med-101",
      courseName: "Anatomia Humana"
    },
    {
      id: "act-4",
      name: "Avaliação: Sistema Muscular",
      type: "exam",
      completed: false,
      deadline: "2023-04-15T23:59:59",
      courseId: "med-101",
      courseName: "Anatomia Humana"
    },
    {
      id: "act-5",
      name: "Projeto: Mapa Mental do Sistema Nervoso",
      type: "project",
      completed: false,
      deadline: "2023-04-20T23:59:59",
      courseId: "med-101",
      courseName: "Anatomia Humana"
    }
  ];

  // Simulação de conquistas
  const achievements: Achievement[] = [
    {
      id: "ach-1",
      name: "Primeiro Passo",
      description: "Complete sua primeira atividade no portal",
      icon: BookOpen,
      progress: 100,
      achieved: true,
      unlockedAt: "2023-03-01T10:30:00",
      category: "activity",
      points: 50,
      level: 1
    },
    {
      id: "ach-2",
      name: "Explorador de Conhecimento",
      description: "Acesse todos os tipos de materiais disponíveis em um curso",
      icon: Lightbulb,
      progress: 100,
      achieved: true,
      unlockedAt: "2023-03-15T14:20:00",
      category: "course",
      points: 100,
      level: 2
    },
    {
      id: "ach-3",
      name: "Pontualidade é Tudo",
      description: "Entregue 5 atividades antes do prazo final",
      icon: Clock,
      progress: 80,
      achieved: false,
      category: "activity",
      points: 150,
      level: 2
    },
    {
      id: "ach-4",
      name: "Mente Brilhante",
      description: "Obtenha nota máxima em 3 avaliações consecutivas",
      icon: Brain,
      progress: 66,
      achieved: false,
      category: "assessment",
      points: 200,
      level: 3
    },
    {
      id: "ach-5",
      name: "Maratonista do Conhecimento",
      description: "Estude por 7 dias consecutivos",
      icon: Flame,
      progress: 100,
      achieved: true,
      unlockedAt: "2023-04-05T08:45:00",
      category: "special",
      points: 100,
      level: 2
    },
    {
      id: "ach-6",
      name: "Acadêmico Dedicado",
      description: "Complete um curso inteiro",
      icon: GraduationCap,
      progress: 100,
      achieved: true,
      unlockedAt: "2023-03-30T16:15:00",
      category: "course",
      points: 300,
      level: 3
    },
    {
      id: "ach-7",
      name: "Mestre do Debate",
      description: "Participe de 10 discussões nos fóruns",
      icon: Users,
      progress: 40,
      achieved: false,
      category: "special",
      points: 150,
      level: 2
    },
    {
      id: "ach-8",
      name: "Estudante Exemplar",
      description: "Mantenha uma média acima de 90% em um curso completo",
      icon: Crown,
      progress: 50,
      achieved: false,
      category: "assessment",
      points: 250,
      level: 4
    },
    {
      id: "ach-9",
      name: "Gerenciador do Tempo",
      description: "Complete 20 atividades dentro do prazo",
      icon: Calendar,
      progress: 70,
      achieved: false,
      category: "activity",
      points: 150,
      level: 2
    },
    {
      id: "ach-10",
      name: "Leitor Ávido",
      description: "Leia todo o material de estudo disponível em um curso",
      icon: BookMarked,
      progress: 90,
      achieved: false,
      category: "course",
      points: 200,
      level: 3
    },
    {
      id: "ach-11",
      name: "Colaborador Ativo",
      description: "Ajude 5 colegas respondendo suas dúvidas no fórum",
      icon: Medal,
      progress: 20,
      achieved: false,
      category: "special",
      points: 150,
      level: 3
    },
    {
      id: "ach-12",
      name: "Especialista em Anatomia",
      description: "Complete o curso de Anatomia Humana com nota acima de 95%",
      icon: Trophy,
      progress: 80,
      achieved: false,
      category: "course",
      points: 300,
      level: 4
    }
  ];

  // Função para formatar tempo (minutos para horas e minutos)
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para calcular o top percentil do aluno
  const calculateTopPercentile = (position: number, total: number) => {
    const percentile = Math.round((1 - (position / total)) * 100);
    return `Top ${percentile}%`;
  };

  // Sidebar items
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, href: "/student/courses" },
    { name: "Progresso", icon: <BarChart3 />, active: true, href: "/student/learning" },
    { name: "Credencial", icon: <SchoolIcon />, href: "/student/credencial" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Biblioteca", icon: <LayersIcon />, href: "/student/library" },
    { name: "Secretaria", icon: <FileTextIcon />, href: "/student/secretaria" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Progresso Gamificado</h1>
            <p className="text-gray-600">Acompanhe seus níveis, conquistas e progresso acadêmico</p>
          </div>

          {/* Perfil e Nível do Aluno */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="flex items-center">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.imageUrl} alt={studentName} />
                    <AvatarFallback className="bg-green-100 text-green-800 text-lg">{studentName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white">
                    {studentProgress.level}
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="font-bold text-lg">{studentName}</h2>
                  <p className="text-sm text-gray-600">Nível {studentProgress.level} • {calculateTopPercentile(studentRanking.position, studentRanking.totalStudents)}</p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">XP: {studentProgress.xp}/{studentProgress.xpToNextLevel}</span>
                  <span className="text-gray-600">{Math.round((studentProgress.xp / studentProgress.xpToNextLevel) * 100)}%</span>
                </div>
                <Progress value={(studentProgress.xp / studentProgress.xpToNextLevel) * 100} className="h-3" />
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center bg-amber-100 text-amber-800 rounded-full w-10 h-10 mx-auto mb-1">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{studentProgress.streak} dias</div>
                  <div className="text-xs text-gray-500">Sequência</div>
                </div>
                <div>
                  <div className="flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full w-10 h-10 mx-auto mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{formatTime(studentProgress.totalTimeSpent)}</div>
                  <div className="text-xs text-gray-500">Tempo total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
            </TabsList>

            {/* Tab - Visão Geral */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progresso Geral */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Progresso Geral</CardTitle>
                    <CardDescription>
                      Seu progresso em cursos e atividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cursos */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">Cursos</h3>
                          <Badge variant="outline" className="text-xs font-normal">
                            {studentProgress.completedCourses}/{studentProgress.totalCourses}
                          </Badge>
                        </div>
                        <div className="bg-gray-100 rounded-full h-3 mb-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${(studentProgress.completedCourses / studentProgress.totalCourses) * 100}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 text-center text-sm">
                          <div>
                            <p className="font-medium">{studentProgress.totalCourses}</p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                          <div>
                            <p className="font-medium">{studentProgress.completedCourses}</p>
                            <p className="text-xs text-gray-500">Completos</p>
                          </div>
                          <div>
                            <p className="font-medium">{studentProgress.totalCourses - studentProgress.completedCourses}</p>
                            <p className="text-xs text-gray-500">Em andamento</p>
                          </div>
                        </div>
                      </div>

                      {/* Atividades */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">Atividades</h3>
                          <Badge variant="outline" className="text-xs font-normal">
                            {studentProgress.completedActivities}/{studentProgress.totalActivities}
                          </Badge>
                        </div>
                        <div className="bg-gray-100 rounded-full h-3 mb-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${(studentProgress.completedActivities / studentProgress.totalActivities) * 100}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 text-center text-sm">
                          <div>
                            <p className="font-medium">{studentProgress.totalActivities}</p>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                          <div>
                            <p className="font-medium">{studentProgress.completedActivities}</p>
                            <p className="text-xs text-gray-500">Completas</p>
                          </div>
                          <div>
                            <p className="font-medium">{studentProgress.totalActivities - studentProgress.completedActivities}</p>
                            <p className="text-xs text-gray-500">Pendentes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas de Aprendizado */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Estatísticas de Aprendizado</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-10 h-10 mx-auto mb-2">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-medium text-blue-800">85%</div>
                          <div className="text-xs text-blue-700">Média geral</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center bg-green-100 text-green-800 rounded-full w-10 h-10 mx-auto mb-2">
                            <LineChart className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-medium text-green-800">92%</div>
                          <div className="text-xs text-green-700">Taxa de conclusão</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center bg-purple-100 text-purple-800 rounded-full w-10 h-10 mx-auto mb-2">
                            <PieChart className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-medium text-purple-800">78%</div>
                          <div className="text-xs text-purple-700">Média avaliações</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center bg-amber-100 text-amber-800 rounded-full w-10 h-10 mx-auto mb-2">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-medium text-amber-800">TOP 15%</div>
                          <div className="text-xs text-amber-700">Ranking da turma</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conquistas Recentes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conquistas Recentes</CardTitle>
                    <CardDescription>
                      Últimas conquistas desbloqueadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {achievements
                        .filter(a => a.achieved)
                        .sort((a, b) => {
                          if (!a.unlockedAt || !b.unlockedAt) return 0;
                          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
                        })
                        .slice(0, 3)
                        .map((achievement) => (
                          <button
                            key={achievement.id}
                            className="w-full text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
                            onClick={() => {
                              setSelectedAchievement(achievement);
                              setIsAchievementDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center">
                              <div className="flex items-center justify-center bg-green-100 text-green-700 rounded-full h-10 w-10 mr-3">
                                <achievement.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {achievement.unlockedAt && `Desbloqueado em ${formatDate(achievement.unlockedAt)}`}
                                </p>
                              </div>
                              <div className="ml-auto">
                                <Badge>+{achievement.points} XP</Badge>
                              </div>
                            </div>
                          </button>
                        ))}

                      {achievements.filter(a => a.achieved).length === 0 && (
                        <div className="text-center py-6">
                          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Nenhuma conquista desbloqueada ainda</p>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setActiveTab("achievements")}
                        >
                          Ver todas as conquistas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Próximas Atividades */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Próximas Atividades</CardTitle>
                    <CardDescription>
                      Atividades com prazo próximo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities
                        .filter(a => !a.completed && a.deadline)
                        .sort((a, b) => {
                          if (!a.deadline || !b.deadline) return 0;
                          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                        })
                        .slice(0, 3)
                        .map((activity) => (
                          <div key={activity.id} className="flex items-start p-3 border rounded-lg">
                            <div className="flex items-center justify-center bg-amber-100 text-amber-700 rounded-lg h-10 w-10 mr-3">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap justify-between gap-2">
                                <h4 className="font-medium text-gray-900">{activity.name}</h4>
                                <Badge variant="outline" className="capitalize">
                                  {activity.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{activity.courseName}</p>
                              {activity.deadline && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Prazo: {formatDate(activity.deadline)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                      {recentActivities.filter(a => !a.completed && a.deadline).length === 0 && (
                        <div className="text-center py-6">
                          <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                          <p className="text-gray-500">Não há atividades pendentes no momento</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seu Ranking</CardTitle>
                    <CardDescription>
                      Sua posição em relação aos colegas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div className="relative inline-block">
                          <div className="rounded-full bg-amber-100 p-6">
                            <Trophy className="h-8 w-8 text-amber-600" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">
                            #{studentRanking.position}
                          </div>
                        </div>
                        <h3 className="font-bold text-lg mt-4">{calculateTopPercentile(studentRanking.position, studentRanking.totalStudents)}</h3>
                        <p className="text-sm text-gray-600">entre {studentRanking.totalStudents} alunos</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-center">
                        <h4 className="font-medium text-sm mb-2">Ranking na sua turma</h4>
                        <div className="font-bold text-xl text-green-600">#{studentRanking.classPosition}</div>
                        <p className="text-xs text-gray-500">de {studentRanking.totalClassStudents} alunos</p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab("ranking")}
                      >
                        Ver detalhes do ranking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab - Conquistas */}
            <TabsContent value="achievements">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Todas as Conquistas</CardTitle>
                    <CardDescription>
                      Acompanhe suas conquistas e desafios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {achievements.filter(a => a.achieved).length}
                          </div>
                          <div className="text-sm text-gray-600">Conquistas desbloqueadas</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {achievements.length - achievements.filter(a => a.achieved).length}
                          </div>
                          <div className="text-sm text-gray-600">Conquistas pendentes</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {achievements.filter(a => a.achieved).reduce((sum, a) => sum + a.points, 0)}
                          </div>
                          <div className="text-sm text-gray-600">XP ganho</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round((achievements.filter(a => a.achieved).length / achievements.length) * 100)}%
                          </div>
                          <div className="text-sm text-gray-600">Progresso total</div>
                        </div>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="all">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="unlocked">Desbloqueadas</TabsTrigger>
                        <TabsTrigger value="pending">Pendentes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        <div className="space-y-4">
                          <h3 className="font-medium text-lg">Todas as Conquistas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {achievements.map((achievement) => (
                              <div 
                                key={achievement.id} 
                                className={`border rounded-lg p-4 ${achievement.achieved ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                                onClick={() => {
                                  setSelectedAchievement(achievement);
                                  setIsAchievementDialogOpen(true);
                                }}
                                role="button"
                              >
                                <div className="flex items-start">
                                  <div className={`rounded-full p-3 mr-3 flex-shrink-0 ${
                                    achievement.achieved 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    <achievement.icon className="h-6 w-6" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                                      <Badge className={achievement.achieved ? '' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                                        {achievement.points} XP
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                    
                                    {achievement.achieved ? (
                                      <p className="text-xs text-green-600 mt-2">
                                        Desbloqueado em {achievement.unlockedAt ? formatDate(achievement.unlockedAt) : 'data desconhecida'}
                                      </p>
                                    ) : (
                                      <div className="mt-2">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-gray-600">Progresso</span>
                                          <span className="text-gray-600">{achievement.progress}%</span>
                                        </div>
                                        <Progress value={achievement.progress} className="h-1.5" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="unlocked">
                        <div className="space-y-4">
                          <h3 className="font-medium text-lg">Conquistas Desbloqueadas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {achievements
                              .filter(a => a.achieved)
                              .map((achievement) => (
                                <div 
                                  key={achievement.id} 
                                  className="border rounded-lg p-4 bg-green-50 border-green-200"
                                  onClick={() => {
                                    setSelectedAchievement(achievement);
                                    setIsAchievementDialogOpen(true);
                                  }}
                                  role="button"
                                >
                                  <div className="flex items-start">
                                    <div className="rounded-full bg-green-100 text-green-600 p-3 mr-3 flex-shrink-0">
                                      <achievement.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                                        <Badge>
                                          {achievement.points} XP
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                      <p className="text-xs text-green-600 mt-2">
                                        Desbloqueado em {achievement.unlockedAt ? formatDate(achievement.unlockedAt) : 'data desconhecida'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {achievements.filter(a => a.achieved).length === 0 && (
                              <div className="col-span-full text-center py-10">
                                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <h4 className="text-gray-500 font-medium">Nenhuma conquista desbloqueada</h4>
                                <p className="text-sm text-gray-400 mt-1">Complete atividades e desafios para desbloquear conquistas</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pending">
                        <div className="space-y-4">
                          <h3 className="font-medium text-lg">Conquistas Pendentes</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {achievements
                              .filter(a => !a.achieved)
                              .map((achievement) => (
                                <div 
                                  key={achievement.id} 
                                  className="border rounded-lg p-4"
                                  onClick={() => {
                                    setSelectedAchievement(achievement);
                                    setIsAchievementDialogOpen(true);
                                  }}
                                  role="button"
                                >
                                  <div className="flex items-start">
                                    <div className="rounded-full bg-gray-100 text-gray-500 p-3 mr-3 flex-shrink-0">
                                      <achievement.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                                        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                                          {achievement.points} XP
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                                      <div className="mt-2">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-gray-600">Progresso</span>
                                          <span className="text-gray-600">{achievement.progress}%</span>
                                        </div>
                                        <Progress value={achievement.progress} className="h-1.5" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {achievements.filter(a => !a.achieved).length === 0 && (
                              <div className="col-span-full text-center py-10">
                                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                                <h4 className="text-gray-500 font-medium">Parabéns! Você desbloqueou todas as conquistas</h4>
                                <p className="text-sm text-gray-400 mt-1">Continue acompanhando para novos desafios</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab - Ranking */}
            <TabsContent value="ranking">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ranking Geral */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Ranking Geral</CardTitle>
                    <CardDescription>
                      Como você se compara com outros alunos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Visão resumida do ranking do aluno */}
                      <div className="bg-blue-50 rounded-lg p-6 text-center">
                        <div className="inline-block relative mb-2">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.imageUrl} alt={studentName} />
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">{studentName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold border-4 border-blue-50">
                            {studentRanking.position}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-blue-800">{studentName}</h3>
                        <p className="text-blue-600 font-medium">{calculateTopPercentile(studentRanking.position, studentRanking.totalStudents)}</p>
                        <p className="text-sm text-blue-700 mt-1">de {studentRanking.totalStudents} alunos totais</p>
                      </div>

                      {/* Meus destaques */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Meus Destaques</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <Trophy className="h-5 w-5 text-amber-600 mr-2" />
                              <h4 className="font-medium text-amber-800">1º lugar</h4>
                            </div>
                            <p className="text-sm text-amber-700 mt-1">em Anatomia Humana</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <Medal className="h-5 w-5 text-green-600 mr-2" />
                              <h4 className="font-medium text-green-800">Top 3</h4>
                            </div>
                            <p className="text-sm text-green-700 mt-1">em taxa de conclusão</p>
                          </div>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <Star className="h-5 w-5 text-purple-600 mr-2" />
                              <h4 className="font-medium text-purple-800">Top 5</h4>
                            </div>
                            <p className="text-sm text-purple-700 mt-1">em participação nos fóruns</p>
                          </div>
                        </div>
                      </div>

                      {/* Simulação de tabela de ranking */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Top 5 Alunos</h3>
                        <div className="border rounded-lg overflow-hidden">
                          {/* Cabeçalho */}
                          <div className="grid grid-cols-12 gap-2 bg-gray-100 p-3 text-sm font-medium text-gray-700">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-6">Aluno</div>
                            <div className="col-span-2 text-center">Nível</div>
                            <div className="col-span-3 text-center">Pontuação</div>
                          </div>
                          
                          {/* Dados simulados */}
                          {[
                            { position: 1, name: "Carlos Silva", level: 18, points: 9870, isCurrentUser: false },
                            { position: 2, name: "Mariana Alves", level: 16, points: 8945, isCurrentUser: false },
                            { position: 3, name: studentName, level: studentProgress.level, points: 8320, isCurrentUser: true },
                            { position: 4, name: "Pedro Santos", level: 14, points: 7950, isCurrentUser: false },
                            { position: 5, name: "Julia Costa", level: 13, points: 7640, isCurrentUser: false }
                          ].map((student) => (
                            <div 
                              key={student.position} 
                              className={`grid grid-cols-12 gap-2 p-3 text-sm border-b last:border-0 items-center ${
                                student.isCurrentUser ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="col-span-1 text-center font-bold">
                                {student.position}
                              </div>
                              <div className="col-span-6 flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className={student.isCurrentUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}>
                                    {student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={student.isCurrentUser ? 'font-medium' : ''}>
                                  {student.name} {student.isCurrentUser && "(Você)"}
                                </span>
                              </div>
                              <div className="col-span-2 text-center">
                                <Badge className={student.isCurrentUser ? 'bg-blue-500' : 'bg-gray-500'}>
                                  Nível {student.level}
                                </Badge>
                              </div>
                              <div className="col-span-3 text-center font-medium">
                                {student.points.toLocaleString()} XP
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ranking da Turma */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ranking da Turma</CardTitle>
                    <CardDescription>
                      Sua posição em relação aos colegas de turma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Visão resumida do ranking do aluno na turma */}
                      <div className="bg-green-50 rounded-lg p-6 text-center">
                        <div className="inline-block relative mb-2">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.imageUrl} alt={studentName} />
                            <AvatarFallback className="bg-green-100 text-green-800 text-xl">{studentName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold border-4 border-green-50">
                            {studentRanking.classPosition}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-green-800">{studentName}</h3>
                        <p className="text-green-600 font-medium">{calculateTopPercentile(studentRanking.classPosition, studentRanking.totalClassStudents)}</p>
                        <p className="text-sm text-green-700 mt-1">de {studentRanking.totalClassStudents} alunos na turma</p>
                      </div>

                      {/* Estatísticas Comparativas */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Comparação com a média</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Média de notas</span>
                              <span className="font-medium">Você: 85% | Turma: 72%</span>
                            </div>
                            <div className="flex h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="bg-green-500 w-[85%]"></div>
                              <div className="border-l-2 border-white relative">
                                <div className="absolute -top-1 -bottom-1 -translate-x-1/2 border-l-2 border-dashed border-gray-400"></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
                              <span className="text-green-600">+13%</span> acima da média
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Taxa de conclusão</span>
                              <span className="font-medium">Você: 92% | Turma: 65%</span>
                            </div>
                            <div className="flex h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="bg-green-500 w-[92%]"></div>
                              <div className="border-l-2 border-white relative">
                                <div className="absolute -top-1 -bottom-1 -translate-x-1/2 border-l-2 border-dashed border-gray-400"></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
                              <span className="text-green-600">+27%</span> acima da média
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Tempo de estudo semanal</span>
                              <span className="font-medium">Você: 12h | Turma: 8h</span>
                            </div>
                            <div className="flex h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="bg-green-500 w-[75%]"></div>
                              <div className="border-l-2 border-white relative">
                                <div className="absolute -top-1 -bottom-1 -translate-x-1/2 border-l-2 border-dashed border-gray-400"></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
                              <span className="text-green-600">+4h</span> acima da média
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medalhas da Turma */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Medalhas</h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2">
                            <div className="bg-amber-100 text-amber-700 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-1">
                              <Trophy className="h-6 w-6" />
                            </div>
                            <p className="text-xs text-gray-700">Aluno Destaque</p>
                          </div>
                          <div className="p-2">
                            <div className="bg-blue-100 text-blue-700 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-1">
                              <Flame className="h-6 w-6" />
                            </div>
                            <p className="text-xs text-gray-700">Maior Sequência</p>
                          </div>
                          <div className="p-2">
                            <div className="bg-purple-100 text-purple-700 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-1">
                              <Star className="h-6 w-6" />
                            </div>
                            <p className="text-xs text-gray-700">Melhor Média</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab - Atividades */}
            <TabsContent value="activities">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pontuação por Atividades</CardTitle>
                    <CardDescription>
                      Acompanhe sua pontuação e desempenho em diferentes tipos de atividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Visão geral por tipo de atividade */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center bg-blue-100 text-blue-700 rounded-full h-10 w-10 mx-auto mb-2">
                            <Target className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-bold text-blue-700">2450</div>
                          <p className="text-sm text-blue-600">Vídeo-aulas</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center bg-green-100 text-green-700 rounded-full h-10 w-10 mx-auto mb-2">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-bold text-green-700">1850</div>
                          <p className="text-sm text-green-600">Leituras</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center bg-amber-100 text-amber-700 rounded-full h-10 w-10 mx-auto mb-2">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-bold text-amber-700">1320</div>
                          <p className="text-sm text-amber-600">Exercícios</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center bg-red-100 text-red-700 rounded-full h-10 w-10 mx-auto mb-2">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-bold text-red-700">980</div>
                          <p className="text-sm text-red-600">Avaliações</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center bg-purple-100 text-purple-700 rounded-full h-10 w-10 mx-auto mb-2">
                            <Rocket className="h-5 w-5" />
                          </div>
                          <div className="text-lg font-bold text-purple-700">2100</div>
                          <p className="text-sm text-purple-600">Projetos</p>
                        </div>
                      </div>

                      {/* Informações sobre como ganhar XP */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                          <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-800">Como ganhar XP</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Pontos de experiência (XP) são ganhos ao completar atividades e atingir objetivos. Os pontos acumulados determinam seu nível e posição no ranking.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div className="bg-white rounded p-3 text-sm">
                                <h5 className="font-medium text-gray-900 mb-1">Pontuação por atividade:</h5>
                                <ul className="space-y-1 text-gray-700">
                                  <li className="flex justify-between">
                                    <span>Assistir vídeo-aula:</span>
                                    <span className="font-medium">10-25 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Completar leitura:</span>
                                    <span className="font-medium">5-15 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Exercícios:</span>
                                    <span className="font-medium">10-30 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Avaliações:</span>
                                    <span className="font-medium">20-50 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Projetos:</span>
                                    <span className="font-medium">50-100 XP</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="bg-white rounded p-3 text-sm">
                                <h5 className="font-medium text-gray-900 mb-1">Bônus de XP:</h5>
                                <ul className="space-y-1 text-gray-700">
                                  <li className="flex justify-between">
                                    <span>Entregar antes do prazo:</span>
                                    <span className="font-medium">+10% XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Nota máxima:</span>
                                    <span className="font-medium">+15% XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Sequência de 7 dias:</span>
                                    <span className="font-medium">+50 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Desbloquear conquistas:</span>
                                    <span className="font-medium">50-300 XP</span>
                                  </li>
                                  <li className="flex justify-between">
                                    <span>Participar em fóruns:</span>
                                    <span className="font-medium">5-20 XP</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Histórico recente de atividades */}
                      <div>
                        <h3 className="font-medium text-lg mb-3">Histórico Recente de Pontuação</h3>
                        <div className="border rounded-lg overflow-hidden">
                          {/* Cabeçalho */}
                          <div className="grid grid-cols-12 gap-2 bg-gray-100 p-3 text-sm font-medium text-gray-700">
                            <div className="col-span-6">Atividade</div>
                            <div className="col-span-2 text-center">Data</div>
                            <div className="col-span-2 text-center">Resultado</div>
                            <div className="col-span-2 text-center">XP Ganho</div>
                          </div>
                          
                          {/* Atividades recentes com XP */}
                          {[
                            { name: "Vídeo-aula: Introdução ao Sistema Respiratório", date: "10/04/2023", result: "Concluído", xp: 25, type: "video" },
                            { name: "Avaliação: Fisiologia do Sistema Nervoso", date: "08/04/2023", result: "92%", xp: 45, type: "exam" },
                            { name: "Exercício: Células e Tecidos", date: "05/04/2023", result: "85%", xp: 22, type: "exercise" },
                            { name: "Leitura: Metabolismo Celular", date: "03/04/2023", result: "Concluído", xp: 15, type: "reading" },
                            { name: "Projeto: Mapa Conceitual de Anatomia", date: "01/04/2023", result: "95%", xp: 85, type: "project" }
                          ].map((activity, index) => (
                            <div 
                              key={index} 
                              className="grid grid-cols-12 gap-2 p-3 text-sm border-b last:border-0 items-center"
                            >
                              <div className="col-span-6 flex items-center">
                                <div className={`rounded-full p-1.5 mr-2 ${
                                  activity.type === "video" ? "bg-blue-100 text-blue-700" :
                                  activity.type === "reading" ? "bg-green-100 text-green-700" :
                                  activity.type === "exercise" ? "bg-amber-100 text-amber-700" :
                                  activity.type === "exam" ? "bg-red-100 text-red-700" :
                                  "bg-purple-100 text-purple-700"
                                }`}>
                                  {activity.type === "video" ? <Target className="h-4 w-4" /> :
                                   activity.type === "reading" ? <BookOpen className="h-4 w-4" /> :
                                   activity.type === "exercise" ? <Zap className="h-4 w-4" /> :
                                   activity.type === "exam" ? <Award className="h-4 w-4" /> :
                                   <Rocket className="h-4 w-4" />
                                  }
                                </div>
                                <span>{activity.name}</span>
                              </div>
                              <div className="col-span-2 text-center text-gray-600">
                                {activity.date}
                              </div>
                              <div className="col-span-2 text-center">
                                <Badge variant="outline" className={
                                  activity.result === "Concluído" ? "bg-blue-50 text-blue-700" :
                                  parseInt(activity.result) >= 90 ? "bg-green-50 text-green-700" :
                                  parseInt(activity.result) >= 70 ? "bg-amber-50 text-amber-700" :
                                  "bg-red-50 text-red-700"
                                }>
                                  {activity.result}
                                </Badge>
                              </div>
                              <div className="col-span-2 text-center font-medium text-green-600">
                                +{activity.xp} XP
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de detalhes da conquista */}
      <Dialog open={isAchievementDialogOpen} onOpenChange={setIsAchievementDialogOpen}>
        {selectedAchievement && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                  <selectedAchievement.icon className="h-4 w-4 text-green-600" />
                </div>
                {selectedAchievement.name}
              </DialogTitle>
              <DialogDescription>
                {selectedAchievement.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedAchievement.points}</div>
                    <div className="text-xs text-gray-600">Pontos XP</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Nível {selectedAchievement.level}</div>
                    <div className="text-xs text-gray-600">Dificuldade</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">{selectedAchievement.category}</div>
                    <div className="text-xs text-gray-600">Categoria</div>
                  </div>
                </div>
              </div>

              {selectedAchievement.achieved ? (
                <div className="bg-green-50 p-3 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">
                    Conquista desbloqueada em {selectedAchievement.unlockedAt ? formatDate(selectedAchievement.unlockedAt) : 'data desconhecida'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-gray-600">{selectedAchievement.progress}%</span>
                  </div>
                  <Progress value={selectedAchievement.progress} className="h-2" />
                </div>
              )}

              {!selectedAchievement.achieved && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Como desbloquear:</h4>
                  <p className="text-xs text-blue-700">{selectedAchievement.description}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAchievementDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}