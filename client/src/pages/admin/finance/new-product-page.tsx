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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, SaveIcon, ShoppingBagIcon } from "@/components/ui/icons";

// Schema de validação para criação de curso/serviço
const formSchema = z.object({
  // Informações básicas
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  code: z.string().min(2, { message: "Código é obrigatório" }),
  type: z.enum(["course", "service"], { 
    required_error: "Selecione o tipo" 
  }),
  category: z.string().min(1, { message: "Selecione a categoria" }),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }),
  
  // Detalhes
  workload: z.coerce.number().min(1, { message: "Carga horária é obrigatória" }).optional(),
  duration: z.coerce.number().min(1, { message: "Duração é obrigatória" }).optional(),
  durationUnit: z.string().optional(),
  tags: z.string().optional().or(z.literal("")),
  
  // Preços
  price: z.coerce.number().min(0, { message: "Preço deve ser maior ou igual a zero" }),
  costPrice: z.coerce.number().min(0, { message: "Custo deve ser maior ou igual a zero" }).optional(),
  taxRate: z.coerce.number().min(0, { message: "Taxa deve ser maior ou igual a zero" }).optional(),
  
  // Status
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProductPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "course",
      category: "",
      description: "",
      workload: undefined,
      duration: undefined,
      durationUnit: "months",
      tags: "",
      price: 0,
      costPrice: undefined,
      taxRate: undefined,
      isActive: true,
      isFeatured: false,
      isDigital: true,
    },
  });

  const productType = form.watch("type");

  const onSubmit = async (data: FormValues) => {
    try {
      // Quando tivermos a API, enviaremos a requisição para o servidor
      console.log("Enviando dados do formulário:", data);

      /*
      // Exemplo de como será a implementação da API
      await apiRequest({
        url: "/api/finance/products",
        method: "POST",
        data,
      });
      
      // Invalidar cache para forçar recarregamento dos produtos
      queryClient.invalidateQueries({ queryKey: ["/api/finance/products"] });
      */

      toast({
        title: "Curso/Serviço cadastrado com sucesso",
        description: `${data.type === 'course' ? 'Curso' : 'Serviço'} ${data.name} foi cadastrado com sucesso.`,
      });

      // Redirecionar para a lista de produtos
      navigate("/admin/finance/products");
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o curso/serviço. Tente novamente.",
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
              onClick={() => navigate("/admin/finance/products")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {productType === 'course' ? 'Novo Curso' : 'Novo Serviço'}
              </h1>
              <p className="text-gray-500">
                Cadastre um novo {productType === 'course' ? 'curso' : 'serviço'} no sistema
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBagIcon className="mr-2 h-5 w-5" />
              Cadastro de {productType === 'course' ? 'Curso' : 'Serviço'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="pricing">Preços</TabsTrigger>
                  </TabsList>

                  {/* Tab: Informações Básicas */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo*</FormLabel>
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
                                <SelectItem value="course">Curso</SelectItem>
                                <SelectItem value="service">Serviço</SelectItem>
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
                            <FormLabel>Nome*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={
                                  productType === "course" 
                                    ? "Ex: MBA em Gestão Empresarial" 
                                    : "Ex: Consultoria Pedagógica"
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
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código*</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: MBA-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Código único para identificação do {productType === 'course' ? 'curso' : 'serviço'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria*</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productType === 'course' ? (
                                  <>
                                    <SelectItem value="graduacao">Graduação</SelectItem>
                                    <SelectItem value="pos-graduacao">Pós-Graduação</SelectItem>
                                    <SelectItem value="mba">MBA</SelectItem>
                                    <SelectItem value="extensao">Extensão</SelectItem>
                                    <SelectItem value="cursos-livres">Cursos Livres</SelectItem>
                                    <SelectItem value="idiomas">Idiomas</SelectItem>
                                    <SelectItem value="tecnico">Técnico</SelectItem>
                                    <SelectItem value="outros-cursos">Outros Cursos</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="consultoria">Consultoria</SelectItem>
                                    <SelectItem value="certificacao">Certificação</SelectItem>
                                    <SelectItem value="mentoria">Mentoria</SelectItem>
                                    <SelectItem value="treinamento">Treinamento In-Company</SelectItem>
                                    <SelectItem value="tutoria">Tutoria</SelectItem>
                                    <SelectItem value="suporte">Suporte</SelectItem>
                                    <SelectItem value="outros-servicos">Outros Serviços</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição*</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={`Descreva o ${productType === 'course' ? 'curso' : 'serviço'} detalhadamente`}
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div className="flex flex-col space-y-1.5">
                          <h3 className="text-lg font-semibold">Status</h3>
                        </div>
                        <div className="flex flex-row space-x-8">
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Ativo</FormLabel>
                                  <p className="text-sm text-gray-500">
                                    Disponível para venda
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Destaque</FormLabel>
                                  <p className="text-sm text-gray-500">
                                    Mostrar em destaque no site
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isDigital"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Digital</FormLabel>
                                  <p className="text-sm text-gray-500">
                                    Entregue digitalmente
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Detalhes */}
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {productType === 'course' && (
                        <FormField
                          control={form.control}
                          name="workload"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Carga Horária (horas)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="Ex: 360" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e.target.valueAsNumber || 0);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duração</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="Ex: 12" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="durationUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade de Duração</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a unidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="days">Dias</SelectItem>
                                <SelectItem value="weeks">Semanas</SelectItem>
                                <SelectItem value="months">Meses</SelectItem>
                                <SelectItem value="years">Anos</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ex: educação, gestão, finanças (separadas por vírgula)" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Tags para facilitar a busca e categorização
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab: Preços */}
                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Venda (R$)*</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="Ex: 1499,90" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 0);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="Ex: 799,90" 
                                {...field} 
                                onChange={(e) => {
                                  const value = e.target.valueAsNumber;
                                  field.onChange(isNaN(value) ? undefined : value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Custo interno para fornecimento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Imposto (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="Ex: 18,5" 
                                {...field} 
                                onChange={(e) => {
                                  const value = e.target.valueAsNumber;
                                  field.onChange(isNaN(value) ? undefined : value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
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
                    onClick={() => navigate("/admin/finance/products")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Salvar {productType === 'course' ? 'Curso' : 'Serviço'}
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