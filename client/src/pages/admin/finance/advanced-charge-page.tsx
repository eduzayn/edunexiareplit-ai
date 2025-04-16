/**
 * Página avançada de criação de cobranças
 * 
 * Esta página expande as funcionalidades da página simples de cobranças,
 * adicionando suporte para parcelamento, juros, multas e descontos.
 * 
 * IMPORTANTE: Esta página foi criada como complemento à implementação
 * estável existente e não afeta o funcionamento da página original.
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeftIcon, CreditCardIcon, InvoiceIcon, SaveIcon, InfoIcon } from "@/components/ui/icons";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipo para cliente
type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
};

// Tipo para parcelamento
type Installment = {
  number: number;
  description: string;
  value: number;
};

// Tipo para desconto
type DiscountType = 'FIXED' | 'PERCENTAGE';

// Tipo para juros/multa
type FineType = 'FIXED' | 'PERCENTAGE';

export default function AdvancedChargePage() {
  const [, navigate] = useLocation();
  
  // Estado do formulário - Dados básicos
  const [customerId, setCustomerId] = useState("");
  const [value, setValue] = useState("");
  const [numericValue, setNumericValue] = useState(0);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingType, setBillingType] = useState("BOLETO");
  const [externalReference, setExternalReference] = useState("");
  
  // Estado do formulário - Parcelamento
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [installmentValue, setInstallmentValue] = useState<number>(0);
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Estado do formulário - Desconto
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("FIXED");
  const [discountValue, setDiscountValue] = useState("");
  const [discountDueDateLimitDays, setDiscountDueDateLimitDays] = useState(0);
  
  // Estado do formulário - Juros e Multa
  const [fineEnabled, setFineEnabled] = useState(false);
  const [fineType, setFineType] = useState<FineType>("PERCENTAGE");
  const [fineValue, setFineValue] = useState("");
  
  // Estado do formulário - Juros
  const [interestEnabled, setInterestEnabled] = useState(false);
  const [interestValue, setInterestValue] = useState("");
  
  // Estado de submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Buscar clientes do Asaas
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/debug/asaas-customers"],
    staleTime: 60000, // 1 minuto
  });

  const customers: AsaasCustomer[] = customersData?.data || [];

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    const numericValue = value.replace(/\\D/g, "");
    
    // Converte para formato flutuante (divide por 100 para tratar centavos)
    const floatValue = Number(numericValue) / 100;
    
    // Retorna valor formatado como moeda
    return floatValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Manipuladores de eventos - Campos básicos
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove formatação, mantém apenas números
    const numericValue = e.target.value.replace(/\\D/g, "");
    
    // Se estiver vazio, limpa o campo
    if (!numericValue) {
      setValue("");
      setNumericValue(0);
      return;
    }
    
    // Converte para valor numérico
    const floatValue = Number(numericValue) / 100;
    setNumericValue(floatValue);
    
    // Formata como moeda
    setValue(formatCurrency(numericValue));
    
    // Atualiza valor da parcela se o parcelamento estiver habilitado
    if (installmentEnabled && installmentCount > 1) {
      calculateInstallments(floatValue, installmentCount);
    }
  };
  
  // Função para extrair valor numérico de um valor formatado como moeda
  const extractNumericValue = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/\\D/g, "");
    return Number(numericValue) / 100;
  };
  
  // Manipuladores de eventos - Parcelamento
  const handleInstallmentChange = (value: string) => {
    const count = parseInt(value);
    setInstallmentCount(count);
    
    if (count > 1) {
      setInstallmentEnabled(true);
      calculateInstallments(numericValue, count);
    } else {
      setInstallmentEnabled(false);
      setInstallments([]);
    }
  };
  
  // Calcular parcelas
  const calculateInstallments = (totalValue: number, count: number) => {
    if (count <= 1 || totalValue <= 0) {
      setInstallments([]);
      setInstallmentValue(0);
      return;
    }
    
    // Calcular valor da parcela (arredondando para 2 casas decimais)
    const installmentVal = Math.floor((totalValue * 100) / count) / 100;
    setInstallmentValue(installmentVal);
    
    // Criar array de parcelas
    const installmentArray: Installment[] = [];
    
    for (let i = 1; i <= count; i++) {
      installmentArray.push({
        number: i,
        description: `Parcela ${i} de ${count}`,
        value: installmentVal
      });
    }
    
    // Adicionar diferença na última parcela para evitar problemas de arredondamento
    const totalCalc = installmentVal * count;
    if (totalCalc !== totalValue) {
      const diff = totalValue - totalCalc;
      installmentArray[count - 1].value = installmentVal + diff;
    }
    
    setInstallments(installmentArray);
  };
  
  // Manipuladores de eventos - Desconto
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountValue(e.target.value);
  };
  
  // Manipuladores de eventos - Juros/Multa
  const handleFineValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFineValue(e.target.value);
  };
  
  const handleInterestValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterestValue(e.target.value);
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!customerId) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione o cliente para a cobrança",
        variant: "destructive",
      });
      return;
    }

    if (!value || numericValue <= 0) {
      toast({
        title: "Valor obrigatório",
        description: "Informe o valor da cobrança",
        variant: "destructive",
      });
      return;
    }

    if (!description) {
      toast({
        title: "Descrição obrigatória",
        description: "Informe a descrição da cobrança",
        variant: "destructive",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Data de vencimento obrigatória",
        description: "Informe a data de vencimento da cobrança",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Preparar dados da cobrança
      const chargeData: any = {
        customerId,
        value: numericValue,
        description,
        dueDate,
        billingType,
        externalReference: externalReference || undefined,
      };
      
      // Adicionar configurações de parcelamento, se habilitado
      if (installmentEnabled && installmentCount > 1) {
        chargeData.installmentCount = installmentCount;
        chargeData.installmentValue = installmentValue;
      }
      
      // Adicionar configurações de desconto, se habilitado
      if (discountEnabled && discountValue) {
        const discountValueNum = discountType === 'PERCENTAGE' 
          ? parseFloat(discountValue)
          : extractNumericValue(discountValue);
          
        chargeData.discount = {
          value: discountValueNum,
          dueDateLimitDays: discountDueDateLimitDays || 0,
          type: discountType
        };
      }
      
      // Adicionar configurações de multa, se habilitado
      if (fineEnabled && fineValue) {
        const fineValueNum = fineType === 'PERCENTAGE' 
          ? parseFloat(fineValue)
          : extractNumericValue(fineValue);
          
        chargeData.fine = {
          value: fineValueNum,
          type: fineType
        };
      }
      
      // Adicionar configurações de juros, se habilitado
      if (interestEnabled && interestValue) {
        chargeData.interest = {
          value: parseFloat(interestValue),
          type: 'PERCENTAGE'
        };
      }

      console.log("Enviando cobrança:", chargeData);

      // Usar fetch diretamente para evitar problemas com o tipo da requisição
      const response = await fetch("/api/debug/asaas-create-charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chargeData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Erro ao criar cobrança");
      }

      console.log("Resposta da criação de cobrança:", responseData);
      
      // Invalidar o cache para forçar recarregamento dos dados
      queryClient.invalidateQueries({ queryKey: ["/api/debug/asaas-charges"] });

      toast({
        title: "Cobrança criada com sucesso",
        description: `A cobrança foi criada com o ID: ${responseData.data.id}`,
      });

      // Redirecionar para a lista de cobranças
      navigate("/admin/finance/charges");
      
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      toast({
        title: "Erro ao criar cobrança",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a cobrança. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
              onClick={() => navigate("/admin/finance/charges")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nova Cobrança Avançada</h1>
              <p className="text-gray-500">
                Crie uma nova cobrança com opções avançadas de parcelamento, juros e descontos
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <InvoiceIcon className="mr-2 h-5 w-5" />
              Criar Cobrança
            </CardTitle>
            <CardDescription>
              Configure todos os parâmetros da cobrança incluindo parcelamento, descontos e multas
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid grid-cols-3 md:grid-cols-4">
                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                <TabsTrigger value="installment">Parcelamento</TabsTrigger>
                <TabsTrigger value="discount">Desconto</TabsTrigger>
                <TabsTrigger value="interest" className="hidden md:flex">Juros e Multa</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit}>
                {/* Aba Dados Básicos */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cliente */}
                    <div className="space-y-2">
                      <Label htmlFor="customer" className="flex items-center">
                        Cliente*
                      </Label>
                      <Select
                        value={customerId}
                        onValueChange={setCustomerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCustomers ? (
                            <SelectItem value="loading" disabled>
                              Carregando clientes...
                            </SelectItem>
                          ) : customers && customers.length > 0 ? (
                            customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} - CPF/CNPJ: {customer.cpfCnpj}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              Nenhum cliente encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Valor */}
                    <div className="space-y-2">
                      <Label htmlFor="value" className="flex items-center">
                        Valor*
                      </Label>
                      <Input
                        id="value"
                        value={value}
                        onChange={handleValueChange}
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="flex items-center">
                        Descrição*
                      </Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Matrícula Curso de Pedagogia"
                      />
                    </div>

                    {/* Data de Vencimento */}
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className="flex items-center">
                        Data de Vencimento*
                      </Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-2">
                      <Label htmlFor="billingType" className="flex items-center">
                        Forma de Pagamento*
                      </Label>
                      <Select
                        value={billingType}
                        onValueChange={setBillingType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                          <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          <SelectItem value="PIX">Pix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Referência Externa */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="externalReference" className="flex items-center">
                        Referência Externa (opcional)
                      </Label>
                      <Input
                        id="externalReference"
                        value={externalReference}
                        onChange={(e) => setExternalReference(e.target.value)}
                        placeholder="Código de referência do seu sistema (opcional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use este campo para armazenar uma referência do seu sistema.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/finance/charges")}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("installment")}
                    >
                      Próximo: Parcelamento
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Aba Parcelamento */}
                <TabsContent value="installment" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="installment-enabled" 
                        checked={installmentEnabled}
                        onCheckedChange={(checked) => setInstallmentEnabled(checked === true)}
                      />
                      <Label htmlFor="installment-enabled" className="font-medium">
                        Habilitar parcelamento
                      </Label>
                    </div>
                    
                    {installmentEnabled && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="installmentCount">
                              Número de Parcelas
                            </Label>
                            <Select
                              value={installmentCount.toString()}
                              onValueChange={handleInstallmentChange}
                              disabled={!installmentEnabled}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o número de parcelas" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num === 1 ? 'À vista' : `${num} parcelas`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="installmentValue">
                              Valor da Parcela
                            </Label>
                            <Input
                              id="installmentValue"
                              value={installmentValue.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                              readOnly
                              disabled={!installmentEnabled}
                            />
                          </div>
                        </div>
                        
                        {installments.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium mb-2">Simulação de parcelas:</h3>
                            <div className="bg-gray-50 p-4 rounded-md max-h-48 overflow-y-auto">
                              <ul className="space-y-2">
                                {installments.map((inst) => (
                                  <li key={inst.number} className="flex justify-between text-sm">
                                    <span>{inst.description}</span>
                                    <span className="font-medium">
                                      {inst.value.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      })}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic")}
                    >
                      Voltar: Dados Básicos
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("discount")}
                    >
                      Próximo: Desconto
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Aba Desconto */}
                <TabsContent value="discount" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="discount-enabled" 
                        checked={discountEnabled}
                        onCheckedChange={(checked) => setDiscountEnabled(checked === true)}
                      />
                      <Label htmlFor="discount-enabled" className="font-medium">
                        Aplicar desconto
                      </Label>
                    </div>
                    
                    {discountEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="discountType">
                            Tipo de Desconto
                          </Label>
                          <Select
                            value={discountType}
                            onValueChange={(value) => setDiscountType(value as DiscountType)}
                            disabled={!discountEnabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de desconto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                              <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="discountValue">
                            {discountType === 'PERCENTAGE' ? 'Percentual de Desconto (%)' : 'Valor do Desconto (R$)'}
                          </Label>
                          <Input
                            id="discountValue"
                            value={discountValue}
                            onChange={handleDiscountValueChange}
                            placeholder={discountType === 'PERCENTAGE' ? '0.00' : 'R$ 0,00'}
                            disabled={!discountEnabled}
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="discountDueDateLimitDays">
                            Prazo máximo para desconto (dias antes do vencimento)
                          </Label>
                          <Select
                            value={discountDueDateLimitDays.toString()}
                            onValueChange={(value) => setDiscountDueDateLimitDays(parseInt(value))}
                            disabled={!discountEnabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o prazo para desconto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Até a data de vencimento</SelectItem>
                              <SelectItem value="1">1 dia antes do vencimento</SelectItem>
                              <SelectItem value="2">2 dias antes do vencimento</SelectItem>
                              <SelectItem value="3">3 dias antes do vencimento</SelectItem>
                              <SelectItem value="5">5 dias antes do vencimento</SelectItem>
                              <SelectItem value="7">7 dias antes do vencimento</SelectItem>
                              <SelectItem value="10">10 dias antes do vencimento</SelectItem>
                              <SelectItem value="15">15 dias antes do vencimento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("installment")}
                    >
                      Voltar: Parcelamento
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("interest")}
                    >
                      Próximo: Juros e Multa
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Aba Juros e Multa */}
                <TabsContent value="interest" className="space-y-6">
                  <div className="space-y-6">
                    {/* Multa */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="fine-enabled" 
                          checked={fineEnabled}
                          onCheckedChange={(checked) => setFineEnabled(checked === true)}
                        />
                        <Label htmlFor="fine-enabled" className="font-medium">
                          Aplicar multa por atraso
                        </Label>
                      </div>
                      
                      {fineEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="fineType">
                              Tipo de Multa
                            </Label>
                            <Select
                              value={fineType}
                              onValueChange={(value) => setFineType(value as FineType)}
                              disabled={!fineEnabled}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de multa" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="fineValue">
                              {fineType === 'PERCENTAGE' ? 'Percentual da Multa (%)' : 'Valor da Multa (R$)'}
                            </Label>
                            <Input
                              id="fineValue"
                              value={fineValue}
                              onChange={handleFineValueChange}
                              placeholder={fineType === 'PERCENTAGE' ? '0.00' : 'R$ 0,00'}
                              disabled={!fineEnabled}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Juros */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="interest-enabled" 
                          checked={interestEnabled}
                          onCheckedChange={(checked) => setInterestEnabled(checked === true)}
                        />
                        <Label htmlFor="interest-enabled" className="font-medium">
                          Aplicar juros ao mês
                        </Label>
                      </div>
                      
                      {interestEnabled && (
                        <div className="grid grid-cols-1 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="interestValue">
                              Percentual de Juros ao Mês (%)
                            </Label>
                            <Input
                              id="interestValue"
                              value={interestValue}
                              onChange={handleInterestValueChange}
                              placeholder="0.00"
                              disabled={!interestEnabled}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Os juros são sempre calculados ao mês, com base no percentual informado.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("discount")}
                    >
                      Voltar: Desconto
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <SaveIcon className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Criando cobrança..." : "Criar Cobrança"}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}