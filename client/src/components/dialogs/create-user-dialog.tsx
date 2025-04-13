import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Esquema para criação de usuário
const createUserSchema = z.object({
  username: z.string().min(3, { message: "Username deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  fullName: z.string().min(3, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  cpf: z.string().min(11, { message: "CPF inválido" }).optional(),
  portalType: z.string({ required_error: "Tipo de portal é obrigatório" }),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: (user: any) => void;
  defaultPortalType?: string;
}

export function CreateUserDialog({
  isOpen,
  onOpenChange,
  onUserCreated,
  defaultPortalType = "student"
}: CreateUserDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  // Inicializando formulário
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      cpf: "",
      portalType: defaultPortalType,
    },
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserValues) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário foi adicionado ao sistema",
      });
      
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Fechar diálogo e resetar form
      onOpenChange(false);
      form.reset();
      
      // Callback para componente pai
      if (onUserCreated) {
        onUserCreated(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  // Função para enviar formulário
  const onSubmit = (values: CreateUserValues) => {
    setIsCreating(true);
    createUserMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo usuário no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="nome.sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="portalType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Portal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Aluno</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="polo">Polo</SelectItem>
                        <SelectItem value="partner">Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@exemplo.com.br" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="******" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormDescription>
                    O CPF é obrigatório para usuários do tipo Aluno
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
              >
                {isCreating ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}