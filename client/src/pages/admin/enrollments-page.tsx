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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Icons
import { Plus, MoreVertical, InfoIcon, ArrowUpDown, Check, Loader2, Search, AlertTriangle, Filter, FileText, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FilterMenu } from "@/components/filter-menu";

// Definir o esquema de validação para o formulário de filtro
const filterFormSchema = z.object({
  status: z.string().optional(),
  studentName: z.string().optional(),
  courseName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Definir o esquema de validação para criação de matrícula
const enrollmentFormSchema = z.object({
  studentId: z.number({
    required_error: "Selecione um aluno",
  }),
  courseId: z.number({
    required_error: "Selecione um curso",
  }),
  institutionId: z.number({
    required_error: "Selecione uma instituição",
  }),
  poloId: z.number({
    required_error: "Selecione um polo",
  }),
  paymentGateway: z.string({
    required_error: "Selecione um gateway de pagamento",
  }),
  amount: z.number({
    required_error: "Informe o valor da matrícula",
  }),
  contractTemplateId: z.number({
    required_error: "Selecione um modelo de contrato",
  }),
  observations: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;
type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

export default function EnrollmentsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Estados para controle da UI
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  
  // Definir o formulário de filtro
  const filterForm = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      status: "",
      studentName: "",
      courseName: "",
      startDate: "",
      endDate: "",
    },
  });
  
  // Capturar valores do formulário de filtro
  const filterValues = filterForm.watch();
  
  // Lidar com a aplicação do filtro
  const handleFilterSubmit = (values: FilterFormValues) => {
    setCurrentPage(1); // Reset para a primeira página quando aplicar o filtro
    setIsFilterOpen(false);
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    filterForm.reset({
      status: "",
      studentName: "",
      courseName: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
  
  // Query para obter a lista de matrículas (com filtros)
  const {
    data: enrollments = [],
    isLoading: isLoadingEnrollments,
    refetch,
  } = useQuery({
    queryKey: ["/api/enrollments", filterValues, currentPage, itemsPerPage],
    queryFn: async () => {
      // Construir a URL com parâmetros de consulta
      const queryParams = new URLSearchParams();
      
      // Adicionar os filtros aos parâmetros de consulta
      if (filterValues.status) queryParams.append("status", filterValues.status);
      if (filterValues.studentName) queryParams.append("studentName", filterValues.studentName);
      if (filterValues.courseName) queryParams.append("courseName", filterValues.courseName);
      if (filterValues.startDate) queryParams.append("startDate", filterValues.startDate);
      if (filterValues.endDate) queryParams.append("endDate", filterValues.endDate);
      
      // Adicionar paginação
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());
      
      const response = await fetch("/api/enrollments?" + queryParams.toString());
      
      if (!response.ok) {
        throw new Error("Erro ao buscar matrículas");
      }
      
      return response.json();
    },
  });
  
  // Função para buscar o histórico de status de uma matrícula
  const fetchStatusHistory = async (enrollmentId: number) => {
    try {
      const response = await fetch("/api/enrollments/" + enrollmentId + "/status-history");
      
      if (!response.ok) {
        throw new Error("Erro ao buscar histórico de status");
      }
      
      const data = await response.json();
      setStatusHistory(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de status",
        variant: "destructive",
      });
    }
  };
  
  // Função para mostrar o diálogo de histórico de status
  const showStatusHistory = async (id: number) => {
    setSelectedId(id);
    await fetchStatusHistory(id);
    setIsDetailsDialogOpen(true);
  };
  
  // Função para mostrar o diálogo de atualização de status
  const showStatusUpdateDialog = (id: number) => {
    setSelectedId(id);
    setIsStatusDialogOpen(true);
  };
  
  // Mutação para atualizar o status da matrícula
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason: string }) => {
      const response = await apiRequest("POST", "/api/enrollments/" + id + "/status", { status, reason });
      return response.json();
    },
    onSuccess: () => {
      setIsStatusDialogOpen(false);
      setStatusReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Sucesso",
        description: "Status da matrícula atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status da matrícula",
        variant: "destructive",
      });
    },
  });
  
  // Efeito para setar o loading com base na query
  useEffect(() => {
    setIsLoading(isLoadingEnrollments);
  }, [isLoadingEnrollments]);
  
  // Função para renderizar o status com badge
  const renderStatus = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativa", variant: "default" },
      pending_payment: { label: "Aguardando Pagamento", variant: "secondary" },
      completed: { label: "Concluída", variant: "default" },
      cancelled: { label: "Cancelada", variant: "destructive" },
      suspended: { label: "Suspensa", variant: "outline" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    );
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar 
        items={getAdminSidebarItems()} 
      />
      
      {/* Main content */}
      <div className="flex-1">
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lista de Matrículas</CardTitle>
                  <CardDescription>
                    Gerencie as matrículas da plataforma EdunexIA
                  </CardDescription>
                </div>
                <Button onClick={() => window.location.href = "/admin/enrollments/new"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Matrícula
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Nenhuma matrícula encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Polo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">{enrollment.code}</TableCell>
                            <TableCell>{enrollment.studentName || '-'}</TableCell>
                            <TableCell>{enrollment.courseName || '-'}</TableCell>
                            <TableCell>{enrollment.poloName || '-'}</TableCell>
                            <TableCell>{new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{renderStatus(enrollment.status)}</TableCell>
                            <TableCell>R$ {enrollment.amount.toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => showStatusHistory(enrollment.id)}>
                                    Ver detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => showStatusUpdateDialog(enrollment.id)}>
                                    Alterar status
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    />
                    
                    {/* Lógica de paginação simplificada */}
                    {[...Array(3)].map((_, i) => {
                      const pageNumber = currentPage - 1 + i;
                      if (pageNumber < 1) return null;
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={pageNumber === currentPage}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => p + 1)}
                    />
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Diálogo de detalhes/histórico de status */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Histórico de Status</DialogTitle>
            <DialogDescription>
              Veja todas as alterações de status desta matrícula.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {statusHistory.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">Nenhum histórico encontrado</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {statusHistory.map((history, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{renderStatus(history.status)}</p>
                        <p className="text-sm text-muted-foreground">{history.reason}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(history.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de atualização de status */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
            <DialogDescription>
              Altere o status da matrícula selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="suspended">Suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reason">Motivo</label>
              <Input 
                id="reason" 
                placeholder="Informe o motivo da alteração" 
                value={statusReason} 
                onChange={(e) => setStatusReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                if (selectedId) {
                  updateStatusMutation.mutate({
                    id: selectedId,
                    status: selectedStatus,
                    reason: statusReason
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}