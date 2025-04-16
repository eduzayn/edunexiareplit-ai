import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLeadsV2 } from '@/hooks/use-leads-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Search, Filter, RefreshCw, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

/**
 * Formatação de status para exibição
 */
const statusFormat = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'Qualificado', color: 'bg-green-100 text-green-800' },
  unqualified: { label: 'Não Qualificado', color: 'bg-red-100 text-red-800' },
  converted: { label: 'Convertido', color: 'bg-purple-100 text-purple-800' },
};

export default function LeadsV2Page() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();
  
  const { 
    useLeadsList, 
    currentPage, 
    setCurrentPage, 
    pageSize, 
    setPageSize 
  } = useLeadsV2();
  
  const { data, isLoading, isError, refetch } = useLeadsList(
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter
  );
  
  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  // Função para verificar e converter leads pendentes
  const handleCheckPendingLeads = async () => {
    try {
      setIsConverting(true);
      
      const response = await fetch('/api/v2/checkout/convert-pending-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Operação concluída',
          description: `${result.count} leads foram convertidos para clientes.`,
          variant: 'default',
        });
        
        // Se algum lead foi convertido, recarregar a lista
        if (result.count > 0) {
          refetch();
        }
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao verificar leads pendentes:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao verificar leads pendentes',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  return (
    <div className="container p-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Leads</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setLocation('/admin/crm/leads/new-v2')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar leads específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="contacted">Contatados</SelectItem>
                <SelectItem value="qualified">Qualificados</SelectItem>
                <SelectItem value="unqualified">Não Qualificados</SelectItem>
                <SelectItem value="converted">Convertidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Lista de Leads</CardTitle>
            <CardDescription>
              {data?.data.length 
                ? `Mostrando ${data.data.length} de ${data.pagination.total} leads`
                : 'Nenhum lead encontrado'}
            </CardDescription>
          </div>
          <Button
            onClick={handleCheckPendingLeads}
            disabled={isConverting}
            size="sm"
            variant="outline"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Converter Leads Pendentes
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              Erro ao carregar leads. Tente novamente.
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Nenhum lead encontrado com os filtros selecionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusFormat[lead.status]?.color}>
                        {statusFormat[lead.status]?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.course || '-'}</TableCell>
                    <TableCell>
                      {lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/crm/leads/${lead.id}/detail-v2`)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {data && data.pagination.pages > 1 && (
          <CardFooter className="flex justify-between">
            <div>
              <span className="text-sm text-gray-500">
                Página {currentPage} de {data.pagination.pages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.pagination.pages}
              >
                Próxima
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}