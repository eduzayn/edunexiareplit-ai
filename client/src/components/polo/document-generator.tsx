import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTextIcon, DownloadIcon, PrinterIcon } from "@/components/ui/icons";

// Tipos de documentos suportados
export type DocumentType = 
  | "enrollment_contract" 
  | "enrollment_receipt" 
  | "enrollment_certificate" 
  | "payment_slip";

// Interfaces
interface DocumentGeneratorProps {
  enrollmentId: number;
  studentName: string;
  courseName: string;
  showTriggerButton?: boolean;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  onGenerated?: (documentUrl: string) => void;
}

interface DocumentOption {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function DocumentGenerator({
  enrollmentId,
  studentName,
  courseName,
  showTriggerButton = true,
  buttonLabel = "Gerar Documento",
  buttonVariant = "outline",
  onGenerated,
}: DocumentGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeInstitutionHeader, setIncludeInstitutionHeader] = useState(true);
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Lista de documentos disponíveis
  const documentOptions: DocumentOption[] = [
    {
      id: "enrollment_contract",
      label: "Contrato de Matrícula",
      description: "Documento formal de contrato entre o aluno e a instituição",
      icon: <FileTextIcon className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "enrollment_receipt",
      label: "Comprovante de Matrícula",
      description: "Comprovante de que o aluno está matriculado",
      icon: <FileTextIcon className="h-5 w-5 text-green-500" />,
    },
    {
      id: "enrollment_certificate",
      label: "Declaração de Matrícula",
      description: "Documento formal que certifica a matrícula do aluno",
      icon: <FileTextIcon className="h-5 w-5 text-orange-500" />,
    },
    {
      id: "payment_slip",
      label: "Boleto de Pagamento",
      description: "Boleto para pagamento da matrícula ou mensalidade",
      icon: <FileTextIcon className="h-5 w-5 text-purple-500" />,
    },
  ];

