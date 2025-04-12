import { useState, useEffect } from "react";
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
  CheckCircleIcon,
  AlertCircleIcon,
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

// Interface para questões da avaliação
interface AssessmentQuestion {
  id: number;
  statement: string;
  options: string[];
  correctOption: number; // Índice da opção correta (0 a n-1)
}

export default function DisciplineAvaliacaoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 20); // 20 minutos em segundos
  const [isPaused, setIsPaused] = useState(false);

  // Efeito para controlar o temporizador
  useEffect(() => {
    if (isPaused || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          toast({
            title: "Tempo esgotado",
            description: "O tempo para a avaliação acabou. Suas respostas serão enviadas automaticamente.",
            variant: "destructive",
          });
          submitAssessment();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, showResults]);

  const { data: discipline, isLoading: isDisciplineLoading } = useQuery<DisciplineDetail>({
    queryKey: [`/api/student/disciplines/${id}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Para um protótipo, vamos simular questões localmente
  const assessmentQuestions: AssessmentQuestion[] = Array(10).fill(0).map((_, index) => ({
    id: index + 1,
    statement: `Questão ${index + 1}: Com base no conteúdo estudado na disciplina ${discipline?.name || 'atual'}, responda:`,
    options: [
      "Esta é a primeira alternativa para a questão de avaliação.",
      "Esta é a segunda alternativa, que apresenta outra perspectiva.",
      "Esta é a terceira alternativa, com uma abordagem diferente.",
      "Esta é a quarta alternativa, que pode ser a correta ou não."
    ],
    correctOption: Math.floor(Math.random() * 4) // Simular alternativa correta aleatória
  }));

  // Usar o componente padronizado para os itens da barra lateral
  const [location] = useLocation();
  const sidebarItems = getStudentSidebarItems(location);

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
    if (currentQuestion < assessmentQuestions.length - 1) {
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
      if (answer === assessmentQuestions[index].correctOption) {
        correctAnswers++;
      }
    });
    return {
      correct: correctAnswers,
      total: assessmentQuestions.length,
      percentage: Math.round((correctAnswers / assessmentQuestions.length) * 100)
    };
  };

  // Pausa temporária na avaliação
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast({
        title: "Avaliação pausada",
        description: "O temporizador foi pausado temporariamente. Retorne logo para continuar.",
      });
    } else {
      toast({
        title: "Avaliação retomada",
        description: "O temporizador foi reiniciado. Continue sua avaliação.",
      });
    }
  };

  // Submeter a avaliação
  const submitAssessment = () => {
    // Verificar se todas as questões foram respondidas
    const unanswered = assessmentQuestions.length - answers.filter(a => a !== undefined).length;
    
    if (unanswered > 0 && !showResults) {
      toast({
        title: "Atenção",
        description: `Você ainda tem ${unanswered} ${unanswered === 1 ? 'questão não respondida' : 'questões não respondidas'}. Deseja continuar?`,
        variant: "destructive",
      });
      return;
    }
    
    setShowResults(true);
    setIsPaused(true); // Pausar o temporizador quando mostrar os resultados
    
    // Em uma implementação real, enviaríamos os resultados para o servidor aqui
    toast({
      title: "Avaliação concluída",
      description: "Suas respostas foram registradas com sucesso.",
    });
  };

  // Ir para a página de cursos
  const goToCourses = () => {
    setLocation("/student/courses");
  };

  // Renderizar o componente de resultados
  const renderResults = () => {
    const score = calculateScore();
    const isPassing = score.percentage >= 70;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultado da Avaliação Final</CardTitle>
          <CardDescription>
            Disciplina: {discipline?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`text-4xl font-bold mb-2 ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {score.percentage}%
            </div>
            <div className="text-gray-500 mb-4">
              {score.correct} de {score.total} questões corretas
            </div>
            <div className={`text-lg font-medium ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {isPassing ? "APROVADO" : "REPROVADO"}
            </div>
            <div className={`flex items-center mt-2 ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
              {isPassing ? (
                <>
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  <span>Parabéns! Você concluiu com sucesso esta disciplina.</span>
                </>
              ) : (
                <>
                  <AlertCircleIcon className="h-6 w-6 mr-2" />
                  <span>Você não atingiu a pontuação mínima para aprovação (70%).</span>
                </>
              )}
            </div>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <h3 className="text-lg font-medium mb-4">Feedback por questão</h3>
            <div className="space-y-4">
              {assessmentQuestions.map((question, index) => {
                const isCorrect = answers[index] === question.correctOption;
                const userAnswer = answers[index] !== undefined ? answers[index] : -1;
                
                return (
                  <div key={index} className={`p-4 rounded-md ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center mb-2">
                      <div className="mr-2 font-medium">Questão {index + 1}:</div>
                      {isCorrect ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Correta
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <AlertCircleIcon className="h-4 w-4 mr-1" />
                          Incorreta
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{question.statement}</div>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Sua resposta:</div>
                      <div className={userAnswer === -1 ? 'text-gray-400 italic' : (isCorrect ? 'text-green-600' : 'text-red-600')}>
                        {userAnswer === -1 ? 'Não respondida' : question.options[userAnswer]}
                      </div>
                      
                      {!isCorrect && (
                        <div className="mt-2">
                          <div className="font-medium mb-1">Resposta correta:</div>
                          <div className="text-green-600">
                            {question.options[question.correctOption]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowResults(false)}>
            Revisar questões
          </Button>
          <Button onClick={goToCourses}>
            Voltar para meus cursos
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar o componente de questão atual
  const renderQuestion = () => {
    const question = assessmentQuestions[currentQuestion];
    const isAnswered = answers[currentQuestion] !== undefined;
    
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle>Avaliação Final - {discipline?.name}</CardTitle>
            <div className="text-gray-500 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span className={timeLeft < 300 ? 'text-red-500 font-medium' : ''}>
                {formatTime(timeLeft)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={togglePause}
              >
                {isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Questão {currentQuestion + 1} de {assessmentQuestions.length}
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
            {currentQuestion < assessmentQuestions.length - 1 ? (
              <Button onClick={nextQuestion}>
                Próxima
              </Button>
            ) : (
              <Button onClick={submitAssessment}>
                <SaveIcon className="h-4 w-4 mr-2" />
                Finalizar Avaliação
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
            {assessmentQuestions.map((_, index) => {
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
          <div className="mt-4">
            <Progress 
              value={(answers.filter(a => a !== undefined).length / assessmentQuestions.length) * 100} 
              className="h-2 mb-1" 
            />
            <p className="text-sm text-gray-600">
              {answers.filter(a => a !== undefined).length} de {assessmentQuestions.length} respondidas
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={submitAssessment}>
            <SaveIcon className="h-4 w-4 mr-2" />
            Finalizar Avaliação
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
          {/* Back button - somente visível quando não estiver fazendo a avaliação */}
          {(showResults || isPaused) && (
            <Button
              variant="ghost"
              className="mb-4 text-gray-600 hover:text-gray-900"
              onClick={() => window.history.back()}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Voltar para o curso
            </Button>
          )}

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
              {!isPaused && !showResults && (
                <div className="alert bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
                  <div className="flex items-center">
                    <AlertCircleIcon className="h-5 w-5 mr-2" />
                    <div>
                      <div className="font-medium">Atenção</div>
                      <div className="text-sm">
                        Esta é a avaliação final da disciplina. Uma vez iniciada, você terá {formatTime(60 * 20)} para completá-la.
                        A pontuação mínima para aprovação é 70%. Boa sorte!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Avaliação header - somente quando não estiver fazendo a avaliação */}
              {(isPaused || showResults) && (
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Avaliação Final - {discipline?.name}
                  </h1>
                  <div className="flex items-center text-gray-600">
                    <AssignmentIcon className="h-4 w-4 mr-1 text-red-600" />
                    <span>
                      Avaliação final com {assessmentQuestions.length} questões e nota de aprovação: 70%
                    </span>
                  </div>
                </div>
              )}

              {/* Avaliação Content */}
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