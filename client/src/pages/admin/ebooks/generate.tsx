import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// UI Components
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  ArrowLeft,
  Sparkles,
  Save,
  BookOpenText,
  Image,
  CheckCircle,
  XCircle,
  Loader2,
  Pencil
} from 'lucide-react';

// Schema de validação
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'O título deve ter pelo menos 3 caracteres',
  }),
  description: z.string().min(10, {
    message: 'A descrição deve ter pelo menos 10 caracteres',
  }),
  disciplineId: z.string({
    required_error: 'Selecione uma disciplina',
  }).refine(val => !isNaN(parseInt(val)), {
    message: 'Selecione uma disciplina válida',
  }),
});

// Tipo da disciplina
interface Discipline {
  id: number;
  name: string;
  code: string;
}

// Tipo do e-book gerado
interface GeneratedEBook {
  title: string;
  content: string;
  imagePrompts?: string[];
}

const GenerateEBookPage: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [generatedContent, setGeneratedContent] = useState<GeneratedEBook | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("content");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);

  // Buscar disciplinas
  const {
    data: disciplines,
    isLoading: isDisciplinesLoading,
    isError: isDisciplinesError,
  } = useQuery<Discipline[]>({
    queryKey: ['/api/admin/disciplines'],
    refetchOnWindowFocus: false,
  });

  // Formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      disciplineId: '',
    },
  });

  // Gerar conteúdo do e-book
  const generateContentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/ebooks/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          disciplineId: parseInt(values.disciplineId),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar conteúdo');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: 'Conteúdo gerado',
        description: 'O conteúdo do e-book foi gerado com sucesso!',
        variant: 'default',
      });
      setActiveTab("content");
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar conteúdo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Gerar sugestões de imagens
  const generateImageSuggestionsMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      setIsGeneratingImages(true);
      const response = await fetch('/api/ebooks/generate-image-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar sugestões de imagens');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setImageSuggestions(data.imageSuggestions || []);
      toast({
        title: 'Sugestões de imagens geradas',
        description: 'As sugestões de imagens foram geradas com sucesso!',
        variant: 'default',
      });
      setIsGeneratingImages(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao gerar sugestões de imagens',
        description: error.message,
        variant: 'destructive',
      });
      setIsGeneratingImages(false);
    },
  });

  // Salvar e-book
  const saveEBookMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      description: string; 
      content: string;
      disciplineId: number;
    }) => {
      const response = await fetch('/api/ebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          isGenerated: true,
          status: 'draft',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar e-book');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-book salvo',
        description: 'O e-book foi salvo com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
      navigate('/admin/ebooks');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar e-book',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Enviar formulário para gerar conteúdo
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateContentMutation.mutate(values);
    
    // Armazenar a disciplina selecionada para uso posterior
    if (disciplines) {
      const discipline = disciplines.find(d => d.id.toString() === values.disciplineId);
      if (discipline) {
        setSelectedDiscipline(discipline);
      }
    }
  };

  // Gerar sugestões de imagens
  const handleGenerateImageSuggestions = () => {
    if (form.getValues('title') && form.getValues('description')) {
      generateImageSuggestionsMutation.mutate({
        title: form.getValues('title'),
        description: form.getValues('description'),
      });
    } else {
      toast({
        title: 'Dados insuficientes',
        description: 'Por favor, preencha o título e a descrição para gerar sugestões de imagens.',
        variant: 'destructive',
      });
    }
  };

  // Salvar e-book completo
  const handleSaveEBook = () => {
    if (!generatedContent || !form.getValues('disciplineId')) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, gere o conteúdo primeiro.',
        variant: 'destructive',
      });
      return;
    }

    saveEBookMutation.mutate({
      title: form.getValues('title'),
      description: form.getValues('description'),
      content: generatedContent.content,
      disciplineId: parseInt(form.getValues('disciplineId')),
    });
  };

  if (isDisciplinesLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/admin/ebooks')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Gerar E-Book com IA</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDisciplinesError) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/admin/ebooks')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Gerar E-Book com IA</h1>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar disciplinas</CardTitle>
            <CardDescription>
              Ocorreu um erro ao carregar as disciplinas. Por favor, tente novamente.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate('/admin/ebooks')}>
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/admin/ebooks')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Gerar E-Book com IA</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do E-Book</CardTitle>
            <CardDescription>
              Forneça os detalhes básicos para gerar o conteúdo do e-book com IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Introdução à teoria musical" {...field} />
                      </FormControl>
                      <FormDescription>
                        Um título descritivo para o e-book.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Uma introdução aos conceitos básicos de teoria musical, incluindo notas, escalas e acordes."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Uma descrição detalhada do que o e-book deve abordar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="disciplineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {disciplines?.map((discipline) => (
                            <SelectItem key={discipline.id} value={discipline.id.toString()}>
                              {discipline.name} ({discipline.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        A disciplina relacionada a este e-book.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateImageSuggestions}
                    disabled={isGeneratingImages || !form.getValues('title') || !form.getValues('description')}
                  >
                    {isGeneratingImages ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Image className="mr-2 h-4 w-4" />
                        Gerar Sugestões de Imagens
                      </span>
                    )}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={generateContentMutation.isPending}
                  >
                    {generateContentMutation.isPending ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Conteúdo
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Conteúdo Gerado</TabsTrigger>
              <TabsTrigger value="images">Sugestões de Imagens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo Gerado</CardTitle>
                  <CardDescription>
                    {generatedContent 
                      ? "Conteúdo gerado com base nas informações fornecidas."
                      : "O conteúdo gerado pela IA aparecerá aqui."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generateContentMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                      <h3 className="text-lg font-semibold mb-2">Gerando conteúdo...</h3>
                      <p className="text-muted-foreground">
                        Estamos criando o conteúdo do e-book com base nas informações fornecidas.
                        Isso pode levar alguns segundos.
                      </p>
                    </div>
                  ) : generatedContent ? (
                    <div className="space-y-4">
                      <div className="border rounded-md p-4 bg-muted/30">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">{generatedContent.title}</h3>
                          <Badge variant="outline" className="ml-2">
                            {selectedDiscipline?.name}
                          </Badge>
                        </div>
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: generatedContent.content.replace(/\n/g, '<br/>') }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <BookOpenText className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo gerado</h3>
                      <p className="text-muted-foreground mb-4">
                        Preencha os campos ao lado e clique em "Gerar Conteúdo" para criar
                        automaticamente o conteúdo deste e-book usando IA.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle>Sugestões de Imagens</CardTitle>
                  <CardDescription>
                    {imageSuggestions.length > 0 
                      ? "Sugestões de imagens e prompts para ilustrar o e-book."
                      : "As sugestões de imagens aparecerão aqui."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGeneratingImages ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                      <h3 className="text-lg font-semibold mb-2">Gerando sugestões...</h3>
                      <p className="text-muted-foreground">
                        Estamos criando sugestões de imagens para o seu e-book.
                        Isso pode levar alguns segundos.
                      </p>
                    </div>
                  ) : imageSuggestions.length > 0 ? (
                    <div className="space-y-4">
                      {imageSuggestions.map((suggestion, index) => (
                        <div key={index} className="border rounded-md p-4 bg-muted/30">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">Sugestão {index + 1}</h3>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                      <p className="text-sm text-muted-foreground mt-4">
                        Você pode usar estas sugestões para buscar imagens em bancos como Freepik, 
                        Shutterstock ou gerar com outras ferramentas de IA.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <Image className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma sugestão gerada</h3>
                      <p className="text-muted-foreground mb-4">
                        Clique no botão "Gerar Sugestões de Imagens" para receber ideias
                        de imagens que podem ilustrar o seu e-book.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleGenerateImageSuggestions}
                        disabled={!form.getValues('title') || !form.getValues('description')}
                      >
                        <Image className="mr-2 h-4 w-4" />
                        Gerar Sugestões
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle>Salvar E-Book</CardTitle>
                <CardDescription>
                  Salve o e-book gerado para editá-lo posteriormente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Conteúdo gerado</span>
                  </div>
                  
                  <div className="flex items-center">
                    {imageSuggestions.length > 0 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Sugestões de imagens geradas</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-amber-500 mr-2" />
                        <span className="text-muted-foreground">Sugestões de imagens (opcional)</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/admin/ebooks')}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEBook}
                  disabled={saveEBookMutation.isPending}
                >
                  {saveEBookMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar E-Book
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateEBookPage;