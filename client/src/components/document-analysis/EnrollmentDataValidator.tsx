import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface EnrollmentDataValidatorProps {
  enrollmentData: any;
  onValidationComplete?: (data: any) => void;
}

/**
 * Componente para validação de dados de matrícula
 * Analisa os dados fornecidos para verificar inconsistências e problemas
 */
export function EnrollmentDataValidator({ 
  enrollmentData, 
  onValidationComplete 
}: EnrollmentDataValidatorProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateData = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setValidationResult(null);

    try {
      const response = await apiRequest('/api/document-analysis/validate-enrollment-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao validar os dados');
      }

      const data = await response.json();
      setSuccess(true);
      setValidationResult(data);
      
      if (onValidationComplete) {
        onValidationComplete(data);
      }
    } catch (err) {
      console.error('Erro na validação de dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido na validação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Validação de Dados de Matrícula</CardTitle>
        <CardDescription>
          Analise os dados de matrícula para identificar inconsistências
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dados do Aluno</h3>
              <div className="rounded-md bg-slate-50 p-3">
                <dl className="text-sm divide-y divide-slate-200">
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Nome:</dt>
                    <dd className="col-span-2">{enrollmentData.student.name}</dd>
                  </div>
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">CPF:</dt>
                    <dd className="col-span-2">{enrollmentData.student.cpf}</dd>
                  </div>
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Email:</dt>
                    <dd className="col-span-2">{enrollmentData.student.email}</dd>
                  </div>
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Telefone:</dt>
                    <dd className="col-span-2">{enrollmentData.student.phone}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dados do Curso</h3>
              <div className="rounded-md bg-slate-50 p-3">
                <dl className="text-sm divide-y divide-slate-200">
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Curso:</dt>
                    <dd className="col-span-2">{enrollmentData.course.name}</dd>
                  </div>
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Código:</dt>
                    <dd className="col-span-2">{enrollmentData.course.code}</dd>
                  </div>
                  <div className="grid grid-cols-3 py-1">
                    <dt className="font-medium">Valor:</dt>
                    <dd className="col-span-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(enrollmentData.course.price)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Dados de Pagamento</h3>
            <div className="rounded-md bg-slate-50 p-3">
              <dl className="text-sm divide-y divide-slate-200">
                <div className="grid grid-cols-3 py-1">
                  <dt className="font-medium">Forma de Pagamento:</dt>
                  <dd className="col-span-2">
                    {enrollmentData.payment.method === 'credit_card' 
                      ? 'Cartão de Crédito' 
                      : enrollmentData.payment.method === 'boleto' 
                        ? 'Boleto Bancário' 
                        : enrollmentData.payment.method}
                  </dd>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <dt className="font-medium">Parcelas:</dt>
                  <dd className="col-span-2">{enrollmentData.payment.installments}x</dd>
                </div>
                <div className="grid grid-cols-3 py-1">
                  <dt className="font-medium">Dia de Vencimento:</dt>
                  <dd className="col-span-2">{enrollmentData.payment.dueDay}</dd>
                </div>
              </dl>
            </div>
          </div>

          {validationResult && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Resultado da Validação</h3>
                <span 
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    validationResult.isValid 
                      ? "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20" 
                      : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20"
                  }`}
                >
                  {validationResult.isValid ? "Dados Válidos" : "Problemas Encontrados"}
                </span>
              </div>
              
              {validationResult.issues && validationResult.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Problemas encontrados:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    {validationResult.issues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-600">Sugestões:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                    {validationResult.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && !validationResult && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Sucesso</AlertTitle>
              <AlertDescription className="text-green-700">
                Dados validados com sucesso.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={validateData}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-4 rounded-full mr-2" />
              Validando...
            </>
          ) : (
            <>Validar Dados</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}