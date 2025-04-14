import React from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "@/components/ui/icons";

// Schema para validação do formulário de signatários
const signerFormSchema = z.object({
  name: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  title: z.string().min(2, {
    message: "Título deve ter pelo menos 2 caracteres.",
  }),
  position: z.string().min(2, {
    message: "Cargo deve ter pelo menos 2 caracteres.",
  }),
  institution: z.string().min(2, {
    message: "Instituição deve ter pelo menos 2 caracteres.",
  }),
  signatureUrl: z.string().optional(),
});

type SignerFormValues = z.infer<typeof signerFormSchema>;

// Componente para o formulário de novo signatário
function SignerForm({ 
  defaultValues = {
    name: "",
    title: "",
    position: "",
    institution: "",
    signatureUrl: ""
  },
  onSubmit,
  isEditing = false
}: { 
  defaultValues?: Partial<SignerFormValues>;
  onSubmit: (data: SignerFormValues) => void;
  isEditing?: boolean;
}) {
  const form = useForm<SignerFormValues>({
    resolver: zodResolver(signerFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Prof. Dr. João da Silva" {...field} />
              </FormControl>
              <FormDescription>
                Nome completo do signatário como aparecerá no certificado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Acadêmico</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Doutor em Educação" {...field} />
              </FormControl>
              <FormDescription>
                Título acadêmico que aparecerá abaixo do nome.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Reitor" {...field} />
              </FormControl>
              <FormDescription>
                Cargo ou função exercida pelo signatário.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instituição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Faculdade EdunexIA" {...field} />
              </FormControl>
              <FormDescription>
                Nome da instituição representada pelo signatário.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="signatureUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assinatura Digital</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => {
                  // Aqui seria implementado o upload da imagem para o servidor
                  // e então atualizaria o campo com a URL retornada
                  field.onChange(e.target.value);
                }} />
              </FormControl>
              <FormDescription>
                Upload de uma imagem PNG transparente com a assinatura do signatário.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit">
            {isEditing ? "Atualizar Signatário" : "Adicionar Signatário"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Página principal de gerenciamento de signatários
export default function CertificationSignersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openNewSignerDialog, setOpenNewSignerDialog] = React.useState(false);
  const [editingSigner, setEditingSigner] = React.useState<any>(null);
  
  // Fetch de signatários
  const { data: signers = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/certificate-signers'],
    throwOnError: false
  });
  
  // Mutation para criar signatário
  const createSignerMutation = useMutation({
    mutationFn: async (newSigner: SignerFormValues) => {
      const response = await apiRequest('/api/admin/certificate-signers', { method: 'POST', data: newSigner });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/certificate-signers'] });
      setOpenNewSignerDialog(false);
      toast({
        title: "Signatário adicionado",
        description: "O signatário foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar signatário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar o signatário",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar signatário
  const updateSignerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SignerFormValues }) => {
      const response = await apiRequest(`/api/admin/certificate-signers/${id}`, { method: 'PUT', data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/certificate-signers'] });
      setEditingSigner(null);
      toast({
        title: "Signatário atualizado",
        description: "O signatário foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar signatário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o signatário",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir signatário
  const deleteSignerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/certificate-signers/${id}`, { method: 'DELETE' });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/certificate-signers'] });
      toast({
        title: "Signatário removido",
        description: "O signatário foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover signatário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao remover o signatário",
        variant: "destructive",
      });
    }
  });
  
  // Função para lidar com a criação de um novo signatário
  const handleCreateSigner = (data: SignerFormValues) => {
    createSignerMutation.mutate(data);
  };
  
  // Função para lidar com a atualização de um signatário
  const handleUpdateSigner = (data: SignerFormValues) => {
    if (editingSigner) {
      updateSignerMutation.mutate({ id: editingSigner.id, data });
    }
  };
  
  // Função para abrir o diálogo de edição
  const handleEditSigner = (signer: any) => {
    setEditingSigner(signer);
  };
  
  // Função para excluir um signatário
  const handleDeleteSigner = (id: number) => {
    if (confirm("Tem certeza que deseja remover este signatário? Esta ação não pode ser desfeita.")) {
      deleteSignerMutation.mutate(id);
    }
  };
  
  // Renderização condicional para loading e erro
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <p>Carregando signatários...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar signatários</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Ocorreu um erro ao carregar os signatários."}
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Signatários de Certificados</h1>
            <p className="text-muted-foreground">
              Gerencie os signatários que podem assinar certificados emitidos pela instituição.
            </p>
          </div>
          <Dialog open={openNewSignerDialog} onOpenChange={setOpenNewSignerDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Novo Signatário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Signatário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do signatário que poderá assinar certificados.
                </DialogDescription>
              </DialogHeader>
              <SignerForm onSubmit={handleCreateSigner} />
            </DialogContent>
          </Dialog>
        </div>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Dica</AlertTitle>
          <AlertDescription>
            Signatários são pessoas autorizadas a assinar certificados, como reitores, coordenadores ou diretores.
            A assinatura digital aparecerá nos certificados emitidos.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Signatários Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os signatários disponíveis para assinatura de certificados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nenhum signatário cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  signers.map((signer: any) => (
                    <TableRow key={signer.id}>
                      <TableCell>{signer.name}</TableCell>
                      <TableCell>{signer.title}</TableCell>
                      <TableCell>{signer.position}</TableCell>
                      <TableCell>{signer.institution}</TableCell>
                      <TableCell className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditSigner(signer)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive" 
                          onClick={() => handleDeleteSigner(signer.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Diálogo de edição */}
      {editingSigner && (
        <Dialog open={!!editingSigner} onOpenChange={(open) => !open && setEditingSigner(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Signatário</DialogTitle>
              <DialogDescription>
                Atualize os dados do signatário.
              </DialogDescription>
            </DialogHeader>
            <SignerForm 
              defaultValues={editingSigner} 
              onSubmit={handleUpdateSigner} 
              isEditing 
            />
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}