import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { listSimplifiedEnrollments, NewSimplifiedEnrollment } from '../../../services/new-simplified-enrollment-service';
import { DollarSign, Eye, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function NewSimplifiedEnrollmentPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Buscar matrículas simplificadas
  const {
    data: enrollmentsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['/api/v2/simplified-enrollments', { page: currentPage, search: searchQuery, status: statusFilter }],
    queryFn: () => listSimplifiedEnrollments({
      page: currentPage,
      limit: 10,
      search: searchQuery || undefined,
      status: statusFilter || undefined
    }),
  });
  
  // Extrair dados da resposta
  const enrollments = enrollmentsResponse?.success ? enrollmentsResponse : { data: [], page: 1, limit: 10, pages: 1, total: 0 };

  // Função para mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Aguardando</Badge>;
      case 'waiting_payment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aguardando Pgto.</Badge>;
      case 'payment_confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelada</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Falha</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Filtrar e navegar para página de detalhes
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const viewEnrollmentDetails = (id: number) => {
    setLocation(`/admin/crm/new-simplified-enrollments/${id}`);
  };

  // Paginação
  const renderPagination = () => {
    // Se os dados ainda não foram carregados, não renderize a paginação
    if (!enrollments?.data) return null;
    
    const totalPages = enrollments.pages || 1;
    
    // Se só tem 1 página, não mostra a paginação
    if (totalPages <= 1) return null;
    
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Ajustar startPage se estivermos perto do final
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      >
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              className="gap-1"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <PaginationPrevious className="h-4 w-4" />
              Anterior
            </Button>
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pages.map((page) => (
            <PaginationItem key={page}>
              <Button
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <Button
              variant="outline"
              className="gap-1"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Próxima
              <PaginationNext className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Matrículas Simplificadas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de matrículas simplificadas
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setLocation('/admin/crm/new-simplified-enrollments/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Matrícula
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre as matrículas por nome do aluno, CPF, e-mail ou curso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                placeholder="Buscar por nome, CPF, e-mail ou curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value === 'all' ? undefined : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Aguardando Processamento</SelectItem>
                  <SelectItem value="waiting_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-3">
              <Button type="submit" className="w-full md:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro ao carregar matrículas</AlertTitle>
          <AlertDescription>
            {(error as any)?.message || "Ocorreu um erro ao carregar as matrículas. Tente novamente."}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments?.data?.length ? (
                    enrollments.data.map((enrollment: NewSimplifiedEnrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{enrollment.studentName}</div>
                            <div className="text-xs text-muted-foreground">{enrollment.studentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={enrollment.courseName}>
                            {enrollment.courseName}
                          </div>
                          <div className="text-xs text-muted-foreground">{enrollment.institutionName}</div>
                        </TableCell>
                        <TableCell>{formatDate(enrollment.createdAt)}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(enrollment.amount || 0)}
                        </TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewEnrollmentDetails(enrollment.id)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(enrollment.status === 'pending' || enrollment.status === 'waiting_payment') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLocation(`/admin/crm/new-simplified-enrollments/${enrollment.id}`)}
                                title="Gerar link de pagamento"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Nenhuma matrícula encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-center pt-2">
              {renderPagination()}
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}