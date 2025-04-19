import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, UploadCloud, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (fileUrl: string) => void;
  title?: string;
  description?: string;
}

export default function PdfUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
  title = "Enviar Apostila PDF",
  description = "Selecione um arquivo PDF para enviar como apostila da disciplina",
}: PdfUploadDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        });
        setFile(null);
        e.target.value = '';
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) { // 100MB
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 100MB.",
          variant: "destructive",
        });
        setFile(null);
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
      setUploadError(null);
      setUploadComplete(false);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Simula uma contagem progressiva enquanto a requisição real ocorre
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Faz o upload real do arquivo
      const response = await fetch('/api/uploads/pdf', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload do arquivo');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao fazer upload do arquivo');
      }

      setUploadProgress(100);
      setUploadComplete(true);
      
      toast({
        title: "Upload concluído com sucesso!",
        description: "O arquivo PDF foi enviado.",
      });

      // Retorna os dados do arquivo para o componente pai
      // Registra no console para debugging
      console.log('Enviando dados do arquivo:', data.file);
      onUploadComplete(data.file);

      // Fecha o diálogo após um breve momento
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);

    } catch (error: any) {
      setUploadError(error.message || 'Ocorreu um erro durante o upload');
      setUploadProgress(0);
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!isUploading && !uploadComplete && (
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="pdf-file" className="col-span-4">
                Selecione o arquivo PDF:
              </Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="col-span-4"
              />
            </div>
          )}

          {(isUploading || uploadComplete) && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isUploading ? "Enviando..." : "Upload concluído"}
                </span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {file && (
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="truncate max-w-[260px]">{file.name}</span>
                </div>
              )}
            </div>
          )}

          {uploadComplete && (
            <div className="flex items-center justify-center p-4 text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span>Arquivo enviado com sucesso!</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center justify-center p-4 text-red-600">
              <XCircle className="mr-2 h-5 w-5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isUploading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={uploadFile}
            disabled={!file || isUploading || uploadComplete}
            className="gap-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}