/**
 * Página de criação de cobranças recorrentes (assinaturas)
 * 
 * Esta página permite criar assinaturas recorrentes integradas ao Asaas.
 * Acessível através do módulo de cobranças para uma experiência unificada.
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeftIcon,
  InfoIcon, 
  CalendarIcon,
  RepeatIcon,
  CheckIcon, 
  AlertTriangleIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Interface para cliente Asaas
interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export default function SubscriptionChargePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Estados do formulário
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [nextDueDate, setNextDueDate] = useState("");
  const [discount, setDiscount] = useState({ value: "", dueDateLimitDays: "" });
  const [fine, setFine] = useState({ value: "" });
  const [interest, setInterest] = useState({ value: "" });
  const [maxInstallments, setMaxInstallments] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Carregar clientes da API Asaas
  const { data: customers = { data: [] }, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/debug/asaas-customers'],
    refetchOnWindowFocus: false,
  });

  // Formatar valor como moeda
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setValue('');
      return;
    }
    const formattedValue = (parseInt(value) / 100).toFixed(2);
    setValue(formattedValue);
  };

  // Validar campos obrigatórios
  const validateForm = () => {
    if (!selectedCustomer) {
      toast({
        title: "Cliente não selecionado",
        description: "Selecione um cliente para criar a assinatura.",
        variant: "destructive",
      });
      return false;
    }

    if (!value || parseFloat(value) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Insira um valor válido para a assinatura.",
        variant: "destructive",
      });
      return false;
    }

    if (!nextDueDate) {
      toast({
        title: "Data de vencimento não definida",
        description: "Defina a data do primeiro vencimento da assinatura.",
        variant: "destructive",
      });
      return false;
    }

    if (!description) {
      toast({
        title: "Descrição não preenchida",
        description: "Adicione uma descrição para a assinatura.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Criar assinatura
  const handleCreateSubscription = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    
    try {
      const subscriptionData = {
        customer: selectedCustomer,
        billingType: "CREDIT_CARD", // Definido explicitamente como cartão de crédito
        value: parseFloat(value),
        nextDueDate,
        description,
        cycle: billingCycle,
        discount: discount.value ? {
          value: parseFloat(discount.value),
          dueDateLimitDays: parseInt(discount.dueDateLimitDays) || 0
        } : undefined,
        fine: fine.value ? {
          value: parseFloat(fine.value)
        } : undefined,
        interest: interest.value ? {
          value: parseFloat(interest.value)
        } : undefined,
        maxInstallments: maxInstallments ? parseInt(maxInstallments) : undefined,
        endDate: endDate || undefined,
        sendEmail: isEmailEnabled,
        status: isActive ? "ACTIVE" : "INACTIVE"
      };

      const response = await fetch("/api/debug/asaas-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Assinatura criada com sucesso",
          description: `A assinatura recorrente foi criada e associada ao cliente ${data.customerName || ''}`,
        });
        
        // Redirecionar para a página de cobranças
        navigate("/admin/finance/charges");
      } else {
        throw new Error(data.message || "Erro ao criar assinatura");
      }
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
      toast({
        title: "Erro ao criar assinatura",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              className="mr-2"
              onClick={() => navigate("/admin/finance/charges")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Nova Assinatura</h1>
          </div>
          <Badge className="bg-blue-600">Cobrança Recorrente</Badge>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Assinatura por Cartão de Crédito</h2>
                <p className="opacity-90">Cobrança recorrente automática estilo Netflix</p>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="flex items-center space-x-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                <CheckIcon className="h-4 w-4" />
                <span>Renovação Automática</span>
              </span>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Detalhes da Assinatura</CardTitle>
            <CardDescription>
              Crie uma cobrança recorrente que será gerada automaticamente conforme o ciclo definido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customer" className="mb-2 block">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedCustomer || undefined} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer" className="w-full">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCustomers ? (
                      <SelectItem value="loading" disabled>
                        Carregando clientes...
                      </SelectItem>
                    ) : customers?.data && customers.data.length > 0 ? (
                      customers.data.map((customer: AsaasCustomer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.cpfCnpj})
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

              <div>
                <Label htmlFor="value" className="mb-2 block">
                  Valor da assinatura <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="value"
                    type="text"
                    value={value}
                    onChange={handleValueChange}
                    className="pl-8"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billing-cycle" className="mb-2 block">
                  Ciclo de Cobrança <span className="text-red-500">*</span>
                </Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger id="billing-cycle">
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="next-due-date" className="mb-2 block">
                  Data do primeiro vencimento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="next-due-date"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description" className="mb-2 block">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Mensalidade do curso de Pós-Graduação"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-medium mb-4">Configurações Adicionais</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="end-date" className="mb-2 block flex items-center justify-between">
                  <span>Data de término (opcional)</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>A assinatura será encerrada automaticamente nesta data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="max-installments" className="mb-2 block flex items-center justify-between">
                  <span>Máximo de cobranças (opcional)</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Quantidade máxima de cobranças que serão geradas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="max-installments"
                  type="number"
                  min="1"
                  value={maxInstallments}
                  onChange={(e) => setMaxInstallments(e.target.value)}
                  placeholder="Sem limite"
                />
              </div>

              <div>
                <Label htmlFor="discount" className="mb-2 block">Desconto por pagamento antecipado</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <Input
                      id="discount"
                      type="text"
                      className="pl-8"
                      placeholder="0,00"
                      value={discount.value}
                      onChange={(e) => setDiscount({...discount, value: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Dias"
                      min="1"
                      max="30"
                      value={discount.dueDateLimitDays}
                      onChange={(e) => setDiscount({...discount, dueDateLimitDays: e.target.value})}
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">dias antes</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fine" className="mb-2 block">Multa por atraso (%)</Label>
                  <Input
                    id="fine"
                    type="text"
                    placeholder="0,00"
                    value={fine.value}
                    onChange={(e) => setFine({value: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="interest" className="mb-2 block">Juros por atraso (% a.m.)</Label>
                  <Input
                    id="interest"
                    type="text"
                    placeholder="0,00"
                    value={interest.value}
                    onChange={(e) => setInterest({value: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="email-notification" checked={isEmailEnabled} onCheckedChange={setIsEmailEnabled} />
                <Label htmlFor="email-notification">Enviar e-mail de cobrança ao cliente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active-status" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active-status">Assinatura ativa (início imediato)</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/finance/charges")}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubscription} 
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>Criando assinatura...</>
              ) : (
                <>
                  <RepeatIcon className="h-4 w-4" />
                  Criar Assinatura
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-6 mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Assinaturas recorrentes são automáticas e geram cobranças de acordo com o ciclo definido.
                  As cobranças geradas aparecerão na lista de cobranças com um indicador de recorrência.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Pagamento com Cartão de Crédito</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Esta assinatura será processada através de cartão de crédito, similar ao modelo utilizado pela Netflix. 
                  O cliente receberá um e-mail com link para cadastrar os dados do cartão, e as cobranças serão renovadas 
                  automaticamente a cada ciclo sem necessidade de nova intervenção.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}