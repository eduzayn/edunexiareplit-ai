import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircleIcon,
  CheckIcon, 
  InfoIcon,
  Loader2Icon,
  SearchIcon,
} from "@/components/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "../lib/queryClient";

// Interface para os clientes do Asaas
interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

// Esquema de validação para o formulário de cobrança
const chargeFormSchema = z.object({
  customerId: z.string({
    required_error: "Por favor, selecione um cliente",
  }),
  billingType: z.enum(["BOLETO", "PIX", "CREDIT_CARD"], {
    required_error: "Por favor, selecione um método de pagamento",
  }),
  value: z.coerce.number({
    required_error: "Por favor, informe o valor",
    invalid_type_error: "O valor deve ser um número",
  }).min(1, {
    message: "O valor deve ser maior que zero",
  }),
  dueDate: z.string({
    required_error: "Por favor, selecione uma data de vencimento",
  }),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  postalService: z.boolean().default(false).optional(),
});

type ChargeFormValues = z.infer<typeof chargeFormSchema>;

export default function PublicCreateChargePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AsaasCustomer | null>(null);

  // Buscar clientes do Asaas
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/debug/asaas-customers"],
    enabled: true,
  });

  // Hoje + 7 dias para data padrão de vencimento
  const getDefaultDueDate = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  // Configuração do formulário
  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      billingType: "BOLETO",
      value: undefined,
      dueDate: getDefaultDueDate(),
      description: "",
      externalReference: "",
      postalService: false,
    },
  });

  // Mutação para criar cobrança
  const createChargeMutation = useMutation({
    mutationFn: async (data: ChargeFormValues) => {
      return apiRequest("/api/debug/asaas-create-charge", {
        method: "POST",
        data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Cobrança criada com sucesso",
        description: "A cobrança foi criada e o cliente será notificado.",
      });
      
      // Resetar o formulário
      form.reset();
      setSelectedCustomer(null);
      
      // Redirecionar para a página de cobranças
      setTimeout(() => {
        navigate("/public/charges");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cobrança",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar clientes baseado na busca
  const customers: AsaasCustomer[] = customersData && 'data' in customersData ? customersData.data : [];
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpfCnpj.includes(searchTerm)
  );

  // Formatador de CPF/CNPJ
  const formatCpfCnpj = (cpfCnpj: string) => {
    if (cpfCnpj.length === 11) {
      // CPF
      return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "$1.$2.$3-$4");
    } else if (cpfCnpj.length === 14) {
      // CNPJ
      return cpfCnpj.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,
        "$1.$2.$3/$4-$5"
      );
    }
    return cpfCnpj;
  };

  // Controlar a seleção de cliente
  const handleSelectCustomer = (customer: AsaasCustomer) => {
    setSelectedCustomer(customer);
    form.setValue("customerId", customer.id);
  };

  // Enviar formulário
  const onSubmit = (data: ChargeFormValues) => {
    if (!selectedCustomer) {
      toast({
        title: "Cliente não selecionado",
        description: "Por favor, selecione um cliente para criar a cobrança.",
        variant: "destructive",
      });
      return;
    }

    createChargeMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Nova Cobrança</CardTitle>
          <CardDescription>
            Crie uma nova cobrança para um cliente existente no Asaas
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna de seleção de cliente */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Selecionar Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar cliente por nome, email ou CPF/CNPJ"
                className="pl-9 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoadingCustomers ? (
              <div className="flex items-center justify-center p-4">
                <Loader2Icon className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Carregando clientes...</span>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {customer.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCpfCnpj(customer.cpfCnpj)}
                          </p>
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircleIcon className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-600">
                      Nenhum cliente encontrado com o termo "{searchTerm}"
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Tente outro termo de busca
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna do formulário de cobrança */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Detalhes da Cobrança</CardTitle>
            {selectedCustomer && (
              <CardDescription>
                Criando cobrança para {selectedCustomer.name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCustomer ? (
              <Alert className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Selecione um cliente</AlertTitle>
                <AlertDescription>
                  Para criar uma cobrança, primeiro selecione um cliente na coluna ao lado.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="billingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50">
                            <RadioGroupItem value="BOLETO" id="boleto" />
                            <Label htmlFor="boleto" className="cursor-pointer">Boleto</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50">
                            <RadioGroupItem value="PIX" id="pix" />
                            <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50">
                            <RadioGroupItem value="CREDIT_CARD" id="credit-card" />
                            <Label htmlFor="credit-card" className="cursor-pointer">Cartão de Crédito</Label>
                          </div>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o motivo da cobrança"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Esta descrição aparecerá no e-mail enviado ao cliente e
                          no boleto.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referência Externa</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Código de referência (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Código de referência do seu sistema, se houver.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createChargeMutation.isPending}
                    >
                      {createChargeMutation.isPending ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Criando cobrança...
                        </>
                      ) : (
                        "Criar Cobrança"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/public/charges")}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}