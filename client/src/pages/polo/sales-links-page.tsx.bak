import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChartIcon,
  GroupIcon,
  ShowChartIcon,
  AccountBalanceIcon,
  EventNoteIcon,
  SettingsIcon,
  HelpOutlineIcon,
  StorefrontIcon,
  SchoolIcon,
  LinkIcon,
  EditIcon,
  BarChartIcon,
  CopyIcon,
  QrCodeIcon,
  ShareIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface para os links de vendas
interface SalesLink {
  id: number;
  name: string;
  slug: string;
  url: string;
  status: "active" | "inactive";
  created: string;
  autoApprove: boolean;
  commission: number;
  visits: number;
  conversions: number;
  revenue: number;
}

// Schema para formulário de links de vendas
const salesLinkFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  slug: z.string().min(3, "O slug deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens")
    .optional(),
  autoApprove: z.boolean().default(false),
  commission: z.number().min(0, "A comissão não pode ser negativa").max(100, "A comissão máxima é 100%"),
  status: z.enum(["active", "inactive"]).default("active"),
});

type SalesLinkFormValues = z.infer<typeof salesLinkFormSchema>;

export default function PoloSalesLinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estados para diálogos
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<SalesLink | null>(null);
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null);

  // Consulta para listar links de vendas
  const { 
    data: linksData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/polo/sales-links"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/polo/sales-links");
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        const mockLinks: SalesLink[] = [
          {
            id: 1,
            name: "Link Principal",
            slug: "principal",
            url: new URL('/inscrever?polo=principal', window.location.origin).href,
            status: "active",
            created: "2023-06-15",
            autoApprove: true,
            commission: 10,
            visits: 1250,
            conversions: 45,
            revenue: 22500.00
          },
          {
            id: 2,
            name: "Promoção Verão",
            slug: "promo-verao",
            url: new URL('/inscrever?polo=promo-verao', window.location.origin).href,
            status: "active",
            created: "2023-10-01",
            autoApprove: false,
            commission: 15,
            visits: 560,
            conversions: 23,
            revenue: 11500.00
          },
          {
            id: 3,
            name: "Parceria Empresa XYZ",
            slug: "xyz",
            url: new URL('/inscrever?polo=xyz', window.location.origin).href,
            status: "inactive",
            created: "2023-04-10",
            autoApprove: false,
            commission: 8,
            visits: 320,
            conversions: 12,
            revenue: 6000.00
          }
        ];
        
        return {
          links: mockLinks,
          totalVisits: 2130,
          totalConversions: 80,
          totalRevenue: 40000.00,
          conversionRate: 3.76,
          avgCommission: 11
        };
      }
    },
  });

  // Form para criar link de vendas
  const createForm = useForm<SalesLinkFormValues>({
    resolver: zodResolver(salesLinkFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      autoApprove: false,
      commission: 10,
      status: "active",
    },
  });

  // Form para editar link de vendas
  const editForm = useForm<SalesLinkFormValues>({
    resolver: zodResolver(salesLinkFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      autoApprove: false,
      commission: 10,
      status: "active",
    },
  });

  // Mutation para criar link de vendas
  const createLinkMutation = useMutation({
    mutationFn: async (data: SalesLinkFormValues) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return { ...data, id: Date.now() };
    },
    onSuccess: () => {
      toast({
        title: "Link criado com sucesso!",
        description: "O novo link de vendas foi criado.",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar link",
        description: error.message || "Ocorreu um erro ao tentar criar o link de vendas.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar link de vendas
  const updateLinkMutation = useMutation({
    mutationFn: async (data: SalesLinkFormValues & { id: number }) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Link atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar link",
        description: error.message || "Ocorreu um erro ao tentar atualizar o link de vendas.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir link de vendas
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Link excluído com sucesso!",
        description: "O link de vendas foi removido.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir link",
        description: error.message || "Ocorreu um erro ao tentar excluir o link de vendas.",
        variant: "destructive",
      });
    },
  });

  // Funções de submit dos formulários
  const onCreateSubmit = (data: SalesLinkFormValues) => {
    createLinkMutation.mutate(data);
  };

  const onEditSubmit = (data: SalesLinkFormValues) => {
    if (selectedLink) {
      updateLinkMutation.mutate({ ...data, id: selectedLink.id });
    }
  };

  const handleOpenEditDialog = (link: SalesLink) => {
    setSelectedLink(link);
    editForm.reset({
      name: link.name,
      slug: link.slug,
      autoApprove: link.autoApprove,
      commission: link.commission,
      status: link.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (link: SalesLink) => {
    setSelectedLink(link);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedLink) {
      deleteLinkMutation.mutate(selectedLink.id);
    }
  };

  // Gerar QR Code para um link
  const handleGenerateQRCode = (link: SalesLink) => {
    setSelectedLink(link);
    
    // Simulando a geração de QR Code
    setTimeout(() => {
      // URL de um QR Code de exemplo
      setQrCodeImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link.url)}`);
      setIsQRCodeDialogOpen(true);
    }, 500);
  };

  // Copiar link para a área de transferência
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    });
  };

  // Compartilhar link
  const handleShareLink = (url: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title: `Matrícula - ${title}`,
        text: 'Faça sua matrícula utilizando este link:',
        url: url,
      })
      .catch((error) => {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o link.",
          variant: "destructive",
        });
      });
    } else {
      handleCopyLink(url);
    }
  };

  // Função para formatar dinheiro
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Renderizar status com cores
  const renderStatus = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments" },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
    { name: "Links de Vendas", icon: <LinkIcon />, href: "/polo/sales-links", active: true },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/polo/reports" },
    { name: "Configurações", icon: <SettingsIcon />, href: "/polo/settings" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/polo/support" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="polo"
        portalColor="#F79009"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Links de Vendas</h1>
              <p className="text-gray-600">Gerencie seus links personalizados para matrículas e vendas</p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600"
            >
              Criar Novo Link
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erro ao carregar links</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao tentar carregar seus links de vendas. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Visitas Totais</p>
                        <h3 className="text-2xl font-bold mt-1">{linksData?.totalVisits?.toLocaleString() || 0}</h3>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChartIcon className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Matrículas</p>
                        <h3 className="text-2xl font-bold mt-1">{linksData?.totalConversions?.toLocaleString() || 0}</h3>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <SchoolIcon className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Taxa de conversão: {linksData?.conversionRate?.toFixed(2) || 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Receita Gerada</p>
                        <h3 className="text-2xl font-bold mt-1">{formatCurrency(linksData?.totalRevenue || 0)}</h3>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AccountBalanceIcon className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Comissão Média</p>
                        <h3 className="text-2xl font-bold mt-1">{linksData?.avgCommission || 0}%</h3>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <SettingsIcon className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Seus Links de Vendas</CardTitle>
                  <CardDescription>
                    Lista de todos os seus links personalizados para rastreamento de matrículas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {linksData?.links?.length === 0 ? (
                    <div className="text-center py-12">
                      <LinkIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum link encontrado</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Você ainda não criou nenhum link de vendas personalizado.
                      </p>
                      <Button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="mt-4 bg-orange-500 hover:bg-orange-600"
                      >
                        Criar Primeiro Link
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Comissão</TableHead>
                            <TableHead>Visitas</TableHead>
                            <TableHead>Conversões</TableHead>
                            <TableHead>Receita</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {linksData?.links?.map((link: SalesLink) => (
                            <TableRow key={link.id}>
                              <TableCell className="font-medium">{link.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm truncate max-w-[150px]">
                                    {link.url}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleCopyLink(link.url)}
                                  >
                                    <CopyIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{renderStatus(link.status)}</TableCell>
                              <TableCell>{link.commission}%</TableCell>
                              <TableCell>{link.visits.toLocaleString()}</TableCell>
                              <TableCell>{link.conversions.toLocaleString()}</TableCell>
                              <TableCell>{formatCurrency(link.revenue)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleOpenEditDialog(link)}
                                    title="Editar"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleGenerateQRCode(link)}
                                    title="Gerar QR Code"
                                  >
                                    <QrCodeIcon className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleShareLink(link.url, link.name)}
                                    title="Compartilhar"
                                  >
                                    <ShareIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Desempenho dos Links */}
              {linksData?.links?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Desempenho</CardTitle>
                    <CardDescription>
                      Compare o desempenho dos seus diferentes links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="conversions">
                      <TabsList className="mb-4">
                        <TabsTrigger value="conversions">Conversões</TabsTrigger>
                        <TabsTrigger value="revenue">Receita</TabsTrigger>
                        <TabsTrigger value="ratio">Taxa de Conversão</TabsTrigger>
                      </TabsList>

                      <TabsContent value="conversions">
                        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">Gráfico de conversões por link</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="revenue">
                        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">Gráfico de receita por link</p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="ratio">
                        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                          <p className="text-gray-500">Gráfico de taxa de conversão por link</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-gray-500">
                      As estatísticas são atualizadas a cada 24 horas.
                    </p>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}

          {/* Dialog para criar novo link */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Link de Vendas</DialogTitle>
                <DialogDescription>
                  Crie um link personalizado para rastrear suas matrículas e vendas
                </DialogDescription>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Campanha Instagram" {...field} />
                        </FormControl>
                        <FormDescription>
                          Um nome para identificar facilmente este link
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug Personalizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: promo-instagram" {...field} />
                        </FormControl>
                        <FormDescription>
                          Será usado no link: {window.location.origin}/inscrever?polo={field.value || "[slug]"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="commission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comissão (%)</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="w-full"
                                min={0}
                                max={100}
                              />
                              <span className="ml-2">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Porcentagem de comissão para este link
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Links inativos não registrarão conversões
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="autoApprove"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aprovar matrículas automaticamente</FormLabel>
                          <FormDescription>
                            As matrículas feitas via este link serão aprovadas sem revisão
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLinkMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {createLinkMutation.isPending ? "Criando..." : "Criar Link"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog para editar link */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Link de Vendas</DialogTitle>
                <DialogDescription>
                  Atualize as configurações do seu link personalizado
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Link</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Campanha Instagram" {...field} />
                        </FormControl>
                        <FormDescription>
                          Um nome para identificar facilmente este link
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug Personalizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: promo-instagram" {...field} />
                        </FormControl>
                        <FormDescription>
                          Será usado no link: {window.location.origin}/inscrever?polo={field.value || "[slug]"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="commission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comissão (%)</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="w-full"
                                min={0}
                                max={100}
                              />
                              <span className="ml-2">%</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Porcentagem de comissão para este link
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Links inativos não registrarão conversões
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="autoApprove"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Aprovar matrículas automaticamente</FormLabel>
                          <FormDescription>
                            As matrículas feitas via este link serão aprovadas sem revisão
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        if (selectedLink) {
                          handleOpenDeleteDialog(selectedLink);
                        }
                      }}
                    >
                      Excluir
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateLinkMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {updateLinkMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmação de exclusão */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir Link de Vendas</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <p className="font-medium">{selectedLink?.name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedLink?.url}</p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteLinkMutation.isPending}
                >
                  {deleteLinkMutation.isPending ? "Excluindo..." : "Excluir Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de QR Code */}
          <Dialog open={isQRCodeDialogOpen} onOpenChange={setIsQRCodeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>QR Code para o Link</DialogTitle>
                <DialogDescription>
                  Compartilhe facilmente seu link de vendas com este QR Code
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center">
                {qrCodeImageUrl ? (
                  <img 
                    src={qrCodeImageUrl} 
                    alt="QR Code para o link" 
                    className="w-48 h-48 mx-auto mb-4"
                  />
                ) : (
                  <Skeleton className="w-48 h-48 mx-auto mb-4" />
                )}
                <p className="text-sm text-center text-gray-600 mt-2 mb-4">
                  {selectedLink?.url}
                </p>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsQRCodeDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    if (qrCodeImageUrl) {
                      const link = document.createElement('a');
                      link.href = qrCodeImageUrl;
                      link.download = `qrcode-${selectedLink?.slug || 'link'}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={!qrCodeImageUrl}
                >
                  Baixar QR Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}