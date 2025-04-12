import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  AssignmentIcon,
  BookIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  SaveIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

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

// Interface para questões do simulado
interface SimuladoQuestion {
  id: number;
  statement: string;
  options: string[];
  correctOption: number; // Índice da opção correta (0 a n-1)
}

export default function DisciplineSimuladoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 30); // 30 minutos em segundos

  const { data: discipline, isLoading: isDisciplineLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Para um protótipo, vamos simular questões localmente
  const simulatedQuestions: SimuladoQuestion[] = Array(30).fill(0).map((_, index) => ({
    id: index + 1,
    statement: `Questão ${index + 1}: Em relação à disciplina ${discipline?.name || 'atual'}, analise a afirmação a seguir...`,
    options: [
      "Esta é a primeira alternativa, que pode ser correta ou não.",
      "Esta é a segunda alternativa, com uma abordagem diferente.",
      "Esta é a terceira alternativa, apresentando outra perspectiva.",
      "Esta é a quarta alternativa, que pode ser a resposta correta.",
      "Esta é a quinta alternativa, com uma conclusão diferente."
    ],
    correctOption: Math.floor(Math.random() * 5) // Simular alternativa correta aleatória
  }));

  // Sidebar items for student portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, active: true, href: "/student/courses" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

  // Formatar o tempo restante em MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Lidar com a seleção de uma resposta
  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  // Navegar para a próxima questão
  const nextQuestion = () => {
    if (currentQuestion < simulatedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Navegar para a questão anterior
  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Calcular pontuação final
  const calculateScore = () => {
    let correctAnswers = 0;
    answers.forEach((answer, index) => {
      if (answer === simulatedQuestions[index].correctOption) {
        correctAnswers++;
      }
    });
    return {
      correct: correctAnswers,
      total: simulatedQuestions.length,
      percentage: Math.round((correctAnswers / simulatedQuestions.length) * 100)
    };
  };

  // Submeter o simulado
  const submitSimulado = () => {
    // Verificar se todas as questões foram respondidas
    const unanswered = simulatedQuestions.length - answers.filter(a => a !== undefined).length;
    
    if (unanswered > 0 && !showResults) {
      toast({
        title: "Atenção",
        description: `Você ainda tem ${unanswered} ${unanswered === 1 ? 'questão não respondida' : 'questões não respondidas'}. Deseja continuar?`,
        variant: "destructive",
      });
      return;
    }
    
    setShowResults(true);
    
    // Em uma implementação real, enviaríamos os resultados para o servidor aqui
    toast({
      title: "Simulado concluído",
      description: "Suas respostas foram registradas com sucesso.",
    });
  };

  // Ir para a avaliação final
  const goToFinalAssessment = () => {
    setLocation(`/student/discipline/${id}/avaliacao`);
  };

  // Renderizar o componente de resultados
  const renderResults = () => {
    const score = calculateScore();
    const isPassing = score.percentage >= 70;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultado do Simulado</CardTitle>
          <CardDescription>
            Disciplina: {discipline?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`text-4xl font-bold mb-2 ${isPassing ? 'text-green-600' : 'text-amber-600'}`}>
              {score.percentage}%
            </div>
            <div className="text-gray-500 mb-4">
              {score.correct} de {score.total} questões corretas
            </div>
            <div className={`flex items-center ${isPassing ? 'text-green-600' : 'text-amber-600'}`}>
              {isPassing ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  <span>Parabéns! Você está preparado para a avaliação final.</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="h-6 w-6 mr-2" />
                  <span>Recomendamos revisar o conteúdo antes da avaliação final.</span>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Desempenho por questão</h3>
            <div className="grid grid-cols-5 gap-2">
              {simulatedQuestions.map((_, index) => {
                const isCorrect = answers[index] === simulatedQuestions[index].correctOption;
                const isAnswered = answers[index] !== undefined;
                
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-10 w-10 p-0 ${
                      !isAnswered 
                        ? 'bg-gray-100' 
                        : isCorrect 
                          ? 'bg-green-100 border-green-500' 
                          : 'bg-red-100 border-red-500'
                    }`}
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowResults(false)}>
            Revisar questões
          </Button>
          <Button onClick={goToFinalAssessment}>
            Ir para Avaliação Final
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar o componente de questão atual
  const renderQuestion = () => {
    const question = simulatedQuestions[currentQuestion];
    const isAnswered = answers[currentQuestion] !== undefined;
    
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Simulado - {discipline?.name}</CardTitle>
            <div className="text-gray-500 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <CardDescription>
            Questão {currentQuestion + 1} de {simulatedQuestions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Enunciado</h3>
              <p className="text-gray-700">{question.statement}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Alternativas</h3>
              <RadioGroup value={answers[currentQuestion]?.toString()} onValueChange={(value) => handleAnswerSelect(parseInt(value))}>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 rounded-md hover:bg-gray-50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="text-gray-700 font-normal cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowResults(true)}
            >
              Ver resultados
            </Button>
            {currentQuestion < simulatedQuestions.length - 1 ? (
              <Button onClick={nextQuestion}>
                Próxima
              </Button>
            ) : (
              <Button onClick={submitSimulado}>
                <SaveIcon className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar navegação de questões
  const renderQuestionNavigation = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {simulatedQuestions.map((_, index) => {
              const isCurrentQuestion = index === currentQuestion;
              const isAnswered = answers[index] !== undefined;
              
              return (
                <Button
                  key={index}
                  variant={isCurrentQuestion ? "default" : "outline"}
                  className={`h-10 w-10 p-0 ${isAnswered && !isCurrentQuestion ? 'bg-gray-100' : ''}`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={submitSimulado}>
            <SaveIcon className="h-4 w-4 mr-2" />
            Finalizar Simulado
          </Button>
        </CardFooter>
      </Card>
    );
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

          {isDisciplineLoading ? (
            <>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="w-full h-[400px]" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Simulado header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Simulado - {discipline?.name}
                </h1>
                <div className="flex items-center text-gray-600">
                  <AssignmentIcon className="h-4 w-4 mr-1 text-orange-600" />
                  <span>
                    Esse simulado possui {simulatedQuestions.length} questões e deve ser concluído em 30 minutos
                  </span>
                </div>
              </div>

              {/* Simulado Content */}
              {showResults ? (
                renderResults()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    {renderQuestion()}
                  </div>
                  <div>
                    {renderQuestionNavigation()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}