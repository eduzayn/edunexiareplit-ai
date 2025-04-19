import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { PaymentLinksList } from './payment-links-list';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export function PaymentLinksManager() {
  // Obter o ID do curso da URL
  const params = useParams<{ id: string }>();
  const courseId = params?.id ? parseInt(params.id, 10) : undefined;
  
  // Buscar informações do curso
  const { data: course, isLoading, isError } = useQuery({
    queryKey: [`/api/admin/courses/${courseId}`],
    enabled: !!courseId,
  });
  
  // Estado de erro caso o ID do curso não seja fornecido
  if (!courseId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ID do curso não fornecido</AlertTitle>
        <AlertDescription>
          O ID do curso é necessário para gerenciar os links de pagamento.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  // Estado de erro ao carregar o curso
  if (isError || !course) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar o curso</AlertTitle>
        <AlertDescription>
          Não foi possível carregar as informações do curso. Por favor, verifique se o ID do curso é válido.
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/academico/cursos">Voltar para lista de cursos</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Links de Pagamento para {course.name}</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os links de pagamento personalizados para este curso.
        </p>
      </div>
      
      <div className="border-t pt-6">
        <PaymentLinksList 
          courseId={courseId} 
          courseName={course.name} 
        />
      </div>
    </div>
  );
}