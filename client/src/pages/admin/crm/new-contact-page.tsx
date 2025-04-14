import React from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, ContactIcon, SaveIcon } from "@/components/ui/icons";

// Schema de validação para criação de contato
const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }),
  position: z.string().min(2, { message: "Cargo é obrigatório" }),
  clientId: z.string().min(1, { message: "Selecione a empresa/cliente" }),
  role: z.string().min(1, { message: "Selecione a função do contato" }),
  department: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewContactPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Dados simulados de clientes - será substituído por dados da API
  const mockClients = [
    { id: "1", name: "Empresa ABC Ltda" },
    { id: "2", name: "Instituto Educacional XYZ" },
    { id: "3", name: "Faculdade Metropolitana" },
    { id: "4", name: "Centro de Ensino Superior" },
    { id: "5", name: "Universidade Federal" },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      position: "",
      clientId: "",
      role: "",
      department: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Quando tivermos a API, enviaremos a requisição para o servidor
      console.log("Enviando dados do formulário:", data);

      /*
      // Exemplo de como será a implementação da API
      await apiRequest({
        url: "/api/crm/contacts",
        method: "POST",
        data,
      });
      
      // Invalidar cache para forçar recarregamento dos contatos
      queryClient.invalidateQueries({ queryKey: ["/api/crm/contacts"] });
      */

      toast({
        title: "Contato cadastrado com sucesso",
        description: `Contato ${data.name} foi cadastrado com sucesso.`,
      });

      // Redirecionar para a lista de contatos
      navigate("/admin/crm/contacts");
    } catch (error) {
      console.error("Erro ao cadastrar contato:", error);
      toast({
        title: "Erro ao cadastrar contato",
        description: "Ocorreu um erro ao cadastrar o contato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4" 
              onClick={() => navigate("/admin/crm/contacts")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Contato</h1>
              <p className="text-gray-500">
                Cadastre um novo contato associado a um cliente
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ContactIcon className="mr-2 h-5 w-5" />
              Informações do Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo*</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do contato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone*</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Diretor Financeiro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa/Cliente*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função no Processo de Compra*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="decision_maker">Decisor</SelectItem>
                            <SelectItem value="influencer">Influenciador</SelectItem>
                            <SelectItem value="technical">Técnico</SelectItem>
                            <SelectItem value="financial">Financeiro</SelectItem>
                            <SelectItem value="admin">Administrativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Financeiro, Recursos Humanos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o contato"
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin/crm/contacts")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Salvar Contato
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}