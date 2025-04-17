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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, BuildingStoreIcon, SaveIcon } from "@/components/ui/icons";
import { useClients } from "@/hooks/use-crm";

// Schema de validação para criação de cliente
// Schema simplificado com apenas os campos obrigatórios para o Asaas
const formSchema = z.object({
  // Informações básicas (obrigatórias para o Asaas)
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  type: z.enum(["pf", "pj"], { 
    required_error: "Selecione o tipo de cliente" 
  }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }),
  
  // Documentos (CPF/CNPJ é obrigatório para o Asaas)
  document: z.string().min(11, { message: "CPF/CNPJ inválido" }).refine(val => val.length > 0, {
    message: "CPF/CNPJ é obrigatório para integração com sistema financeiro"
  }),
  
  // Campos opcionais
  // Estes campos podem ser preenchidos posteriormente pelo aluno no portal
  rgIe: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")).transform(val => val || undefined),
  observation: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewClientPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { createClient, isPendingCreate } = useClients();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "pf", // Alterado para "pf" (pessoa física) como padrão
      email: "",
      phone: "",
      document: "",
      rgIe: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      birthDate: "",
      observation: "",
    },
  });

  const clientType = form.watch("type");

  const onSubmit = async (data: FormValues) => {
    try {
      console.log("Enviando dados do formulário:", data);
      
      // Adaptar os dados do formulário para o formato esperado pela API
      const clientData = {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        document: data.document,
        rgIe: data.rgIe || "",
        // Campos de endereço separados (conforme esperado pela API)
        street: data.street,
        number: data.number,
        complement: data.complement || "",
        neighborhood: data.neighborhood,
        zipCode: data.zipCode,
        city: data.city,
        state: data.state,
        birthDate: data.birthDate,
        observation: data.observation || ""
      };

      // Enviar dados para a API
      await createClient(clientData);
      
      // Redirecionar para a lista de clientes após sucesso
      navigate("/admin/crm/clients");
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      toast({
        title: "Erro ao cadastrar cliente",
        description: "Ocorreu um erro ao cadastrar o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para buscar o endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    if (cep.length < 8) return;
    
    try {
      const cleanCep = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        form.setValue('street', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
        // Focar no campo número após preencher o endereço
        document.getElementById('number')?.focus();
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
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
              onClick={() => navigate("/admin/crm/clients")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
              <p className="text-gray-500">
                Cadastre um novo cliente no sistema
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BuildingStoreIcon className="mr-2 h-5 w-5" />
              Cadastro de Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="address">Endereço</TabsTrigger>
                    <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
                  </TabsList>

                  {/* Tab: Informações Básicas */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Cliente*</FormLabel>
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
                                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                                <SelectItem value="pf">Pessoa Física</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {clientType === "pj" 
                                ? "Nome da Empresa/Instituição*" 
                                : "Nome Completo*"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={
                                  clientType === "pj" 
                                    ? "Nome da empresa ou instituição" 
                                    : "Nome completo"
                                } 
                                {...field} 
                              />
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


                    </div>
                  </TabsContent>

                  {/* Tab: Documentos */}
                  <TabsContent value="documents" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {clientType === "pj" ? "CNPJ*" : "CPF*"}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={
                                  clientType === "pj" 
                                    ? "00.000.000/0000-00" 
                                    : "000.000.000-00"
                                } 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rgIe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {clientType === "pj" ? "Inscrição Estadual" : "RG"}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Documento de identificação" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Tab: Endereço */}
                  <TabsContent value="address" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00000-000 (opcional)" 
                                {...field} 
                                onBlur={(e) => {
                                  field.onBlur();
                                  fetchAddressByCep(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Os dados de endereço poderão ser atualizados pelo aluno após o cadastro inicial
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="md:col-span-6">
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc. (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Número*</FormLabel>
                            <FormControl>
                              <Input id="number" placeholder="Número" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem className="md:col-span-4">
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartamento, sala, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem className="md:col-span-4">
                            <FormLabel>Bairro*</FormLabel>
                            <FormControl>
                              <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Cidade*</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>UF*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="UF" 
                                maxLength={2} 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e.target.value.toUpperCase());
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Tab: Informações Adicionais */}
                  <TabsContent value="additional" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                placeholder="DD/MM/AAAA" 
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre o cliente"
                              className="min-h-[120px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin/crm/clients")}
                    disabled={isPendingCreate}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPendingCreate}>
                    {isPendingCreate ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <SaveIcon className="mr-2 h-4 w-4" />
                        Salvar Cliente
                      </span>
                    )}
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