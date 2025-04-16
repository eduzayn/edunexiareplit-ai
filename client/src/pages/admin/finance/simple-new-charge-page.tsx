import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CardFooter 
} from "@/components/ui/card";
import { ArrowLeftIcon, InvoiceIcon, SaveIcon } from "@/components/ui/icons";
import { apiRequest } from "@/lib/queryClient";

// Tipo para cliente
type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
};

export default function SimpleNewChargePage() {
  const [, navigate] = useLocation();
  
  // Estado do formulário
  const [customerId, setCustomerId] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingType, setBillingType] = useState("PIX");
  const [externalReference, setExternalReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar clientes do Asaas
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/debug/asaas-customers"],
    staleTime: 60000, // 1 minuto
  });

  const customers: AsaasCustomer[] = customersData?.data || [];

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    const numericValue = value.replace(/\D/g, "");
    
    // Converte para formato flutuante (divide por 100 para tratar centavos)
    const floatValue = Number(numericValue) / 100;
    
    // Retorna valor formatado como moeda
    return floatValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Manipuladores de eventos
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove formatação, mantém apenas números
    const numericValue = e.target.value.replace(/\D/g, "");
    
    // Se estiver vazio, limpa o campo
    if (!numericValue) {
      setValue("");
      return;
    }
    
    // Formata como moeda
    setValue(formatCurrency(numericValue));
  };

  // Função para extrair valor numérico de um valor formatado como moeda
  const extractNumericValue = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/\D/g, "");
    return Number(numericValue) / 100;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione o cliente para a cobrança",
        variant: "destructive",
      });
      return;
    }

    if (!value) {
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
      const chargeData = {
        customerId,
        value: extractNumericValue(value),
        description,
        dueDate,
        billingType,
        externalReference: externalReference || undefined,
      };

      console.log("Enviando cobrança:", chargeData);

      // Enviar requisição para criar cobrança usando rota de debug
      const response = await apiRequest({
        url: "/api/debug/asaas-create-charge",
        method: "POST",
        data: chargeData,
      });

      console.log("Resposta da criação de cobrança:", response);

      toast({
        title: "Cobrança criada com sucesso",
        description: `A cobrança foi criada com o ID: ${response.data.id}`,
      });

      // Redirecionar para a lista de cobranças
      navigate("/admin/finance/charges");
      
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      toast({
        title: "Erro ao criar cobrança",
        description: "Ocorreu um erro ao criar a cobrança. Tente novamente.",
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
              <h1 className="text-3xl font-bold tracking-tight">Nova Cobrança</h1>
              <p className="text-gray-500">
                Crie uma nova cobrança para pagamento através do Asaas
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <InvoiceIcon className="mr-2 h-5 w-5" />
              Informações da Cobrança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente */}
                <div className="space-y-2">
                  <label htmlFor="customer" className="text-sm font-medium">
                    Cliente*
                  </label>
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
                  <label htmlFor="value" className="text-sm font-medium">
                    Valor*
                  </label>
                  <Input
                    id="value"
                    value={value}
                    onChange={handleValueChange}
                    placeholder="R$ 0,00"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descrição*
                  </label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Matrícula Curso de Pedagogia"
                  />
                </div>

                {/* Data de Vencimento */}
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Data de Vencimento*
                  </label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <label htmlFor="billingType" className="text-sm font-medium">
                    Forma de Pagamento*
                  </label>
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
                  <label htmlFor="externalReference" className="text-sm font-medium">
                    Referência Externa (opcional)
                  </label>
                  <Input
                    id="externalReference"
                    value={externalReference}
                    onChange={(e) => setExternalReference(e.target.value)}
                    placeholder="Código de referência do seu sistema (opcional)"
                  />
                  <p className="text-xs text-gray-500">
                    Use este campo para armazenar uma referência do seu sistema.
                  </p>
                </div>
              </div>

              <CardFooter className="flex justify-end px-0 pb-0">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Criando cobrança..." : "Criar Cobrança"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}