import React, { useState } from "react";
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
  FormDescription,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeftIcon, CalendarIcon, ContractIcon, EyeIcon, SaveIcon } from "@/components/ui/icons";

// Schema de validação para criação de contrato
const formSchema = z.object({
  // Informações básicas
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  contractNumber: z.string().min(2, { message: "Número do contrato é obrigatório" }),
  clientId: z.string().min(1, { message: "Selecione o cliente" }),
  type: z.string().min(1, { message: "Selecione o tipo de contrato" }),
  templateId: z.string().min(1, { message: "Selecione o modelo de contrato" }),
  status: z.string().min(1, { message: "Selecione o status" }),
  
  // Datas
  startDate: z.date({
    required_error: "Data de início é obrigatória",
  }),
  endDate: z.date({
    required_error: "Data de término é obrigatória",
  }),
  signingDate: z.date().optional(),
  
  // Valores
  value: z.coerce.number().min(0, { message: "Valor deve ser maior ou igual a zero" }),
  
  // Conteúdo
  description: z.string().optional().or(z.literal("")),
  termsAndConditions: z.string().optional().or(z.literal("")),
  additionalInfo: z.string().optional().or(z.literal("")),
  
  // Opções
  autoRenew: z.boolean().default(false),
  requiresSignature: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewContractPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);

  // Dados simulados de clientes - será substituído por dados da API
  const mockClients = [
    { id: "1", name: "Empresa ABC Ltda" },
    { id: "2", name: "Instituto Educacional XYZ" },
    { id: "3", name: "Faculdade Metropolitana" },
    { id: "4", name: "Centro de Ensino Superior" },
    { id: "5", name: "Universidade Federal" },
  ];

  // Dados simulados de modelos de contrato - será substituído por dados da API
  const mockTemplates = [
    { id: "1", name: "Contrato de Prestação de Serviços Educacionais", type: "education" },
    { id: "2", name: "Contrato de Matrícula - Graduação", type: "education" },
    { id: "3", name: "Contrato de Matrícula - Pós-Graduação", type: "education" },
    { id: "4", name: "Contrato de Parceria Institucional", type: "partnership" },
    { id: "5", name: "Contrato de Consultoria", type: "service" },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      contractNumber: generateContractNumber(),
      clientId: "",
      type: "",
      templateId: "",
      status: "draft",
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano após a data atual
      signingDate: undefined,
      value: 0,
      description: "",
      termsAndConditions: "",
      additionalInfo: "",
      autoRenew: false,
      requiresSignature: true,
    },
  });

  // Função para gerar número de contrato automático
  function generateContractNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CONT-${year}-${random}`;
  }

  // Função para preencher campos baseado no modelo selecionado
  const handleTemplateSelect = (templateId: string) => {
    const template = mockTemplates.find(t => t.id === templateId);
    if (template) {
      // Em uma implementação real, buscaríamos o conteúdo completo do modelo na API
      // e preencheríamos os campos adequadamente
      form.setValue("type", template.type);
      
      // Exemplo de conteúdo pré-definido para o modelo
      if (templateId === "1") {
        form.setValue("title", "Contrato de Prestação de Serviços Educacionais");
        form.setValue("termsAndConditions", `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

Por meio deste instrumento particular, de um lado a INSTITUIÇÃO DE ENSINO, e de outro lado, o CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem como objeto a prestação de serviços educacionais pela INSTITUIÇÃO ao CONTRATANTE, referente ao curso escolhido pelo CONTRATANTE, conforme plano de estudos, calendário acadêmico e projeto pedagógico.

CLÁUSULA 2ª - DO PRAZO
O presente contrato vigorará durante o período indicado, podendo ser renovado mediante acordo entre as partes.

CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO
Pelos serviços prestados, o CONTRATANTE pagará à INSTITUIÇÃO o valor total especificado, que poderá ser parcelado conforme acordado entre as partes.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DAS PARTES
A INSTITUIÇÃO se compromete a prestar os serviços educacionais com qualidade, seguindo as diretrizes educacionais estabelecidas.
O CONTRATANTE se compromete a cumprir o regimento interno da instituição, calendário acadêmico e efetuar os pagamentos nas datas estabelecidas.

