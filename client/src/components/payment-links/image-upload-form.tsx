import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, UploadIcon, FileImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImageUploadFormProps {
  paymentLinkId: number;
  paymentLinkName: string;
  onSuccess?: () => void;
}

export function ImageUploadForm({ paymentLinkId, paymentLinkName, onSuccess }: ImageUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Validar tipo de arquivo (apenas imagens)
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Tipo de arquivo inválido',
          description: 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tamanho do arquivo (máx 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Gerar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };
  
  // Mutação para upload de imagem
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Usar XMLHttpRequest para monitorar o progresso do upload
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              try {
                reject(JSON.parse(xhr.responseText));
              } catch (e) {
                reject({ error: 'Erro desconhecido durante o upload' });
              }
            }
          }
        };
        
        xhr.open('POST', `/api/payment-links/${paymentLinkId}/image`, true);
        
        // Obter o token da API (pode ser necessário ajustar isso dependendo da implementação)
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload concluído',
        description: 'A imagem foi adicionada ao link de pagamento com sucesso',
      });
      
      // Atualizar os dados de links de pagamento
      queryClient.invalidateQueries({ queryKey: [`/api/payment-links/course`] });
      
      // Limpar o formulário
      setFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      
      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Ocorreu um erro ao fazer upload da imagem',
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  });
  
  // Submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'Nenhuma imagem selecionada',
        description: 'Por favor, selecione uma imagem para upload',
        variant: 'destructive',
      });
      return;
    }
    
    uploadMutation.mutate();
  };
  
  // Cancelar upload e limpar o formulário
  const handleCancel = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };
  
  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Upload de Imagem Personalizada</AlertTitle>
        <AlertDescription>
          A imagem será usada como capa do link de pagamento. Recomendamos imagens no formato paisagem (16:9) 
          com resolução mínima de 1024x576 pixels.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Imagem para "{paymentLinkName}"</CardTitle>
          <CardDescription>
            Selecione uma imagem para personalizar o link de pagamento. A imagem deve ter no máximo 5MB.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Input de arquivo */}
              <div className="col-span-2">
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadMutation.isPending}
                    className="w-full"
                  />
                  {file && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={uploadMutation.isPending}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                
                {/* Barra de progresso */}
                {uploadMutation.isPending && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-center mt-1">{uploadProgress}% concluído</p>
                  </div>
                )}
              </div>
              
              {/* Preview da imagem */}
              {previewUrl && (
                <div className="col-span-2 mt-4">
                  <div className="rounded-md overflow-hidden border border-border">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              )}
              
              {/* Sem imagem selecionada */}
              {!previewUrl && (
                <div className="col-span-2 mt-4 flex flex-col items-center justify-center border border-dashed border-border rounded-md p-8">
                  <FileImageIcon size={48} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem selecionada
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadIcon size={16} className="mr-2" />
                    Fazer Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}