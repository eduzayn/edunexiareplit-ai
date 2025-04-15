import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/admin-layout";
import { CalendarIcon, DownloadIcon, RefreshCw, SearchIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";

// Tipos para log de auditoria
interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  entityType: string;
  entityId: number | null;
  actionType: string;
  description: string;
  sourceChannel: string;
  ipAddress: string;
  userAgent: string | null;
  metadata: any;
  oldValue: any;
  newValue: any;
  createdAt: string;
}

const getBadgeColorForAction = (action: string) => {
  switch (action) {
    case 'create':
      return 'bg-green-500';
    case 'update':
      return 'bg-blue-500';
    case 'delete':
      return 'bg-red-500';
    case 'view':
      return 'bg-slate-500';
    case 'manage':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const getBadgeColorForEntity = (entity: string) => {
  switch (entity) {
    case 'permission':
      return 'bg-yellow-500';
    case 'role':
      return 'bg-indigo-500';
    case 'user':
      return 'bg-cyan-500';
    case 'enrollment':
      return 'bg-emerald-500';
    case 'payment':
      return 'bg-amber-500';
    default:
      return 'bg-slate-500';
  }
};

const getSourceChannelLabel = (channel: string) => {
  switch (channel) {
    case 'admin_portal':
      return 'Portal Administrativo';
    case 'student_portal':
      return 'Portal do Aluno';
    case 'partner_portal':
      return 'Portal do Parceiro';
    case 'polo_portal':
      return 'Portal do Polo';
    case 'mobile_app':
      return 'Aplicativo Móvel';
    case 'mobile_browser':
      return 'Navegador Móvel';
    case 'web_browser':
      return 'Navegador Web';
    case 'asaas_webhook':
      return 'Webhook Asaas';
    default:
      return channel;
  }
};

export const LogsAuditoriaPage = () => {
  // Estados para filtros
  const [userId, setUserId] = useState<string>("");
  const [actionType, setActionType] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Construir parâmetros de consulta
  const buildQueryParams = () => {
    const params: Record<string, string> = {};
    
    if (userId) params.userId = userId;
    if (actionType) params.actionType = actionType;
    if (entityType) params.entityType = entityType;
    if (entityId) params.entityId = entityId;
    if (searchQuery) params.search = searchQuery;
    
    if (dateRange?.from) {
      params.startDate = format(dateRange.from, 'yyyy-MM-dd');
    }
    
    if (dateRange?.to) {
      params.endDate = format(dateRange.to, 'yyyy-MM-dd');
    }
    
    params.limit = limit.toString();
    params.offset = ((page - 1) * limit).toString();
    
    return params;
  };

  // Tipo para resposta da API
  interface AuditLogResponse {
    logs: AuditLog[];
    totalCount: number;
  }

  // Consulta para obter logs de auditoria
  const { data, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey: ['/api/audit/logs', buildQueryParams()]
  });

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / limit);

  // Função para exportar logs
  const exportLogs = async (format: 'csv' | 'json') => {
    const params = new URLSearchParams(buildQueryParams());
    params.set('format', format);
    
    const url = `/api/audit/logs?${params.toString()}`;
    
    // Se for CSV, baixar como arquivo
    if (format === 'csv') {
      window.open(url, '_blank');
    }
  };

  // Renderização das páginas para paginação
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajuste para mostrar sempre maxVisiblePages, se possível
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Primeira página
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={page === i}
            onClick={() => setPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Última página
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <AdminLayout>
      <PageTransition>
        <div className="container mx-auto py-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Visualize e filtre os registros de atividades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Filtro por Usuário */}
                <div>
                  <label className="text-sm font-medium mb-1 block">ID do Usuário</label>
                  <Input 
                    placeholder="ID do usuário" 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)} 
                  />
                </div>
                
                {/* Filtro por Tipo de Ação */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Ação</label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as ações</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Atualização</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                      <SelectItem value="view">Visualização</SelectItem>
                      <SelectItem value="manage">Gerenciamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por Tipo de Entidade */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de Entidade</label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as entidades</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="role">Papel</SelectItem>
                      <SelectItem value="permission">Permissão</SelectItem>
                      <SelectItem value="enrollment">Matrícula</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="institution">Instituição</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro por ID da Entidade */}
                <div>
                  <label className="text-sm font-medium mb-1 block">ID da Entidade</label>
                  <Input 
                    placeholder="ID da entidade" 
                    value={entityId} 
                    onChange={(e) => setEntityId(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Filtro por Data */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Período</label>
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "P", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "P", { locale: ptBR })}
                              </>
                            ) : (
                              format(dateRange.from, "P", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecione um período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          locale={ptBR}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Filtro por busca geral */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Buscar</label>
                  <div className="relative">
                    <Input 
                      placeholder="Buscar em descrição, nome de usuário, etc..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                    <SearchIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => exportLogs('csv')}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Itens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Entidade</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Origem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              Nenhum registro de log encontrado com os filtros atuais.
                            </TableCell>
                          </TableRow>
                        ) : (
                          logs.map((log: AuditLog) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                {log.userName || `Usuário #${log.userId || 'Sistema'}`}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("capitalize", getBadgeColorForAction(log.actionType))}>
                                  {log.actionType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("capitalize", getBadgeColorForEntity(log.entityType))}>
                                  {log.entityType} {log.entityId && `#${log.entityId}`}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md truncate">
                                {log.description}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {getSourceChannelLabel(log.sourceChannel)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {logs.length > 0 && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setPage(Math.max(1, page - 1))}
                              isActive={page > 1}
                            />
                          </PaginationItem>
                          
                          {renderPaginationItems()}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setPage(Math.min(totalPages, page + 1))}
                              isActive={page < totalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                {data?.totalCount 
                  ? `Mostrando ${(page - 1) * limit + 1}-${Math.min(page * limit, data.totalCount)} de ${data.totalCount} registros`
                  : 'Nenhum registro encontrado'
                }
              </div>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default LogsAuditoriaPage;