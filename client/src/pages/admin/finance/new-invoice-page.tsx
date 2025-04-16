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
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeftIcon, CalendarIcon, InvoiceIcon, PlusIcon, SaveIcon, TrashIcon } from "@/components/ui/icons";

// Schema de validação para criação de cobrança
const formSchema = z.object({
  clientId: z.string().min(1, { message: "Selecione o cliente" }),
  invoiceNumber: z.string().min(1, { message: "Número da cobrança é obrigatório" }),
  issueDate: z.date({
    required_error: "Data de emissão é obrigatória",
  }),
  dueDate: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  status: z.string().min(1, { message: "Selecione o status" }),
  notes: z.string().optional().or(z.literal("")),
  // Os itens serão gerenciados separadamente
});

// Schema para item da cobrança
const chargeItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, { message: "Descrição do item é obrigatória" }),
  quantity: z.number().min(1, { message: "Quantidade deve ser pelo menos 1" }),
  unitPrice: z.number().min(0, { message: "Preço unitário deve ser maior que zero" }),
  discount: z.number().min(0, { message: "Desconto não pode ser negativo" }).default(0),
  tax: z.number().min(0, { message: "Imposto não pode ser negativo" }).default(0),
});

type FormValues = z.infer<typeof formSchema>;
type ChargeItem = z.infer<typeof chargeItemSchema>;

export default function NewInvoicePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ChargeItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<ChargeItem>>({
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
  });

  // Dados simulados de clientes - será substituído por dados da API
  const mockClients = [
    { id: "1", name: "Empresa ABC Ltda" },
    { id: "2", name: "Instituto Educacional XYZ" },
    { id: "3", name: "Faculdade Metropolitana" },
    { id: "4", name: "Centro de Ensino Superior" },
    { id: "5", name: "Universidade Federal" },
  ];

  // Dados simulados de produtos - será substituído por dados da API
  const mockProducts = [
    { id: "1", name: "MBA em Gestão Empresarial", price: 12990.00 },
    { id: "2", name: "Pós-Graduação em Direito Digital", price: 9990.00 },
    { id: "3", name: "Curso de Extensão em Marketing Digital", price: 1990.00 },
    { id: "4", name: "Consultoria Pedagógica", price: 5000.00 },
    { id: "5", name: "Certificação Profissional", price: 790.00 },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      invoiceNumber: generateChargeNumber(),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Padrão: 30 dias após hoje
      status: "pending",
      notes: "",
    },
  });

  // Função para gerar número de cobrança automático
  function generateChargeNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COB-${year}${month}-${random}`;
  }

  // Função para calcular o subtotal do item
  const calculateItemSubtotal = (item: Partial<ChargeItem>) => {
    if (!item.quantity || !item.unitPrice) return 0;
    return (item.quantity * item.unitPrice) - (item.discount || 0);
  };

  // Função para calcular o total da cobrança
  const calculateChargeTotal = () => {
    return items.reduce((total, item) => {
      const itemSubtotal = calculateItemSubtotal(item);
      const itemTax = (item.tax || 0) / 100 * itemSubtotal;
      return total + itemSubtotal + itemTax;
    }, 0);
  };

  // Função para adicionar item à cobrança
  const addItemToCharge = () => {
    if (!currentItem.description || !currentItem.quantity || !currentItem.unitPrice) {
      toast({
        title: "Informações incompletas",
        description: "Preencha todos os campos obrigatórios do item.",
        variant: "destructive",
      });
      return;
    }

    setItems([...items, currentItem as ChargeItem]);
    
    // Resetar o item atual
    setCurrentItem({
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
    });
  };

  // Função para remover item da cobrança
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Função para preencher item com produto selecionado
  const handleProductSelect = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        description: product.name,
        unitPrice: product.price,
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (items.length === 0) {
      toast({
        title: "Nenhum item adicionado",
        description: "Adicione pelo menos um item à cobrança.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Preparar dados da cobrança completa
      const chargeData = {
        ...data,
        items,
        total: calculateChargeTotal(),
      };

      // Quando tivermos a API, enviaremos a requisição para o servidor
      console.log("Enviando dados da cobrança:", chargeData);

      /*
      // Exemplo de como será a implementação da API
      await apiRequest({
        url: "/api/finance/charges",
        method: "POST",
        data: chargeData,
      });
      
      // Invalidar cache para forçar recarregamento das cobranças
      queryClient.invalidateQueries({ queryKey: ["/api/finance/charges"] });
      */

      toast({
        title: "Cobrança criada com sucesso",
        description: `Cobrança ${data.invoiceNumber} foi criada com sucesso.`,
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
                Crie uma nova cobrança para pagamento
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <InvoiceIcon className="mr-2 h-5 w-5" />
                Informações da Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Cobrança*</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormDescription>
                            Gerado automaticamente
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Emissão*</FormLabel>
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
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento*</FormLabel>
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
                          <FormLabel>Status*</FormLabel>
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
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Paga</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                              <SelectItem value="overdue">Vencida</SelectItem>
                            </SelectContent>
                          </Select>
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
                              placeholder="Informações adicionais sobre a cobrança"
                              className="min-h-[80px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens da Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-3">
                    <Select 
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto/serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      placeholder="Descrição do item"
                      value={currentItem.description}
                      onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={currentItem.quantity}
                      onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Preço unitário"
                      value={currentItem.unitPrice}
                      onChange={e => setCurrentItem({...currentItem, unitPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Desconto"
                      value={currentItem.discount}
                      onChange={e => setCurrentItem({...currentItem, discount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Imposto %"
                      value={currentItem.tax}
                      onChange={e => setCurrentItem({...currentItem, tax: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button 
                      type="button" 
                      onClick={addItemToCharge}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                        <TableHead className="text-right">Imposto %</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => {
                        const subtotal = calculateItemSubtotal(item);
                        const taxAmount = (item.tax || 0) / 100 * subtotal;
                        const total = subtotal + taxAmount;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.discount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="text-right">{item.tax}%</TableCell>
                            <TableCell className="text-right font-medium">
                              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeItem(item.id)}
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum item adicionado à cobrança
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de itens: {items.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total da Cobrança:</p>
                <p className="text-xl font-bold">
                  {calculateChargeTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </CardFooter>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/admin/finance/charges")}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={items.length === 0}
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              Salvar Cobrança
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}