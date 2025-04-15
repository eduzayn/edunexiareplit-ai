import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Sidebar } from "@/components/layout/sidebar";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  MapPinIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { StorefrontIcon } from "@/components/ui/icons";

// Schema para validação do formulário
const poloFormSchema = z.object({
  code: z.string().min(3, "O código deve ter pelo menos 3 caracteres"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  status: z.enum(["active", "inactive"], {
    required_error: "O status é obrigatório",
  }),
  address: z.string().min(3, "O endereço deve ter pelo menos 3 caracteres"),
  city: z.string().min(2, "A cidade deve ter pelo menos 2 caracteres"),
  state: z.string().min(2, "O estado deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "O telefone deve ter pelo menos 8 caracteres"),
  coordinator: z.string().min(3, "O nome do coordenador deve ter pelo menos 3 caracteres"),
  capacity: z.coerce.number().min(1, "A capacidade deve ser pelo menos 1"),
  description: z.string().optional(),
});

// Tipos para os formulários
type PoloFormValues = z.infer<typeof poloFormSchema>;

// Interface para polo
interface Polo {
  id: number;
  code: string;
  name: string;
  status: "active" | "inactive";
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  coordinator: string;
  capacity: number;
  description?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function PolosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolo, setSelectedPolo] = useState<Polo | null>(null);
  
  // Usar o componente padronizado para os itens da barra lateral
  const sidebarItems = getAdminSidebarItems(location || "");

  // Simulação de dados para fins de demonstração
  const mockPolos: Polo[] = [
    {
      id: 1,
      code: "POL001",
      name: "Polo Centro",
      status: "active",
      address: "Avenida Central, 123",
      city: "São Paulo",
      state: "SP",
      email: "polo.centro@edunexia.com.br",
      phone: "(11) 3333-4444",
      coordinator: "Ana Maria Silva",
      capacity: 250,
      description: "Polo localizado na região central da cidade com ampla infraestrutura.",
      createdById: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      code: "POL002",
      name: "Polo Norte",
      status: "active",
      address: "Rua Norte, 500",
      city: "Rio de Janeiro",
      state: "RJ",
      email: "polo.norte@edunexia.com.br",
      phone: "(21) 2222-3333",
      coordinator: "Carlos Eduardo Mendes",
      capacity: 180,
      description: "Polo com foco em cursos na área de tecnologia.",
      createdById: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      code: "POL003",
      name: "Polo Sul",
      status: "inactive",
      address: "Avenida Sul, 789",
      city: "Curitiba",
      state: "PR",
      email: "polo.sul@edunexia.com.br",
      phone: "(41) 4444-5555",
      coordinator: "Fernanda Santos",
      capacity: 120,
      description: "Polo em fase de renovação de infraestrutura.",
      createdById: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Consulta para listar polos (simulada)
  const { 
    data: polos, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["/api/admin/polos", searchTerm, statusFilter],
    queryFn: async () => {
      // Simulando filtros
      let filteredPolos = mockPolos;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredPolos = filteredPolos.filter(polo => 
          polo.name.toLowerCase().includes(searchLower) || 
          polo.code.toLowerCase().includes(searchLower) ||
          polo.city.toLowerCase().includes(searchLower)
        );
      }
      
      if (statusFilter && statusFilter !== "all") {
        filteredPolos = filteredPolos.filter(polo => polo.status === statusFilter);
      }
      
      // Simulando um delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return filteredPolos;
    },
  });

  // Mutation para criar polo (simulada)
  const createPoloMutation = useMutation({
    mutationFn: async (data: PoloFormValues) => {
      // Simulando um delay de rede
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Simulando uma resposta de sucesso
      const newPolo: Polo = {
        id: Math.floor(Math.random() * 1000) + 10,
        ...data,
        createdById: user?.id || 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return newPolo;
    },
    onSuccess: () => {
      toast({
        title: "Polo criado com sucesso!",
        description: "O novo polo foi adicionado ao sistema.",
      });
      setIsCreateDialogOpen(false);
      refetch();
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar polo",
        description: error.message || "Ocorreu um erro ao tentar criar o polo.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar polo (simulada)
  const updatePoloMutation = useMutation({
    mutationFn: async (data: PoloFormValues & { id: number }) => {
      // Simulando um delay de rede
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Simulando uma resposta de sucesso
      const updatedPolo: Polo = {
        ...data,
        createdById: user?.id || 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return updatedPolo;
    },
    onSuccess: () => {
      toast({
        title: "Polo atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar polo",
        description: error.message || "Ocorreu um erro ao tentar atualizar o polo.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir polo (simulada)
  const deletePoloMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulando um delay de rede
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Simulando uma resposta de sucesso
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Polo excluído com sucesso!",
        description: "O polo foi removido do sistema.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir polo",
        description: error.message || "Ocorreu um erro ao tentar excluir o polo.",
        variant: "destructive",
      });
    },
  });

  // Form para criar polo
  const createForm = useForm<PoloFormValues>({
    resolver: zodResolver(poloFormSchema),
    defaultValues: {
      code: "",
      name: "",
      status: "active",
      address: "",
      city: "",
      state: "",
      email: "",
      phone: "",
      coordinator: "",
      capacity: 50,
      description: "",
    },
  });

  // Form para editar polo
  const editForm = useForm<PoloFormValues>({
    resolver: zodResolver(poloFormSchema),
    defaultValues: {
      code: "",
      name: "",
      status: "active",
      address: "",
      city: "",
      state: "",
      email: "",
      phone: "",
      coordinator: "",
      capacity: 50,
      description: "",
    },
  });

  // Funções para abrir diálogos
  const handleOpenCreateDialog = () => {
    createForm.reset();
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (polo: Polo) => {
    setSelectedPolo(polo);
    editForm.reset({
      code: polo.code,
      name: polo.name,
      status: polo.status,
      address: polo.address,
      city: polo.city,
      state: polo.state,
      email: polo.email,
      phone: polo.phone,
      coordinator: polo.coordinator,
      capacity: polo.capacity,
      description: polo.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (polo: Polo) => {
    setSelectedPolo(polo);
    setIsDeleteDialogOpen(true);
  };

  // Funções para enviar formulários
  const onCreateSubmit = (data: PoloFormValues) => {
    createPoloMutation.mutate(data);
  };

  const onEditSubmit = (data: PoloFormValues) => {
    if (selectedPolo) {
      updatePoloMutation.mutate({ ...data, id: selectedPolo.id });
    }
  };

  const handleDelete = () => {
    if (selectedPolo) {
      deletePoloMutation.mutate(selectedPolo.id);
    }
  };

  // Função para formatar e mostrar o status
  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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
        portalColor="#4CAF50"
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
                <StorefrontIcon className="mr-2 h-6 w-6" />
                Gestão de Polos
              </h1>
              <p className="text-gray-600">
                Gerencie os polos educacionais da plataforma
              </p>
            </div>
            <div className="mt-4 flex space-x-2 md:mt-0">
              <Button
                onClick={handleOpenCreateDialog}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="mr-1 h-4 w-4" />
                Novo Polo
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
                    placeholder="Buscar por nome, código ou cidade..."
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
                <div className="w-full md:w-48">
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* Polos List */}
          <Card>
            <CardHeader>
              <CardTitle>Polos</CardTitle>
              <CardDescription>
                Lista completa de polos educacionais cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3)
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
                  <AlertTitle>Erro ao carregar polos</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao tentar carregar a lista de polos. Por favor, tente novamente.
                  </AlertDescription>
                </Alert>
              ) : polos && polos.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>Coordenador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {polos.map((polo) => (
                        <TableRow key={polo.id}>
                          <TableCell className="font-medium">{polo.code}</TableCell>
                          <TableCell>{polo.name}</TableCell>
                          <TableCell>{polo.city}/{polo.state}</TableCell>
                          <TableCell>{polo.coordinator}</TableCell>
                          <TableCell>{renderStatus(polo.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditDialog(polo)}
                              >
                                <EditIcon className="h-4 w-4" />
                                <span className="sr-only md:not-sr-only md:ml-2">Editar</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog(polo)}
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
                  <StorefrontIcon className="h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    Nenhum polo encontrado
                  </h3>
                  <p className="mt-1 text-gray-500">
                    Cadastre seu primeiro polo educacional para começar.
                  </p>
                  <Button
                    onClick={handleOpenCreateDialog}
                    className="mt-4 flex items-center"
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Criar Polo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Polo Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Polo</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo polo educacional no sistema.
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
                        <Input placeholder="Ex: POL001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do polo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade (alunos)</FormLabel>
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contato@polo.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="coordinator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordenador</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do coordenador" {...field} />
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
                        placeholder="Descreva o polo educacional..." 
                        className="min-h-[100px]" 
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
                  disabled={createPoloMutation.isPending}
                >
                  {createPoloMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Polo Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Polo</DialogTitle>
            <DialogDescription>
              Atualize os dados do polo selecionado.
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
                        <Input placeholder="Ex: POL001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do polo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade (alunos)</FormLabel>
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contato@polo.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="coordinator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordenador</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do coordenador" {...field} />
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
                        placeholder="Descreva o polo educacional..." 
                        className="min-h-[100px]" 
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
                  disabled={updatePoloMutation.isPending}
                >
                  {updatePoloMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Polo Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o polo "{selectedPolo?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
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
              disabled={deletePoloMutation.isPending}
            >
              {deletePoloMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}