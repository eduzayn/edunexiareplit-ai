import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Icons
import { 
  Plus, 
  MoreVertical, 
  FileEdit, 
  Trash2, 
  Eye, 
  Upload,
  BookOpenText
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
  };
}

const EBooksPage: React.FC = () => {
  const { toast } = useToast();
  const [deletingEBookId, setDeletingEBookId] = useState<number | null>(null);

  // Buscar todos os e-books
  const { 
    data: ebooks, 
    isLoading,
    isError,
    refetch
  } = useQuery<EBook[]>({
    queryKey: ['/api/ebooks'],
    refetchOnWindowFocus: false,
  });

  // Excluir e-book
  const deleteEBookMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/ebooks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir e-book');
      }
    },
    onSuccess: () => {
      toast({
        title: 'E-book excluído',
        description: 'O e-book foi excluído com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
      setDeletingEBookId(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir e-book',
        description: error.message,
        variant: 'destructive',
      });
      setDeletingEBookId(null);
    },
  });

  // Publicar e-book
  const publishEBookMutation = useMutation({
    mutationFn: async (id: number) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/ebooks'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao publicar e-book',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteEBook = (id: number) => {
    setDeletingEBookId(id);
  };

  const confirmDeleteEBook = () => {
    if (deletingEBookId) {
      deleteEBookMutation.mutate(deletingEBookId);
    }
  };

  const handlePublishEBook = (id: number) => {
    publishEBookMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Renderização de estado de carregamento
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">E-Books Interativos</h1>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-5 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderização de estado de erro
  if (isError) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar e-books</CardTitle>
            <CardDescription>Ocorreu um erro ao tentar carregar a lista de e-books.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">E-Books Interativos</h1>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/admin/ebooks/generate">
              <BookOpenText className="mr-2 h-4 w-4" />
              Gerar com IA
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/ebooks/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo E-Book
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Todos os E-Books</CardTitle>
          <CardDescription>
            Gerencie todos os e-books interativos disponíveis na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ebooks && ebooks.length > 0 ? (
            <Table>
              <TableCaption>Lista de e-books interativos</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ebooks.map((ebook) => (
                  <TableRow key={ebook.id}>
                    <TableCell className="font-medium">{ebook.title}</TableCell>
                    <TableCell>{ebook.discipline?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={ebook.status === 'published' ? 'default' : 'secondary'}
                      >
                        {ebook.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(ebook.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/ebooks/${ebook.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/ebooks/${ebook.id}/edit`}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          {ebook.status !== 'published' && (
                            <DropdownMenuItem onClick={() => handlePublishEBook(ebook.id)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Publicar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteEBook(ebook.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <BookOpenText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">Nenhum e-book encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhum e-book interativo.
              </p>
              <Button asChild>
                <Link href="/admin/ebooks/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar E-Book
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deletingEBookId !== null} onOpenChange={() => setDeletingEBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o e-book e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EBooksPage;