  // Mutação para geração de documento
  const generateDocumentMutation = useMutation({
    mutationFn: async (data: {
      enrollmentId: number;
      documentType: DocumentType;
      options: {
        includeSignature: boolean;
        includeInstitutionHeader: boolean;
        additionalInfo: string;
      };
    }) => {
      const response = await apiRequest("POST", "/api/polo/documents/generate", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Documento gerado com sucesso",
        description: "O documento está pronto para download",
      });
      
      if (onGenerated) {
        onGenerated(data.documentUrl);
      }
      
      // Simular download automático
      if (data.documentUrl) {
        const link = document.createElement("a");
        link.href = data.documentUrl;
        link.setAttribute("download", `${getDocumentFileName()}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar documento",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Obter nome do arquivo baseado no tipo de documento
  const getDocumentFileName = () => {
    const documentName = documentOptions.find(d => d.id === selectedDocumentType)?.label || "Documento";
    const safeName = studentName.replace(/[^\w]/g, "_").toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];
    
    return `${documentName}_${safeName}_${timestamp}`;
  };

  // Função para gerar o documento
  const handleGenerateDocument = () => {
    if (!selectedDocumentType) {
      toast({
        title: "Tipo de documento não selecionado",
        description: "Selecione um tipo de documento para continuar",
        variant: "destructive",
      });
      return;
    }

    generateDocumentMutation.mutate({
      enrollmentId,
      documentType: selectedDocumentType,
      options: {
        includeSignature,
        includeInstitutionHeader,
        additionalInfo,
      },
    });
  };

  return (
    <>
      {showTriggerButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant={buttonVariant} className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              {buttonLabel}
            </Button>
          </DialogTrigger>
          <DocumentGeneratorContent 
            studentName={studentName}
            courseName={courseName}
            documentOptions={documentOptions}
            selectedDocumentType={selectedDocumentType}
            setSelectedDocumentType={setSelectedDocumentType}
            includeSignature={includeSignature}
            setIncludeSignature={setIncludeSignature}
            includeInstitutionHeader={includeInstitutionHeader}
            setIncludeInstitutionHeader={setIncludeInstitutionHeader}
            additionalInfo={additionalInfo}
            setAdditionalInfo={setAdditionalInfo}
            isGenerating={generateDocumentMutation.isPending}
            onGenerate={handleGenerateDocument}
            onCancel={() => setIsOpen(false)}
          />
        </Dialog>
      )}
    </>
  );
}

// Componente de conteúdo do modal
interface DocumentGeneratorContentProps {
  studentName: string;
  courseName: string;
  documentOptions: DocumentOption[];
  selectedDocumentType: DocumentType | null;
  setSelectedDocumentType: (type: DocumentType) => void;
  includeSignature: boolean;
  setIncludeSignature: (include: boolean) => void;
  includeInstitutionHeader: boolean;
  setIncludeInstitutionHeader: (include: boolean) => void;
  additionalInfo: string;
  setAdditionalInfo: (info: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}

function DocumentGeneratorContent({
  studentName,
  courseName,
  documentOptions,
  selectedDocumentType,
  setSelectedDocumentType,
  includeSignature,
  setIncludeSignature,
  includeInstitutionHeader,
  setIncludeInstitutionHeader,
  additionalInfo,
  setAdditionalInfo,
  isGenerating,
  onGenerate,
  onCancel,
}: DocumentGeneratorContentProps) {
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Gerador de Documentos</DialogTitle>
        <DialogDescription>
          Gere documentos oficiais para a matrícula do aluno {studentName}.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 my-2">
        <div className="space-y-2">
          <Label htmlFor="document-type">Tipo de Documento</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentOptions.map((doc) => (
              <Card 
                key={doc.id}
                className={`cursor-pointer transition-all ${
                  selectedDocumentType === doc.id 
                    ? "border-orange-500 border-2 shadow-md" 
                    : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedDocumentType(doc.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-1">{doc.icon}</div>
                  <div>
                    <h3 className="font-medium">{doc.label}</h3>
                    <p className="text-xs text-gray-500">{doc.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="font-medium">Informações do Documento</h3>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox 
                id="include-signature" 
                checked={includeSignature}
                onCheckedChange={(checked) => 
                  setIncludeSignature(checked as boolean)
                }
              />
              <div className="space-y-1 leading-none">
                <Label 
                  htmlFor="include-signature"
                  className="font-normal cursor-pointer"
                >
                  Incluir assinatura digital
                </Label>
                <p className="text-sm text-gray-500">
                  Adiciona a assinatura digital do responsável pelo polo
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <Checkbox 
                id="include-header" 
                checked={includeInstitutionHeader}
                onCheckedChange={(checked) => 
                  setIncludeInstitutionHeader(checked as boolean)
                }
              />
              <div className="space-y-1 leading-none">
                <Label 
                  htmlFor="include-header"
                  className="font-normal cursor-pointer"
                >
                  Incluir cabeçalho institucional
                </Label>
                <p className="text-sm text-gray-500">
                  Adiciona o cabeçalho oficial da instituição no documento
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additional-info">Informações Adicionais (opcional)</Label>
            <Input 
              id="additional-info"
              placeholder="Insira informações complementares se necessário"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Aluno:</span> {studentName}</p>
              <p><span className="text-gray-500">Curso:</span> {courseName}</p>
              <p>
                <span className="text-gray-500">Documento:</span> {
                  selectedDocumentType
                    ? documentOptions.find(d => d.id === selectedDocumentType)?.label
                    : "Nenhum selecionado"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DialogFooter className="flex items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isGenerating}
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={!selectedDocumentType || isGenerating}
            onClick={onGenerate}
            className="bg-orange-500 hover:bg-orange-600 gap-2"
          >
            {isGenerating ? (
              <>
                <Skeleton className="h-4 w-4 rounded-full" />
                Gerando...
              </>
            ) : (
              <>
                <FileTextIcon className="h-4 w-4" />
                Gerar Documento
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}