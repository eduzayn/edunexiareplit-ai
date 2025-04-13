import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface GenerateImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (imageUrl: string) => void;
}

export function GenerateImageDialog({ 
  open, 
  onOpenChange, 
  onImageGenerated 
}: GenerateImageDialogProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(50);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/generate-image", {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        guidance_scale: guidance,
        num_inference_steps: steps
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.images && data.images.length > 0) {
        setGeneratedImages(data.images);
        setSelectedImageUrl(data.images[0]);
        toast({
          title: "Imagem gerada com sucesso",
          description: `Prompt: ${data.prompt}`,
        });
      } else {
        toast({
          title: "Erro ao gerar imagem",
          description: data.error || "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectImage = (url: string) => {
    setSelectedImageUrl(url);
  };

  const handleUseSelectedImage = () => {
    if (selectedImageUrl) {
      onImageGenerated(selectedImageUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerador de Imagens com IA</DialogTitle>
          <DialogDescription>
            Gere imagens para cursos, disciplinas e materiais usando inteligência artificial.
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Gerar Imagem</TabsTrigger>
            <TabsTrigger value="results" disabled={generatedImages.length === 0}>
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Descrição da imagem (prompt)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Descreva a imagem que deseja gerar, com o máximo de detalhes possível."
                  className="min-h-[100px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="negative-prompt">Negativo (opcional)</Label>
                <Textarea
                  id="negative-prompt"
                  placeholder="Elementos que você NÃO quer que apareçam na imagem."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura: {width}px</Label>
                  <Slider
                    id="width"
                    min={512}
                    max={1024}
                    step={128}
                    value={[width]}
                    onValueChange={(value) => setWidth(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura: {height}px</Label>
                  <Slider
                    id="height"
                    min={512}
                    max={1024}
                    step={128}
                    value={[height]}
                    onValueChange={(value) => setHeight(value[0])}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guidance">Guidance Scale: {guidance}</Label>
                  <Slider
                    id="guidance"
                    min={1}
                    max={20}
                    step={0.5}
                    value={[guidance]}
                    onValueChange={(value) => setGuidance(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">Quanto maior, mais a imagem seguirá o prompt (7.5 é o ideal)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steps">Passos: {steps}</Label>
                  <Slider
                    id="steps"
                    min={20}
                    max={100}
                    step={1}
                    value={[steps]}
                    onValueChange={(value) => setSteps(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">Mais passos = mais qualidade, mas leva mais tempo</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => generateImageMutation.mutate()}
                disabled={!prompt.trim() || generateImageMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full mr-2" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Imagem'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className={`
                      relative border rounded-md overflow-hidden cursor-pointer
                      ${selectedImageUrl === imageUrl ? 'ring-2 ring-green-600' : ''}
                    `}
                    onClick={() => handleSelectImage(imageUrl)}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Imagem gerada ${index + 1}`} 
                      className="w-full h-auto"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full h-6 w-6 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {selectedImageUrl && (
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleUseSelectedImage}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Usar Imagem Selecionada
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}