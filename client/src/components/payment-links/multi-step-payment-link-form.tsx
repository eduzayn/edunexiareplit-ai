/**
 * Formulário de múltiplas etapas para criação de links de pagamento
 * Implementa uma experiência de usuário guiada em etapas para facilitar a configuração
 */
import React, { useState } from 'react';
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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ArrowRight, ArrowLeft, Image, Share2, CreditCard } from 'lucide-react';

// Esquema de validação do formulário
const formSchema = z.object({
  // Etapa 1: Informações básicas
  linkName: z.string()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(255, { message: "Nome deve ter no máximo 255 caracteres" }),
  amount: z.coerce.number()
    .min(1, { message: "Valor deve ser maior que zero" }),
  description: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
  generateImage: z.boolean().default(true),

  // Etapa 2: Formas de pagamento e parcelamento
  allowBoleto: z.boolean().default(true),
  allowPix: z.boolean().default(true),
  allowCreditCard: z.boolean().default(true),
  maxInstallments: z.coerce.number().min(1).max(12).default(12),
  dueDateLimitDays: z.coerce.number().min(1).max(30).default(7),
  
  // Etapa 3: Configurações adicionais
  // Desconto
  discountEnabled: z.boolean().default(false),
  discountValue: z.coerce.number().min(0).max(100).default(5),
  discountDueDateLimitDays: z.coerce.number().min(1).max(30).default(3),
  
  // Multa e juros
  fineEnabled: z.boolean().default(true),
  fineValue: z.coerce.number().min(0).max(20).default(2),
  interestEnabled: z.boolean().default(true),
  interestValue: z.coerce.number().min(0).max(10).default(1),
  
  // Dados do pagador
  payerName: z.string().optional(),
  payerCpf: z.string().optional(),
  payerEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal('')),
});

// Tipo dos dados do formulário
type FormData = z.infer<typeof formSchema>;

// Interface para as props do componente
interface MultiStepPaymentLinkFormProps {
  courseId: number;
  courseName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Componente de formulário multi-etapas para criação de links de pagamento
 */
export function MultiStepPaymentLinkForm({ 
  courseId, 
  courseName, 
  onSuccess,
  onCancel
}: MultiStepPaymentLinkFormProps) {
  // Estado para controlar a etapa atual
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Total de etapas no formulário
  const totalSteps = 4;
  
  // Configuração do formulário com React Hook Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Etapa 1: Informações básicas
      linkName: `Matrícula - ${courseName}`,
      amount: 0,
      description: `Pagamento do curso: ${courseName}`,
      notificationEnabled: true,
      generateImage: true,
      
      // Etapa 2: Formas de pagamento
      allowBoleto: true,
      allowPix: true,
      allowCreditCard: true,
      maxInstallments: 12,
      dueDateLimitDays: 7,
      
      // Etapa 3: Configurações adicionais
      discountEnabled: false,
      discountValue: 5,
      discountDueDateLimitDays: 3,
      fineEnabled: true,
      fineValue: 2,
      interestEnabled: true,
      interestValue: 1,
      
      // Dados do pagador
      payerName: '',
      payerCpf: '',
      payerEmail: '',
    },
  });
  
  // Hook para submissão da API
  const createLinkMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Adicionar courseId aos dados
      const payload = {
        ...data,
        courseId,
      };
      
      return apiRequest('/api/payment-links', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: (response) => {
      toast({
        title: 'Link de pagamento criado',
        description: 'O link de pagamento foi criado com sucesso!',
      });
      
      // Resetar o formulário
      form.reset();
      
      // Chamar o callback de sucesso se existir
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Erro ao criar link de pagamento:', error);
      
      // Mensagem de erro específica se disponível, ou genérica
      toast({
        title: 'Erro ao criar link',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar o link de pagamento.',
        variant: 'destructive',
      });
    },
  });
  
  // Função para avançar para a próxima etapa
  const goToNextStep = async () => {
    // Validar campos da etapa atual
    const fieldsToValidate = getFieldsForCurrentStep();
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      // Se for a última etapa, submeter o formulário
      if (currentStep === totalSteps - 1) {
        form.handleSubmit(onSubmit)();
      } else {
        // Avançar para a próxima etapa
        setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
      }
    }
  };
  
  // Função para voltar para a etapa anterior
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  // Função para cancelar o formulário
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  // Função para submeter o formulário
  const onSubmit = (data: FormData) => {
    createLinkMutation.mutate(data);
  };
  
  // Obter os campos para validar na etapa atual
  const getFieldsForCurrentStep = (): (keyof FormData)[] => {
    switch (currentStep) {
      case 0: // Informações básicas
        return ['linkName', 'amount', 'description', 'notificationEnabled', 'generateImage'];
      case 1: // Formas de pagamento
        return ['allowBoleto', 'allowPix', 'allowCreditCard', 'maxInstallments', 'dueDateLimitDays'];
      case 2: // Configurações adicionais
        return ['discountEnabled', 'discountValue', 'discountDueDateLimitDays', 'fineEnabled', 'fineValue', 'interestEnabled', 'interestValue'];
      case 3: // Dados do pagador
        return ['payerName', 'payerCpf', 'payerEmail'];
      default:
        return [];
    }
  };
  
  // Status de carregamento
  const isLoading = createLinkMutation.isPending;
  
  // Renderizar a etapa atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderPaymentMethodsStep();
      case 2:
        return renderAdditionalSettingsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };
  
  // Etapa 1: Informações básicas
  const renderBasicInfoStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Informações Básicas do Link
          </CardTitle>
          <CardDescription>
            Configure as informações principais do seu link de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Link */}
          <FormField
            control={form.control}
            name="linkName"
            render={({ field }) => (
              <FormItem>
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

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
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

          {/* Notificações */}
          <FormField
            control={form.control}
            name="notificationEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
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

          {/* Gerar Imagem Automaticamente */}
          <FormField
            control={form.control}
            name="generateImage"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Gerar Imagem Automaticamente</FormLabel>
                  <FormDescription>
                    Cria uma imagem personalizada para o link de pagamento
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    );
  };
  
  // Etapa 2: Formas de pagamento
  const renderPaymentMethodsStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Formas de Pagamento
          </CardTitle>
          <CardDescription>
            Configure os métodos de pagamento aceitos e condições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Aceitar Boleto */}
            <FormField
              control={form.control}
              name="allowBoleto"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceitar Boleto</FormLabel>
                    <FormDescription>
                      Permitir pagamento via boleto bancário
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aceitar PIX */}
            <FormField
              control={form.control}
              name="allowPix"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceitar PIX</FormLabel>
                    <FormDescription>
                      Permitir pagamento via PIX
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aceitar Cartão de Crédito */}
            <FormField
              control={form.control}
              name="allowCreditCard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aceitar Cartão de Crédito</FormLabel>
                    <FormDescription>
                      Permitir pagamento via cartão de crédito
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

            {/* Dias para vencimento */}
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
                    Prazo em dias para vencimento do pagamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Etapa 3: Configurações adicionais
  const renderAdditionalSettingsStep = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>
            Configure opções avançadas como desconto, multa e juros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Desconto */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações de Desconto</h3>
            
            {/* Habilitar Desconto */}
            <FormField
              control={form.control}
              name="discountEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Habilitar Desconto</FormLabel>
                    <FormDescription>
                      Oferece desconto para pagamento antecipado
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('discountEnabled') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                {/* Valor do Desconto */}
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Desconto (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentual de desconto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Dias para Desconto */}
                <FormField
                  control={form.control}
                  name="discountDueDateLimitDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias para Desconto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Prazo em dias para o desconto
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* Seção de Multa e Juros */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações de Multa e Juros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Habilitar Multa */}
                <FormField
                  control={form.control}
                  name="fineEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Habilitar Multa</FormLabel>
                        <FormDescription>
                          Aplica multa em caso de atraso
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('fineEnabled') && (
                  <FormField
                    control={form.control}
                    name="fineValue"
                    render={({ field }) => (
                      <FormItem className="pl-8">
                        <FormLabel>Valor da Multa (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de multa
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <div className="space-y-4">
                {/* Habilitar Juros */}
                <FormField
                  control={form.control}
                  name="interestEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Habilitar Juros</FormLabel>
                        <FormDescription>
                          Aplica juros por dia de atraso
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('interestEnabled') && (
                  <FormField
                    control={form.control}
                    name="interestValue"
                    render={({ field }) => (
                      <FormItem className="pl-8">
                        <FormLabel>Valor dos Juros (% ao mês)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de juros ao mês
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Etapa 4: Resumo e dados do pagador
  const renderReviewStep = () => {
    const formData = form.getValues();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Pagador (Opcional)</CardTitle>
            <CardDescription>
              Informações pré-preenchidas para o pagador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            {/* Email do Pagador */}
            <FormField
              control={form.control}
              name="payerEmail"
              render={({ field }) => (
                <FormItem>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Revise as informações antes de criar o link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Informações Básicas</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Nome:</span> {formData.linkName}</li>
                    <li><span className="font-medium">Valor:</span> R$ {formData.amount.toFixed(2)}</li>
                    <li><span className="font-medium">Notificações:</span> {formData.notificationEnabled ? 'Ativadas' : 'Desativadas'}</li>
                    <li><span className="font-medium">Imagem:</span> {formData.generateImage ? 'Gerar automaticamente' : 'Não gerar'}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Formas de Pagamento</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Boleto:</span> {formData.allowBoleto ? 'Sim' : 'Não'}</li>
                    <li><span className="font-medium">PIX:</span> {formData.allowPix ? 'Sim' : 'Não'}</li>
                    <li><span className="font-medium">Cartão:</span> {formData.allowCreditCard ? 'Sim' : 'Não'}</li>
                    <li><span className="font-medium">Parcelas:</span> Até {formData.maxInstallments}x</li>
                    <li><span className="font-medium">Prazo:</span> {formData.dueDateLimitDays} dias</li>
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Configurações Avançadas</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Desconto:</span> {formData.discountEnabled ? `${formData.discountValue}% em ${formData.discountDueDateLimitDays} dias` : 'Não'}</li>
                    <li><span className="font-medium">Multa:</span> {formData.fineEnabled ? `${formData.fineValue}%` : 'Não'}</li>
                    <li><span className="font-medium">Juros:</span> {formData.interestEnabled ? `${formData.interestValue}% ao mês` : 'Não'}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Dados do Pagador</h3>
                  <ul className="mt-2 space-y-1">
                    <li><span className="font-medium">Nome:</span> {formData.payerName || 'Não informado'}</li>
                    <li><span className="font-medium">CPF:</span> {formData.payerCpf || 'Não informado'}</li>
                    <li><span className="font-medium">Email:</span> {formData.payerEmail || 'Não informado'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Indicador de progresso
  const renderProgressIndicator = () => {
    return (
      <div className="flex justify-between mb-6">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div 
            key={index}
            className={`flex items-center ${index === 0 ? '' : 'flex-1'}`}
          >
            <div 
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 
                ${currentStep >= index 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'border-gray-300 text-gray-500'}`}
            >
              {index + 1}
            </div>
            
            {index < totalSteps - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 
                  ${currentStep > index ? 'bg-primary' : 'bg-gray-300'}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Renderização do componente
  return (
    <div className="space-y-6 my-6">
      {renderProgressIndicator()}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {renderCurrentStep()}
          
          <div className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={currentStep === 0 ? handleCancel : goToPreviousStep}
              disabled={isLoading}
            >
              {currentStep === 0 ? 'Cancelar' : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              onClick={goToNextStep}
              disabled={isLoading}
            >
              {currentStep === totalSteps - 1 ? (
                isLoading ? 'Criando...' : 'Criar Link'
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}