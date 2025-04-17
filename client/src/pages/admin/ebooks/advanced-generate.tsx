import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// UI Components
import { Button } from '@/components/ui/button';
import {
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

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
  Pencil,
  Upload,
  FileText,
  Link as LinkIcon,
  UploadCloud,
  Trash,
  FileAnalytics,
  ListTree,
  MessageSquarePlus,
  FileUp
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
  description: string;
  imagePrompts?: string[];
  tableOfContents?: { title: string, level: number }[];
}

// Tipo de análise do conteúdo importado
interface ContentAnalysis {
  summary: string;
  keyPoints: string[];
  recommendedSections: string[];
}

// Tipos de materiais de referência
type ReferenceType = 'text' | 'link' | 'file';

interface Reference {
  id: string;
  type: ReferenceType;
  content: string;
  name?: string;
  selected: boolean;
}

const AdvancedGenerateEBookPage: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [generatedContent, setGeneratedContent] = useState<GeneratedEBook | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("content");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [referencesTab, setReferencesTab] = useState<string>("text");
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [showContentAnalysis, setShowContentAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Gerar conteúdo avançado do e-book usando o novo serviço
  const generateContentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Filtrar apenas os materiais selecionados
      const selectedReferences = references
        .filter(ref => ref.selected)
        .map(ref => ref.content);

      const response = await fetch('/api/advanced-ebooks/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: values.title,
          disciplineId: parseInt(values.disciplineId),
          additionalContext: values.description,
          referenceMaterials: selectedReferences.length > 0 ? selectedReferences : undefined
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

  // Analisar conteúdo importado
  const analyzeContentMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsAnalyzingContent(true);
      const response = await fetch('/api/advanced-ebooks/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao analisar conteúdo');
      }
      
      return await response.json();
    },
    onSuccess: (data: ContentAnalysis) => {
      setContentAnalysis(data);
      setShowContentAnalysis(true);
      setIsAnalyzingContent(false);
      toast({
        title: 'Análise concluída',
        description: 'O conteúdo foi analisado com sucesso!',
        variant: 'default',
      });
    },
    onError: (error) => {
      setIsAnalyzingContent(false);
      toast({
        title: 'Erro ao analisar conteúdo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Gerar sugestões de imagens com o serviço avançado
  const generateImageSuggestionsMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      setIsGeneratingImages(true);
      const response = await fetch('/api/advanced-ebooks/generate-image-suggestions', {
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

  // Salvar e-book usando o endpoint avançado
  const saveEBookMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      description: string; 
      content: string;
      disciplineId: number;
      tableOfContents?: { title: string, level: number }[];
    }) => {
      const response = await fetch('/api/advanced-ebooks', {
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

  // Adicionar uma referência de texto
  const addTextReference = (text: string) => {
    if (!text.trim()) return;
    
    const newReference: Reference = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: text,
      selected: true,
    };
    
    setReferences(prev => [...prev, newReference]);
    setReferencesTab("list");
  };

  // Adicionar uma referência de link
  const addLinkReference = (url: string) => {
    if (!url.trim()) return;
    
    const newReference: Reference = {
      id: `link-${Date.now()}`,
      type: 'link',
      content: url,
      name: new URL(url).hostname,
      selected: true,
    };
    
    setReferences(prev => [...prev, newReference]);
    setReferencesTab("list");
  };

  // Processar o upload de arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { // limite de 5MB
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const text = await file.text();
      const newReference: Reference = {
        id: `file-${Date.now()}`,
        type: 'file',
        content: text.substring(0, 25000), // limitar a 25000 caracteres para evitar problemas
        name: file.name,
        selected: true,
      };
      
      setReferences(prev => [...prev, newReference]);
      setReferencesTab("list");
      
      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o conteúdo do arquivo.",
        variant: "destructive"
      });
    }
  };

  // Alternar a seleção de uma referência
  const toggleReferenceSelection = (id: string) => {
    setReferences(prev => 
      prev.map(ref => 
        ref.id === id ? { ...ref, selected: !ref.selected } : ref
      )
    );
  };

  // Remover uma referência
  const removeReference = (id: string) => {
    setReferences(prev => prev.filter(ref => ref.id !== id));
  };

  // Analisar conteúdo de uma referência
  const analyzeReference = (reference: Reference) => {
    if (reference.content) {
      analyzeContentMutation.mutate(reference.content);
    }
  };

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
      tableOfContents: generatedContent.tableOfContents
    });
  };

  // Estados dos componentes de referência
  const [textReferenceValue, setTextReferenceValue] = useState("");
  const [linkReferenceValue, setLinkReferenceValue] = useState("");
  
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
          <h1 className="text-3xl font-bold">Gerador Avançado de E-Books</h1>
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
          <h1 className="text-3xl font-bold">Gerador Avançado de E-Books</h1>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/admin/ebooks')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Gerador Avançado de E-Books</h1>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
          Powered by IA Avançada
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do E-Book</CardTitle>
              <CardDescription>
                Forneça os detalhes básicos para gerar o conteúdo do e-book com IA avançada.
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
                            className="min-h-[100px]"
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

          {/* Seção de Materiais de Referência */}
          <Card>
            <CardHeader>
              <CardTitle>Materiais de Referência</CardTitle>
              <CardDescription>
                Adicione textos, arquivos ou links para melhorar a contextualização do conteúdo gerado pela IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={referencesTab} onValueChange={setReferencesTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="text">Texto</TabsTrigger>
                  <TabsTrigger value="link">Link</TabsTrigger>
                  <TabsTrigger value="file">Arquivo</TabsTrigger>
                  <TabsTrigger value="list">Lista ({references.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="pt-4">
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Cole ou digite um texto de referência aqui..."
                      className="min-h-[150px]"
                      value={textReferenceValue}
                      onChange={(e) => setTextReferenceValue(e.target.value)}
                    />
                    <Button 
                      onClick={() => {
                        addTextReference(textReferenceValue);
                        setTextReferenceValue("");
                      }}
                      disabled={!textReferenceValue.trim()}
                      className="w-full"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Adicionar Texto de Referência
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="link" className="pt-4">
                  <div className="space-y-4">
                    <Input 
                      type="url" 
                      placeholder="https://exemplo.com/artigo"
                      value={linkReferenceValue}
                      onChange={(e) => setLinkReferenceValue(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Adicione URLs de artigos, sites ou páginas relacionadas ao tópico do e-book.
                      O sistema capturará o conteúdo relevante.
                    </p>
                    <Button 
                      onClick={() => {
                        addLinkReference(linkReferenceValue);
                        setLinkReferenceValue("");
                      }}
                      disabled={!linkReferenceValue.trim() || !linkReferenceValue.startsWith('http')}
                      className="w-full"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Adicionar Link de Referência
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="file" className="pt-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors">
                      <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Arrastar ou Selecionar Arquivo</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Arquivos em formato .txt, .md ou .pdf (max 5MB)
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        accept=".txt,.md,.pdf,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="mx-auto"
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Selecionar Arquivo
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="list" className="py-4">
                  {references.length > 0 ? (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3">
                        {references.map((ref) => (
                          <div 
                            key={ref.id} 
                            className={`border rounded-md p-3 ${ref.selected ? 'border-primary/50 bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <Checkbox
                                  checked={ref.selected}
                                  onCheckedChange={() => toggleReferenceSelection(ref.id)}
                                  className="mr-2"
                                />
                                <div>
                                  {ref.type === 'text' && <FileText className="h-4 w-4 text-blue-500" />}
                                  {ref.type === 'link' && <LinkIcon className="h-4 w-4 text-green-500" />}
                                  {ref.type === 'file' && <FileText className="h-4 w-4 text-orange-500" />}
                                </div>
                                <span className="ml-2 font-medium truncate max-w-[180px]">
                                  {ref.name || (ref.type === 'text' ? 'Texto' : ref.content.substring(0, 30))}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => analyzeReference(ref)}
                                  className="h-7 w-7"
                                >
                                  <FileAnalytics className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeReference(ref.id)}
                                  className="h-7 w-7 text-destructive"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {ref.type === 'text' && (
                              <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
                                {ref.content.substring(0, 150)}...
                              </p>
                            )}
                            {ref.type === 'link' && (
                              <p className="text-xs text-blue-500 underline ml-7">
                                {ref.content}
                              </p>
                            )}
                            {ref.type === 'file' && (
                              <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
                                Arquivo: {ref.name} ({(ref.content.length / 1024).toFixed(1)}KB)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma referência adicionada</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione textos, links ou arquivos para melhorar a qualidade
                        do conteúdo gerado pela IA.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Conteúdo Gerado</TabsTrigger>
              <TabsTrigger value="images">Sugestões de Imagens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Conteúdo Gerado</CardTitle>
                      <CardDescription>
                        {generatedContent 
                          ? "Conteúdo gerado com base nas informações fornecidas."
                          : "O conteúdo gerado pela IA aparecerá aqui."}
                      </CardDescription>
                    </div>
                    {generatedContent && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSaveEBook}
                        disabled={saveEBookMutation.isPending}
                      >
                        {saveEBookMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="flex items-center">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar E-book
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
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
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{selectedDiscipline?.name}</Badge>
                        {references.filter(r => r.selected).length > 0 && (
                          <Badge variant="outline">
                            {references.filter(r => r.selected).length} referências
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold">{generatedContent.title}</h2>
                      
                      {generatedContent.tableOfContents && generatedContent.tableOfContents.length > 0 && (
                        <Accordion type="single" collapsible className="mb-4">
                          <AccordionItem value="toc">
                            <AccordionTrigger className="py-2">
                              <span className="flex items-center">
                                <ListTree className="mr-2 h-4 w-4" />
                                Sumário
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pl-4 py-2 space-y-1">
                                {generatedContent.tableOfContents.map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    className="text-sm"
                                    style={{ 
                                      paddingLeft: `${(item.level - 1) * 1.5}rem`,
                                      fontWeight: item.level === 1 ? 600 : 400,
                                    }}
                                  >
                                    {item.title}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      <div className="border rounded-md p-4 bg-muted/30">
                        <div className="prose dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ 
                            __html: generatedContent.content
                              .replace(/\n/g, '<br/>')
                              .replace(/# (.*?)$/gm, '<h1>$1</h1>')
                              .replace(/## (.*?)$/gm, '<h2>$1</h2>')
                              .replace(/### (.*?)$/gm, '<h3>$1</h3>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\[Imagem (\d+)\]/g, '<div class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-950/20"><span class="text-blue-600 dark:text-blue-400 font-medium">Imagem $1</span></div>')
                          }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <BookOpenText className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo gerado</h3>
                      <p className="text-muted-foreground mb-4">
                        Preencha os campos ao lado e clique em "Gerar Conteúdo" para criar
                        automaticamente o conteúdo deste e-book usando IA avançada.
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">Dicas para melhores resultados:</p>
                        <ul className="list-disc text-left pl-5 space-y-1">
                          <li>Seja específico no título e na descrição</li>
                          <li>Adicione materiais de referência para contextualização</li>
                          <li>Selecione a disciplina mais adequada ao tema</li>
                        </ul>
                      </div>
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
        </div>
      </div>

      {/* Diálogo de análise de conteúdo */}
      <Dialog open={showContentAnalysis} onOpenChange={setShowContentAnalysis}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileAnalytics className="h-5 w-5 mr-2" /> 
              Análise de Conteúdo
            </DialogTitle>
            <DialogDescription>
              Análise do material de referência feita pela IA.
            </DialogDescription>
          </DialogHeader>

          {isAnalyzingContent ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Analisando conteúdo...
              </p>
            </div>
          ) : contentAnalysis ? (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-medium mb-2">Resumo</h4>
                <p className="text-sm text-muted-foreground">{contentAnalysis.summary}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Pontos-chave</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {contentAnalysis.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm">{point}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Seções Recomendadas</h4>
                <div className="space-y-2">
                  {contentAnalysis.recommendedSections.map((section, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">Sem dados de análise disponíveis.</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContentAnalysis(false)}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                form.setValue('description', form.getValues('description') + "\n\n" + contentAnalysis?.summary);
                setShowContentAnalysis(false);
                toast({
                  title: "Descrição atualizada",
                  description: "O resumo da análise foi adicionado à descrição.",
                  variant: "default",
                });
              }}
              disabled={!contentAnalysis}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Adicionar à Descrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedGenerateEBookPage;