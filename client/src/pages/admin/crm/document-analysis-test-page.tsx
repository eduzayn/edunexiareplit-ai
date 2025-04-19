import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { DocumentUploadAnalysis } from '@/components/document-analysis/DocumentUploadAnalysis';
import { EnrollmentDataValidator } from '@/components/document-analysis/EnrollmentDataValidator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';

/**
 * Página de teste para análise de documentos
 * Permite testar componentes de análise de texto e imagem
 */
export default function DocumentAnalysisTestPage() {
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  
  // Exemplo de dados para validação
  const sampleEnrollmentData = {
    student: {
      name: "João Silva",
      cpf: "123.456.789-00",
      email: "joao@exemplo.com",
      phone: "(11) 98765-4321",
      address: "Rua Exemplo, 123",
      zipCode: "01234-567",
      city: "São Paulo",
      state: "SP"
    },
    course: {
      id: 5,
      name: "MBA em Gestão Empresarial",
      code: "MBA-GE-2023",
      price: 6500.00
    },
    institution: {
      id: 3,
      name: "Faculdade Exemplo",
      cnpj: "12.345.678/0001-90"
    },
    payment: {
      method: "credit_card",
      installments: 10,
      dueDay: 15
    }
  };

  const handleAnalysisComplete = (data: any) => {
    console.log("Análise concluída:", data);
    setAnalysisResult(data);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Teste de Análise de Documentos" 
        description="Teste os componentes de análise de documentos com IA"
        actions={
          <Link to="/admin/crm/simplified-enrollments">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        <div className="md:col-span-8">
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Análise de Documento</TabsTrigger>
              <TabsTrigger value="validate">Validação de Dados</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <DocumentUploadAnalysis onAnalysisComplete={handleAnalysisComplete} />
            </TabsContent>
            <TabsContent value="validate">
              <EnrollmentDataValidator 
                enrollmentData={sampleEnrollmentData} 
                onValidationComplete={handleAnalysisComplete} 
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>
                Dados extraídos do documento analisado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="bg-slate-50 p-4 rounded-md max-h-[calc(100vh-300px)] overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap text-slate-700">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Nenhum resultado disponível ainda</p>
                  <p className="text-sm mt-2">Analise um documento ou valide os dados de exemplo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}