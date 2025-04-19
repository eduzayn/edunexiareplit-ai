/**
 * Página aprimorada para gerenciamento de links de pagamento
 * Implementa uma interface melhorada com tratamento de erros e UX aprimorada
 */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { EnhancedPaymentLinksManager } from "@/components/payment-links/enhanced-payment-links-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Página aprimorada para gerenciamento de links de pagamento de cursos
 */
const EnhancedCoursePaymentLinksPage: React.FC = () => {
  const { toast } = useToast();
  
  // Estado para controlar o curso selecionado
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  // Buscar os cursos disponíveis
  const {
    data: courses,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/courses?status=published');
      return response;
    }
  });
  
  // Função para formatar preço
  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return "Não definido";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };
  
  // Função para selecionar um curso
  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    
    // Exibir uma notificação informando a seleção
    toast({
      title: "Curso selecionado",
      description: `Gerenciando links de pagamento para: ${course.name}`,
    });
  };
  
  // Renderizar conteúdo com base no estado de carregamento
  const renderContent = () => {
    if (isLoading) {
      return renderLoading();
    }
    
    if (isError) {
      return renderError();
    }
    
    if (!courses || courses.length === 0) {
      return renderNoCourses();
    }
    
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cursos Disponíveis</CardTitle>
            <CardDescription>
              Selecione um curso para gerenciar seus links de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome do Curso</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course: any) => (
                    <TableRow key={course.id} className={selectedCourse?.id === course.id ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{formatPrice(course.price)}</TableCell>
                      <TableCell>
                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                          {course.status === 'published' ? 'Publicado' : course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={selectedCourse?.id === course.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectCourse(course)}
                          disabled={!course.price && course.price !== 0}
                        >
                          {selectedCourse?.id === course.id ? "Selecionado" : "Gerenciar Links"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {selectedCourse && (
          <EnhancedPaymentLinksManager
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
          />
        )}
      </div>
    );
  };
  
  // Renderizar estado de carregamento
  const renderLoading = () => {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderizar mensagem de erro
  const renderError = () => {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar cursos</AlertTitle>
        <AlertDescription className="flex flex-col space-y-2">
          <p>
            {error instanceof Error 
              ? error.message 
              : 'Ocorreu um erro ao carregar os cursos. Por favor, tente novamente.'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-fit" 
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  };
  
  // Renderizar mensagem de nenhum curso encontrado
  const renderNoCourses = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum curso encontrado</CardTitle>
          <CardDescription>
            Não foram encontrados cursos disponíveis para gerenciar links de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Para criar links de pagamento, você precisa primeiro criar cursos com preços definidos.
            </p>
            <Button variant="default" asChild>
              <a href="/admin/cursos/novo">
                Criar Novo Curso
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderização da página
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Links de Pagamento para Cursos</h1>
          {selectedCourse && (
            <Button variant="outline" onClick={() => setSelectedCourse(null)}>
              Voltar para Lista
            </Button>
          )}
        </div>
        
        {renderContent()}
      </div>
    </AdminLayout>
  );
};

export default EnhancedCoursePaymentLinksPage;