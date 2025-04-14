import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreateUserDialog } from "@/components/dialogs/create-user-dialog";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Loader2 } from "lucide-react";

// Schema para validação do formulário
const enrollmentFormSchema = z.object({
  // Opção para escolher entre aluno existente ou novo aluno
  enrollmentType: z.enum(["existing", "new"], {
    required_error: "Selecione o tipo de matrícula",
  }),
  
  // Dados do aluno - ID (usado apenas para aluno existente)
  studentId: z.string().optional(),
  
  // Dados do aluno - Novo (usado quando criar novo aluno)
  studentName: z.string().optional(),
  studentEmail: z.string().email({ message: "Email inválido" }).optional(),
  studentPhone: z.string().optional(),
  studentDocument: z.string().optional(),
  studentAddress: z.string().optional(),
  studentCity: z.string().optional(),
  studentState: z.string().optional(),
  studentZipCode: z.string().optional(),
  
  // Gateway de pagamento
  paymentGateway: z.enum(["asaas", "lytex"], {
    required_error: "Selecione um gateway de pagamento",
  }),
  
  // Dados do curso
  courseId: z.string().min(1, { message: "Selecione um curso" }),
  institutionId: z.string().min(1, { message: "Selecione uma instituição" }),
  poloId: z.string().min(1, { message: "Selecione um polo" }),
  
  // Dados de pagamento
  paymentMethod: z.enum(["credit_card", "bank_slip", "pix"], {
    required_error: "Selecione uma forma de pagamento",
  }),
  amount: z.string().min(1, { message: "Informe o valor" }),
  installments: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val, {
    message: "Você deve aceitar os termos antes de prosseguir",
  }),
  
  // Contrato
  contractTemplateId: z.string().min(1, { message: "Selecione um modelo de contrato" }),
  observations: z.string().optional(),
  
  // Campo para controlar o atual "passo" do formulário
  currentStep: z.number().min(1).max(4)
}).refine(data => {
  // Se for aluno existente, studentId é obrigatório
  if (data.enrollmentType === "existing") {
    return !!data.studentId;
  }
  
  // Se for novo aluno, todos os campos de aluno são obrigatórios
  if (data.enrollmentType === "new") {
    return !!data.studentName && 
           !!data.studentEmail && 
           !!data.studentPhone && 
           !!data.studentDocument && 
           !!data.studentAddress && 
           !!data.studentCity && 
           !!data.studentState && 
           !!data.studentZipCode;
  }
  
  return false;
}, {
  message: "Preencha todos os campos obrigatórios do aluno",
  path: ["enrollmentType"],
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

export default function NewEnrollmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  // Estado para controle de formulário multi-etapas
  const [step, setStep] = useState(1);
  const [isCreatingEnrollment, setIsCreatingEnrollment] = useState(false);
  const [createdEnrollmentId, setCreatedEnrollmentId] = useState<number | null>(null);
  
  // Estado para controle do diálogo de criação de usuário
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  
  // Função para lidar com a criação de um novo usuário
  const handleUserCreated = (newUser: any) => {
    // Atualiza a lista de estudantes
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users", "student"] });
    
    // Seleciona automaticamente o usuário recém-criado no formulário
    if (newUser && newUser.id) {
      form.setValue("studentId", newUser.id.toString());
      
      // Exibe mensagem de sucesso
      toast({
        title: "Usuário criado com sucesso",
        description: `O aluno ${newUser.fullName} foi adicionado e selecionado.`,
      });
    }
  };
  
  // Consulta para listar cursos disponíveis
  const { data: coursesData = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses", "published"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/courses?status=published");
      return await res.json();
    },
  });
  
  // Consulta para listar templates de contrato disponíveis
  const { data: contractTemplatesData = [], isLoading: isLoadingContractTemplates } = useQuery({
    queryKey: ["/api/contract-templates"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contract-templates");
      return await res.json();
    },
  });
  
  // Consulta para listar instituições disponíveis
  const { data: institutionsData = [], isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ["/api/institutions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/institutions");
      return await res.json();
    },
  });
  
  // Consulta para listar polos disponíveis
  const { data: polosData = [], isLoading: isLoadingPolos } = useQuery({
    queryKey: ["/api/polos"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/polos");
      return await res.json();
    },
  });
  
  // Consulta para listar alunos disponíveis
  const { data: studentsData = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/admin/users", "student"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users?portalType=student");
      return await res.json();
    },
  });
  
  // Inicializando formulário com valores padrão
  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      enrollmentType: "existing",
      studentId: "",
      studentName: "",
      studentEmail: "",
      studentPhone: "",
      studentDocument: "",
      studentAddress: "",
      studentCity: "",
      studentState: "",
      studentZipCode: "",
      courseId: "",
      institutionId: "",
      poloId: "",
      paymentGateway: "asaas",
      paymentMethod: "credit_card",
      amount: "",
      installments: "1",
      acceptTerms: false,
      contractTemplateId: "",
      observations: "",
      currentStep: 1
    }
  });
  
  // Função para calcular valor da parcela com juros quando aplicável
  const getInstallmentValue = (installments: number): string => {
    const amountStr = form.watch("amount") || "0";
    const amountValue = parseFloat(amountStr.replace(',', '.')) || 0;
    const paymentMethod = form.watch("paymentMethod");
    let installmentValue = amountValue;
    
    // Aplicar juros para parcelas maiores que 6x
    if (installments > 6) {
      // Juros diferentes baseados no método de pagamento
      if (paymentMethod === "credit_card") {
        // 1.2% de juros ao mês para cartão acima de 6x
        const monthlyInterest = 0.012;
        // Cálculo de juros compostos (modelo Price)
        installmentValue = amountValue * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                         (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
      } else if (paymentMethod === "bank_slip" || paymentMethod === "pix") {
        // Juros progressivos para boleto/PIX
        if (installments > 12) {
          // 1.5% de juros ao mês para parcelas acima de 12x
          const monthlyInterest = 0.015;
          installmentValue = amountValue * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                           (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
        } else {
          // 1% de juros ao mês para parcelas entre 7x e 12x
          const monthlyInterest = 0.01;
          installmentValue = amountValue * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                           (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
        }
      }
    }
    
    // Dividir o valor total pelo número de parcelas
    installmentValue = installmentValue / installments;
    
    // Formatar o valor
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(installmentValue);
  };
  
  // Mutation para criar nova matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormValues) => {
      setIsCreatingEnrollment(true);
      try {
        let payload: any;
        
        // Se for um aluno existente
        if (data.enrollmentType === "existing") {
          payload = {
            studentId: parseInt(data.studentId || "0"),
            courseId: parseInt(data.courseId),
            institutionId: parseInt(data.institutionId),
            poloId: parseInt(data.poloId),
            paymentGateway: data.paymentGateway,
            paymentMethod: data.paymentMethod,
            amount: parseFloat(data.amount.replace(',', '.')),
            contractTemplateId: parseInt(data.contractTemplateId),
            observations: data.observations || ""
          };
        } 
        // Se for um novo aluno
        else {
          payload = {
            newStudent: {
              fullName: data.studentName,
              email: data.studentEmail,
              phone: data.studentPhone,
              cpf: data.studentDocument,
              address: data.studentAddress,
              city: data.studentCity,
              state: data.studentState,
              zipCode: data.studentZipCode
            },
            courseId: parseInt(data.courseId),
            institutionId: parseInt(data.institutionId),
            poloId: parseInt(data.poloId),
            paymentGateway: data.paymentGateway,
            paymentMethod: data.paymentMethod,
            amount: parseFloat(data.amount.replace(',', '.')),
            contractTemplateId: parseInt(data.contractTemplateId),
            observations: data.observations || ""
          };
        }
        
        const res = await apiRequest("POST", "/api/enrollments", payload);
        const result = await res.json();
        return result;
      } finally {
        setIsCreatingEnrollment(false);
      }
    },
    onSuccess: (data) => {
      setCreatedEnrollmentId(data.id);
      toast({
        title: "Matrícula criada com sucesso",
        description: `Código da matrícula: ${data.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      // Redirect depois de 2 segundos
      setTimeout(() => {
        navigate("/admin/enrollments");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Lidar com a submissão do formulário em cada etapa
  const onSubmit = (values: EnrollmentFormValues) => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      createEnrollmentMutation.mutate(values);
    }
  };
  
  // Função para retornar para a etapa anterior
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Definir rótulos para os passos do formulário
  const stepLabels = [
    { number: 1, label: "Aluno" },
    { number: 2, label: "Curso" },
    { number: 3, label: "Pagamento" },
    { number: 4, label: "Contrato" },
  ];
  
  // Definir tipos para os dados
  type Course = {
    id: number;
    name: string;
    code: string;
    description: string;
    workload: number;
    price?: number;
  };
  
  type ContractTemplate = {
    id: number;
    name: string;
    description: string;
    type: string;
  };
  
  type Student = {
    id: number;
    fullName: string;
    email: string;
    cpf: string | null;
  };
  
  type Institution = {
    id: number;
    name: string;
  };
  
  type Polo = {
    id: number;
    name: string;
  };
  
  // Para obter o curso selecionado e exibir detalhes
  const selectedCourseId = form.watch("courseId");
  const selectedCourse = coursesData.find(
    (course: Course) => course.id.toString() === selectedCourseId
  );
  
  // Para obter o template de contrato selecionado
  const selectedContractTemplateId = form.watch("contractTemplateId");
  const selectedContractTemplate = contractTemplatesData.find(
    (template: ContractTemplate) => template.id.toString() === selectedContractTemplateId
  );
  
  // Obter o estudante selecionado
  const selectedStudentId = form.watch("studentId");
  const selectedStudent = studentsData.find(
    (student: Student) => student.id.toString() === selectedStudentId
  );
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar 
        items={getAdminSidebarItems(location || "")}
        user={user}
        portalType="admin"
        portalColor="#4CAF50"
        isMobileMenuOpen={false}
        setIsMobileMenuOpen={() => {}}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1">
        <div className="container py-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => navigate("/admin/enrollments")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Nova Matrícula</h1>
          </div>
          
          {/* Indicador de progresso */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="flex justify-between items-center">
              {stepLabels.map((s, index) => (
                <div key={s.number} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                        step >= s.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.number}
                    </div>
                    {index < stepLabels.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          step > s.number ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      step >= s.number ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Dados do Aluno"}
                {step === 2 && "Dados do Curso"}
                {step === 3 && "Dados de Pagamento"}
                {step === 4 && "Contrato e Documentos"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Preencha os dados do aluno para a matrícula"}
                {step === 2 && "Selecione o curso e instituição para a matrícula"}
                {step === 3 && "Configure a forma de pagamento para o curso"}
                {step === 4 && "Selecione o contrato e documentos necessários"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Etapa 1: Dados do Aluno */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-lg font-medium">Dados do Aluno</h2>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="enrollmentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Matrícula</FormLabel>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Resetar campos do aluno quando mudar o tipo de matrícula
                                if (value === "existing") {
                                  form.setValue("studentName", "");
                                  form.setValue("studentEmail", "");
                                  form.setValue("studentPhone", "");
                                  form.setValue("studentDocument", "");
                                  form.setValue("studentAddress", "");
                                  form.setValue("studentCity", "");
                                  form.setValue("studentState", "");
                                  form.setValue("studentZipCode", "");
                                } else {
                                  form.setValue("studentId", "");
                                }
                              }}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="existing" id="enrollment-existing" />
                                  <Label htmlFor="enrollment-existing">Aluno Existente</Label>
                                </div>
                              </FormControl>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="new" id="enrollment-new" />
                                  <Label htmlFor="enrollment-new">Novo Aluno</Label>
                                </div>
                              </FormControl>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Seleção de aluno existente */}
                      {form.watch("enrollmentType") === "existing" && (
                        <>
                          <FormField
                            control={form.control}
                            name="studentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Aluno</FormLabel>
                                <div className="flex gap-2">
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um aluno" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {studentsData.map((student: Student) => (
                                        <SelectItem key={student.id} value={student.id.toString()}>
                                          {student.fullName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Detalhes do aluno selecionado */}
                          {selectedStudent && (
                            <div className="border rounded-md p-4 bg-secondary/10">
                              <h3 className="font-medium mb-2">Dados do Aluno</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Nome:</p>
                                  <p>{selectedStudent.fullName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email:</p>
                                  <p>{selectedStudent.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">CPF:</p>
                                  <p>{selectedStudent.cpf}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Campos para novo aluno */}
                      {form.watch("enrollmentType") === "new" && (
                        <div className="space-y-4 border rounded-md p-4">
                          <h3 className="font-medium">Cadastro de Novo Aluno</h3>
                          
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
                            <h3 className="text-sm font-medium">Endereço</h3>
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
                      )}
                      
                      {/* Gateway de Pagamento (movido da etapa 3 para etapa 1) */}
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Gateway de Pagamento</h3>
                        <Alert className="mb-4 bg-amber-50 border-amber-300">
                          <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Importante</AlertTitle>
                          <AlertDescription className="text-amber-800">
                            Selecione o gateway de pagamento para cadastrar o cliente automaticamente na plataforma.
                          </AlertDescription>
                        </Alert>
                        
                        <FormField
                          control={form.control}
                          name="paymentGateway"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gateway de Pagamento</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o gateway" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="asaas">Asaas</SelectItem>
                                  <SelectItem value="lytex">Lytex</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Este gateway será usado para gerenciar todos os pagamentos do aluno.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Etapa 2: Dados do Curso */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-lg font-medium">Dados do Curso</h2>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="institutionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instituição</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma instituição" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {institutionsData.map((institution: Institution) => (
                                  <SelectItem key={institution.id} value={institution.id.toString()}>
                                    {institution.name}
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
                        name="poloId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Polo</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um polo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {polosData.map((polo: Polo) => (
                                  <SelectItem key={polo.id} value={polo.id.toString()}>
                                    {polo.name}
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
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curso</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Define o valor do curso no campo de valor
                                const selectedCourse = coursesData.find(
                                  (course: Course) => course.id.toString() === value
                                );
                                if (selectedCourse && selectedCourse.price) {
                                  form.setValue("amount", selectedCourse.price.toString());
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um curso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {coursesData.map((course: Course) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Detalhes do curso selecionado */}
                      {selectedCourse && (
                        <div className="border rounded-md p-4 bg-secondary/10">
                          <h3 className="font-medium mb-2">Detalhes do Curso</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Nome:</p>
                              <p>{selectedCourse.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Código:</p>
                              <p>{selectedCourse.code}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Carga Horária:</p>
                              <p>{selectedCourse.workload}h</p>
                            </div>
                            {selectedCourse.price && (
                              <div>
                                <p className="text-sm text-muted-foreground">Valor:</p>
                                <p>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCourse.price)}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Descrição:</p>
                            <p>{selectedCourse.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Etapa 3: Dados de Pagamento */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-lg font-medium">Dados de Pagamento</h2>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor do Curso</FormLabel>
                            <FormControl>
                              <Input placeholder="R$ 0,00" {...field} />
                            </FormControl>
                            <FormDescription>
                              Valor total do curso, sem juros.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a forma de pagamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                <SelectItem value="bank_slip">Boleto Bancário</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Opções de parcelamento condicionais à forma de pagamento */}
                      {form.watch("paymentMethod") === "credit_card" && (
                        <FormField
                          control={form.control}
                          name="installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parcelamento</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o número de parcelas" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((installment) => (
                                    <SelectItem key={installment} value={installment.toString()}>
                                      {installment}x de {getInstallmentValue(installment)}
                                      {installment > 6 ? ' (com juros)' : ' (sem juros)'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Acima de 6x, juros de 1,2% ao mês.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {/* Opções de parcelamento para boleto e PIX */}
                      {(form.watch("paymentMethod") === "bank_slip" || form.watch("paymentMethod") === "pix") && (
                        <FormField
                          control={form.control}
                          name="installments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parcelamento</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o número de parcelas" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18].map((installment) => (
                                    <SelectItem key={installment} value={installment.toString()}>
                                      {installment}x de {getInstallmentValue(installment)}
                                      {installment > 6 ? ' (com juros)' : ' (sem juros)'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Acima de 6x, juros de 1% ao mês até 12x e 1,5% acima disso.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Etapa 4: Contrato */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-lg font-medium">Contrato e Documentação</h2>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="contractTemplateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo de Contrato</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um modelo de contrato" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {contractTemplatesData.map((template: ContractTemplate) => (
                                  <SelectItem key={template.id} value={template.id.toString()}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Detalhes do template de contrato selecionado */}
                      {selectedContractTemplate && (
                        <div className="border rounded-md p-4 bg-secondary/10 mb-4">
                          <h3 className="font-medium mb-2">Detalhes do Contrato</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Modelo:</p>
                              <p>{selectedContractTemplate.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Tipo:</p>
                              <p>{selectedContractTemplate.type}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Descrição:</p>
                            <p>{selectedContractTemplate.description}</p>
                          </div>
                        </div>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Observações adicionais sobre a matrícula"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Declaro que li e concordo com os termos do contrato acima e confirmo a veracidade de todas as informações fornecidas.
                              </FormLabel>
                              <FormDescription>
                                Ao aceitar, você confirma que todas as informações do aluno, curso e pagamento estão corretas.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Botões de navegação */}
                  <div className="pt-4 border-t flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={step === 1}
                    >
                      Voltar
                    </Button>
                    
                    <Button 
                      type="submit"
                      disabled={isCreatingEnrollment}
                    >
                      {isCreatingEnrollment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {step < 4 ? "Próximo" : "Finalizar Matrícula"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog para criar novo usuário */}
      <CreateUserDialog 
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
        defaultPortalType="student"
      />
    </div>
  );
}