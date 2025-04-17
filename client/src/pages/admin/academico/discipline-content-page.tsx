import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Discipline, videoSourceEnum, contentCompletionStatusEnum } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VideoIcon,
  BookIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  SaveIcon,
  PencilIcon,
  PlusIcon,
  MinusIcon,
  RefreshCwIcon,
  UploadIcon,
  DashboardIcon,
  SchoolIcon,
  FileIcon,
  PlayIcon,
  LinkIcon,
  AlertTriangleIcon,
  YoutubeIcon,
  OneDriveIcon,
  GoogleDriveIcon,
  VimeoIcon,
  CheckIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schema para validação dos formulários
const videoFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  videoSource: z.enum(["youtube", "onedrive", "google_drive", "vimeo", "upload"]),
  url: z.string().url({ message: "URL inválida" }),
  duration: z.coerce.number().min(1, { message: "Duração deve ser maior que 0" }),
});

const materialFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  url: z.string().url({ message: "URL inválida" }),
});

// E-book schema removido - usando interface completa em /admin/ebooks/generate

const questionFormSchema = z.object({
  statement: z.string().min(5, { message: "Enunciado deve ter pelo menos 5 caracteres" }),
  options: z.array(z.string()).min(4, { message: "Deve ter pelo menos 4 opções" }).max(5, { message: "Deve ter no máximo 5 opções" }),
  correctOption: z.number().min(0, { message: "Selecione a opção correta" }),
  explanation: z.string().min(5, { message: "Explicação deve ter pelo menos 5 caracteres" }),
});

const assessmentFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  type: z.enum(["simulado", "avaliacao_final"]),
  passingScore: z.coerce.number().min(0, { message: "Nota mínima deve ser maior ou igual a 0" }).max(10, { message: "Nota mínima deve ser menor ou igual a 10" }),
});

