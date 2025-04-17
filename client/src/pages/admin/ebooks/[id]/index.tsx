import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  ArrowLeft,
  FileEdit,
  Calendar,
  BookOpenText,
  GraduationCap,
  Tag,
  Lightbulb,
} from 'lucide-react';

// Tipos
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

const ViewEBookPage: React.FC = () => {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = params.id ? parseInt(params.id) : undefined;

  // Buscar dados do e-book
  const {
    data: ebook,
    isLoading,
    isError,
    error,
  } = useQuery<EBook>({
    queryKey: [`/api/ebooks/${id}`],
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (isLoading) {
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
          <Skeleton className="h-9 w-[300px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
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
          <h1 className="text-3xl font-bold">E-Book não encontrado</h1>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar e-book</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Não foi possível encontrar o e-book solicitado.'}
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
            onClick={() => navigate('/admin/ebooks')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold truncate max-w-md">{ebook.title}</h1>
        </div>
        
        <Button asChild>
          <Link href={`/admin/ebooks/${ebook.id}/edit`}>
            <FileEdit className="mr-2 h-4 w-4" />
            Editar E-Book
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="mb-2">{ebook.title}</CardTitle>
                  <CardDescription>{ebook.description}</CardDescription>
                </div>
                <Badge variant={ebook.status === 'published' ? 'default' : 'secondary'}>
                  {ebook.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: ebook.content.replace(/\n/g, '<br/>') }} />
              </div>
              
              {ebook.images && ebook.images.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Imagens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ebook.images.map((image) => (
                      <div key={image.id} className="border rounded-lg overflow-hidden">
                        <img 
                          src={image.url} 
                          alt={image.caption}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-2 bg-muted/50">
                          <p className="text-sm text-muted-foreground">{image.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <GraduationCap className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Disciplina</p>
                    <p className="text-sm text-muted-foreground">
                      {ebook.discipline?.name || 'N/A'} 
                      {ebook.discipline?.code && (
                        <span className="ml-1 text-xs">({ebook.discipline.code})</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de criação</p>
                    <p className="text-sm text-muted-foreground">{formatDate(ebook.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Última atualização</p>
                    <p className="text-sm text-muted-foreground">{formatDate(ebook.updatedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div>
                      <Badge variant={ebook.status === 'published' ? 'default' : 'secondary'}>
                        {ebook.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Origem</p>
                    <p className="text-sm text-muted-foreground">
                      {ebook.isGenerated ? 'Gerado por IA' : 'Criado manualmente'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/ebooks/${ebook.id}/edit`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Editar E-Book
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/ebooks/${ebook.id}/images`}>
                    <BookOpenText className="mr-2 h-4 w-4" />
                    Gerenciar Imagens
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewEBookPage;