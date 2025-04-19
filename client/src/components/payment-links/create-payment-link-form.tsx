import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { InfoIcon } from 'lucide-react';

// Interface para as props do componente
interface CreatePaymentLinkFormProps {
  courseId: number;
  courseName: string;
  onSuccess?: () => void;
}

// Esquema de validação do formulário
const formSchema = z.object({
  linkName: z.string()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(255, { message: "Nome deve ter no máximo 255 caracteres" }),
  amount: z.coerce.number()
    .min(1, { message: "Valor deve ser maior que 0" }),
  description: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
  payerName: z.string().optional(),
  payerCpf: z.string().optional(),
  payerEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal('')),
  
  // Campos adicionais para aproveitar mais recursos da API Asaas
  maxInstallments: z.coerce.number().min(1).max(12).default(12),
  expirationDays: z.coerce.number().min(1).max(365).default(30),
  dueDateLimitDays: z.coerce.number().min(1).max(30).default(7),
  
  // Configurações de desconto
  discountEnabled: z.boolean().default(false),
  discountValue: z.coerce.number().min(0).max(100).default(5),
  discountDueDateLimitDays: z.coerce.number().min(1).max(30).default(3),
  
  // Configurações de multa e juros
  fineEnabled: z.boolean().default(true),
  fineValue: z.coerce.number().min(0).max(20).default(2),
  interestEnabled: z.boolean().default(true),
  interestValue: z.coerce.number().min(0).max(10).default(1),
});

// Tipo dos dados do formulário
type FormData = z.infer<typeof formSchema>;

export function CreatePaymentLinkForm({ courseId, courseName, onSuccess }: CreatePaymentLinkFormProps) {
  // Configuração do formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkName: `Matrícula - ${courseName}`,
      amount: 0,
      description: `Pagamento do curso: ${courseName}`,
      notificationEnabled: true,
      payerName: '',
      payerCpf: '',
      payerEmail: '',
      
      // Configurações avançadas
      maxInstallments: 12,
      expirationDays: 30,
      dueDateLimitDays: 7,
      
      // Desconto
      discountEnabled: false,
      discountValue: 5,
      discountDueDateLimitDays: 3,
      
      // Multa e juros
      fineEnabled: true,
      fineValue: 2,
      interestEnabled: true,
      interestValue: 1
    },
  });

  // Mutação para criar o link de pagamento
  const createLinkMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        courseId,
      };
      return apiRequest('/api/payment-links', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: () => {
      form.reset(); // Resetar o formulário
      // Chamar o callback de sucesso se existir
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Erro ao criar link de pagamento:', error);
      toast({
        title: 'Erro ao criar link',
        description: error.message || 'Ocorreu um erro ao criar o link de pagamento.',
        variant: 'destructive',
      });
    },
  });

  // Submit do formulário
  const onSubmit = (data: FormData) => {
    createLinkMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Criação de Link de Pagamento com Imagem</AlertTitle>
        <AlertDescription>
          Este formulário gera um link de pagamento personalizado com uma imagem 
          gerada por IA. A imagem será criada automaticamente com base no nome do curso.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Nome do Link */}
                <FormField
                  control={form.control}
                  name="linkName"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome do Link*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome que será exibido no link de pagamento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor a ser cobrado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notificações */}
                <FormField
                  control={form.control}
                  name="notificationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Habilitar Notificações</FormLabel>
                        <FormDescription>
                          Envia notificações por email ao cliente
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormDescription>
                        Descrição detalhada que será exibida no link de pagamento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Informações do Pagador (Opcional)</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Nome do Pagador */}
                <FormField
                  control={form.control}
                  name="payerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pagador</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome que será pré-preenchido no link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF do Pagador */}
                <FormField
                  control={form.control}
                  name="payerCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Pagador</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        CPF que será pré-preenchido no link
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email do Pagador */}
                <FormField
                  control={form.control}
                  name="payerEmail"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Email do Pagador</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email que será pré-preenchido no link e usado para notificações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configure parâmetros avançados do link de pagamento como parcelamento, vencimento e outros
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="payment">
                <TabsList className="mb-4">
                  <TabsTrigger value="payment">Pagamento</TabsTrigger>
                  <TabsTrigger value="discount">Desconto</TabsTrigger>
                  <TabsTrigger value="interest">Multa e Juros</TabsTrigger>
                </TabsList>
                
                <TabsContent value="payment" className="space-y-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                    {/* Parcelamento máximo */}
                    <FormField
                      control={form.control}
                      name="maxInstallments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcelamento Máximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="12"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de parcelas (1-12)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dias de expiração */}
                    <FormField
                      control={form.control}
                      name="expirationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias para Expiração</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Dias até o link expirar
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dias para data limite de pagamento */}
                    <FormField
                      control={form.control}
                      name="dueDateLimitDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dias para Vencimento</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Dias para vencimento após acessar o link
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="discount" className="space-y-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {/* Habilitar desconto */}
                    <FormField
                      control={form.control}
                      name="discountEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Habilitar Desconto</FormLabel>
                            <FormDescription>
                              Ativa desconto para pagamento antecipado
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Dias para limite de desconto */}
                    <FormField
                      control={form.control}
                      name="discountDueDateLimitDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo de Desconto (dias)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="30"
                              disabled={!form.watch('discountEnabled')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Dias antes do vencimento para aplicar desconto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Valor do desconto */}
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Valor do Desconto (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              disabled={!form.watch('discountEnabled')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual de desconto para pagamento antecipado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="interest" className="space-y-4">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {/* Habilitar multa */}
                    <FormField
                      control={form.control}
                      name="fineEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Habilitar Multa</FormLabel>
                            <FormDescription>
                              Ativa multa por atraso no pagamento
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Habilitar juros */}
                    <FormField
                      control={form.control}
                      name="interestEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Habilitar Juros</FormLabel>
                            <FormDescription>
                              Ativa juros por atraso no pagamento
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Valor da multa */}
                    <FormField
                      control={form.control}
                      name="fineValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Multa (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              disabled={!form.watch('fineEnabled')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual de multa por atraso
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Valor dos juros */}
                    <FormField
                      control={form.control}
                      name="interestValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor dos Juros (%/mês)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              disabled={!form.watch('interestEnabled')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentual de juros mensal por atraso
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              disabled={createLinkMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createLinkMutation.isPending}
            >
              {createLinkMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Criando...
                </>
              ) : 'Criar Link de Pagamento'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}