CLÁUSULA 5ª - DA RESCISÃO
O presente contrato poderá ser rescindido por ambas as partes, respeitando as condições estabelecidas neste instrumento.`);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Quando tivermos a API, enviaremos a requisição para o servidor
      console.log("Enviando dados do contrato:", data);

      /*
      // Exemplo de como será a implementação da API
      await apiRequest({
        url: "/api/contracts",
        method: "POST",
        data,
      });
      
      // Invalidar cache para forçar recarregamento dos contratos
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      */

      toast({
        title: "Contrato criado com sucesso",
        description: `Contrato ${data.contractNumber} foi criado com sucesso.`,
      });

      // Redirecionar para a lista de contratos
      navigate("/admin/contracts");
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      toast({
        title: "Erro ao criar contrato",
        description: "Ocorreu um erro ao criar o contrato. Tente novamente.",
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
              onClick={() => navigate("/admin/contracts")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Contrato</h1>
              <p className="text-gray-500">
                Crie um novo contrato para clientes
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            {previewMode ? "Modo Edição" : "Visualizar Contrato"}
          </Button>
        </div>

        {previewMode ? (
          // Modo de visualização do contrato
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-center">
                {form.getValues("title") || "Contrato"}
              </CardTitle>
              <CardDescription className="text-center">
                Contrato nº {form.getValues("contractNumber")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <h2>Partes Contratantes</h2>
                <p>
                  <strong>CONTRATANTE:</strong> {mockClients.find(c => c.id === form.getValues("clientId"))?.name || "Cliente"}
                </p>
                <p>
                  <strong>CONTRATADA:</strong> Edunexia Educacional
                </p>
                
                <h2>Descrição</h2>
                <p>
                  {form.getValues("description") || "Sem descrição fornecida."}
                </p>
                
                <h2>Vigência</h2>
                <p>
                  <strong>Início:</strong> {format(form.getValues("startDate"), "dd/MM/yyyy", { locale: ptBR })}
                  <br />
                  <strong>Término:</strong> {format(form.getValues("endDate"), "dd/MM/yyyy", { locale: ptBR })}
                  <br />
                  <strong>Renovação Automática:</strong> {form.getValues("autoRenew") ? "Sim" : "Não"}
                </p>
                
                <h2>Valor</h2>
                <p>
                  <strong>Valor Total:</strong> {form.getValues("value").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                
                <h2>Termos e Condições</h2>
                <div className="whitespace-pre-line">
                  {form.getValues("termsAndConditions") || "Nenhum termo especificado."}
                </div>
                
                {form.getValues("additionalInfo") && (
                  <>
                    <h2>Informações Adicionais</h2>
                    <div className="whitespace-pre-line">
                      {form.getValues("additionalInfo")}
                    </div>
                  </>
                )}
                
                <h2>Assinaturas</h2>
                <div className="flex justify-between mt-20">
                  <div className="text-center">
                    <div className="border-t border-black pt-2 w-64">
                      Edunexia Educacional
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black pt-2 w-64">
                      {mockClients.find(c => c.id === form.getValues("clientId"))?.name || "Cliente"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t">
              <Button 
                type="button" 
                onClick={() => setPreviewMode(false)}
                className="mr-2"
              >
                Voltar para Edição
              </Button>
              <Button 
                type="button"
                onClick={form.handleSubmit(onSubmit)}
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                Salvar Contrato
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Formulário de edição do contrato
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ContractIcon className="mr-2 h-5 w-5" />
                Informações do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                      <TabsTrigger value="dates">Datas e Valores</TabsTrigger>
                      <TabsTrigger value="content">Conteúdo</TabsTrigger>
                      <TabsTrigger value="options">Opções</TabsTrigger>
                    </TabsList>

                    {/* Tab: Informações Básicas */}
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="contractNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número do Contrato*</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly />
                              </FormControl>
                              <FormDescription>
                                Gerado automaticamente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cliente*</FormLabel>
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
                          name="templateId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo de Contrato*</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleTemplateSelect(value);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o modelo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {mockTemplates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                      {template.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Selecione um modelo para pré-preencher o contrato
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Contrato*</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="education">Educacional</SelectItem>
                                  <SelectItem value="service">Prestação de Serviços</SelectItem>
                                  <SelectItem value="partnership">Parceria</SelectItem>
                                  <SelectItem value="commercial">Comercial</SelectItem>
                                  <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Título do Contrato*</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ex: Contrato de Prestação de Serviços Educacionais" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Descreva o objetivo deste contrato"
                                  className="min-h-[80px]" 
                                  {...field} 
                                />
                              </FormControl>
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
                                  <SelectItem value="draft">Rascunho</SelectItem>
                                  <SelectItem value="pending">Pendente de Assinatura</SelectItem>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="expired">Expirado</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab: Datas e Valores */}
                    <TabsContent value="dates" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Início*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Término*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="signingDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Assinatura</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Opcional. Deixe em branco para contratos ainda não assinados.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Contrato*</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  placeholder="0,00" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Valor total do contrato em Reais (R$)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* Tab: Conteúdo */}
                    <TabsContent value="content" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="termsAndConditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Termos e Condições</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Insira os termos e condições do contrato"
                                className="min-h-[300px] font-mono" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              O texto principal do contrato com todas as cláusulas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additionalInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Informações Adicionais</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações complementares, anexos, etc."
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* Tab: Opções */}
                    <TabsContent value="options" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="autoRenew"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Renovação Automática</FormLabel>
                                <p className="text-sm text-gray-500">
                                  O contrato será renovado automaticamente ao fim do prazo
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requiresSignature"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Requer Assinatura</FormLabel>
                                <p className="text-sm text-gray-500">
                                  O contrato precisa ser assinado por ambas as partes
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/admin/contracts")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPreviewMode(true)}
                      className="mr-2"
                    >
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button type="submit">
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Salvar Contrato
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}