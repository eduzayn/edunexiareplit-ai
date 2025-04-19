import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileType, Image, FileText, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentUploadAnalysisProps {
  onAnalysisComplete?: (data: any) => void;
}

/**
 * Componente para upload e análise de documentos
 * Permite upload de imagem ou inserção de texto para análise com IA
 */
export function DocumentUploadAnalysis({ onAnalysisComplete }: DocumentUploadAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('rg');
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);
    setSuccess(false);
  };

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setError(null);
    setSuccess(false);
  };

  const handleTabChange = (tab: 'image' | 'text') => {
    setActiveTab(tab);
    setError(null);
    setSuccess(false);
  };

  const analyzeImage = async () => {
    if (!file) {
      setError('Por favor, selecione uma imagem para análise.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Converter imagem para base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result?.toString().split(',')[1];

        if (!base64Image) {
          throw new Error('Erro ao processar a imagem');
        }

        // Enviar para a API
        const response = await apiRequest('/api/document-analysis/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            documentType
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao analisar a imagem');
        }

        const data = await response.json();
        setSuccess(true);
        if (onAnalysisComplete) {
          onAnalysisComplete(data);
        }
      };
    } catch (err) {
      console.error('Erro na análise de imagem:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido na análise');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!text.trim()) {
      setError('Por favor, insira o texto para análise.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiRequest('/api/document-analysis/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          documentType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao analisar o texto');
      }

      const data = await response.json();
      setSuccess(true);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      console.error('Erro na análise de texto:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido na análise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise de Documento</CardTitle>
        <CardDescription>
          Faça upload de uma imagem ou insira o texto para análise com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 ${
              activeTab === 'image'
                ? 'border-b-2 border-primary font-medium'
                : 'text-gray-500'
            }`}
            onClick={() => handleTabChange('image')}
            type="button"
          >
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-2" />
              Imagem
            </div>
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'text'
                ? 'border-b-2 border-primary font-medium'
                : 'text-gray-500'
            }`}
            onClick={() => handleTabChange('text')}
            type="button"
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Texto
            </div>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="document-type">Tipo de Documento</Label>
            <Select value={documentType} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rg">RG</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="passport">Passaporte</SelectItem>
                <SelectItem value="driver_license">CNH</SelectItem>
                <SelectItem value="address_proof">Comprovante de Endereço</SelectItem>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="school_transcript">Histórico Escolar</SelectItem>
                <SelectItem value="enrollment_form">Ficha de Matrícula</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeTab === 'image' ? (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="document-upload">Imagem do Documento</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Input
                  id="document-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label
                  htmlFor="document-upload"
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">Clique para selecionar imagem</span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPEG, PNG ou PDF (até 10MB)
                  </span>
                </Label>
                {file && (
                  <div className="mt-2 text-sm text-gray-700 flex items-center justify-center">
                    <FileType className="h-4 w-4 mr-1" />
                    <span className="truncate max-w-xs">{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="document-text">Texto do Documento</Label>
              <textarea
                id="document-text"
                className="min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Cole o texto do documento aqui..."
                value={text}
                onChange={handleTextChange}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Sucesso</AlertTitle>
              <AlertDescription className="text-green-700">
                Documento analisado com sucesso. Veja os resultados ao lado.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={activeTab === 'image' ? analyzeImage : analyzeText}
          disabled={isLoading || (activeTab === 'image' ? !file : !text.trim())}
        >
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-4 rounded-full mr-2" />
              Analisando...
            </>
          ) : (
            <>Analisar Documento</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}