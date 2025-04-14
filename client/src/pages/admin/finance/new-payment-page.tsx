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
  CardDescription 
} from "@/components/ui/card";
import { ArrowLeftIcon, CalendarIcon, PaymentsIcon, SaveIcon } from "@/components/ui/icons";

// Schema de validação para registro de pagamento
const formSchema = z.object({
  invoiceId: z.string().min(1, { message: "Selecione a fatura" }),
  clientId: z.string().min(1, { message: "Selecione o cliente" }),
  amount: z.coerce.number().min(0.01, { message: "Valor deve ser maior que zero" }),
  method: z.string().min(1, { message: "Selecione o método de pagamento" }),
  paymentDate: z.date({
    required_error: "Data de pagamento é obrigatória",
  }),
  status: z.string().min(1, { message: "Selecione o status" }),
  transactionId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewPaymentPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Dados simulados de clientes - será substituído por dados da API
  const mockClients = [
    { id: "1", name: "Empresa ABC Ltda" },
    { id: "2", name: "Instituto Educacional XYZ" },
    { id: "3", name: "Faculdade Metropolitana" },
    { id: "4", name: "Centro de Ensino Superior" },
    { id: "5", name: "Universidade Federal" },
  ];

  // Dados simulados de faturas - será substituído por dados da API
  const mockInvoices = [
    { id: "1", number: "FAT-2304-0001", clientId: "1", amount: 12990.00, dueDate: "2025-04-20", status: "pending" },
    { id: "2", number: "FAT-2304-0002", clientId: "2", amount: 9990.00, dueDate: "2025-04-15", status: "pending" },
    { id: "3", number: "FAT-2304-0003", clientId: "3", amount: 1990.00, dueDate: "2025-04-10", status: "pending" },
    { id: "4", number: "FAT-2304-0004", clientId: "1", amount: 5000.00, dueDate: "2025-04-30", status: "pending" },
    { id: "5", number: "FAT-2304-0005", clientId: "4", amount: 790.00, dueDate: "2025-05-05", status: "pending" },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceId: "",
      clientId: "",
      amount: 0,
      method: "",
      paymentDate: new Date(),
      status: "completed",
      transactionId: "",
      notes: "",
    },
  });

  // Função para carregar informações da fatura selecionada
  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = mockInvoices.find(i => i.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      form.setValue("clientId", invoice.clientId);
      form.setValue("amount", invoice.amount);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Quando tivermos a API, enviaremos a requisição para o servidor
      console.log("Enviando dados do pagamento:", data);

      /*
      // Exemplo de como será a implementação da API
      await apiRequest({
        url: "/api/finance/payments",
        method: "POST",
        data,
      });
      
      // Invalidar cache para forçar recarregamento dos pagamentos
      queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
      // Invalidar cache das faturas também, pois o status pode mudar
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      */

      toast({
        title: "Pagamento registrado com sucesso",
        description: `Pagamento no valor de ${data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi registrado.`,
      });

      // Redirecionar para a lista de pagamentos
      navigate("/admin/finance/payments");
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: "Ocorreu um erro ao registrar o pagamento. Tente novamente.",
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
              onClick={() => navigate("/admin/finance/payments")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Registrar Pagamento</h1>
              <p className="text-gray-500">
                Registre um novo pagamento no sistema
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PaymentsIcon className="mr-2 h-5 w-5" />
              Informações do Pagamento
            </CardTitle>
            {selectedInvoice && (
              <CardDescription>
                Registrando pagamento para a fatura {selectedInvoice.number}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fatura*</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleInvoiceSelect(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a fatura" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockInvoices
                              .filter(invoice => invoice.status === "pending")
                              .map(invoice => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                  {invoice.number} - {mockClients.find(c => c.id === invoice.clientId)?.name}
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
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!!selectedInvoice}
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
                        <FormDescription>
                          {selectedInvoice ? "Cliente da fatura selecionada" : "Selecione um cliente"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Pagamento*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0.01" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                            <SelectItem value="bank_slip">Boleto Bancário</SelectItem>
                            <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Pagamento*</FormLabel>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status do Pagamento*</FormLabel>
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
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="failed">Falhou</SelectItem>
                            <SelectItem value="refunded">Estornado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID da Transação</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Código/ID da transação" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Número da transação do gateway de pagamento, se aplicável
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o pagamento"
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/admin/finance/payments")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Registrar Pagamento
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