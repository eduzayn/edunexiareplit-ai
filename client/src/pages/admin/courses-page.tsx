import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Course, courseStatusEnum, Discipline } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDisciplines, setSelectedDisciplines] = useState<number[]>([]);
  
  // Consulta para listar disciplinas disponíveis
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

  // Consulta para listar cursos
  const { 
    data: courses, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/admin/courses", searchTerm, statusFilter],
    queryFn: async () => {
      let url = "/api/admin/courses";
      const params = [];
      
      if (searchTerm) params.push(`search=${searchTerm}`);
      if (statusFilter && statusFilter !== "all") params.push(`status=${statusFilter}`);
      
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      
      const response = await apiRequest("GET", url);
      return response.json();
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
      setSelectedDisciplines([]);
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar disciplinas",
        description: error.message || "Ocorreu um erro ao vincular as disciplinas ao curso.",
        variant: "destructive",
      });
    },
  });

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
      }
      
      setIsCreateDialogOpen(false);
      refetch();
      createForm.reset();
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
    mutationFn: async (data: CourseFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/admin/courses/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message || "Ocorreu um erro ao tentar atualizar o curso.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir curso
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Curso excluído com sucesso!",
        description: "O curso foi removido do sistema.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Ocorreu um erro ao tentar excluir o curso.",
        variant: "destructive",
      });
    },
  });

  // Mutation para publicar curso
  const publishCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/admin/courses/${id}/publish`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Curso publicado com sucesso!",
        description: "O curso agora está disponível para os alunos.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao publicar curso",
        description: error.message || "Ocorreu um erro ao tentar publicar o curso.",
        variant: "destructive",
      });
    },
  });

  // Form para criar curso
  const createForm = useForm<CourseFormValues>({
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
    },
  });

  // Form para editar curso
  const editForm = useForm<CourseFormValues>({
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
    },
  });

  // Funções para abrir diálogos
  const handleOpenCreateDialog = () => {
    createForm.reset();
    setSelectedDisciplines([]);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (course: Course) => {
    setSelectedCourse(course);
    editForm.reset({
      code: course.code,
      name: course.name,
      description: course.description,
      workload: course.workload,
      price: course.price || 0,
      thumbnail: course.thumbnail || "",
      status: course.status,
      evaluationMethod: course.evaluationMethod || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Funções para enviar formulários
  const onCreateSubmit = (data: CourseFormValues) => {
    createCourseMutation.mutate(data);
  };

  const onEditSubmit = (data: CourseFormValues) => {
    if (selectedCourse) {
      updateCourseMutation.mutate({ ...data, id: selectedCourse.id });
    }
  };

  const handleDelete = () => {
    if (selectedCourse) {
      deleteCourseMutation.mutate(selectedCourse.id);
    }
  };

  const handlePublish = (id: number) => {
    publishCourseMutation.mutate(id);
  };

  // Renderiza badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "published":
        return <Badge className="bg-green-500">Publicado</Badge>;
      case "archived":
        return <Badge variant="secondary">Arquivado</Badge>;
      default:
        return null;
    }
  };

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
                Gestão de Cursos
              </h1>
              <p className="text-gray-600">
                Crie e gerencie os cursos oferecidos na plataforma
              </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0">
              <Button
                onClick={handleOpenCreateDialog}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Novo Curso
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou código do curso..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        refetch();
                      }
                    }}
                  />
                </div>
                <div className="flex w-full space-x-2 md:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => refetch()} 
                    variant="outline" 
                    className="flex items-center"
                  >
                    <RefreshCwIcon className="mr-1 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses List */}
          <Card>
            <CardHeader>
              <CardTitle>Cursos</CardTitle>
              <CardDescription>
                Lista completa de cursos disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar cursos</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao tentar carregar a lista de cursos. Por favor, tente novamente.
                  </AlertDescription>
                </Alert>
              ) : courses && courses.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>CH</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course: Course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{renderStatusBadge(course.status)}</TableCell>
                          <TableCell>{course.workload}h</TableCell>
                          <TableCell>
                            {course.price
                              ? `R$ ${course.price.toFixed(2)}`
                              : "Gratuito"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {course.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePublish(course.id)}
                                >
                                  <ShowChartIcon className="h-4 w-4" />
                                  <span className="sr-only md:not-sr-only md:ml-2">Publicar</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(course)}
                              >
                                <EditIcon className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:ml-2">Editar</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(course)}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:ml-2">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <SchoolIcon className="h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    Nenhum curso encontrado
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Crie seu primeiro curso para oferecer aos alunos.
                  </p>
                  <Button
                    onClick={handleOpenCreateDialog}
                    className="mt-4 flex items-center"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Criar Curso
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo curso no sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CS101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Curso</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Introdução à Programação"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o curso em detalhes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 299.90"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="evaluationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Avaliação</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="exam">Prova</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                            <SelectItem value="mixed">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>URL da Imagem de Capa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <FormField
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Disciplinas do Curso</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Selecione as disciplinas que farão parte deste curso.
                </p>
                
                {isDisciplinesLoading ? (
                  <div className="space-y-2">
                    {Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-[250px]" />
                        </div>
                      ))}
                  </div>
                ) : disciplines && disciplines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                    {disciplines.map((discipline: Discipline) => (
                      <div key={discipline.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`discipline-${discipline.id}`}
                          checked={selectedDisciplines.includes(discipline.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDisciplines([...selectedDisciplines, discipline.id]);
                            } else {
                              setSelectedDisciplines(
                                selectedDisciplines.filter((id) => id !== discipline.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`discipline-${discipline.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {discipline.code} - {discipline.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>Nenhuma disciplina encontrada</AlertTitle>
                    <AlertDescription>
                      Você precisa criar disciplinas antes de poder adicioná-las a um curso.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Curso</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Atualize as informações do curso selecionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CS101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 60"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Curso</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Introdução à Programação"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o curso em detalhes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 299.90"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="evaluationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Avaliação</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="exam">Prova</SelectItem>
                            <SelectItem value="project">Projeto</SelectItem>
                            <SelectItem value="mixed">Misto</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>URL da Imagem de Capa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o curso "{selectedCourse?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-500">
              Todos os dados associados a este curso, incluindo disciplinas vinculadas, serão removidos permanentemente.
            </p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}