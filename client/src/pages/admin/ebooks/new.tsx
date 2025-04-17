import React from 'react';
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

// Icons
import {
  ArrowLeft,
  Save,
  BookOpenText,
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

// Tipo da disciplina
interface Discipline {
  id: number;
  name: string;
  code: string;
}

const NewEBookPage: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
      content: '',
      disciplineId: '',
      thumbnailUrl: '',
    },
  });

  // Criar e-book
  const createEBookMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/ebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          disciplineId: parseInt(values.disciplineId),
          isGenerated: false,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar e-book');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'E-book criado',
        description: 'O e-book foi criado com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
      navigate('/admin/ebooks');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar e-book',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Enviar formulário
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createEBookMutation.mutate(values);
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
          <h1 className="text-3xl font-bold">Novo E-Book Interativo</h1>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold">Novo E-Book Interativo</h1>
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
        <h1 className="text-3xl font-bold">Novo E-Book Interativo</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo E-Book</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para criar um novo e-book interativo.
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
                      <Input placeholder="Introdução ao curso de música" {...field} />
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
                        placeholder="Uma breve descrição sobre o conteúdo deste e-book..."
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
                      />
                    </FormControl>
                    <FormDescription>
                      Uma URL para a imagem de capa do e-book (opcional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="O conteúdo detalhado do e-book..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O conteúdo completo do e-book em formato de texto.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/ebooks')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEBookMutation.isPending}
                >
                  {createEBookMutation.isPending ? (
                    <span className="flex items-center">
                      <BookOpenText className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar E-Book
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewEBookPage;