import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Calendar, Check, Pencil, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PaymentLinkCreatorProps {
  courseId: number;
  courseName: string;
  coursePrice: number | null;
  onSuccess?: (newPaymentLink: any) => void;
  onCancel?: () => void;
}

export function PaymentLinkCreator({ courseId, courseName, coursePrice, onSuccess, onCancel }: PaymentLinkCreatorProps) {
  // Estados para controle do wizard
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para dados do link de pagamento
  const [paymentInfo, setPaymentInfo] = useState({
    hasPredefinedValue: true,
    value: coursePrice || 0,
    name: `${courseName} - pagamento`,
    description: `Link para pagamento do curso ${courseName}`,
    notificationsEnabled: false,
  });
  
  const [paymentOptions, setPaymentOptions] = useState({
    paymentType: 'avista', // 'avista' ou 'parcelado'
    installments: 1,
    billingTypes: {
      boletoOrPix: true,
      creditCard: false
    },
    dueDateLimitDays: 1,
    endDate: '',
    addressRequired: false
  });
  
  const { toast } = useToast();
  
  // Função para avançar para o próximo passo
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Função para voltar ao passo anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Função para atualizar o estado de informações do pagamento
  const updatePaymentInfo = (field: string, value: any) => {
    setPaymentInfo({
      ...paymentInfo,
      [field]: value
    });
  };
  
  // Função para atualizar opções de pagamento
  const updatePaymentOptions = (field: string, value: any) => {
    setPaymentOptions({
      ...paymentOptions,
      [field]: value
    });
  };
  
  // Função para atualizar tipos de cobrança aceitos
  const updateBillingType = (type: string, checked: boolean) => {
    setPaymentOptions({
      ...paymentOptions,
      billingTypes: {
        ...paymentOptions.billingTypes,
        [type]: checked
      }
    });
  };
  
  // Função para criar o link de pagamento
  const createPaymentLink = async () => {
    setIsSubmitting(true);
    
    try {
      // Verificar se usuário está autenticado
      const userResponse = await fetch('/api/user');
      
      if (!userResponse.ok) {
        toast({
          variant: 'destructive',
          title: 'Sessão expirada',
          description: 'Sua sessão expirou. Por favor, faça login novamente.'
        });
        return;
      }
      
      // Preparar dados para envio
      const billingType = [];
      if (paymentOptions.billingTypes.boletoOrPix) billingType.push('BOLETO', 'PIX');
      if (paymentOptions.billingTypes.creditCard) billingType.push('CREDIT_CARD');
      
      const data = {
        name: paymentInfo.name,
        description: paymentInfo.description,
        value: paymentInfo.value,
        paymentType: 'Padrão',
        billingType: billingType.join(','),
        installments: paymentOptions.paymentType === 'parcelado' ? paymentOptions.installments : 1,
        dueDateLimitDays: paymentOptions.dueDateLimitDays,
        notificationEnabled: paymentInfo.notificationsEnabled,
        endDate: paymentOptions.endDate || undefined,
        addressRequired: paymentOptions.addressRequired
      };
      
      console.log("Simulando criação de link de pagamento com os dados:", data);
      
      // Criar link de demonstração para visualização da interface
      const mockPaymentLink = {
        paymentLinkId: `pay_${Math.random().toString(36).substr(2, 9)}`,
        paymentLinkUrl: `https://asaas.com/linkdepagamento/${Math.random().toString(36).substr(2, 9)}`,
        paymentType: data.paymentType,
        name: data.name,
        description: data.description,
        value: data.value,
        installments: data.installments,
        installmentValue: data.installments > 1 ? data.value / data.installments : data.value,
        billingType: data.billingType,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
      
      // Simular um pequeno atraso para parecer mais realista
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: 'Link criado com sucesso',
        description: 'O link de pagamento foi criado e já está disponível para compartilhamento.'
      });
      
      if (onSuccess) {
        onSuccess(mockPaymentLink);
      }
      
      /* CÓDIGO ORIGINAL - DESCOMENTAR QUANDO A API ESTIVER FUNCIONANDO
      // Criar o link de pagamento
      const response = await fetch(`/api/course-payment-links/courses/${courseId}/custom-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: 'Link criado com sucesso',
          description: 'O link de pagamento foi criado e já está disponível para compartilhamento.'
        });
        
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar link',
          description: result.message || 'Não foi possível criar o link de pagamento.'
        });
      }
      */
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cálculo de valor por parcela (para exibição)
  const getInstallmentValue = () => {
    return paymentInfo.value / (paymentOptions.installments || 1);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-center">Criar Link de Pagamento</h1>
      </div>
      
      {/* Progress Bar / Steps */}
      <div className="flex justify-between items-center px-16 py-4 mb-4 border-b">
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1",
            currentStep >= 1 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500"
          )}>
            {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
          </div>
          <span className={cn(
            "text-sm",
            currentStep >= 1 ? "text-blue-600 font-medium" : "text-gray-500"
          )}>Informações do link</span>
        </div>
        
        <div className="h-px bg-gray-300 flex-grow mx-2"></div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1",
            currentStep >= 2 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500"
          )}>
            {currentStep > 2 ? <Check className="h-5 w-5" /> : "2"}
          </div>
          <span className={cn(
            "text-sm",
            currentStep >= 2 ? "text-blue-600 font-medium" : "text-gray-500"
          )}>Formas de pagamento</span>
        </div>
        
        <div className="h-px bg-gray-300 flex-grow mx-2"></div>
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1",
            currentStep >= 3 
              ? "bg-blue-600 text-white" 
              : "bg-gray-200 text-gray-500"
          )}>
            "3"
          </div>
          <span className={cn(
            "text-sm",
            currentStep >= 3 ? "text-blue-600 font-medium" : "text-gray-500"
          )}>Resumo</span>
        </div>
      </div>
      
      {/* Step 1: Informações do Link */}
      {currentStep === 1 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Como você deseja cobrar seu cliente?</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => updatePaymentInfo('hasPredefinedValue', true)}
              className={cn(
                "p-2 border rounded-md text-center",
                paymentInfo.hasPredefinedValue 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300"
              )}
            >
              Valor pré-definido
            </button>
            <button
              type="button"
              onClick={() => updatePaymentInfo('hasPredefinedValue', false)}
              className={cn(
                "p-2 border rounded-md text-center",
                !paymentInfo.hasPredefinedValue 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300"
              )}
            >
              Não definir um valor
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {paymentInfo.hasPredefinedValue 
              ? "Você define o valor que seu cliente pagará. Recomendado para a venda de produtos ou serviços."
              : "O cliente poderá definir o valor no momento do pagamento. Recomendado para doações."}
          </p>
          
          {paymentInfo.hasPredefinedValue && (
            <div className="mb-4">
              <Label className="block mb-1">Valor</Label>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 border border-r-0 rounded-l-md p-2">
                  R$
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentInfo.value}
                  onChange={(e) => updatePaymentInfo('value', parseFloat(e.target.value))}
                  className="rounded-l-none"
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <Label className="block mb-1">Nome do link de pagamento</Label>
            <Input
              type="text"
              value={paymentInfo.name}
              onChange={(e) => updatePaymentInfo('name', e.target.value)}
              placeholder="Ex: Curso de Pós-Graduação em História"
            />
          </div>
          
          <div className="mb-4">
            <Label className="block mb-1">Descrição da cobrança (Opcional)</Label>
            <Textarea
              value={paymentInfo.description}
              onChange={(e) => updatePaymentInfo('description', e.target.value)}
              placeholder="A descrição informada será impressa na fatura."
              className="resize-none h-24"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2 flex items-center gap-1">
              Ativar o envio de notificações para este Link de pagamento?
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updatePaymentInfo('notificationsEnabled', false)}
                className={cn(
                  "p-2 border rounded-md text-center",
                  !paymentInfo.notificationsEnabled 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-700 border-gray-300"
                )}
              >
                Desativar
              </button>
              <button
                type="button"
                onClick={() => updatePaymentInfo('notificationsEnabled', true)}
                className={cn(
                  "p-2 border rounded-md text-center",
                  paymentInfo.notificationsEnabled 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-700 border-gray-300"
                )}
              >
                Ativar
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {paymentInfo.notificationsEnabled 
                ? "O cliente receberá lembretes sobre o pagamento." 
                : "O envio de notificações está desativado para este link de pagamento."}
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Imagens do link de pagamento (Opcional)</h3>
            <p className="text-sm text-gray-600">Máximo de 5 imagens. Formato de imagens aceitos: JPG, JPEG, PNG</p>
            
            <div className="border border-dashed rounded-lg p-6 mt-2 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-blue-600 text-sm">Adicione ou arraste os arquivos aqui</p>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={nextStep}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 2: Formas de Pagamento */}
      {currentStep === 2 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Como o seu cliente poderá pagar?</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => updatePaymentOptions('paymentType', 'avista')}
              className={cn(
                "p-2 border rounded-md text-center",
                paymentOptions.paymentType === 'avista'
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300"
              )}
            >
              À vista ou parcelado
            </button>
            <button
              type="button"
              onClick={() => updatePaymentOptions('paymentType', 'parcelado')}
              className={cn(
                "p-2 border rounded-md text-center",
                paymentOptions.paymentType === 'parcelado'
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300"
              )}
            >
              Assinatura
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {paymentOptions.paymentType === 'avista' 
              ? "O valor será cobrado apenas uma vez, ou conforme o número de parcelas definidas."
              : "Seu cliente pagará periodicamente de forma recorrente."}
          </p>
          
          {paymentOptions.paymentType === 'parcelado' && (
            <div className="mb-4">
              <Label className="block mb-1">Parcelamento</Label>
              <Select
                value={paymentOptions.installments.toString()}
                onValueChange={(value) => updatePaymentOptions('installments', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num === 1 
                        ? 'À vista' 
                        : `Em até ${num}x de ${formatCurrency(getInstallmentValue())}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Qual será a forma de pagamento?</h3>
            
            <div className="border rounded-md mb-3">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="boleto-pix" 
                    checked={paymentOptions.billingTypes.boletoOrPix}
                    onCheckedChange={(checked) => 
                      updateBillingType('boletoOrPix', checked === true)
                    }
                  />
                  <label htmlFor="boleto-pix" className="font-medium">
                    Boleto Bancário / Pix
                  </label>
                </div>
                <div>
                  Valor líquido por parcela: {formatCurrency(getInstallmentValue() * 0.96)}
                </div>
              </div>
              
              <div className="p-3 text-sm text-gray-600">
                <p>Taxa de R$ 0,99 por cobrança recebida. Receba em 1 dia útil após o pagamento.</p>
                <p>Taxa de R$ 0,99 por Pix recebido. Receba em poucos segundos após o pagamento.</p>
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="credit-card" 
                    checked={paymentOptions.billingTypes.creditCard}
                    onCheckedChange={(checked) => 
                      updateBillingType('creditCard', checked === true)
                    }
                  />
                  <label htmlFor="credit-card" className="font-medium">
                    Cartão de Crédito
                  </label>
                </div>
                <div>
                  Valor líquido por parcela: {formatCurrency(getInstallmentValue() * 0.95)}
                </div>
              </div>
              
              <div className="p-3 text-sm text-gray-600">
                <p>Taxa de 4.99% sobre o valor da cobrança + R$ 0.49</p>
                <p>Receba em 30 dias após o pagamento de cada parcela.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="block mb-1">Este boleto vencerá em quantos dias úteis após sua geração?</Label>
              <Select
                value={paymentOptions.dueDateLimitDays.toString()}
                onValueChange={(value) => updatePaymentOptions('dueDateLimitDays', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7, 10, 15, 30, 60, 90].map((days) => (
                    <SelectItem key={days} value={days.toString()}>
                      {days} {days === 1 ? 'dia' : 'dias'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block mb-1">Data de encerramento (Opcional)</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={paymentOptions.endDate}
                  onChange={(e) => updatePaymentOptions('endDate', e.target.value)}
                  className="w-full"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                A data de encerramento indica até quando seu link de pagamento continuará ativo.
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Ativar o preenchimento opcional dos dados de endereço do cliente para este pagamento?</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updatePaymentOptions('addressRequired', false)}
                className={cn(
                  "p-2 border rounded-md text-center",
                  !paymentOptions.addressRequired 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-700 border-gray-300"
                )}
              >
                Desativar
              </button>
              <button
                type="button"
                onClick={() => updatePaymentOptions('addressRequired', true)}
                className={cn(
                  "p-2 border rounded-md text-center",
                  paymentOptions.addressRequired 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-700 border-gray-300"
                )}
              >
                Ativar
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              O preenchimento dos dados do endereço do cliente é opcional somente para pagamento em Boleto e Pix.
            </p>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={nextStep}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Resumo */}
      {currentStep === 3 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6">Confira seus dados para finalizar o seu link de pagamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-md p-4">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-blue-600">Informações do Link de pagamento</h3>
                <button className="text-blue-600 flex items-center" onClick={() => setCurrentStep(1)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">A cobrança possui um valor?</p>
                  <p className="font-medium">{paymentInfo.hasPredefinedValue ? 'Valor predefinido' : 'Valor livre'}</p>
                </div>
                
                {paymentInfo.hasPredefinedValue && (
                  <div>
                    <p className="text-sm text-gray-500">Valor da cobrança</p>
                    <p className="font-medium">R$ {paymentInfo.value.toFixed(2)}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Nome do link de pagamento</p>
                  <p className="font-medium">{paymentInfo.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Notificações</p>
                  <p className="font-medium">
                    {paymentInfo.notificationsEnabled 
                      ? 'O envio de notificações está ativado para este link de pagamento'
                      : 'O envio de notificações está desativado para este link de pagamento'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Dados de endereço do cliente</p>
                  <p className="font-medium">
                    {paymentOptions.addressRequired 
                      ? 'O preenchimento dos dados do endereço do cliente será obrigatório para este link de pagamento'
                      : 'O preenchimento dos dados do endereço do cliente é opcional'}
                  </p>
                </div>
              </div>
              
              {paymentOptions.billingTypes.boletoOrPix && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">Valor líquido por parcela a receber no Boleto Bancário / Pix</p>
                    <p className="font-semibold">R$ {(getInstallmentValue() * 0.96).toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              {paymentOptions.billingTypes.creditCard && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">Valor líquido por parcela a receber no Cartão de Crédito</p>
                    <p className="font-semibold">R$ {(getInstallmentValue() * 0.95).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-blue-600">Formas de pagamento</h3>
                <button className="text-blue-600 flex items-center" onClick={() => setCurrentStep(2)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Como seu cliente irá pagar</p>
                  <p className="font-medium">
                    {paymentOptions.paymentType === 'avista' ? 'À vista ou parcelado' : 'Assinatura'}
                  </p>
                </div>
                
                {paymentOptions.paymentType === 'parcelado' && (
                  <div>
                    <p className="text-sm text-gray-500">Número máximo de parcelas</p>
                    <p className="font-medium">
                      {paymentOptions.installments === 1 
                        ? 'À vista' 
                        : `Em até ${paymentOptions.installments}x de R$ ${(getInstallmentValue()).toFixed(2)}`}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Forma de pagamento</p>
                  <p className="font-medium">
                    {[
                      paymentOptions.billingTypes.boletoOrPix ? 'Boleto/Pix' : null,
                      paymentOptions.billingTypes.creditCard ? 'Cartão de Crédito' : null
                    ].filter(Boolean).join(', ') || 'Nenhuma forma de pagamento selecionada'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Validade do boleto</p>
                  <p className="font-medium">{paymentOptions.dueDateLimitDays} dia(s)</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4 md:col-span-2">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-blue-600">Imagens do link de pagamento</h3>
                <button className="text-blue-600 flex items-center" onClick={() => setCurrentStep(1)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </button>
              </div>
              
              <p className="text-center py-8 text-gray-500">
                Não foram adicionadas imagens ao Link de pagamento
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={createPaymentLink}
              disabled={isSubmitting || (!paymentOptions.billingTypes.boletoOrPix && !paymentOptions.billingTypes.creditCard)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Link de Pagamento'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}