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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchIcon, FilterIcon, PencilIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { MoreVertical as MoreVerticalIcon } from "lucide-react";

type Enrollment = {
  id: number;
  code: string;
  studentId: number;
  courseId: number;
  poloId: number;
  institutionId: number;
  partnerId: number | null;
  status: string;
  enrollmentDate: string;
  paymentStatus: string;
  paymentExternalId: string | null;
  paymentUrl: string | null;
  paymentGateway: string;
  amount: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  // Relações expandidas
  studentName?: string;
  courseName?: string;
  poloName?: string;
  institutionName?: string;
  partnerName?: string;
};

// Schema para filtragem
const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  paymentGateway: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

export default function EnrollmentsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [statusReason, setStatusReason] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: "",
    status: "",
    paymentGateway: "",
    startDate: "",
    endDate: "",
  });

  // Form para filtros
  const filterForm = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: filterValues,
  });

  // Query para obter matrículas
  const {
    data: enrollments = [],
    isLoading,
    refetch,
  } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments", filterValues, currentPage, itemsPerPage],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filterValues.search) queryParams.append("search", filterValues.search);
      if (filterValues.status) queryParams.append("status", filterValues.status);
      if (filterValues.paymentGateway) queryParams.append("paymentGateway", filterValues.paymentGateway);
      if (filterValues.startDate) queryParams.append("startDate", filterValues.startDate);
      if (filterValues.endDate) queryParams.append("endDate", filterValues.endDate);
      queryParams.append("limit", String(itemsPerPage));
      queryParams.append("offset", String((currentPage - 1) * itemsPerPage));
      
      const response = await fetch("/api/enrollments?" + queryParams.toString());
      if (!response.ok) {
        throw new Error("Erro ao buscar matrículas");
      }
      return await response.json();
    }
  });

  // Query para obter histórico de status
  const fetchStatusHistory = async (enrollmentId: number) => {
    try {
      const response = await fetch("/api/enrollments/" + enrollmentId + "/status-history");
      if (!response.ok) {
        throw new Error("Erro ao buscar histórico de status");
      }
      const data = await response.json();
      setStatusHistory(data);
    } catch (error) {
      console.error("Erro ao buscar histórico de status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de status",
        variant: "destructive",
      });
    }
  };

  // Mutation para atualizar status da matrícula
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason: string }) => {
      const response = await apiRequest("POST", "/api/enrollments/" + id + "/status", { status, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da matrícula foi atualizado com sucesso",
      });
      setIsStatusDialogOpen(false);
      setSelectedStatus("active");
      setStatusReason("");
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Aplicar filtros
  const onFilterSubmit = (values: FilterValues) => {
    setFilterValues(values);
    setCurrentPage(1);
  };

  // Reset de filtros
  const resetFilters = () => {
    filterForm.reset({
      search: "",
      status: "",
      paymentGateway: "",
      startDate: "",
      endDate: "",
    });
    setFilterValues({
      search: "",
      status: "",
      paymentGateway: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // Função para mostrar o histórico de status
  const showStatusHistory = (id: number) => {
    setSelectedId(id);
    fetchStatusHistory(id);
    setIsDetailsDialogOpen(true);
  };

  // Função para mostrar diálogo de atualização de status
  const showStatusUpdateDialog = (id: number) => {
    setSelectedId(id);
    setIsStatusDialogOpen(true);
  };

  // Status da matrícula formatado com cores
  const renderStatus = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status.toLowerCase()) {
      case "active":
        variant = "default";
        return <Badge variant={variant}>Ativa</Badge>;
      case "pending_payment":
        variant = "secondary";
        return <Badge variant={variant}>Aguardando Pagamento</Badge>;
      case "completed":
        variant = "outline";
        return <Badge variant={variant}>Concluída</Badge>;
      case "cancelled":
        variant = "destructive";
        return <Badge variant={variant}>Cancelada</Badge>;
      case "suspended":
        variant = "destructive";
        return <Badge variant={variant}>Suspensa</Badge>;
      default:
        return <Badge variant={variant}>{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={getAdminSidebarItems(location)} isMobile={isMobile} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Matrículas</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="flex items-center gap-1"
                >
                  <FilterIcon className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Filtre as matrículas por diferentes critérios</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...filterForm}>
                  <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={filterForm.control}
                        name="search"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Busca</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Código, aluno, curso..." className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={filterForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                <SelectItem value="suspended">Suspensa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={filterForm.control}
                        name="paymentGateway"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gateway de Pagamento</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um gateway" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="asaas">Asaas</SelectItem>
                                <SelectItem value="lytex">Lytex</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={filterForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Inicial</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={filterForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Final</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit">Aplicar Filtros</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Matrículas</CardTitle>
                <CardDescription>
                  Gerencie as matrículas da plataforma EdunexIA
                </CardDescription>
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
                                    <MoreVerticalIcon className="h-4 w-4" />
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
                      disabled={currentPage === 1}
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