type VideoFormValues = z.infer<typeof videoFormSchema>;
type MaterialFormValues = z.infer<typeof materialFormSchema>;
type EbookFormValues = z.infer<typeof ebookFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;
type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export default function DisciplineContentPage() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const disciplineId = parseInt(id as string);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para diálogos
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isVideoEditDialogOpen, setIsVideoEditDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isEbookDialogOpen, setIsEbookDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  
  // Estados para seleção de itens
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<"simulado" | "avaliacao_final">("simulado");
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  
  // Estados para formulários de questões
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number>(0);
  
  // Contador de progresso
  const [completionProgress, setCompletionProgress] = useState(0);

  // Sidebar items for admin portal
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon />, href: "/admin/dashboard" },
    { name: "Disciplinas", icon: <BookIcon />, href: "/admin/disciplines", active: true },
    { name: "Cursos", icon: <SchoolIcon />, href: "/admin/courses" },
  ];

  // Consulta para obter a disciplina pelo ID
  const { 
    data: discipline, 
    isLoading: isDisciplineLoading, 
    isError: isDisciplineError 
  } = useQuery({
    queryKey: ["/api/admin/disciplines", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/disciplines/${disciplineId}`);
      return response.json();
    },
  });
  
  // Consulta para obter vídeos da disciplina
  const { 
    data: videos, 
    isLoading: isVideosLoading,
    refetch: refetchVideos
  } = useQuery({
    queryKey: ["/api/admin/discipline-videos", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/discipline-videos/${disciplineId}`);
      return response.json();
    },
  });
  
  // Consulta para obter apostila da disciplina
  const { 
    data: material, 
    isLoading: isMaterialLoading,
    refetch: refetchMaterial
  } = useQuery({
    queryKey: ["/api/admin/discipline-material", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/discipline-material/${disciplineId}`);
      return response.json();
    },
  });
  
  // Consulta para obter e-book da disciplina
  const { 
    data: ebook, 
    isLoading: isEbookLoading,
    refetch: refetchEbook
  } = useQuery({
    queryKey: ["/api/admin/discipline-ebook", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/discipline-ebook/${disciplineId}`);
      return response.json();
    },
  });
  
  // Consulta para obter questões da disciplina
  const { 
    data: questions, 
    isLoading: isQuestionsLoading,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: ["/api/admin/discipline-questions", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/discipline-questions/${disciplineId}`);
      return response.json();
    },
  });
  
  // Consulta para obter avaliações da disciplina
  const { 
    data: assessments, 
    isLoading: isAssessmentsLoading,
    refetch: refetchAssessments
  } = useQuery({
    queryKey: ["/api/admin/discipline-assessments", disciplineId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/discipline-assessments/${disciplineId}`);
      return response.json();
    },
  });
  
  // Mutation para adicionar vídeo
  const addVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      const response = await apiRequest("POST", `/api/admin/discipline-videos/${disciplineId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vídeo adicionado com sucesso!",
        description: "O vídeo foi vinculado à disciplina.",
      });
      refetchVideos();
      setIsVideoDialogOpen(false);
      videoForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para editar vídeo
  const editVideoMutation = useMutation({
    mutationFn: async ({ videoId, data }: { videoId: number, data: VideoFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/discipline-videos/${videoId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vídeo atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      refetchVideos();
      setIsVideoEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar vídeo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar apostila
  const addMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      const response = await apiRequest("POST", `/api/admin/discipline-material/${disciplineId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Apostila adicionada com sucesso!",
        description: "A apostila foi vinculada à disciplina.",
      });
      refetchMaterial();
      setIsMaterialDialogOpen(false);
      materialForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar apostila",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar e-book
  const addEbookMutation = useMutation({
    mutationFn: async (data: EbookFormValues) => {
      const response = await apiRequest("POST", `/api/admin/discipline-ebook/${disciplineId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "E-book adicionado com sucesso!",
        description: "O e-book foi vinculado à disciplina.",
      });
      refetchEbook();
      setIsEbookDialogOpen(false);
      ebookForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar e-book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar questão
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { disciplineId: number }) => {
      const response = await apiRequest("POST", "/api/admin/questions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Questão adicionada com sucesso!",
        description: "A questão foi salva no banco de questões.",
      });
      refetchQuestions();
      setIsQuestionDialogOpen(false);
      questionForm.reset();
      setQuestionOptions(["", "", "", ""]);
      setCorrectOption(0);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar questão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para adicionar avaliação
  const addAssessmentMutation = useMutation({
    mutationFn: async (data: AssessmentFormValues & { disciplineId: number }) => {
      const response = await apiRequest("POST", "/api/admin/assessments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação criada com sucesso!",
        description: "A avaliação foi vinculada à disciplina.",
      });
      refetchAssessments();
      setIsAssessmentDialogOpen(false);
      assessmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para verificar completude da disciplina
  const checkCompletenesssMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", `/api/admin/disciplines/${disciplineId}/check-completeness`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.complete) {
        toast({
          title: "Disciplina completa!",
          description: "Todos os elementos pedagógicos foram adicionados.",
        });
      } else {
        toast({
          title: "Disciplina incompleta",
          description: "Alguns elementos pedagógicos ainda precisam ser adicionados.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao verificar completude",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formulários
  const videoForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoSource: "youtube",
      url: "",
      duration: 0,
    },
  });
  
  const materialForm = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });
  
  const ebookForm = useForm<EbookFormValues>({
    resolver: zodResolver(ebookFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });
  
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      statement: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    },
  });
  
  const assessmentForm = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "simulado",
      passingScore: 6,
    },
  });
  
  // Funções para manipular dialogs
  const handleOpenVideoDialog = () => {
    videoForm.reset();
    setIsVideoDialogOpen(true);
  };
  
  const handleOpenVideoEditDialog = (video: any) => {
    setSelectedVideo(video);
    videoForm.reset({
      title: video.title,
      description: video.description,
      videoSource: video.videoSource,
      url: video.url,
      duration: video.duration,
    });
    setIsVideoEditDialogOpen(true);
  };
  
  const handleOpenMaterialDialog = () => {
    materialForm.reset();
    setIsMaterialDialogOpen(true);
  };
  
  const handleOpenEbookDialog = () => {
    ebookForm.reset();
    setIsEbookDialogOpen(true);
  };
  
  const handleOpenQuestionDialog = () => {
    questionForm.reset();
    setQuestionOptions(["", "", "", ""]);
    setCorrectOption(0);
    setIsQuestionDialogOpen(true);
  };
  
  const handleOpenAssessmentDialog = (type: "simulado" | "avaliacao_final") => {
    setSelectedAssessmentType(type);
    assessmentForm.reset({
      title: type === "simulado" ? "Simulado" : "Avaliação Final",
      description: type === "simulado" 
        ? "Simulado para prática e preparação" 
        : "Avaliação final para certificação",
      type: type,
      passingScore: 6,
    });
    setIsAssessmentDialogOpen(true);
  };
  
  // Funções para envio de formulários
  const onVideoSubmit = (data: VideoFormValues) => {
    addVideoMutation.mutate(data);
  };
  
  const onVideoEditSubmit = (data: VideoFormValues) => {
    if (selectedVideo) {
      editVideoMutation.mutate({ videoId: selectedVideo.id, data });
    }
  };
  
  const onMaterialSubmit = (data: MaterialFormValues) => {
    addMaterialMutation.mutate(data);
  };
  
  const onEbookSubmit = (data: EbookFormValues) => {
    addEbookMutation.mutate(data);
  };
  
  const onQuestionSubmit = (data: QuestionFormValues) => {
    addQuestionMutation.mutate({ ...data, disciplineId });
  };
  
  const onAssessmentSubmit = (data: AssessmentFormValues) => {
    addAssessmentMutation.mutate({ ...data, disciplineId });
  };
  
  // Manipuladores de opções para questões
  const handleAddOption = () => {
    if (questionOptions.length < 5) {
      setQuestionOptions([...questionOptions, ""]);
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (questionOptions.length > 4) {
      const newOptions = [...questionOptions];
      newOptions.splice(index, 1);
      setQuestionOptions(newOptions);
      
      // Ajusta a opção correta se necessário
      if (correctOption === index) {
        setCorrectOption(0);
      } else if (correctOption > index) {
        setCorrectOption(correctOption - 1);
      }
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionOptions];
    newOptions[index] = value;
    setQuestionOptions(newOptions);
    
    // Atualiza o formulário
    questionForm.setValue("options", newOptions);
  };
  
  // Calcula o progresso de completude
  useEffect(() => {
    let progress = 0;
    const totalItems = 5; // 2 vídeos, 1 apostila, 1 e-book, 1 conjunto de avaliações
    
    if (videos && videos.length >= 2) progress++; // Vídeos
    if (material) progress++; // Apostila
    if (ebook) progress++; // E-book
    
    // Simulado com pelo menos 30 questões
    const simulado = assessments?.find(a => a.type === "simulado");
    if (simulado && (simulado.questionCount || 0) >= 30) progress++;
    
    // Avaliação final com pelo menos 10 questões
    const avaliacao = assessments?.find(a => a.type === "avaliacao_final");
    if (avaliacao && (avaliacao.questionCount || 0) >= 10) progress++;
    
    setCompletionProgress(Math.floor((progress / totalItems) * 100));
  }, [videos, material, ebook, assessments]);

  // Efeito para fechar menu mobile quando a tela é redimensionada
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Loading state
  if (isDisciplineLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          items={sidebarItems}
          user={user}
          portalType="admin"
          portalColor="#3451B2"
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-[180px] mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isDisciplineError || !discipline) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          items={sidebarItems}
          user={user}
          portalType="admin"
          portalColor="#3451B2"
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 overflow-auto p-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Erro ao carregar disciplina</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados da disciplina. Verifique se o ID está correto.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate("/admin/disciplines")}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar para Lista de Disciplinas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="admin"
        portalColor="#3451B2"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/admin/disciplines")}
                  className="mr-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {discipline.code} - {discipline.name}
                </h1>
              </div>
              <p className="text-gray-600">
                Gerencie o conteúdo pedagógico da disciplina
              </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0">
              <Button
                onClick={() => checkCompletenesssMutation.mutate()}
                className="flex items-center"
                variant="outline"
              >
                <CheckCircleIcon className="mr-1 h-4 w-4" />
                Verificar Completude
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Progresso de Completude</h3>
                  <span className="text-sm font-semibold">{completionProgress}%</span>
                </div>
                <Progress value={completionProgress} className="h-2" />
                <p className="text-sm text-gray-500">
                  Complete todos os elementos pedagógicos para que a disciplina possa ser incluída em cursos.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="videos">Vídeo-aulas</TabsTrigger>
              <TabsTrigger value="materials">Apostila</TabsTrigger>
              <TabsTrigger value="ebook">E-book</TabsTrigger>
              <TabsTrigger value="assessments">Avaliações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card de Vídeos */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <VideoIcon className="mr-2 h-5 w-5" />
                      Vídeo-aulas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={videos && videos.length >= 2 ? "default" : "outline"}>
                          {videos ? videos.length : 0}/2
                        </Badge>
                      </div>
                      <Progress value={videos ? Math.min(videos.length / 2 * 100, 100) : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("videos")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {videos && videos.length >= 2 ? "Gerenciar Vídeos" : "Adicionar Vídeos"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Apostila */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileTextIcon className="mr-2 h-5 w-5" />
                      Apostila
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={material ? "default" : "outline"}>
                          {material ? "1" : "0"}/1
                        </Badge>
                      </div>
                      <Progress value={material ? 100 : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("materials")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {material ? "Gerenciar Apostila" : "Adicionar Apostila"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de E-book */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookIcon className="mr-2 h-5 w-5" />
                      E-book Interativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Progresso:</span>
                        <Badge variant={ebook ? "default" : "outline"}>
                          {ebook ? "1" : "0"}/1
                        </Badge>
                      </div>
                      <Progress value={ebook ? 100 : 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("ebook")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {ebook ? "Gerenciar E-book" : "Adicionar E-book"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Simulado */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileIcon className="mr-2 h-5 w-5" />
                      Simulado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const simulado = assessments?.find(a => a.type === "simulado");
                        const questionCount = simulado?.questionCount || 0;
                        const progress = Math.min(questionCount / 30 * 100, 100);
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Questões:</span>
                              <Badge variant={questionCount >= 30 ? "default" : "outline"}>
                                {questionCount}/30
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("assessments")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {assessments?.some(a => a.type === "simulado") 
                        ? "Gerenciar Simulado" 
                        : "Adicionar Simulado"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Avaliação Final */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5" />
                      Avaliação Final
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const avaliacao = assessments?.find(a => a.type === "avaliacao_final");
                        const questionCount = avaliacao?.questionCount || 0;
                        const progress = Math.min(questionCount / 10 * 100, 100);
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span>Questões:</span>
                              <Badge variant={questionCount >= 10 ? "default" : "outline"}>
                                {questionCount}/10
                              </Badge>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => setActiveTab("assessments")} 
                      variant="outline" 
                      className="w-full"
                    >
                      {assessments?.some(a => a.type === "avaliacao_final") 
                        ? "Gerenciar Avaliação" 
                        : "Adicionar Avaliação"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Card de Informações da Disciplina */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Código</h4>
                        <p>{discipline.code}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Carga Horária</h4>
                        <p>{discipline.workload} horas</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-500">Status</h4>
                        <Badge variant={completionProgress >= 100 ? "default" : "outline"}>
                          {completionProgress >= 100 ? "Completa" : "Incompleta"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Vídeo-aulas</CardTitle>
                      <CardDescription>
                        Adicione até 2 vídeo-aulas para a disciplina
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleOpenVideoDialog}
                      className="mt-4 md:mt-0"
                      disabled={videos && videos.length >= 2}
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Adicionar Vídeo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isVideosLoading ? (
                    <div className="space-y-4">
                      {Array(2)
                        .fill(0)
                        .map((_, index) => (
                          <div key={index} className="flex flex-col space-y-2">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-6 w-[250px]" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                    </div>
                  ) : !videos || videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <VideoIcon className="h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Nenhuma vídeo-aula adicionada
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Adicione vídeo-aulas para enriquecer o conteúdo da disciplina.
                      </p>
                      <Button onClick={handleOpenVideoDialog} className="mt-4">
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Adicionar Vídeo
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {videos.map((video: any) => (
                        <Card key={video.id} className="overflow-hidden">
                          <div className="relative pb-[56.25%] bg-gray-100">
                            {video.videoSource === "youtube" ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <YoutubeIcon className="h-16 w-16 text-red-600" />
                              </div>
                            ) : video.videoSource === "onedrive" ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <OneDriveIcon className="h-16 w-16 text-blue-500" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <PlayIcon className="h-16 w-16 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="text-lg font-semibold">{video.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                              {video.description}
                            </p>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span>{video.duration} minutos</span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenVideoEditDialog(video)}
                            >
                              <PencilIcon className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(video.url, "_blank")}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" />
                              Visualizar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Apostila</CardTitle>
                      <CardDescription>
                        Adicione a apostila principal em PDF para esta disciplina
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleOpenMaterialDialog}
                      className="mt-4 md:mt-0"
                      disabled={material !== null && material !== undefined}
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      {material ? "Substituir Apostila" : "Adicionar Apostila"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isMaterialLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-6 w-[250px]" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : !material ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileTextIcon className="h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Nenhuma apostila adicionada
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Adicione uma apostila em PDF com o conteúdo principal da disciplina.
                      </p>
                      <Button onClick={handleOpenMaterialDialog} className="mt-4">
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Adicionar Apostila
                      </Button>
                    </div>
                  ) : (
                    <Card>
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex justify-center items-center p-8 bg-gray-100 rounded-md min-w-[200px]">
                          <FileTextIcon className="h-20 w-20 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{material.title}</h3>
                          <p className="mt-2 text-gray-600">{material.description}</p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(material.url, "_blank")}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" />
                              Visualizar PDF
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                materialForm.reset({
                                  title: material.title,
                                  description: material.description,
                                  url: material.url,
                                });
                                setIsMaterialDialogOpen(true);
                              }}
                            >
                              <PencilIcon className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* E-book Tab */}
            <TabsContent value="ebook">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>E-book Interativo</CardTitle>
                      <CardDescription>
                        Adicione um e-book interativo para complementar o aprendizado
                      </CardDescription>
                    </div>
                    <Button
                      asChild
                      className="mt-4 md:mt-0"
                      disabled={ebook !== null && ebook !== undefined}
                    >
                      <Link href={`/admin/ebooks/generate?disciplineId=${disciplineId}`}>
                        <BookIcon className="mr-1 h-4 w-4" />
                        {ebook ? "Substituir E-book" : "Gerar E-book com IA"}
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEbookLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-6 w-[250px]" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : !ebook ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookIcon className="h-16 w-16 text-gray-300" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        Nenhum e-book interativo adicionado
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Adicione um e-book interativo para proporcionar uma experiência rica de aprendizado.
                      </p>
                      <Button asChild className="mt-4">
                        <Link href={`/admin/ebooks/generate?disciplineId=${disciplineId}`}>
                          <BookIcon className="mr-1 h-4 w-4" />
                          Gerar E-book com IA
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Card>
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex justify-center items-center p-8 bg-gray-100 rounded-md min-w-[200px]">
                          <BookIcon className="h-20 w-20 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{ebook.title}</h3>
                          <p className="mt-2 text-gray-600">{ebook.description}</p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(ebook.url, "_blank")}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" />
                              Abrir E-book
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                ebookForm.reset({
                                  title: ebook.title,
                                  description: ebook.description,
                                  url: ebook.url,
                                });
                                setIsEbookDialogOpen(true);
                              }}
                            >
                              <PencilIcon className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments">
              <div className="space-y-6">
                {/* Seção de Questões */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Banco de Questões</CardTitle>
                        <CardDescription>
                          Gerencie as questões que serão utilizadas nas avaliações
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleOpenQuestionDialog}
                        className="mt-4 md:mt-0"
                      >
                        <PlusIcon className="mr-1 h-4 w-4" />
                        Nova Questão
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isQuestionsLoading ? (
                      <div className="space-y-4">
                        {Array(3)
                          .fill(0)
                          .map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                          ))}
                      </div>
                    ) : !questions || questions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertTriangleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Nenhuma questão adicionada
                        </h3>
                        <p className="mt-1 text-gray-500">
                          Adicione questões ao banco para criar avaliações e simulados.
                        </p>
                        <Button onClick={handleOpenQuestionDialog} className="mt-4">
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Adicionar Questão
                        </Button>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {questions.map((question: any, index: number) => (
                          <AccordionItem key={question.id} value={`question-${question.id}`}>
                            <AccordionTrigger className="text-left">
                              Questão {index + 1}: {question.statement.substring(0, 80)}
                              {question.statement.length > 80 ? "..." : ""}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 p-2">
                                <div>
                                  <h4 className="font-semibold">Enunciado:</h4>
                                  <p className="mt-1">{question.statement}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Alternativas:</h4>
                                  <ul className="space-y-2">
                                    {question.options.map((option: string, i: number) => (
                                      <li key={i} className="flex items-start">
                                        <span className={`font-medium ${i === question.correctOption ? "text-green-600" : ""}`}>
                                          {String.fromCharCode(65 + i)}.
                                        </span>
                                        <span className="ml-2">{option}</span>
                                        {i === question.correctOption && (
                                          <Badge className="ml-2 bg-green-500">Correta</Badge>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Explicação:</h4>
                                  <p className="mt-1">{question.explanation}</p>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestion(question);
                                      questionForm.reset({
                                        statement: question.statement,
                                        options: question.options,
                                        correctOption: question.correctOption,
                                        explanation: question.explanation,
                                      });
                                      setQuestionOptions(question.options);
                                      setCorrectOption(question.correctOption);
                                      setIsQuestionDialogOpen(true);
                                    }}
                                  >
                                    <PencilIcon className="mr-1 h-4 w-4" />
                                    Editar
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Simulado */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Simulado</CardTitle>
                        <CardDescription>
                          Configure o simulado com 30 questões para prática dos alunos
                        </CardDescription>
                      </div>
                      {!assessments?.some(a => a.type === "simulado") && (
                        <Button
                          onClick={() => handleOpenAssessmentDialog("simulado")}
                          className="mt-4 md:mt-0"
                          disabled={!questions || questions.length < 30}
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Criar Simulado
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isAssessmentsLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : assessments?.some(a => a.type === "simulado") ? (
                      (() => {
                        const simulado = assessments.find(a => a.type === "simulado");
                        if (!simulado) return null;
                        
                        return (
                          <Card>
                            <div className="p-6">
                              <h3 className="text-xl font-semibold">{simulado.title}</h3>
                              <p className="mt-2 text-gray-600">{simulado.description}</p>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Questões</h4>
                                  <p className="text-lg">
                                    {simulado.questionCount || 0} de 30 necessárias
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Nota para Aprovação</h4>
                                  <p className="text-lg">{simulado.passingScore}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    assessmentForm.reset({
                                      title: simulado.title,
                                      description: simulado.description,
                                      type: "simulado",
                                      passingScore: simulado.passingScore,
                                    });
                                    setSelectedAssessmentType("simulado");
                                    setIsAssessmentDialogOpen(true);
                                  }}
                                >
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {}}
                                >
                                  <PlusIcon className="mr-1 h-4 w-4" />
                                  Adicionar Questões
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Simulado não configurado
                        </h3>
                        <p className="mt-1 text-gray-500">
                          {!questions || questions.length < 30
                            ? `Você precisa adicionar pelo menos 30 questões no banco. Atualmente tem ${questions ? questions.length : 0} questão(ões).`
                            : "Configure o simulado para prática dos alunos."}
                        </p>
                        <Button
                          onClick={() => {
                            if (questions && questions.length >= 30) {
                              handleOpenAssessmentDialog("simulado");
                            } else {
                              handleOpenQuestionDialog();
                            }
                          }}
                          className="mt-4"
                          disabled={!questions || questions.length < 30}
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          {!questions || questions.length < 30
                            ? "Adicionar Questão"
                            : "Criar Simulado"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Avaliação Final */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle>Avaliação Final</CardTitle>
                        <CardDescription>
                          Configure a avaliação final com 10 questões para certificação dos alunos
                        </CardDescription>
                      </div>
                      {!assessments?.some(a => a.type === "avaliacao_final") && (
                        <Button
                          onClick={() => handleOpenAssessmentDialog("avaliacao_final")}
                          className="mt-4 md:mt-0"
                          disabled={!questions || questions.length < 10}
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          Criar Avaliação
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isAssessmentsLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : assessments?.some(a => a.type === "avaliacao_final") ? (
                      (() => {
                        const avaliacao = assessments.find(a => a.type === "avaliacao_final");
                        if (!avaliacao) return null;
                        
                        return (
                          <Card>
                            <div className="p-6">
                              <h3 className="text-xl font-semibold">{avaliacao.title}</h3>
                              <p className="mt-2 text-gray-600">{avaliacao.description}</p>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Questões</h4>
                                  <p className="text-lg">
                                    {avaliacao.questionCount || 0} de 10 necessárias
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-500">Nota para Aprovação</h4>
                                  <p className="text-lg">{avaliacao.passingScore}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    assessmentForm.reset({
                                      title: avaliacao.title,
                                      description: avaliacao.description,
                                      type: "avaliacao_final",
                                      passingScore: avaliacao.passingScore,
                                    });
                                    setSelectedAssessmentType("avaliacao_final");
                                    setIsAssessmentDialogOpen(true);
                                  }}
                                >
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {}}
                                >
                                  <PlusIcon className="mr-1 h-4 w-4" />
                                  Adicionar Questões
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircleIcon className="h-16 w-16 text-gray-300" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                          Avaliação final não configurada
                        </h3>
                        <p className="mt-1 text-gray-500">
                          {!questions || questions.length < 10
                            ? `Você precisa adicionar pelo menos 10 questões no banco. Atualmente tem ${questions ? questions.length : 0} questão(ões).`
                            : "Configure a avaliação final para certificação dos alunos."}
                        </p>
                        <Button
                          onClick={() => {
                            if (questions && questions.length >= 10) {
                              handleOpenAssessmentDialog("avaliacao_final");
                            } else {
                              handleOpenQuestionDialog();
                            }
                          }}
                          className="mt-4"
                          disabled={!questions || questions.length < 10}
                        >
                          <PlusIcon className="mr-1 h-4 w-4" />
                          {!questions || questions.length < 10
                            ? "Adicionar Questão"
                            : "Criar Avaliação"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo-aula</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar uma vídeo-aula à disciplina.
            </DialogDescription>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
              <FormField
                control={videoForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução à Disciplina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descrição do conteúdo do vídeo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="videoSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Vídeo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="youtube" id="youtube" />
                          <Label htmlFor="youtube" className="flex items-center">
                            <YoutubeIcon className="mr-2 h-4 w-4 text-red-600" />
                            YouTube
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="onedrive" id="onedrive" />
                          <Label htmlFor="onedrive" className="flex items-center">
                            <OneDriveIcon className="mr-2 h-4 w-4 text-blue-500" />
                            OneDrive
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="google_drive" id="google_drive" />
                          <Label htmlFor="google_drive" className="flex items-center">
                            <GoogleDriveIcon className="mr-2 h-4 w-4 text-green-500" />
                            Google Drive
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vimeo" id="vimeo" />
                          <Label htmlFor="vimeo" className="flex items-center">
                            <VimeoIcon className="mr-2 h-4 w-4 text-blue-600" />
                            Vimeo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="upload" />
                          <Label htmlFor="upload" className="flex items-center">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Upload Direto
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Vídeo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {videoForm.watch("videoSource") === "youtube"
                        ? "Cole a URL completa do vídeo no YouTube."
                        : videoForm.watch("videoSource") === "onedrive"
                        ? "Cole a URL de compartilhamento do OneDrive."
                        : videoForm.watch("videoSource") === "google_drive"
                        ? "Cole a URL de compartilhamento do Google Drive."
                        : videoForm.watch("videoSource") === "vimeo"
                        ? "Cole a URL completa do vídeo no Vimeo."
                        : "Cole a URL de upload direto do vídeo."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 45"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Vídeo</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isVideoEditDialogOpen} onOpenChange={setIsVideoEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Vídeo-aula</DialogTitle>
            <DialogDescription>
              Atualize as informações da vídeo-aula selecionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...videoForm}>
            <form onSubmit={videoForm.handleSubmit(onVideoEditSubmit)} className="space-y-6">
              <FormField
                control={videoForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução à Disciplina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descrição do conteúdo do vídeo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="videoSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Vídeo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="youtube" id="youtube-edit" />
                          <Label htmlFor="youtube-edit" className="flex items-center">
                            <YoutubeIcon className="mr-2 h-4 w-4 text-red-600" />
                            YouTube
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="onedrive" id="onedrive-edit" />
                          <Label htmlFor="onedrive-edit" className="flex items-center">
                            <OneDriveIcon className="mr-2 h-4 w-4 text-blue-500" />
                            OneDrive
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="google_drive" id="google_drive-edit" />
                          <Label htmlFor="google_drive-edit" className="flex items-center">
                            <GoogleDriveIcon className="mr-2 h-4 w-4 text-green-500" />
                            Google Drive
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vimeo" id="vimeo-edit" />
                          <Label htmlFor="vimeo-edit" className="flex items-center">
                            <VimeoIcon className="mr-2 h-4 w-4 text-blue-600" />
                            Vimeo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upload" id="upload-edit" />
                          <Label htmlFor="upload-edit" className="flex items-center">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Upload Direto
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Vídeo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {videoForm.watch("videoSource") === "youtube"
                        ? "Cole a URL completa do vídeo no YouTube."
                        : videoForm.watch("videoSource") === "onedrive"
                        ? "Cole a URL de compartilhamento do OneDrive."
                        : videoForm.watch("videoSource") === "google_drive"
                        ? "Cole a URL de compartilhamento do Google Drive."
                        : videoForm.watch("videoSource") === "vimeo"
                        ? "Cole a URL completa do vídeo no Vimeo."
                        : "Cole a URL de upload direto do vídeo."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={videoForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 45"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Apostila</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar a apostila principal da disciplina.
            </DialogDescription>
          </DialogHeader>
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(onMaterialSubmit)} className="space-y-6">
              <FormField
                control={materialForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apostila Completa de Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do conteúdo da apostila..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do PDF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Link para o arquivo PDF da apostila. Pode ser um link direto ou de serviços como Google Drive.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Apostila</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add E-book Dialog */}
      <Dialog open={isEbookDialogOpen} onOpenChange={setIsEbookDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar E-book Interativo</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar um e-book interativo à disciplina.
            </DialogDescription>
          </DialogHeader>
          <Form {...ebookForm}>
            <form onSubmit={ebookForm.handleSubmit(onEbookSubmit)} className="space-y-6">
              <FormField
                control={ebookForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: E-book Interativo de Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ebookForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do conteúdo do e-book..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={ebookForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do E-book</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Link para o e-book interativo. Pode ser uma URL do Canva, Book Creator ou plataforma similar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEbookDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar E-book</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Questão</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para adicionar uma questão ao banco.
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-6">
              <FormField
                control={questionForm.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite o enunciado da questão..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Alternativas</FormLabel>
                <div className="space-y-3 mt-2">
                  {questionOptions.map((option, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 pt-2">
                        <Label
                          htmlFor={`option-${index}`}
                          className="font-medium"
                        >
                          {String.fromCharCode(65 + index)}.
                        </Label>
                      </div>
                      <div className="flex-grow">
                        <div className="flex space-x-2">
                          <Input
                            id={`option-${index}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            className="flex-grow"
                          />
                          {index > 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {questionOptions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="mt-2"
                    >
                      <PlusIcon className="mr-1 h-4 w-4" />
                      Adicionar Alternativa
                    </Button>
                  )}
                </div>
              </div>
              <FormField
                control={questionForm.control}
                name="correctOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternativa Correta</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          const index = parseInt(value);
                          setCorrectOption(index);
                          field.onChange(index);
                        }}
                        defaultValue={field.value.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {questionOptions.map((_, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={index.toString()}
                              id={`correct-${index}`}
                            />
                            <Label htmlFor={`correct-${index}`}>
                              Alternativa {String.fromCharCode(65 + index)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explicação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a explicação da resposta correta..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Questão</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Assessment Dialog */}
      <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAssessmentType === "simulado"
                ? "Criar Simulado"
                : "Criar Avaliação Final"}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros da avaliação.
            </DialogDescription>
          </DialogHeader>
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(onAssessmentSubmit)} className="space-y-6">
              <FormField
                control={assessmentForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          selectedAssessmentType === "simulado"
                            ? "Ex: Simulado de Matemática"
                            : "Ex: Avaliação Final de Matemática"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição da avaliação..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Mínima para Aprovação (0-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina a nota mínima que o aluno precisa atingir para ser aprovado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={assessmentForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssessmentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedAssessmentType === "simulado"
                    ? "Criar Simulado"
                    : "Criar Avaliação"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
