import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useLocation } from 'wouter';
import { 
  NewSimplifiedEnrollment, 
  getSimplifiedEnrollmentById, 
  generatePaymentLink, 
  updatePaymentStatus, 
  cancelEnrollment 
} from '../../../services/new-simplified-enrollment-service';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Componente principal
export default function NewSimplifiedEnrollmentDetailsPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const enrollmentId = parseInt(params.id);
  const queryClient = useQueryClient();
  
  // Estado para o modal de cancelamento
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  // Buscar detalhes da matrícula
  const { 
    data: enrollmentResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({ 
    queryKey: ['/api/v2/simplified-enrollments', enrollmentId], 
    queryFn: () => getSimplifiedEnrollmentById(enrollmentId),
    retry: 1
  });

  // Mutation para gerar link de pagamento
  const generatePaymentLinkMutation = useMutation({
    mutationFn: () => generatePaymentLink(enrollmentId),
    onSuccess: (data) => {
      toast({
        title: "Link de pagamento gerado com sucesso",
        description: "O link de pagamento foi gerado e pode ser compartilhado com o aluno.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v2/simplified-enrollments', enrollmentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar link de pagamento",
        description: error.message || "Ocorreu um erro ao gerar o link de pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para cancelar matrícula
  const cancelEnrollmentMutation = useMutation({
    mutationFn: () => cancelEnrollment(enrollmentId),
    onSuccess: () => {
      toast({
        title: "Matrícula cancelada",
        description: "A matrícula foi cancelada com sucesso.",
      });
      setIsCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/v2/simplified-enrollments', enrollmentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar matrícula",
        description: error.message || "Ocorreu um erro ao cancelar a matrícula. Tente novamente.",
        variant: "destructive",
      });
      setIsCancelDialogOpen(false);
    }
  });

  // Mutation para atualizar status de pagamento
  const updatePaymentStatusMutation = useMutation({
    mutationFn: () => updatePaymentStatus(enrollmentId),
    onSuccess: (data) => {
      toast({
        title: "Status de pagamento atualizado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v2/simplified-enrollments', enrollmentId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status de pagamento",
        description: error.message || "Ocorreu um erro ao atualizar o status do pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Aguardando Processamento</Badge>;
      case 'waiting_payment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aguardando Pagamento</Badge>;
      case 'payment_confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pagamento Confirmado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelada</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Falha no Processamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // UI para estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/crm/new-simplified-enrollments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold ml-4">Carregando matrícula...</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // UI para estado de erro
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/crm/new-simplified-enrollments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold ml-4">Erro ao carregar matrícula</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {(error as any)?.message || "Ocorreu um erro ao carregar os detalhes da matrícula. Tente novamente."}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const enrollmentData = enrollmentResponse?.data;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/crm/new-simplified-enrollments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold ml-4">Detalhes da Matrícula</h1>
        
        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          
          {enrollmentData?.status === 'waiting_payment' && (
            <Button 
              size="sm" 
              onClick={() => updatePaymentStatusMutation.mutate()}
              disabled={updatePaymentStatusMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Pagamento
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="relative">
              <div className="absolute right-6 top-6">
                {enrollmentData?.status && getStatusBadge(enrollmentData.status)}
              </div>
              <CardTitle>
                {enrollmentData?.studentName}
              </CardTitle>
              <CardDescription>
                Matrícula #{enrollmentData?.id} • Criada em {enrollmentData?.createdAt ? formatDate(enrollmentData.createdAt) : '-'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Informações do Aluno</h3>
                  <dl className="mt-2 space-y-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Nome</dt>
                      <dd className="text-base">{enrollmentData?.studentName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">E-mail</dt>
                      <dd className="text-base">{enrollmentData?.studentEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">CPF</dt>
                      <dd className="text-base">{enrollmentData?.studentCpf}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Informações do Curso</h3>
                  <dl className="mt-2 space-y-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">Curso</dt>
                      <dd className="text-base">{enrollmentData?.courseName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Instituição</dt>
                      <dd className="text-base">{enrollmentData?.institutionName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Polo</dt>
                      <dd className="text-base">{enrollmentData?.poloName || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Valor</dt>
                      <dd className="text-base font-semibold">{formatCurrency(enrollmentData?.amount || 0)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Dados Técnicos</h3>
                <dl className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Referência Externa</dt>
                    <dd className="text-sm font-mono">{enrollmentData?.externalReference || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Canal de Origem</dt>
                    <dd className="text-sm">{enrollmentData?.sourceChannel || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">ID do Cliente (Asaas)</dt>
                    <dd className="text-sm font-mono">{enrollmentData?.asaasCustomerId || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">ID do Pagamento (Asaas)</dt>
                    <dd className="text-sm font-mono">{enrollmentData?.paymentId || "-"}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
          
          {enrollmentData?.errorDetails && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Processamento</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Ocorreu um erro durante o processamento desta matrícula:</p>
                <pre className="text-xs bg-red-900/10 p-2 rounded overflow-auto max-h-[200px]">
                  {enrollmentData.errorDetails}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link de Pagamento</CardTitle>
              <CardDescription>
                Gerencie o link de pagamento para esta matrícula
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentData?.paymentLinkUrl ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Link de Pagamento:</p>
                    <div className="flex items-center">
                      <a 
                        href={enrollmentData.paymentLinkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center"
                      >
                        Ver link de pagamento
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ID do Link:</p>
                    <p className="text-sm font-mono">{enrollmentData.paymentLinkId}</p>
                  </div>
                  
                  <div>
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => {
                        if (enrollmentData.paymentLinkUrl) {
                          navigator.clipboard.writeText(enrollmentData.paymentLinkUrl);
                          toast({
                            title: "Link copiado",
                            description: "O link de pagamento foi copiado para a área de transferência.",
                          });
                        }
                      }}
                    >
                      Copiar Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>Nenhum link de pagamento</AlertTitle>
                    <AlertDescription>
                      Ainda não foi gerado um link de pagamento para esta matrícula.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => generatePaymentLinkMutation.mutate()}
                    disabled={
                      generatePaymentLinkMutation.isPending || 
                      enrollmentData?.status === 'cancelled' ||
                      enrollmentData?.status === 'completed'
                    }
                  >
                    {generatePaymentLinkMutation.isPending ? "Gerando..." : "Gerar Link de Pagamento"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Gerencie esta matrícula
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Dados
              </Button>
              
              {enrollmentData?.status === 'waiting_payment' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => updatePaymentStatusMutation.mutate()}
                  disabled={updatePaymentStatusMutation.isPending}
                >
                  Verificar Status do Pagamento
                </Button>
              )}
              
              <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={
                      cancelEnrollmentMutation.isPending || 
                      enrollmentData?.status === 'cancelled' ||
                      enrollmentData?.status === 'completed'
                    }
                  >
                    Cancelar Matrícula
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta matrícula? Esta ação também cancelará qualquer cobrança pendente associada a ela.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => cancelEnrollmentMutation.mutate()}
                      disabled={cancelEnrollmentMutation.isPending}
                    >
                      {cancelEnrollmentMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}