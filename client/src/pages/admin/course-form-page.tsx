import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Course, Discipline, courseStatusEnum, courseModalityEnum } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ChalkboardTeacherIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  SchoolIcon,
  RefreshCwIcon,
  DashboardIcon,
  BookIcon,
  ClockIcon,
  LayersIcon,
  FileTextIcon,
  MonetizationOnIcon,
  PeopleIcon,
  ShowChartIcon,
  ReceiptIcon,
  ArrowLeftIcon,
  SaveIcon,
} from "@/components/ui/icons";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Schema Zod para validação do formulário
const courseFormSchema = z.object({
  code: z.string().min(3, { message: "Código deve ter pelo menos 3 caracteres" }),
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  workload: z.coerce.number().min(1, { message: "Carga horária é obrigatória" }),
  price: z.coerce.number().optional(),
  thumbnail: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  evaluationMethod: z.string().min(3, { message: "Método de avaliação é obrigatório" }),
  modality: z.enum(["ead", "hybrid", "presential"]).default("ead"),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CourseFormPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<number[]>([]);
  const [disciplineSearchTerm, setDisciplineSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [isEditMode, setIsEditMode] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [calculateAutomatically, setCalculateAutomatically] = useState(true);
  const [totalWorkload, setTotalWorkload] = useState(0);
  
  // Verificar se estamos em modo de edição baseado na URL
  useEffect(() => {
    const pathParts = location.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const mode = pathParts[pathParts.length - 2];
    
    if (mode === 'edit' && !isNaN(parseInt(lastPart))) {
      setIsEditMode(true);
      setCourseId(parseInt(lastPart));
    } else {
      setIsEditMode(false);
      setCourseId(null);
    }
  }, [location]);
  
  // Consulta para buscar dados do curso em modo de edição
  const { 
    data: courseData, 
    isLoading: isCourseLoading 
  } = useQuery({
    queryKey: ["/api/admin/courses", courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const response = await apiRequest("GET", `/api/admin/courses/${courseId}`);
      return response.json();
    },
    enabled: !!courseId,
  });
  
  // Consulta para obter disciplinas do curso em edição
  const { 
    data: courseDisciplines, 
    isLoading: isCourseDisciplinesLoading,
  } = useQuery({
    queryKey: ["/api/admin/course-disciplines", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const response = await apiRequest("GET", `/api/admin/courses/${courseId}/disciplines`);
      return response.json();
    },
    enabled: !!courseId,
    onSuccess: (data) => {
      // Extrair os IDs das disciplinas
      if (data && data.length > 0) {
        const disciplineIds = data.map((item: any) => item.disciplineId);
        setSelectedDisciplines(disciplineIds);
      }
    }
  });

  // Consulta para listar todas as disciplinas disponíveis
  const { 
    data: disciplines, 
    isLoading: isDisciplinesLoading 
  } = useQuery({
    queryKey: ["/api/admin/disciplines"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/disciplines");
      return response.json();
    },
  });
  
  // Sidebar items for admin portal
  const sidebarItems = [
    { name: "Dashboard", icon: <DashboardIcon />, href: "/admin/dashboard" },
    { name: "Disciplinas", icon: <BookIcon />, href: "/admin/disciplines" },
    { name: "Cursos", icon: <SchoolIcon />, href: "/admin/courses", active: true },
  ];

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const response = await apiRequest("POST", "/api/admin/courses", data);
      return response.json();
    },
    onSuccess: (createdCourse) => {
      toast({
        title: "Curso criado com sucesso!",
        description: "O novo curso foi adicionado ao sistema.",
      });
      
      // Se há disciplinas selecionadas, vincula-as ao curso
      if (selectedDisciplines.length > 0) {
        addDisciplinesToCourseMutation.mutate({
          courseId: createdCourse.id,
          disciplineIds: selectedDisciplines
        });
      } else {
        // Redirecionar para a lista de cursos
        setLocation("/admin/courses");
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message || "Ocorreu um erro ao tentar criar o curso.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      if (!courseId) throw new Error("ID do curso não encontrado");
      const response = await apiRequest("PUT", `/api/admin/courses/${courseId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      
      // Se houve alteração nas disciplinas, atualizar
      updateCourseDisciplinesMutation.mutate({
        courseId: courseId!,
        disciplineIds: selectedDisciplines
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message || "Ocorreu um erro ao tentar atualizar o curso.",
        variant: "destructive",
      });
    },
  });

  // Mutation para adicionar disciplinas ao curso
  const addDisciplinesToCourseMutation = useMutation({
    mutationFn: async ({ courseId, disciplineIds }: { courseId: number; disciplineIds: number[] }) => {
      const promises = disciplineIds.map((disciplineId, index) => {
        return apiRequest("POST", "/api/admin/course-disciplines", {
          courseId,
          disciplineId,
          order: index + 1
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Disciplinas adicionadas com sucesso!",
        description: "As disciplinas foram vinculadas ao curso.",
      });
      // Redirecionar para a lista de cursos
      setLocation("/admin/courses");
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar disciplinas",
        description: error.message || "Ocorreu um erro ao vincular as disciplinas ao curso.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar disciplinas do curso
  const updateCourseDisciplinesMutation = useMutation({
    mutationFn: async ({ courseId, disciplineIds }: { courseId: number; disciplineIds: number[] }) => {
      // Primeiro, remove todas as disciplinas do curso
      await apiRequest("DELETE", `/api/admin/courses/${courseId}/disciplines`);
      
      // Depois, adiciona as novas selecionadas
      const promises = disciplineIds.map((disciplineId, index) => {
        return apiRequest("POST", "/api/admin/course-disciplines", {
          courseId,
          disciplineId,
          order: index + 1
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Disciplinas atualizadas com sucesso!",
        description: "As disciplinas do curso foram atualizadas.",
      });
      // Redirecionar para a lista de cursos
      setLocation("/admin/courses");
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar disciplinas",
        description: error.message || "Ocorreu um erro ao atualizar as disciplinas do curso.",
        variant: "destructive",
      });
    },
  });

  // Form para o curso
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      workload: 0,
      price: 0,
      thumbnail: "",
      status: "draft",
      evaluationMethod: "",
      modality: "ead",
    },
  });

  // Efeito para calcular automaticamente a carga horária baseada nas disciplinas selecionadas
  useEffect(() => {
    if (!calculateAutomatically || !disciplines) return;
    
    let total = 0;
    selectedDisciplines.forEach(disciplineId => {
      const discipline = disciplines.find((d: Discipline) => d.id === disciplineId);
      if (discipline && discipline.workload) {
        total += discipline.workload;
      }
    });
    
    setTotalWorkload(total);
    form.setValue("workload", total);
  }, [selectedDisciplines, disciplines, calculateAutomatically]);

  // Efeito para preencher o formulário em modo de edição
  useEffect(() => {
    if (isEditMode && courseData) {
      form.reset({
        code: courseData.code,
        name: courseData.name,
        description: courseData.description,
        workload: courseData.workload,
        price: courseData.price || 0,
        thumbnail: courseData.thumbnail || "",
        status: courseData.status,
        evaluationMethod: courseData.evaluationMethod || "",
        modality: courseData.modality || "ead",
      });
      
      // Se o curso tem uma carga horária definida que é diferente da calculada,
      // desativamos o cálculo automático
      if (courseDisciplines && courseDisciplines.length > 0) {
        let calculatedWorkload = 0;
        courseDisciplines.forEach((item: any) => {
          if (item.discipline && item.discipline.workload) {
            calculatedWorkload += item.discipline.workload;
          }
        });
        
        if (courseData.workload !== calculatedWorkload) {
          setCalculateAutomatically(false);
        }
      }
    }
  }, [isEditMode, courseData, courseDisciplines]);

  // Função para enviar o formulário
  const onSubmit = (data: CourseFormValues) => {
    if (isEditMode) {
      updateCourseMutation.mutate(data);
    } else {
      createCourseMutation.mutate(data);
    }
  };

  // Função para adicionar/remover disciplina
  const toggleDiscipline = (disciplineId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedDisciplines([...selectedDisciplines, disciplineId]);
    } else {
      setSelectedDisciplines(selectedDisciplines.filter(id => id !== disciplineId));
    }
  };

  // Verificar se a disciplina tem todos os conteúdos necessários
  const isDisciplineComplete = (discipline: any) => {
    return discipline.contentCompletionStatus === "complete";
  };

  // Filtrar disciplinas com base na busca
  const filteredDisciplines = disciplines ? disciplines.filter((discipline: Discipline) => 
    !disciplineSearchTerm || 
    discipline.name.toLowerCase().includes(disciplineSearchTerm.toLowerCase()) ||
    discipline.code.toLowerCase().includes(disciplineSearchTerm.toLowerCase())
  ) : [];

  // Renderizar o status de uma disciplina
  const renderDisciplineStatus = (discipline: any) => {
    if (isDisciplineComplete(discipline)) {
      return <Badge className="bg-green-500">Completa</Badge>;
    }
    return <Badge variant="outline">Incompleta</Badge>;
  };

  // Renderizar a modalidade do curso
  const renderModality = (modality: string) => {
    switch (modality) {
      case "ead":
        return "EAD - Ensino à Distância";
      case "hybrid":
        return "Híbrido";
      case "presential":
        return "Presencial";
      default:
        return modality;
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <SchoolIcon className="mr-2 h-6 w-6" />
                {isEditMode ? "Editar Curso" : "Criar Novo Curso"}
              </h1>
              <p className="text-gray-600">
                {isEditMode 
                  ? "Atualize as informações do curso e as disciplinas associadas" 
                  : "Preencha os dados para cadastrar um novo curso no sistema"}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/admin/courses")}
                className="flex items-center"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Voltar para Cursos
              </Button>
            </div>
          </div>

          {/* Conteúdo do formulário */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="flex items-center">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="disciplines" className="flex items-center">
                <BookIcon className="mr-2 h-4 w-4" />
                Disciplinas
              </TabsTrigger>
            </TabsList>

            {/* Tab de Informações Básicas */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Curso</CardTitle>
                  <CardDescription>
                    Preencha as informações básicas do curso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isCourseLoading && isEditMode ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: CS101" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Código único de identificação do curso
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Rascunho</SelectItem>
                                    <SelectItem value="published">Publicado</SelectItem>
                                    <SelectItem value="archived">Arquivado</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Status atual do curso no sistema
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Curso</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Introdução à Programação" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva o curso em detalhes..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <FormLabel>Carga Horária (horas)</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={calculateAutomatically}
                                  onCheckedChange={setCalculateAutomatically}
                                  id="auto-calculate"
                                />
                                <label
                                  htmlFor="auto-calculate"
                                  className="text-xs text-gray-600"
                                >
                                  Calcular automaticamente
                                </label>
                              </div>
                            </div>
                            <FormField
                              control={form.control}
                              name="workload"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      disabled={calculateAutomatically}
                                      className={calculateAutomatically ? "bg-gray-100" : ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    {calculateAutomatically
                                      ? `Calculado com base nas disciplinas: ${totalWorkload} horas`
                                      : "Defina manualmente a carga horária total do curso"}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço (R$)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Deixe como 0 para cursos gratuitos
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="evaluationMethod"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Método de Avaliação</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="exam">Exame Final</SelectItem>
                                    <SelectItem value="project">Projeto</SelectItem>
                                    <SelectItem value="mixed">Avaliação Mista</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="modality"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Modalidade</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ead">EAD - Ensino à Distância</SelectItem>
                                    <SelectItem value="hybrid">Híbrido</SelectItem>
                                    <SelectItem value="presential">Presencial</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Modo de disponibilização do curso
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="thumbnail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL da Imagem de Capa</FormLabel>
                              <FormControl>
                                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                              </FormControl>
                              <FormDescription>
                                URL da imagem que será exibida como capa do curso (opcional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {field.value && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-2">Preview da imagem:</p>
                            <div className="border rounded-md p-2 max-w-xs">
                              <img 
                                src={field.value} 
                                alt="Preview da capa" 
                                className="rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = "https://placehold.co/600x400?text=Imagem+Inválida";
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation("/admin/courses")}
                          >
                            Cancelar
                          </Button>
                          
                          <div className="flex space-x-2">
                            <Button
                              type="submit"
                              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <SaveIcon className="mr-2 h-4 w-4" />
                              {isEditMode ? "Salvar Alterações" : "Criar Curso"}
                            </Button>
                            
                            {!isEditMode && (
                              <Button
                                type="button"
                                onClick={() => setActiveTab("disciplines")}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Próximo: Disciplinas
                              </Button>
                            )}
                          </div>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Disciplinas */}
            <TabsContent value="disciplines">
              <Card>
                <CardHeader>
                  <CardTitle>Disciplinas do Curso</CardTitle>
                  <CardDescription>
                    Selecione as disciplinas que farão parte deste curso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Estatísticas e resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">
                              Disciplinas Selecionadas
                            </span>
                            <span className="text-2xl font-bold">
                              {selectedDisciplines.length}
                            </span>
                          </div>
                          <BookIcon className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">
                              Carga Horária Total
                            </span>
                            <span className="text-2xl font-bold">
                              {totalWorkload} horas
                            </span>
                          </div>
                          <ClockIcon className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">
                              Disciplinas Completas
                            </span>
                            <span className="text-2xl font-bold">
                              {disciplines 
                                ? selectedDisciplines.filter(id => {
                                    const discipline = disciplines.find((d: Discipline) => d.id === id);
                                    return discipline && isDisciplineComplete(discipline);
                                  }).length
                                : 0
                              }
                            </span>
                          </div>
                          <CheckIcon className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Campo de Busca */}
                  <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar disciplinas por nome ou código..."
                      className="pl-9"
                      value={disciplineSearchTerm}
                      onChange={(e) => setDisciplineSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Tabela de Disciplinas */}
                  {isDisciplinesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : filteredDisciplines.length === 0 ? (
                    <Alert>
                      <AlertTitle>Nenhuma disciplina encontrada</AlertTitle>
                      <AlertDescription>
                        {disciplineSearchTerm 
                          ? "Nenhuma disciplina corresponde aos termos de busca." 
                          : "Você precisa criar disciplinas antes de poder adicioná-las a um curso."}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Seleção</TableHead>
                            <TableHead className="w-20">Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="w-24">CH</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDisciplines.map((discipline: Discipline) => (
                            <TableRow key={discipline.id} className={!isDisciplineComplete(discipline) ? "bg-amber-50" : ""}>
                              <TableCell>
                                <Checkbox
                                  id={`discipline-${discipline.id}`}
                                  checked={selectedDisciplines.includes(discipline.id)}
                                  onCheckedChange={(checked) => {
                                    toggleDiscipline(discipline.id, checked === true);
                                  }}
                                />
                              </TableCell>
                              <TableCell>{discipline.code}</TableCell>
                              <TableCell className="font-medium">{discipline.name}</TableCell>
                              <TableCell>{discipline.workload} h</TableCell>
                              <TableCell>{renderDisciplineStatus(discipline)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {filteredDisciplines.length > 0 && (
                    <div className="mt-4">
                      <Alert className={selectedDisciplines.some(id => {
                        const discipline = disciplines.find((d: Discipline) => d.id === id);
                        return discipline && !isDisciplineComplete(discipline);
                      }) ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-300"}>
                        <AlertTitle>{selectedDisciplines.length === 0 
                          ? "Nenhuma disciplina selecionada" 
                          : `${selectedDisciplines.length} disciplinas selecionadas`}
                        </AlertTitle>
                        <AlertDescription>
                          {selectedDisciplines.some(id => {
                            const discipline = disciplines.find((d: Discipline) => d.id === id);
                            return discipline && !isDisciplineComplete(discipline);
                          }) 
                            ? "Atenção: algumas disciplinas selecionadas estão incompletas. O curso não poderá ser publicado até que todas as disciplinas estejam completas."
                            : selectedDisciplines.length > 0 
                              ? "Todas as disciplinas selecionadas estão completas e prontas para uso."
                              : "Selecione as disciplinas que farão parte deste curso."}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("info")}
                    >
                      Voltar para Informações
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit(onSubmit)()}
                      disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <SaveIcon className="mr-2 h-4 w-4" />
                      {isEditMode ? "Salvar Alterações" : "Criar Curso"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}