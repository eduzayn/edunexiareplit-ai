import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useLeadsV2 } from '@/hooks/use-leads-v2';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tab, TabsContent, TabsList, TabsTrigger, Tabs } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Calendar, Check, Clock, ClipboardList, Link, ExternalLink, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateLeadActivityData, CheckoutLinkData } from '@/lib/api/leads-api';

// Schema de validação para formulário de atividade
const activityFormSchema = z.object({
  type: z.enum(['note', 'contact', 'email']),
  description: z.string().min(1, 'Descrição é obrigatória'),
});

// Schema de validação para formulário de link de checkout
const checkoutFormSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.coerce.number().min(1, 'Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  expirationTime: z.coerce.number().min(1, 'Tempo de expiração é obrigatório').default(30),
  courseId: z.coerce.number().optional(),
  productId: z.coerce.number().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/**
 * Formatação de status para exibição
 */
const statusFormat = {
  new: { label: 'Novo', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contatado', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'Qualificado', color: 'bg-green-100 text-green-800' },
  unqualified: { label: 'Não Qualificado', color: 'bg-red-100 text-red-800' },
  converted: { label: 'Convertido', color: 'bg-purple-100 text-purple-800' },
};

/**
 * Formatação de tipo de atividade para exibição
 */
const activityTypeFormat = {
  note: { label: 'Anotação', icon: ClipboardList },
  contact: { label: 'Contato', icon: Check },
  email: { label: 'Email', icon: Clock },
  checkout: { label: 'Link de Pagamento', icon: Link },
};

/**
 * Formatação de status de checkout para exibição
 */
const checkoutStatusFormat = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-800' },
};

export default function LeadDetailV2Page() {
  const [, params] = useRoute('/admin/crm/leads/:id/detail-v2');
  const leadId = params ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  
  const { 
    useLead, 
    useCheckoutStatus,
    addLeadActivity, 
    isAddingActivity,
    createCheckoutLink,
    isCreatingCheckoutLink,
    cancelCheckoutLink,
    isCancelingCheckoutLink
  } = useLeadsV2();
  
  // Busca informações detalhadas do lead
  const { data, isLoading, isError, refetch } = useLead(leadId);
  
  // Inicializa formulário de atividade
  const activityForm = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: 'note',
      description: '',
    },
  });
  
  // Inicializa formulário de link de checkout
  const checkoutForm = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      description: data?.lead.course 
        ? `Pagamento para o curso ${data.lead.course}` 
        : 'Pagamento de matrícula',
      value: 0,
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      expirationTime: 30,
    },
  });
  
  // Funções para submissão dos formulários
  const onSubmitActivity = (data: ActivityFormValues) => {
    if (!leadId) return;
    
    addLeadActivity({
      leadId,
      data,
    }, {
      onSuccess: () => {
        activityForm.reset();
        setActivityDialogOpen(false);
        refetch();
      },
    });
  };
  
  const onSubmitCheckout = (formData: CheckoutFormValues) => {
    if (!leadId) return;
    
    const checkoutData: CheckoutLinkData = {
      leadId,
      ...formData,
    };
    
    createCheckoutLink(checkoutData, {
      onSuccess: () => {
        checkoutForm.reset();
        setCheckoutDialogOpen(false);
        refetch();
      },
    });
  };
  
  const handleCancelCheckout = (checkoutId: string) => {
    if (!leadId) return;
    
    if (confirm('Tem certeza que deseja cancelar este link de pagamento?')) {
      cancelCheckoutLink({
        checkoutId,
        leadId,
      }, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };
  
  // Renderização de estados de loading e erro
  if (isLoading) {
    return (
      <div className="container p-6 mx-auto flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError || !data) {
    return (
      <div className="container p-6 mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/admin/crm/leads-v2')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Erro ao carregar lead</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Erro ao carregar os dados do lead
              </h2>
              <p className="text-gray-500 mb-4">
                Não foi possível obter as informações. Tente novamente mais tarde.
              </p>
              <Button onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Dados do lead
  const { lead, activities, checkoutLinks } = data;
  
  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/admin/crm/leads-v2')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{lead.name}</h1>
        <Badge className={`ml-4 ${statusFormat[lead.status]?.color}`}>
          {statusFormat[lead.status]?.label || lead.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Informações do Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1">{lead.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                <dd className="mt-1">{lead.phone || "-"}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Curso de Interesse</dt>
                <dd className="mt-1">{lead.course || "-"}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Origem</dt>
                <dd className="mt-1">{lead.source || "-"}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Cadastro</dt>
                <dd className="mt-1">
                  {lead.created_at 
                    ? format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
                    : "-"}
                </dd>
              </div>
              
              {lead.converted_to_client_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Convertido em Cliente</dt>
                  <dd className="mt-1">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={() => setLocation(`/admin/crm/clients/${lead.converted_to_client_id}`)}
                    >
                      Ver cliente
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Observações</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap min-h-[100px]">
              {lead.notes || "Nenhuma observação registrada."}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="activities" className="mb-6">
        <TabsList>
          <TabsTrigger value="activities">Histórico de Atividades</TabsTrigger>
          <TabsTrigger value="checkout">Links de Pagamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Histórico de Atividades</CardTitle>
                <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Nova Atividade</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Atividade</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova interação com o lead.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...activityForm}>
                      <form 
                        onSubmit={activityForm.handleSubmit(onSubmitActivity)} 
                        className="space-y-4 pt-4"
                      >
                        <FormField
                          control={activityForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Atividade</FormLabel>
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
                                  <SelectItem value="note">Anotação</SelectItem>
                                  <SelectItem value="contact">Contato</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={activityForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Descreva a atividade..."
                                  className="min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActivityDialogOpen(false)}
                            className="mr-2"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit"
                            disabled={isAddingActivity}
                          >
                            {isAddingActivity && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Salvar Atividade
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Registro das interações com este lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map((activity) => {
                    const ActivityIcon = activityTypeFormat[activity.type]?.icon || Clock;
                    
                    return (
                      <div key={activity.id} className="flex space-x-4">
                        <div className="flex h-10 w-10 rounded-full bg-gray-100 items-center justify-center">
                          <ActivityIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              {activityTypeFormat[activity.type]?.label || activity.type}
                            </h4>
                            <time className="text-xs text-gray-500">
                              {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </time>
                          </div>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Nenhuma atividade registrada para este lead.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Links de Pagamento</CardTitle>
                {lead.status !== 'converted' && (
                  <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Novo Link de Pagamento</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Link de Pagamento</DialogTitle>
                        <DialogDescription>
                          Gere um link de pagamento Asaas para enviar a este lead.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...checkoutForm}>
                        <form 
                          onSubmit={checkoutForm.handleSubmit(onSubmitCheckout)} 
                          className="space-y-4 pt-4"
                        >
                          <FormField
                            control={checkoutForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Descrição do pagamento"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={checkoutForm.control}
                            name="value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={checkoutForm.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Vencimento</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="date"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={checkoutForm.control}
                            name="expirationTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tempo de Expiração (minutos)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCheckoutDialogOpen(false)}
                              className="mr-2"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit"
                              disabled={isCreatingCheckoutLink}
                            >
                              {isCreatingCheckoutLink && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Criar Link
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <CardDescription>
                Links de pagamento gerados para este lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkoutLinks && checkoutLinks.length > 0 ? (
                <div className="space-y-6">
                  {checkoutLinks.map((checkout) => (
                    <Card key={checkout.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{checkout.description}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Link gerado em {format(new Date(checkout.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <Badge className={checkoutStatusFormat[checkout.status]?.color || 'bg-gray-100'}>
                            {checkoutStatusFormat[checkout.status]?.label || checkout.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Valor</p>
                            <p className="mt-1">R$ {checkout.value.toFixed(2).replace('.', ',')}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Vencimento</p>
                            <p className="mt-1">{format(new Date(checkout.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Expiração</p>
                            <p className="mt-1">{checkout.expiration_time} minutos</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(checkout.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Link
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(checkout.url);
                              toast({
                                title: "Link copiado",
                                description: "O link de pagamento foi copiado para a área de transferência.",
                              });
                            }}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Copiar Link
                          </Button>
                          
                          {(checkout.status === 'pending' || checkout.status === 'active') && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleCancelCheckout(checkout.asaas_checkout_id)}
                              disabled={isCancelingCheckoutLink}
                            >
                              {isCancelingCheckoutLink ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Cancelar Link
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Nenhum link de pagamento gerado para este lead.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}