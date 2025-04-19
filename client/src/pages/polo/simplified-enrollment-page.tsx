import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Icons
import {
  UserPlusIcon,
  SearchIcon,
  ArrowLeftIcon,
} from "lucide-react";

// Types
interface SimplifiedEnrollment {
  id: number;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  courseId: number;
  courseName?: string;
  poloId?: number;
  poloName?: string;
  status: "pending" | "waiting_payment" | "payment_confirmed" | "completed" | "cancelled";
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  externalReference: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}

// Funções de formatação e exibição
const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
};

const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    waiting_payment: "Aguardando Pagamento",
    payment_confirmed: "Pagamento Confirmado",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  return statusMap[status] || status;
};

const getStatusBadgeProps = (status: string): BadgeProps => {
  const statusProps: Record<string, BadgeProps> = {
    pending: { variant: "outline" },
    waiting_payment: { variant: "secondary" },
    payment_confirmed: { variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80" },
    completed: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100/80" },
    cancelled: { variant: "destructive" },
  };
  return statusProps[status] || { variant: "outline" };
};

export default function PoloSimplifiedEnrollmentPage() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Carregar dados de matrículas para o polo logado
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/simplified-enrollments", { 
      offset: (page - 1) * 10, 
      limit: 10,
      status: statusFilter === "all" ? "" : statusFilter,
      search: searchQuery,
      poloId: "current" // Este parâmetro indica para a API filtrar pelo polo do usuário logado
    }],
    staleTime: 1000 * 60, // 1 minuto
    retry: false, // Não tentar novamente em caso de erro
    enabled: true, // Sempre habilitado
  });

  // Garante que nunca será undefined, mesmo durante o carregamento
  const enrollments: SimplifiedEnrollment[] = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 10) || 1;

  // Event handlers
  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleBack = () => {
    navigate("/polo");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Matrícula Simplificada</h2>
          <p className="text-muted-foreground">
            Crie e gerencie matrículas simplificadas para novos alunos
          </p>
        </div>
        <Button asChild>
          <a href="/polo/simplified-enrollment/new">
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Nova Matrícula
          </a>
        </Button>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Matrículas Simplificadas</CardTitle>
          <CardDescription>
            Visualize e gerencie as matrículas simplificadas do seu polo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 space-x-2">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou CPF..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="waiting_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              Filtrar
            </Button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-muted-foreground">Carregando matrículas...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-red-500">Erro ao carregar matrículas. Tente novamente.</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">Nenhuma matrícula encontrada.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{enrollment.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCPF(enrollment.studentCpf)}
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.courseName || "—"}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadgeProps(enrollment.status)}>
                          {getStatusDisplayName(enrollment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(enrollment.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/polo/simplified-enrollment/${enrollment.id}`}>
                            <span className="sr-only">Ver detalhes</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {enrollments.length > 0 && (
              <>Mostrando <b>{enrollments.length}</b> de <b>{data?.total || 0}</b> resultados</>
            )}
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  // Lógica para mostrar páginas corretas quando há muitas
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3 && page < totalPages - 1) {
                      pageNum = [page - 2, page - 1, page, page + 1, page + 2][i];
                    } else if (page >= totalPages - 1) {
                      pageNum = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages][i];
                    }
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}