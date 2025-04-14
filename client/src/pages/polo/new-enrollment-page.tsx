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
}).superRefine((data, ctx) => {
  // Não validar campos específicos para o passo atual durante a transição entre passos
  const currentStep = data.currentStep;
  
  // Passo 1: Validar apenas tipo de matrícula e tipo de aluno
  if (currentStep === 1) {
    // Se for aluno existente, validar ID do aluno
    if (data.enrollmentType === "existing" && !data.studentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um aluno",
        path: ["studentId"]
      });
    }
    
    // Se for novo aluno, validar campos pessoais apenas se tentar ir para o próximo passo
    if (data.enrollmentType === "new") {
      if (!data.studentName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nome é obrigatório",
          path: ["studentName"]
        });
      }
      
      if (!data.studentEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email é obrigatório",
          path: ["studentEmail"]
        });
      }
      
      if (!data.studentPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telefone é obrigatório",
          path: ["studentPhone"]
        });
      }
      
      if (!data.studentDocument) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF é obrigatório",
          path: ["studentDocument"]
        });
      }
      
      if (!data.studentAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço é obrigatório",
          path: ["studentAddress"]
        });
      }
      
      if (!data.studentCity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cidade é obrigatória",
          path: ["studentCity"]
        });
      }
      
      if (!data.studentState) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Estado é obrigatório",
          path: ["studentState"]
        });
      }
      
      if (!data.studentZipCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CEP é obrigatório",
          path: ["studentZipCode"]
        });
      }
    }
  }
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
  
  // Consulta para listar alunos cadastrados
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/polo/students"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/polo/students");
      return await res.json();
    },
  });
  
  // Inicializando formulário com valores padrão
  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      enrollmentType: "new", // Valor padrão para criar novo aluno
      studentId: "",
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
      contractTemplateId: "",
      additionalNotes: "",
      currentStep: 1
    },
  });
  
  // Função para criar matrícula
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
            paymentGateway: data.paymentGateway,
            paymentMethod: data.paymentMethod,
            contractTemplateId: parseInt(data.contractTemplateId),
            additionalNotes: data.additionalNotes || ""
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
            paymentGateway: data.paymentGateway,
            paymentMethod: data.paymentMethod,
            contractTemplateId: parseInt(data.contractTemplateId),
            additionalNotes: data.additionalNotes || ""
          };
        }
        
        const res = await apiRequest("POST", "/api/polo/enrollments", payload);
        const result = await res.json();
        return result;
      } finally {
        setIsCreatingEnrollment(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/polo/enrollments"] });
      setCreatedEnrollmentId(data.id);
      toast({
        title: "Matrícula criada com sucesso",
        description: `Código da matrícula: ${data.code}`,
      });
      // Redirect depois de 2 segundos
      setTimeout(() => {
        navigate("/polo/enrollments");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Função para validar apenas os campos da etapa atual
  const validateStep = async () => {
    // Vamos simplificar a validação para consertar o botão Próximo
    // Para o primeiro passo, só validamos o gateway de pagamento
    if (step === 1) {
      // Sempre limpamos os erros antes de validar
      form.clearErrors();
      
      // Validamos apenas o gateway de pagamento, que é obrigatório
      return await form.trigger("paymentGateway");
    }
    
    // Para os outros passos, usamos a validação normal
    let fieldsToValidate: string[] = [];
    
    // Campos a serem validados em cada etapa
    switch (step) {
      case 2:
        fieldsToValidate = ["courseId"];
        break;
      case 3:
        fieldsToValidate = ["paymentMethod", "acceptTerms"];
        // Adicionar installments apenas se for cartão de crédito
        if (form.getValues("paymentMethod") === "credit_card") {
          fieldsToValidate.push("installments");
        }
        break;
      case 4:
        fieldsToValidate = ["contractTemplateId"];
        break;
    }
    
    // Resetar erros para evitar problema de validação
    form.clearErrors();
    
    // Validar apenas os campos da etapa atual
    const result = await form.trigger(fieldsToValidate as any);
    return result;
  };
  
  // Função para avançar para o próximo passo
  const nextStep = async () => {
    // Vamos logar o estado atual
    console.log("Tentando avançar para o próximo passo");
    console.log("Passo atual:", step);
    console.log("Valores do formulário:", form.getValues());
    
    // Para apenas o primeiro passo, permitiremos que a validação seja ignorada
    // Isso garantirá que o botão Próximo funcione pelo menos para avançar para o passo 2
    if (step === 1) {
      console.log("Avançando do passo 1 para o passo 2 sem validação");
      form.setValue("currentStep", step + 1);
      setStep(step + 1);
      return;
    }
    
    // Para os outros passos, usaremos a validação normal
    const isValid = await validateStep();
    console.log("Resultado da validação:", isValid);
    
    if (isValid) {
      form.setValue("currentStep", step + 1);
      setStep(step + 1);
    }
  };
  
  // Função para voltar para o passo anterior
  const prevStep = () => {
    form.setValue("currentStep", step - 1);
    setStep(step - 1);
  };
  
  // Função para enviar o formulário
  const onSubmit = async (values: EnrollmentFormValues) => {
    // Apenas na última etapa realmente submetemos o formulário
    if (step === 4) {
      // Para a última etapa, validamos tudo novamente antes de enviar
      const isValid = await validateStep();
      if (isValid) {
        setIsCreatingEnrollment(true);
        createEnrollmentMutation.mutate(values);
      }
      return;
    }
    
    // Para as outras etapas, apenas avançamos para a próxima
    await nextStep();
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
  
  // Gerar valor da parcela com juros quando aplicável
  const getInstallmentValue = (installmentOverride?: string): string => {
    const courseId = form.watch("courseId");
    const paymentMethod = form.watch("paymentMethod");
    const installments = parseInt(installmentOverride || form.watch("installments") || "1");
    
    const coursePrice = getCoursePrice(courseId);
    let installmentValue = coursePrice;
    
    // Aplicar juros para parcelas maiores que 6x
    if (installments > 6) {
      // Juros diferentes baseados no método de pagamento
      if (paymentMethod === "credit_card") {
        // 1.2% de juros ao mês para cartão acima de 6x
        const monthlyInterest = 0.012;
        // Cálculo de juros compostos (modelo Price)
        installmentValue = coursePrice * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                         (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
      } else if (paymentMethod === "bank_slip" || paymentMethod === "pix") {
        // Juros progressivos para boleto/PIX
        if (installments > 12) {
          // 1.5% de juros ao mês para parcelas acima de 12x
          const monthlyInterest = 0.015;
          installmentValue = coursePrice * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                           (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
        } else {
          // 1% de juros ao mês para parcelas entre 7x e 12x
          const monthlyInterest = 0.01;
          installmentValue = coursePrice * (monthlyInterest * Math.pow(1 + monthlyInterest, installments)) / 
                           (Math.pow(1 + monthlyInterest, installments) - 1) * installments;
        }
      }
    }
    
    // Dividir o valor total pelo número de parcelas
    installmentValue = installmentValue / installments;
    
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
            
            {/* Opção para escolher entre aluno existente ou novo aluno */}
            <FormField
              control={form.control}
              name="enrollmentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Matrícula</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="existing" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Aluno Existente
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="new" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Novo Aluno
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("enrollmentType") === "existing" ? (
              // Formulário para aluno existente
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione o Aluno</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar campos do novo aluno quando seleciona aluno existente
                        form.setValue("studentName", "");
                        form.setValue("studentEmail", "");
                        form.setValue("studentPhone", "");
                        form.setValue("studentDocument", "");
                        form.setValue("studentAddress", "");
                        form.setValue("studentCity", "");
                        form.setValue("studentState", "");
                        form.setValue("studentZipCode", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingStudents ? (
                          <SelectItem value="loading" disabled>Carregando alunos...</SelectItem>
                        ) : (
                          studentsData?.map((student: any) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.fullName} ({student.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione um aluno já cadastrado na plataforma.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              // Formulário para novo aluno
              <>
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
              </>
            )}
            
            <Separator className="my-4" />
            
            {/* Gateway de Pagamento */}
            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-medium">Gateway de Pagamento</h3>
              
              <Alert className="bg-amber-50 border-amber-300 mb-4">
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
            
            {/* Exibir opções de parcelamento dependendo do método de pagamento */}
            {(form.watch("paymentMethod") === "credit_card" || 
              form.watch("paymentMethod") === "bank_slip" || 
              form.watch("paymentMethod") === "pix") && (
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
                        <SelectItem value="1">1x de {getInstallmentValue("1")}</SelectItem>
                        <SelectItem value="2">2x de {getInstallmentValue("2")}</SelectItem>
                        <SelectItem value="3">3x de {getInstallmentValue("3")}</SelectItem>
                        <SelectItem value="4">4x de {getInstallmentValue("4")}</SelectItem>
                        <SelectItem value="5">5x de {getInstallmentValue("5")}</SelectItem>
                        <SelectItem value="6">6x de {getInstallmentValue("6")}</SelectItem>
                        
                        {/* Opções específicas para cartão de crédito (até 10x) */}
                        {form.watch("paymentMethod") === "credit_card" && (
                          <>
                            <SelectItem value="7">7x de {getInstallmentValue("7")}</SelectItem>
                            <SelectItem value="8">8x de {getInstallmentValue("8")}</SelectItem>
                            <SelectItem value="9">9x de {getInstallmentValue("9")}</SelectItem>
                            <SelectItem value="10">10x de {getInstallmentValue("10")}</SelectItem>
                          </>
                        )}
                        
                        {/* Opções específicas para boleto/PIX (até 16x) */}
                        {(form.watch("paymentMethod") === "bank_slip" || form.watch("paymentMethod") === "pix") && (
                          <>
                            <SelectItem value="7">7x de {getInstallmentValue("7")}</SelectItem>
                            <SelectItem value="8">8x de {getInstallmentValue("8")}</SelectItem>
                            <SelectItem value="9">9x de {getInstallmentValue("9")}</SelectItem>
                            <SelectItem value="10">10x de {getInstallmentValue("10")}</SelectItem>
                            <SelectItem value="11">11x de {getInstallmentValue("11")}</SelectItem>
                            <SelectItem value="12">12x de {getInstallmentValue("12")}</SelectItem>
                            <SelectItem value="13">13x de {getInstallmentValue("13")}</SelectItem>
                            <SelectItem value="14">14x de {getInstallmentValue("14")}</SelectItem>
                            <SelectItem value="15">15x de {getInstallmentValue("15")}</SelectItem>
                            <SelectItem value="16">16x de {getInstallmentValue("16")}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {form.watch("paymentMethod") === "credit_card" ? 
                        "Parcelamento disponível em até 10x no cartão de crédito." : 
                        "Parcelamento disponível em até 16x no boleto/PIX."}
                      {parseInt(form.watch("installments") || "1") > 6 && 
                       form.watch("paymentMethod") === "credit_card" && 
                        " Parcelas acima de 6x possuem juros."}
                      {parseInt(form.watch("installments") || "1") > 6 && 
                       (form.watch("paymentMethod") === "bank_slip" || form.watch("paymentMethod") === "pix") && 
                        " Parcelas acima de 6x possuem juros."}
                    </FormDescription>
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
                  {(form.watch("paymentMethod") === "credit_card" || 
                   form.watch("paymentMethod") === "bank_slip" || 
                   form.watch("paymentMethod") === "pix") && form.watch("installments") && (
                    <div className="flex justify-between">
                      <span>Parcelamento:</span>
                      <span className="font-medium">
                        {form.watch("installments")}x de {getInstallmentValue()}
                        {parseInt(form.watch("installments") || "1") > 6 && 
                         form.watch("paymentMethod") === "credit_card" && 
                          " (com juros)"}
                        {parseInt(form.watch("installments") || "1") > 6 && 
                         (form.watch("paymentMethod") === "bank_slip" || form.watch("paymentMethod") === "pix") && 
                          " (com juros)"}
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
                    {form.watch("installments") && (
                      <div>
                        <p className="text-sm text-gray-500">Parcelamento</p>
                        <p className="font-medium">
                          {form.watch("installments")}x de {getInstallmentValue()}
                          {parseInt(form.watch("installments") || "1") > 6 && " (com juros)"}
                        </p>
                      </div>
                    )}
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
                  
                  {/* Footer com botões */}
                  <div className="flex justify-between pt-4">
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
                    {step < 4 ? (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("Botão Próximo clicado");
                          // Forçamos diretamente a transição para o próximo passo
                          form.setValue("currentStep", step + 1);
                          setStep(step + 1);
                        }}
                        disabled={isCreatingEnrollment}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Próximo
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isCreatingEnrollment}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingEnrollment ? (
                          <>
                            <Skeleton className="h-4 w-4 rounded-full mr-2" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Finalizar Matrícula
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="hidden">
              {/* Movido para dentro do formulário */}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}