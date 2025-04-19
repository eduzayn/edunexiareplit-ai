/**
 * Gerenciador aprimorado de links de pagamento
 * Implementa uma interface completa para gerenciar links de pagamento com melhor UX
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MultiStepPaymentLinkForm } from './multi-step-payment-link-form';
import { PaymentLinksList } from './payment-links-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface para props do componente
interface EnhancedPaymentLinksManagerProps {
  courseId: number;
  courseName: string;
}

/**
 * Componente para gerenciamento aprimorado de links de pagamento
 */
export function EnhancedPaymentLinksManager({ courseId, courseName }: EnhancedPaymentLinksManagerProps) {
  // Estado para controlar a criação de novos links
  const [isCreatingNewLink, setIsCreatingNewLink] = useState(false);
  
  // Cliente de query para operações com o cache
  const queryClient = useQueryClient();
  
  // Estado da tab atual
  const [activeTab, setActiveTab] = useState<string>('links');
  
  // Buscar links de pagamento do curso
  const { 
    data: paymentLinks, 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/payment-links/course', courseId],
    queryFn: () => apiRequest(`/api/payment-links/course/${courseId}`, { method: 'GET' }),
    retry: 1, // Limitar tentativas de retry para evitar muitas requisições em caso de erro
  });
  
  // Mutação para excluir um link de pagamento
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/payment-links/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: 'Link excluído',
        description: 'O link de pagamento foi excluído com sucesso.',
      });
      // Invalidar o cache para buscar links atualizados
      queryClient.invalidateQueries({ queryKey: ['/api/payment-links/course', courseId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir link',
        description: error.response?.data?.message || 'Ocorreu um erro ao excluir o link de pagamento.',
        variant: 'destructive',
      });
    },
  });
  
  // Controlador para iniciar criação de novo link
  const handleCreateNewLink = () => {
    setIsCreatingNewLink(true);
    setActiveTab('create');
  };
  
  // Controlador para cancelar criação
  const handleCancelCreate = () => {
    setIsCreatingNewLink(false);
    setActiveTab('links');
  };
  
  // Controlador para confirmar criação
  const handleLinkCreated = () => {
    setIsCreatingNewLink(false);
    setActiveTab('links');
    // Recarregar lista de links
    queryClient.invalidateQueries({ queryKey: ['/api/payment-links/course', courseId] });
    
    toast({
      title: 'Link criado com sucesso',
      description: 'O link de pagamento foi adicionado à lista.',
    });
  };
  
  // Controlador para excluir link
  const handleDeleteLink = (id: number) => {
    // Confirmar antes de excluir
    if (confirm('Tem certeza que deseja excluir este link de pagamento?')) {
      deleteMutation.mutate(id);
    }
  };
  
  // Renderizar mensagem de erro
  const renderError = () => {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar links de pagamento</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : 'Ocorreu um erro ao carregar os links de pagamento. Tente novamente mais tarde.'}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  };
  
  // Renderizar estado de carregamento
  const renderLoading = () => {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando links de pagamento...</span>
      </div>
    );
  };
  
  // Renderizar lista vazia
  const renderEmptyState = () => {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Nenhum link de pagamento cadastrado para este curso.</p>
            <Button onClick={handleCreateNewLink}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderização principal
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Links de Pagamento</span>
            {!isCreatingNewLink && (
              <Button onClick={handleCreateNewLink}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Link
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Gerencie os links de pagamento para o curso {courseName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="links">Links Existentes</TabsTrigger>
              <TabsTrigger value="create" disabled={!isCreatingNewLink}>
                {isCreatingNewLink ? 'Criando Novo Link' : 'Novo Link'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="links">
              {isError && renderError()}
              
              {isLoading ? (
                renderLoading()
              ) : (
                paymentLinks && paymentLinks.length > 0 ? (
                  <PaymentLinksList
                    links={paymentLinks}
                    onDelete={handleDeleteLink}
                    isDeleting={deleteMutation.isPending}
                  />
                ) : (
                  renderEmptyState()
                )
              )}
            </TabsContent>
            
            <TabsContent value="create">
              {isCreatingNewLink && (
                <MultiStepPaymentLinkForm
                  courseId={courseId}
                  courseName={courseName}
                  onSuccess={handleLinkCreated}
                  onCancel={handleCancelCreate}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}