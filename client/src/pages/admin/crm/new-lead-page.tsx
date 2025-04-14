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
import { ArrowLeftIcon, SaveIcon, UserPlusIcon } from "@/components/ui/icons";

// Schema de validação para criação de lead
const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }).optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  source: z.string().min(1, { message: "Selecione a origem do lead" }),
  interest: z.string().min(1, { message: "Selecione o interesse principal" }),
  status: z.string().min(1, { message: "Selecione o status do lead" }),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewLeadPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "",
      interest: "",
      status: "novo",
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
        url: "/api/crm/leads",
        method: "POST",
        data,
      });
      
      // Invalidar cache para forçar recarregamento dos leads
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      */

      toast({
        title: "Lead cadastrado com sucesso",
        description: `Lead ${data.name} foi cadastrado com sucesso.`,
      });

      // Redirecionar para a lista de leads
      navigate("/admin/crm/leads");
    } catch (error) {
      console.error("Erro ao cadastrar lead:", error);
      toast({
        title: "Erro ao cadastrar lead",
        description: "Ocorreu um erro ao cadastrar o lead. Tente novamente.",
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
              onClick={() => navigate("/admin/crm/leads")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Lead</h1>
              <p className="text-gray-500">
                Cadastre um novo lead no sistema
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlusIcon className="mr-2 h-5 w-5" />
              Informações do Lead
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
                          <Input placeholder="Nome do lead" {...field} />
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa/Instituição</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a origem do lead" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="indicacao">Indicação</SelectItem>
                            <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                            <SelectItem value="email_marketing">Email Marketing</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="parceiro">Parceiro</SelectItem>
                            <SelectItem value="anuncio">Anúncio</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interesse Principal*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o interesse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="graduacao">Graduação</SelectItem>
                            <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                            <SelectItem value="mba">MBA</SelectItem>
                            <SelectItem value="cursos_livres">Cursos Livres</SelectItem>
                            <SelectItem value="certificacao">Certificação</SelectItem>
                            <SelectItem value="parceria_institucional">Parceria Institucional</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="contatado">Contatado</SelectItem>
                            <SelectItem value="qualificado">Qualificado</SelectItem>
                            <SelectItem value="negociacao">Em Negociação</SelectItem>
                            <SelectItem value="convertido">Convertido</SelectItem>
                            <SelectItem value="perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
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
                          placeholder="Informações adicionais sobre o lead"
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
                    onClick={() => navigate("/admin/crm/leads")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Salvar Lead
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