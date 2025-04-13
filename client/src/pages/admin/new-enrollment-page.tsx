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
import { Plus, Loader2 } from "lucide-react";

// Schema para validação do formulário
const enrollmentFormSchema = z.object({
  // Dados do aluno
  studentId: z.string().min(1, { message: "Selecione um aluno" }),
  
  // Dados do curso
  courseId: z.string().min(1, { message: "Selecione um curso" }),
  institutionId: z.string().min(1, { message: "Selecione uma instituição" }),
  poloId: z.string().min(1, { message: "Selecione um polo" }),
  
  // Dados de pagamento
  paymentGateway: z.enum(["asaas", "lytex"], {
    required_error: "Selecione um gateway de pagamento",
  }),
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
    queryKey: ["/api/users", "student"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users?portalType=student");
      return await res.json();
    },
  });
  
  // Inicializando formulário com valores padrão
  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentId: "",
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
  
  // Mutation para criar nova matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormValues) => {
      setIsCreatingEnrollment(true);
      try {
        const payload = {
          studentId: parseInt(data.studentId),
          courseId: parseInt(data.courseId),
          institutionId: parseInt(data.institutionId),
          poloId: parseInt(data.poloId),
          paymentGateway: data.paymentGateway,
          paymentMethod: data.paymentMethod,
          amount: parseFloat(data.amount),
          contractTemplateId: parseInt(data.contractTemplateId),
          observations: data.observations || ""
        };
        
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
        items={getAdminSidebarItems()} 
        // @ts-ignore - isMobile é uma prop válida em outros componentes
        isMobile={isMobile} 
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
                {step === 4 && "Contrato"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Selecione o aluno que será matriculado"}
                {step === 2 && "Escolha o curso, instituição e polo"}
                {step === 3 && "Configure os dados de pagamento"}
                {step === 4 && "Escolha o modelo de contrato e confirme a matrícula"}
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
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => navigate("/admin/users/new?redirectTo=enrollments/new")}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Novo Aluno
                              </Button>
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
                              onValueChange={field.onChange}
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
                              <p className="text-sm text-muted-foreground">Curso:</p>
                              <p>{selectedCourse.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Código:</p>
                              <p>{selectedCourse.code}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Carga Horária:</p>
                              <p>{selectedCourse.workload} horas</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Preço:</p>
                              <p>R$ {selectedCourse.price?.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Descrição:</p>
                            <p className="text-sm">{selectedCourse.description}</p>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="0,00"
                                {...field}
                                onChange={(e) => {
                                  // Permitir apenas números e vírgula
                                  const value = e.target.value.replace(/[^0-9,]/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Informe o valor total do curso
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
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="credit_card" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Cartão de Crédito
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="bank_slip" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Boleto Bancário
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="pix" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
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
                              <FormLabel>Número de Parcelas</FormLabel>
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
                                  <SelectItem value="1">1x sem juros</SelectItem>
                                  <SelectItem value="2">2x sem juros</SelectItem>
                                  <SelectItem value="3">3x sem juros</SelectItem>
                                  <SelectItem value="4">4x sem juros</SelectItem>
                                  <SelectItem value="5">5x sem juros</SelectItem>
                                  <SelectItem value="6">6x sem juros</SelectItem>
                                  <SelectItem value="7">7x sem juros</SelectItem>
                                  <SelectItem value="8">8x sem juros</SelectItem>
                                  <SelectItem value="9">9x sem juros</SelectItem>
                                  <SelectItem value="10">10x sem juros</SelectItem>
                                  <SelectItem value="11">11x sem juros</SelectItem>
                                  <SelectItem value="12">12x sem juros</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
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
                              <FormLabel>
                                Concordo com os termos de serviço e políticas de privacidade
                              </FormLabel>
                              <FormDescription>
                                Ao concordar, você aceita os termos e condições de pagamento.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Etapa 4: Contrato */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-lg font-medium">Contrato</h2>
                      </div>
                      
                      <Alert className="bg-amber-50 border-amber-300">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Importante</AlertTitle>
                        <AlertDescription className="text-amber-800">
                          O contrato será gerado após a confirmação da matrícula. O aluno deverá assinar digitalmente o documento pelo Portal do Aluno posteriormente.
                        </AlertDescription>
                      </Alert>
                      
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
                      
                      {selectedContractTemplate && (
                        <div className="border rounded-md p-4 bg-secondary/10">
                          <h3 className="font-medium mb-2">Detalhes do Modelo</h3>
                          <p className="text-sm text-muted-foreground">{selectedContractTemplate.description}</p>
                        </div>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações Adicionais</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Informações adicionais para o contrato"
                                className="resize-none h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Estas observações serão incluídas no contrato
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {createdEnrollmentId && (
                        <Alert className="bg-green-50 border-green-200">
                          <FileTextIcon className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Matrícula criada com sucesso!</AlertTitle>
                          <AlertDescription className="text-green-800">
                            O contrato foi gerado e está disponível para assinatura no Portal do Aluno.
                            Você será redirecionado em instantes...
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? () => navigate("/admin/enrollments") : goToPreviousStep}
              >
                {step === 1 ? "Cancelar" : "Voltar"}
              </Button>
              
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isCreatingEnrollment}
                className={`${step < 4 ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
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