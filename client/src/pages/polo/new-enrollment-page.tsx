import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartIcon,
  GroupIcon,
  ShowChartIcon,
  AccountBalanceIcon,
  EventNoteIcon,
  SettingsIcon,
  HelpOutlineIcon,
  SchoolIcon,
  StorefrontIcon,
  ArrowLeftIcon,
  InfoIcon,
  DocumentIcon,
  CreditCardIcon,
  SaveIcon,
  FileTextIcon,
  AlertTriangleIcon,
  FileUploadIcon,
} from "@/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Schema para validação do formulário
const enrollmentFormSchema = z.object({
  // Dados do aluno
  studentName: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  studentEmail: z.string().email({ message: "Email inválido" }),
  studentPhone: z.string().min(10, { message: "Telefone inválido" }),
  studentDocument: z.string().min(11, { message: "CPF inválido" }),
  studentAddress: z.string().min(10, { message: "Endereço deve ter pelo menos 10 caracteres" }),
  studentCity: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres" }),
  studentState: z.string().min(2, { message: "Estado deve ter pelo menos 2 caracteres" }),
  studentZipCode: z.string().min(8, { message: "CEP inválido" }),
  // Gateway de pagamento
  paymentGateway: z.enum(["asaas", "lytex"], {
    required_error: "Selecione um gateway de pagamento",
  }),
  
  // Dados do curso
  courseId: z.string().min(1, { message: "Selecione um curso" }),
  
  // Dados de pagamento
  paymentMethod: z.enum(["credit_card", "bank_slip", "pix"], {
    required_error: "Selecione uma forma de pagamento",
  }),
  installments: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val, {
    message: "Você deve aceitar os termos antes de prosseguir",
  }),
  
  // Contrato
  contractTemplateId: z.string().min(1, { message: "Selecione um modelo de contrato" }),
  additionalNotes: z.string().optional(),
  
  // Campo para controlar o atual "passo" do formulário
  currentStep: z.number().min(1).max(4)
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

export default function NewEnrollmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado para controle de formulário multi-etapas
  const [step, setStep] = useState(1);
  const [isCreatingEnrollment, setIsCreatingEnrollment] = useState(false);
  const [createdEnrollmentId, setCreatedEnrollmentId] = useState<number | null>(null);
  
  // Consulta para listar cursos disponíveis
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/polo/available-courses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/polo/available-courses");
      return await res.json();
    },
  });
  
  // Consulta para listar templates de contrato disponíveis
  const { data: contractTemplatesData, isLoading: isLoadingContractTemplates } = useQuery({
    queryKey: ["/api/polo/contract-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/polo/contract-templates");
      return await res.json();
    },
  });
  
  // Inicializando formulário com valores padrão
  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      studentPhone: "",
      studentDocument: "",
      studentAddress: "",
      studentCity: "",
      studentState: "",
      studentZipCode: "",
      paymentGateway: "asaas", // Valor padrão para gateway
      courseId: "",
      paymentMethod: "bank_slip",
      installments: "1",
      acceptTerms: false,
      hasIdentificationDocument: false,
      hasAddressDocument: false,
      hasSchoolRecords: false,
      contractTemplateId: "",
      additionalNotes: "",
      currentStep: 1
    },
  });
  
  // Função para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: EnrollmentFormValues) => {
      const res = await apiRequest("POST", "/api/polo/enrollments", enrollmentData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/polo/enrollments"] });
      setCreatedEnrollmentId(data.id);
      toast({
        title: "Matrícula criada com sucesso",
        description: "A matrícula foi registrada no sistema",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Função para avançar para o próximo passo
  const nextStep = () => {
    const currentValues = form.getValues();
    form.setValue("currentStep", step + 1);
    setStep(step + 1);
  };
  
  // Função para voltar para o passo anterior
  const prevStep = () => {
    form.setValue("currentStep", step - 1);
    setStep(step - 1);
  };
  
  // Função para enviar o formulário
  const onSubmit = (values: EnrollmentFormValues) => {
    if (step < 4) {
      nextStep();
      return;
    }
    
    setIsCreatingEnrollment(true);
    createEnrollmentMutation.mutate(values);
  };
  
  // Gerar preço do curso baseado no ID selecionado (para fins de demonstração)
  const getCoursePrice = (courseId: string): number => {
    if (!courseId) return 0;
    
    // Valores fictícios para demonstração
    const prices: Record<string, number> = {
      "1": 1200.00,
      "2": 980.00,
      "3": 1500.00,
      "4": 2200.00,
      "5": 1750.00
    };
    
    return prices[courseId] || 1000.00;
  };
  
  // Gerar valor da parcela
  const getInstallmentValue = (): string => {
    const courseId = form.watch("courseId");
    const installments = parseInt(form.watch("installments") || "1");
    
    const coursePrice = getCoursePrice(courseId);
    const installmentValue = coursePrice / installments;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(installmentValue);
  };
  
  // Gerar valor total do curso
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Renderizar conteúdo baseado no passo atual
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Dados do Aluno</h2>
              <p className="text-gray-500">Informações pessoais do estudante</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do aluno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email de contato" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Endereço</h3>
            </div>
            
            <FormField
              control={form.control}
              name="studentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="studentCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="studentZipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Escolha do Curso</h2>
              <p className="text-gray-500">Selecione o curso desejado para matrícula</p>
            </div>
            
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curso</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCourses ? (
                        <SelectItem value="loading" disabled>Carregando cursos...</SelectItem>
                      ) : (
                        coursesData?.map((course: any) => (
                          <SelectItem 
                            key={course.id} 
                            value={course.id.toString()}
                          >
                            {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("courseId") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Detalhes do Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Curso selecionado:</span>
                      <span className="font-medium">
                        {coursesData?.find((c: any) => c.id.toString() === form.watch("courseId"))?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor total:</span>
                      <span className="font-medium">
                        {formatCurrency(getCoursePrice(form.watch("courseId")))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duração estimada:</span>
                      <span className="font-medium">12 meses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Pagamento</h2>
              <p className="text-gray-500">Escolha a forma de pagamento</p>
            </div>
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Método de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="credit_card" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Cartão de Crédito
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="bank_slip" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Boleto Bancário
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pix" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          PIX
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("paymentMethod") === "credit_card" && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1x de {getInstallmentValue()}</SelectItem>
                        <SelectItem value="2">2x de {getInstallmentValue()}</SelectItem>
                        <SelectItem value="3">3x de {getInstallmentValue()}</SelectItem>
                        <SelectItem value="6">6x de {getInstallmentValue()}</SelectItem>
                        <SelectItem value="12">12x de {getInstallmentValue()}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumo do Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Curso:</span>
                    <span className="font-medium">
                      {coursesData?.find((c: any) => c.id.toString() === form.watch("courseId"))?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor total:</span>
                    <span className="font-medium">
                      {formatCurrency(getCoursePrice(form.watch("courseId")))}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>Forma de pagamento:</span>
                    <span className="font-medium">
                      {form.watch("paymentMethod") === "credit_card" && "Cartão de Crédito"}
                      {form.watch("paymentMethod") === "bank_slip" && "Boleto Bancário"}
                      {form.watch("paymentMethod") === "pix" && "PIX"}
                    </span>
                  </div>
                  {form.watch("paymentMethod") === "credit_card" && (
                    <div className="flex justify-between">
                      <span>Parcelamento:</span>
                      <span className="font-medium">
                        {form.watch("installments")}x de {getInstallmentValue()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal cursor-pointer">
                      Li e aceito os termos de matrícula e política de privacidade
                    </FormLabel>
                    <FormDescription>
                      Ao marcar esta opção, você declara estar ciente dos termos da instituição.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Contrato</h2>
              <p className="text-gray-500">Escolha do modelo de contrato</p>
            </div>
            
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Após a matrícula, o sistema irá gerar automaticamente um contrato vinculado ao aluno 
                com base no modelo escolhido. O aluno precisará assinar digitalmente o documento 
                através do Portal do Aluno.
              </AlertDescription>
            </Alert>
            
            <FormField
              control={form.control}
              name="contractTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Contrato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo de contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingContractTemplates ? (
                        <SelectItem value="loading" disabled>Carregando modelos...</SelectItem>
                      ) : (
                        contractTemplatesData?.map((template: any) => (
                          <SelectItem 
                            key={template.id} 
                            value={template.id.toString()}
                          >
                            {template.name} - v{template.version}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    O modelo de contrato define os termos e condições da prestação de serviços educacionais.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumo da Matrícula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Aluno</p>
                      <p className="font-medium">{form.watch("studentName")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Curso</p>
                      <p className="font-medium">
                        {coursesData?.find((c: any) => c.id.toString() === form.watch("courseId"))?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Valor</p>
                      <p className="font-medium">
                        {formatCurrency(getCoursePrice(form.watch("courseId")))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Forma de Pagamento</p>
                      <p className="font-medium">
                        {form.watch("paymentMethod") === "credit_card" && "Cartão de Crédito"}
                        {form.watch("paymentMethod") === "bank_slip" && "Boleto Bancário"}
                        {form.watch("paymentMethod") === "pix" && "PIX"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      // Não temos mais o caso 5, pois agora são apenas 4 etapas
      
      default:
        return null;
    }
  };
  
  // Definir rótulos para os passos do formulário
  const stepLabels = [
    { number: 1, label: "Aluno" },
    { number: 2, label: "Curso" },
    { number: 3, label: "Pagamento" },
    { number: 4, label: "Contrato" },
  ];
  
  // Sidebar items
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/polo/dashboard" },
    { name: "Matrículas", icon: <SchoolIcon />, href: "/polo/enrollments", active: true },
    { name: "Alunos", icon: <GroupIcon />, href: "/polo/students" },
    { name: "Unidades", icon: <StorefrontIcon />, href: "/polo/units" },
    { name: "Financeiro", icon: <AccountBalanceIcon />, href: "/polo/financial" },
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
          {/* Título e botão voltar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate("/polo/enrollments")}
                className="mb-2 md:mb-0"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Matrícula</h1>
                <p className="text-gray-600">Cadastre um novo aluno em seu polo</p>
              </div>
            </div>
          </div>

          {/* Card principal */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Formulário de Matrícula</CardTitle>
                  <CardDescription>
                    Preencha todos os campos obrigatórios
                  </CardDescription>
                </div>
                {/* Indicador de progresso */}
                <div className="hidden md:flex items-center space-x-2">
                  {stepLabels.map((stepItem) => (
                    <div
                      key={stepItem.number}
                      className={`flex items-center ${
                        step === stepItem.number
                          ? "text-orange-500"
                          : step > stepItem.number
                          ? "text-green-500"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          step === stepItem.number
                            ? "border-orange-500 bg-orange-50"
                            : step > stepItem.number
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        {step > stepItem.number ? "✓" : stepItem.number}
                      </div>
                      <span className="ml-2">{stepItem.label}</span>
                      {stepItem.number < stepLabels.length && (
                        <div className="w-8 h-0.5 ml-2 bg-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Formulário */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderStepContent()}
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isCreatingEnrollment}
                >
                  Voltar
                </Button>
              )}
              {step === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/polo/enrollments")}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isCreatingEnrollment}
                className={`${step < 4 ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isCreatingEnrollment ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full mr-2" />
                    Processando...
                  </>
                ) : step < 4 ? (
                  "Continuar"
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Finalizar Matrícula
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}