import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Link as LinkIcon, RefreshCw, Copy } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { PageTransition } from "@/components/ui/page-transition";

/**
 * Página para gerenciar links de pagamento de cursos
 */
const CoursePaymentLinksPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Buscar os cursos
  const coursesQuery = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/courses'); 
      // O status pode ser filtrado aqui, mas vamos trazer todos os cursos inicialmente
      console.log("Cursos obtidos:", response);
      return response;
    }
  });

  // Buscar os links de pagamento para o curso selecionado
  const paymentLinkQuery = useQuery({
    queryKey: ['/api/admin/courses', selectedCourseId, 'payment-link'],
    queryFn: async () => {
      if (!selectedCourseId) return null;
      
      try {
        const response = await apiRequest(`/api/admin/courses/${selectedCourseId}/payment-link`);
        return response.data;
      } catch (error) {
        console.error("Erro ao buscar link de pagamento:", error);
        return null;
      }
    },
    enabled: !!selectedCourseId
  });

  // Mutação para gerar um novo link de pagamento
  const generatePaymentLinkMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest(`/api/admin/courses/${courseId}/payment-link`, {
        method: 'POST'
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourseId, 'payment-link'] });
      toast({
        title: "Link de pagamento gerado",
        description: "O link de pagamento foi gerado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao gerar link de pagamento:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link de pagamento. Tente novamente.",
      });
    }
  });

  // Função para copiar o link para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link copiado",
          description: "O link foi copiado para a área de transferência",
        });
      },
      (err) => {
        console.error("Erro ao copiar texto:", err);
        toast({
          variant: "destructive",
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link",
        });
      }
    );
  };

  const handleGenerateLink = (courseId: number) => {
    setSelectedCourseId(courseId);
    generatePaymentLinkMutation.mutate(courseId);
  };

  const handleGetLink = (courseId: number) => {
    setSelectedCourseId(courseId);
  };

  // Renderizar estado de carregamento
  if (coursesQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Links de Pagamento para Cursos</h1>
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
        </div>
      </AdminLayout>
    );
  }

  // Renderizar erro
  if (coursesQuery.isError) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Links de Pagamento para Cursos</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Ocorreu um erro ao carregar os cursos. Por favor, tente novamente.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Links de Pagamento para Cursos</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Cursos Disponíveis</CardTitle>
            <CardDescription>
              Gere ou copie links de pagamento para seus cursos que poderão ser compartilhados diretamente com interessados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome do Curso</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Link de Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesQuery.data.map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>
                      {course.price
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(course.price)
                        : "Preço não definido"}
                    </TableCell>
                    <TableCell>
                      {selectedCourseId === course.id && paymentLinkQuery.isLoading ? (
                        <Skeleton className="h-6 w-32" />
                      ) : course.paymentLinkUrl ? (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">Link disponível</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(course.paymentLinkUrl)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Nenhum link gerado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {course.paymentLinkUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGetLink(course.id)}
                          disabled={generatePaymentLinkMutation.isPending}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Ver Link
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGenerateLink(course.id)}
                          disabled={generatePaymentLinkMutation.isPending || !course.price}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${generatePaymentLinkMutation.isPending ? 'animate-spin' : ''}`} />
                          Gerar Link
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {coursesQuery.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhum curso encontrado. Crie cursos com preços definidos para gerar links de pagamento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Os links de pagamento são gerados através da API Asaas e permitem pagamentos diversos, incluindo PIX, cartão de crédito e boleto.
            </p>
          </CardFooter>
        </Card>

        {selectedCourseId && paymentLinkQuery.data && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Link de Pagamento</CardTitle>
              <CardDescription>
                Use este link para compartilhar com potenciais alunos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-100 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm break-all mr-2">{paymentLinkQuery.data.paymentLinkUrl}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(paymentLinkQuery.data.paymentLinkUrl)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  ID do Link: <span className="font-mono">{paymentLinkQuery.data.paymentLinkId}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default CoursePaymentLinksPage;