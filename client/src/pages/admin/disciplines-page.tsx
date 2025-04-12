import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Discipline } from "@shared/schema";
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
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema Zod para validação do formulário
const disciplineFormSchema = z.object({
  code: z.string().min(3, { message: "Código deve ter pelo menos 3 caracteres" }),
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  workload: z.coerce.number().min(1, { message: "Carga horária é obrigatória" }),
  syllabus: z.string().min(10, { message: "Ementa deve ter pelo menos 10 caracteres" }),
});

type DisciplineFormValues = z.infer<typeof disciplineFormSchema>;

export default function DisciplinesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  
  // Usar o componente padronizado para os itens da barra lateral
  const sidebarItems = getAdminSidebarItems(location || "");

  // Consulta para listar disciplinas
  const { 
    data: disciplines, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/admin/disciplines", searchTerm],
    queryFn: async () => {
      const url = `/api/admin/disciplines${searchTerm ? `?search=${searchTerm}` : ""}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  // Mutation para criar disciplina
  const createDisciplineMutation = useMutation({
    mutationFn: async (data: DisciplineFormValues) => {
      const response = await apiRequest("POST", "/api/admin/disciplines", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disciplina criada com sucesso!",
        description: "A nova disciplina foi adicionada ao sistema.",
      });
      setIsCreateDialogOpen(false);
      refetch();
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar disciplina",
        description: error.message || "Ocorreu um erro ao tentar criar a disciplina.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar disciplina
  const updateDisciplineMutation = useMutation({
    mutationFn: async (data: DisciplineFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/admin/disciplines/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disciplina atualizada com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar disciplina",
        description: error.message || "Ocorreu um erro ao tentar atualizar a disciplina.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir disciplina
  const deleteDisciplineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/disciplines/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Disciplina excluída com sucesso!",
        description: "A disciplina foi removida do sistema.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir disciplina",
        description: error.message || "Ocorreu um erro ao tentar excluir a disciplina.",
        variant: "destructive",
      });
    },
  });

  // Form para criar disciplina
  const createForm = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      workload: 0,
      syllabus: "",
    },
  });

  // Form para editar disciplina
  const editForm = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      workload: 0,
      syllabus: "",
    },
  });

  // Funções para abrir diálogos
  const handleOpenCreateDialog = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
    editForm.reset({
      code: discipline.code,
      name: discipline.name,
      description: discipline.description,
      workload: discipline.workload,
      syllabus: discipline.syllabus,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
    setIsDeleteDialogOpen(true);
  };

  // Funções para enviar formulários
  const onCreateSubmit = (data: DisciplineFormValues) => {
    createDisciplineMutation.mutate(data);
  };

  const onEditSubmit = (data: DisciplineFormValues) => {
    if (selectedDiscipline) {
      updateDisciplineMutation.mutate({ ...data, id: selectedDiscipline.id });
    }
  };

  const handleDelete = () => {
    if (selectedDiscipline) {
      deleteDisciplineMutation.mutate(selectedDiscipline.id);
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
                <BookIcon className="mr-2 h-6 w-6" />
                Gestão de Disciplinas
              </h1>
              <p className="text-gray-600">
                Gerencie o catálogo de disciplinas da plataforma
              </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0">
              <Button
                onClick={handleOpenCreateDialog}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Nova Disciplina
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
                    placeholder="Buscar por nome ou código da disciplina..."
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
                <Button 
                  onClick={() => refetch()} 
                  variant="outline" 
                  className="flex items-center"
                >
                  <RefreshCwIcon className="mr-1 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disciplines List */}
          <Card>
            <CardHeader>
              <CardTitle>Disciplinas</CardTitle>
              <CardDescription>
                Lista completa de disciplinas disponíveis no sistema
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
                  <AlertTitle>Erro ao carregar disciplinas</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao tentar carregar a lista de disciplinas. Por favor, tente novamente.
                  </AlertDescription>
                </Alert>
              ) : disciplines && disciplines.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Carga Horária</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disciplines.map((discipline: Discipline) => (
                        <TableRow key={discipline.id}>
                          <TableCell className="font-medium">{discipline.code}</TableCell>
                          <TableCell>{discipline.name}</TableCell>
                          <TableCell>{discipline.workload}h</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/disciplines/${discipline.id}/content`)}
                              >
                                <FileTextIcon className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:ml-2">Conteúdo</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(discipline)}
                              >
                                <EditIcon className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:ml-2">Editar</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(discipline)}
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
                  <ChalkboardTeacherIcon className="h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    Nenhuma disciplina encontrada
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Crie sua primeira disciplina para começar a montar seus cursos.
                  </p>
                  <Button
                    onClick={handleOpenCreateDialog}
                    className="mt-4 flex items-center"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Criar Disciplina
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Discipline Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Disciplina</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar uma nova disciplina no sistema.
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
                        <Input placeholder="Ex: MAT101" {...field} />
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
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução à Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente o objetivo da disciplina..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="syllabus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ementa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conteúdo programático da disciplina..."
                        rows={5}
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createDisciplineMutation.isPending}
                >
                  {createDisciplineMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Discipline Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
            <DialogDescription>
              Atualize os dados da disciplina selecionada.
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
                        <Input placeholder="Ex: MAT101" {...field} />
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
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Introdução à Matemática" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva brevemente o objetivo da disciplina..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="syllabus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ementa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conteúdo programático da disciplina..."
                        rows={5}
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDisciplineMutation.isPending}
                >
                  {updateDisciplineMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Discipline Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Disciplina</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDiscipline && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-medium">{selectedDiscipline.name}</p>
                <p className="text-sm text-gray-500">Código: {selectedDiscipline.code}</p>
              </div>
            )}
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
              disabled={deleteDisciplineMutation.isPending}
            >
              {deleteDisciplineMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}