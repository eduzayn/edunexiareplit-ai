import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useLocation, useParams, Link } from 'wouter';

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  ArrowLeft,
  Save,
  BookOpenText,
  Loader2,
  Image
} from 'lucide-react';

// Schema de validação
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'O título deve ter pelo menos 3 caracteres',
  }),
  description: z.string().min(10, {
    message: 'A descrição deve ter pelo menos 10 caracteres',
  }),
  content: z.string().min(50, {
    message: 'O conteúdo deve ter pelo menos 50 caracteres',
  }),
  disciplineId: z.string({
    required_error: 'Selecione uma disciplina',
  }).refine(val => !isNaN(parseInt(val)), {
    message: 'Selecione uma disciplina válida',
  }),
  thumbnailUrl: z.string().url({
    message: 'A URL da imagem deve ser válida',
  }).optional().or(z.literal('')),
});

// Tipos
interface Discipline {
  id: number;
  name: string;
  code: string;
}

interface EBook {
  id: number;
  title: string;
  description: string;
  content: string;
  status: 'draft' | 'published';
  disciplineId: number;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  isGenerated: boolean;
  thumbnailUrl: string | null;
  discipline?: {
    name: string;
    code: string;
  };
  images?: {
    id: number;
    url: string;
    caption: string;
    order: number;
  }[];
}

const EditEBookPage: React.FC = () => {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = params.id ? parseInt(params.id) : undefined;

  // Formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      disciplineId: '',
      thumbnailUrl: '',
    },
  });

  // Buscar disciplinas
  const {
    data: disciplines,
    isLoading: isDisciplinesLoading,
    isError: isDisciplinesError,
  } = useQuery<Discipline[]>({
    queryKey: ['/api/admin/disciplines'],
    refetchOnWindowFocus: false,
  });

  // Buscar dados do e-book
  const {
    data: ebook,
    isLoading: isEBookLoading,
    isError: isEBookError,
    error: ebookError,
  } = useQuery<EBook>({
    queryKey: [`/api/ebooks/${id}`],
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  // Atualizar formulário quando os dados do e-book estiverem disponíveis
  useEffect(() => {
    if (ebook) {
      form.reset({
        title: ebook.title,
        description: ebook.description,
        content: ebook.content,
        disciplineId: ebook.disciplineId.toString(),
        thumbnailUrl: ebook.thumbnailUrl || '',
      });
    }
  }, [ebook, form]);

  // Atualizar e-book
  const updateEBookMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch(`/api/ebooks/${id}`, {
        method: 'PATCH',
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
        throw new Error(error.error || 'Erro ao atualizar e-book');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-book atualizado',
        description: 'O e-book foi atualizado com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/ebooks/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
      navigate(`/admin/ebooks/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar e-book',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Publicar e-book
  const publishEBookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ebooks/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao publicar e-book');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-book publicado',
        description: 'O e-book foi publicado com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/ebooks/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
      navigate(`/admin/ebooks/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao publicar e-book',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Enviar formulário
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateEBookMutation.mutate(values);
  };

  // Publicar e-book
  const handlePublish = () => {
    publishEBookMutation.mutate();
  };

  const isLoading = isDisciplinesLoading || isEBookLoading;
  const isError = isDisciplinesError || isEBookError;

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate(`/admin/ebooks/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-9 w-[300px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
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

  if (isError || !ebook) {
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
          <h1 className="text-3xl font-bold">Erro ao carregar</h1>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            <CardDescription>
              {ebookError instanceof Error 
                ? ebookError.message 
                : 'Não foi possível carregar os dados necessários para edição.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate('/admin/ebooks')}>
              Voltar para a lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="mr-2"
            onClick={() => navigate(`/admin/ebooks/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Editar E-Book</h1>
        </div>
        
        <div className="flex gap-3">
          {ebook.status !== 'published' && (
            <Button 
              variant="outline"
              onClick={handlePublish}
              disabled={publishEBookMutation.isPending}
            >
              {publishEBookMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpenText className="mr-2 h-4 w-4" />
              )}
              Publicar
            </Button>
          )}
          <Badge variant={ebook.status === 'published' ? 'default' : 'secondary'}>
            {ebook.status === 'published' ? 'Publicado' : 'Rascunho'}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Informações Gerais</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>
                    Edite as informações básicas do e-book.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          O título principal do e-book.
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
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Uma descrição curta sobre o e-book.
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
                          value={field.value}
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
                          A disciplina à qual este e-book pertence.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da Imagem de Capa</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://exemplo.com/imagem.jpg"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Uma URL para a imagem de capa do e-book (opcional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Previsualização da imagem se houver */}
                  {form.watch('thumbnailUrl') && (
                    <div className="mt-4">
                      <FormLabel>Previsualização da Capa</FormLabel>
                      <div className="border rounded-md mt-2 overflow-hidden max-w-xs">
                        <img
                          src={form.watch('thumbnailUrl')}
                          alt="Previsualização da capa"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/400x300?text=Imagem+Inválida';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/admin/ebooks/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateEBookMutation.isPending}
                  >
                    {updateEBookMutation.isPending ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo</CardTitle>
                  <CardDescription>
                    Edite o conteúdo principal do e-book.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            className="min-h-[600px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          O conteúdo completo do e-book.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/admin/ebooks/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateEBookMutation.isPending}
                  >
                    {updateEBookMutation.isPending ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle>Imagens</CardTitle>
                  <CardDescription>
                    Gerencie as imagens associadas ao e-book.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <Image className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold mb-1">Gerenciamento de Imagens</h3>
                    <p className="text-muted-foreground mb-4">
                      Utilize a página de gerenciamento de imagens para adicionar, editar e remover imagens do e-book.
                    </p>
                    <Button asChild>
                      <Link href={`/admin/ebooks/${id}/images`}>
                        Gerenciar Imagens
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default EditEBookPage;