import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema de formulário para configurações do polo
const poloSettingsFormSchema = z.object({
  status: z.enum(["active", "inactive"]),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  managerName: z.string().min(3, "O nome do gestor deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(5, "Endereço inválido"),
  city: z.string().min(2, "Cidade inválida"),
  state: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  postalCode: z.string().min(8, "CEP inválido"),
  capacity: z.number().min(1, "A capacidade deve ser maior que zero"),
});

type PoloSettingsFormValues = z.infer<typeof poloSettingsFormSchema>;

// Schema para formulário de links de vendas personalizados
const salesLinkFormSchema = z.object({
  enabled: z.boolean(),
  customSlug: z.string().min(3, "O slug personalizado deve ter pelo menos 3 caracteres").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens").optional().nullable(),
  autoApproveEnrollments: z.boolean(),
  trackReferrals: z.boolean(),
  commission: z.number().min(0, "A comissão não pode ser negativa").max(100, "A comissão máxima é 100%"),
});

type SalesLinkFormValues = z.infer<typeof salesLinkFormSchema>;

// Schema para permissões de cursos
const coursePermissionsFormSchema = z.object({
  allCourses: z.boolean(),
  selectedCourses: z.array(z.number()).optional(),
});

type CoursePermissionsFormValues = z.infer<typeof coursePermissionsFormSchema>;

export default function PoloSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTestLinkDialogOpen, setIsTestLinkDialogOpen] = useState(false);
  const [linkToTest, setLinkToTest] = useState("");

  // Consulta para obter dados do polo
  const { 
    data: poloData, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ["/api/polo/settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/polo/settings");
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        return {
          id: 1,
          code: "POL001",
          name: "Polo Centro",
          status: "active",
          institutionId: 1,
          managerName: "Ana Maria Silva",
          email: "polo.centro@edunexia.com.br",
          phone: "(11) 98765-4321",
          address: "Avenida Central, 123",
          city: "São Paulo",
          state: "SP",
          postalCode: "01234-567",
          capacity: 250,
          salesLink: {
            enabled: true,
            customSlug: "centro-sp",
            autoApproveEnrollments: false,
            trackReferrals: true,
            commission: 10,
          },
          coursePermissions: {
            allCourses: false,
            selectedCourses: [1, 3, 5]
          }
        };
      }
    },
  });

  // Consulta para obter lista de cursos disponíveis
  const { 
    data: coursesData, 
    isLoading: isLoadingCourses, 
  } = useQuery({
    queryKey: ["/api/polo/available-courses"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/polo/available-courses");
        const data = await res.json();
        return data;
      } catch (error) {
        // Dados simulados para desenvolvimento
        return [
          { id: 1, name: "Administração", status: "published" },
          { id: 2, name: "Ciência da Computação", status: "published" },
          { id: 3, name: "Pedagogia", status: "published" },
          { id: 4, name: "Engenharia Civil", status: "published" },
          { id: 5, name: "Psicologia", status: "published" },
          { id: 6, name: "Direito", status: "draft" },
          { id: 7, name: "Medicina", status: "published" },
        ];
      }
    },
  });

  // Form para configurações gerais do polo
  const settingsForm = useForm<PoloSettingsFormValues>({
    resolver: zodResolver(poloSettingsFormSchema),
    defaultValues: {
      status: "active",
      name: "",
      managerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      capacity: 50,
    },
  });

  // Form para links de vendas personalizados
  const salesLinkForm = useForm<SalesLinkFormValues>({
    resolver: zodResolver(salesLinkFormSchema),
    defaultValues: {
      enabled: false,
      customSlug: null,
      autoApproveEnrollments: false,
      trackReferrals: true,
      commission: 10,
    },
  });

  // Form para permissões de cursos
  const coursePermissionsForm = useForm<CoursePermissionsFormValues>({
    resolver: zodResolver(coursePermissionsFormSchema),
    defaultValues: {
      allCourses: true,
      selectedCourses: [],
    },
  });

  // Carregar dados iniciais nos formulários quando disponíveis
  useEffect(() => {
    if (poloData) {
      // Configurações gerais
      settingsForm.reset({
        status: poloData.status,
        name: poloData.name,
        managerName: poloData.managerName,
        email: poloData.email,
        phone: poloData.phone,
        address: poloData.address,
        city: poloData.city,
        state: poloData.state,
        postalCode: poloData.postalCode,
        capacity: poloData.capacity,
      });

      // Links de vendas
      if (poloData.salesLink) {
        salesLinkForm.reset({
          enabled: poloData.salesLink.enabled,
          customSlug: poloData.salesLink.customSlug,
          autoApproveEnrollments: poloData.salesLink.autoApproveEnrollments,
          trackReferrals: poloData.salesLink.trackReferrals,
          commission: poloData.salesLink.commission,
        });
      }

      // Permissões de cursos
      if (poloData.coursePermissions) {
        coursePermissionsForm.reset({
          allCourses: poloData.coursePermissions.allCourses,
          selectedCourses: poloData.coursePermissions.selectedCourses || [],
        });
      }
    }
  }, [poloData, settingsForm, salesLinkForm, coursePermissionsForm]);

  // Mutation para atualizar configurações do polo
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PoloSettingsFormValues) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas com sucesso!",
        description: "As informações do polo foram atualizadas.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao tentar atualizar as configurações do polo.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar link de vendas
  const updateSalesLinkMutation = useMutation({
    mutationFn: async (data: SalesLinkFormValues) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Link de vendas atualizado!",
        description: "As configurações do link de vendas foram atualizadas.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar link de vendas",
        description: error.message || "Ocorreu um erro ao tentar atualizar o link de vendas.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar permissões de cursos
  const updateCoursePermissionsMutation = useMutation({
    mutationFn: async (data: CoursePermissionsFormValues) => {
      // Simulando a chamada à API
      await new Promise(resolve => setTimeout(resolve, 800));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Permissões atualizadas!",
        description: "As permissões de cursos foram atualizadas.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message || "Ocorreu um erro ao tentar atualizar as permissões de cursos.",
        variant: "destructive",
      });
    },
  });

  // Funções de submit dos formulários
  const onSettingsSubmit = (data: PoloSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  const onSalesLinkSubmit = (data: SalesLinkFormValues) => {
    updateSalesLinkMutation.mutate(data);
  };

  const onCoursePermissionsSubmit = (data: CoursePermissionsFormValues) => {
    updateCoursePermissionsMutation.mutate(data);
  };

  // Função para gerar link do polo para testes
  const generateTestLink = () => {
    const slug = salesLinkForm.getValues("customSlug") || poloData?.code.toLowerCase();
    const linkUrl = `${window.location.origin}/inscrever?polo=${slug}`;
    setLinkToTest(linkUrl);
    setIsTestLinkDialogOpen(true);
  };

  // Função para copiar o link para o clipboard
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(linkToTest).then(() => {
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    });
  };

  // Sidebar items for polo portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments" },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
    { name: "Relatórios", icon: <ShowChartIcon />, href: "/polo/reports" },
    { name: "Configurações", icon: <SettingsIcon />, href: "/polo/settings", active: true },
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Polo</h1>
            <p className="text-gray-600">Gerencie as configurações e permissões do seu polo.</p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erro ao carregar configurações</AlertTitle>
              <AlertDescription>
                Ocorreu um erro ao tentar carregar as configurações do polo. Tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Configurações gerais do polo */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>
                    Configure as informações básicas do seu polo educacional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={settingsForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Polo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Polo Centro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="managerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Gestor</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: João Silva" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email de Contato</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Ex: polo@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: (11) 98765-4321" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacidade de Alunos</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  min={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Rua das Flores, 123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: São Paulo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: SP" maxLength={2} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={settingsForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 01234-567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateSettingsMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Links de vendas personalizados */}
              <Card>
                <CardHeader>
                  <CardTitle>Links de Vendas Personalizados</CardTitle>
                  <CardDescription>
                    Configure links de vendas e matriculas personalizados para seu polo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...salesLinkForm}>
                    <form onSubmit={salesLinkForm.handleSubmit(onSalesLinkSubmit)} className="space-y-4">
                      <FormField
                        control={salesLinkForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Ativar Links Personalizados</FormLabel>
                              <FormDescription>
                                Ative para permitir links de matrículas que rastreiam seu polo
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

                      {salesLinkForm.watch("enabled") && (
                        <>
                          <FormField
                            control={salesLinkForm.control}
                            name="customSlug"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Slug Personalizado</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={poloData?.code.toLowerCase()} 
                                    {...field} 
                                    value={field.value || ""} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Este será o identificador do seu polo nos links. Se não for especificado, 
                                  será usado o código do polo ({poloData?.code.toLowerCase()}).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={salesLinkForm.control}
                              name="autoApproveEnrollments"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Aprovar matrículas automaticamente</FormLabel>
                                    <FormDescription>
                                      As matrículas feitas via seu link serão aprovadas sem revisão
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

                            <FormField
                              control={salesLinkForm.control}
                              name="trackReferrals"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Rastrear indicações</FormLabel>
                                    <FormDescription>
                                      Rastrear todas as matrículas feitas através do seu link
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
                          </div>

                          <FormField
                            control={salesLinkForm.control}
                            name="commission"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Comissão (%) por matrícula</FormLabel>
                                <FormControl>
                                  <div className="flex items-center">
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="w-24"
                                      min={0}
                                      max={100}
                                    />
                                    <span className="ml-2">%</span>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Porcentagem que seu polo receberá por cada matrícula feita via seu link
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Seu link será:</span>
                              <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                                {window.location.origin}/inscrever?polo={salesLinkForm.watch("customSlug") || poloData?.code.toLowerCase()}
                              </code>
                              <Button variant="outline" size="sm" onClick={generateTestLink}>
                                Testar
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateSalesLinkMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {updateSalesLinkMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Permissões de cursos */}
              <Card>
                <CardHeader>
                  <CardTitle>Permissões de Cursos</CardTitle>
                  <CardDescription>
                    Defina quais cursos seu polo pode ofertar e matricular alunos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...coursePermissionsForm}>
                    <form onSubmit={coursePermissionsForm.handleSubmit(onCoursePermissionsSubmit)} className="space-y-4">
                      <FormField
                        control={coursePermissionsForm.control}
                        name="allCourses"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Acesso a todos os cursos</FormLabel>
                              <FormDescription>
                                Seu polo poderá ofertar todos os cursos disponíveis
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    coursePermissionsForm.setValue("selectedCourses", []);
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {!coursePermissionsForm.watch("allCourses") && (
                        <div className="space-y-3">
                          <FormLabel>Selecione os cursos permitidos</FormLabel>
                          <div className="h-[200px] overflow-auto border rounded-lg p-4">
                            {isLoadingCourses ? (
                              <div className="space-y-2">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-full" />
                              </div>
                            ) : coursesData && coursesData.length > 0 ? (
                              <div className="space-y-2">
                                {coursesData.map((course: any) => (
                                  <div key={course.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`course-${course.id}`}
                                      checked={coursePermissionsForm.watch("selectedCourses")?.includes(course.id)}
                                      onChange={(e) => {
                                        const currentSelected = coursePermissionsForm.getValues("selectedCourses") || [];
                                        if (e.target.checked) {
                                          coursePermissionsForm.setValue("selectedCourses", [...currentSelected, course.id]);
                                        } else {
                                          coursePermissionsForm.setValue(
                                            "selectedCourses",
                                            currentSelected.filter((id) => id !== course.id)
                                          );
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label 
                                      htmlFor={`course-${course.id}`}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {course.name}
                                      {course.status !== "published" && (
                                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                          {course.status === "draft" ? "Rascunho" : "Arquivado"}
                                        </Badge>
                                      )}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-8">
                                Nenhum curso disponível para seleção
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateCoursePermissionsMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          {updateCoursePermissionsMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialog para teste de link */}
          <Dialog open={isTestLinkDialogOpen} onOpenChange={setIsTestLinkDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link de vendas personalizado</DialogTitle>
                <DialogDescription>
                  Este é o link que você pode compartilhar para que os alunos se matriculem pelo seu polo.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4">
                <div className="bg-gray-100 p-3 rounded break-all">
                  <span className="text-primary font-mono">{linkToTest}</span>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(linkToTest, "_blank")}
                  className="w-full sm:w-auto"
                >
                  Abrir link
                </Button>
                <Button 
                  onClick={copyLinkToClipboard}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  Copiar link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}