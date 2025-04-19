import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ptBR } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2Icon, ArrowLeftIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { CpfCustomerSearch } from "@/components/asaas/cpf-customer-search";

// Schema de validação
const formSchema = z.object({
  studentName: z.string().min(3, "Nome completo é obrigatório"),
  studentEmail: z.string().email("Email inválido"),
  studentCpf: z.string().min(11, "CPF inválido"),
  courseId: z.string().min(1, "Selecione um curso"),
  financialPlanId: z.string().optional(), // Plano financeiro é opcional
});

type FormValues = z.infer<typeof formSchema>;

export default function PoloSimplifiedEnrollmentNewPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados necessários
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses", { status: "published" }],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: poloData } = useQuery({
    queryKey: ["/api/polos/current"],
    retry: false, 
    refetchOnWindowFocus: false,
  });

  // Formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      studentCpf: "",
      courseId: "",
    },
  });

  // Mutation para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Converter IDs para números
      const payload = {
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        studentCpf: data.studentCpf.replace(/\D/g, ""),
        courseId: parseInt(data.courseId, 10),
        // Polo do usuário logado será utilizado automaticamente pelo backend
        financialPlanId: data.financialPlanId ? parseInt(data.financialPlanId, 10) : null,
        amount: 100.00, // Valor padrão para teste, depois será calculado com base no curso e plano
        sourceChannel: "polo_portal",
        externalReference: `matricula_${Date.now()}`, // Identificador único externo para a matrícula
      };
      
      console.log("Enviando payload:", payload);

      return await apiRequest("/api/simplified-enrollments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async (response) => {
      // Extrair dados da resposta
      const data = await response.json();
      
      toast({
        title: "Matrícula criada com sucesso!",
        description: "A matrícula simplificada foi criada com sucesso.",
      });
      
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["/api/simplified-enrollments"] });
      
      // Redirecionar para a página de detalhes
      navigate(`/polo/simplified-enrollment/${data.data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar matrícula",
        description: `Ocorreu um erro ao criar a matrícula: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handler de submissão
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    createEnrollmentMutation.mutate(values);
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const isLoading = isLoadingCourses;

  const handleBack = () => {
    navigate("/polo/simplified-enrollment");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nova Matrícula Simplificada</h2>
        <p className="text-muted-foreground">
          Crie uma nova matrícula simplificada para um aluno
        </p>
      </div>

      <Separator />

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Dados da Matrícula</CardTitle>
          <CardDescription>
            Preencha os dados do aluno e do curso para criar uma matrícula simplificada.
          </CardDescription>
          {poloData?.data && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm">
              Polo: <strong>{poloData.data.name}</strong>
            </div>
          )}
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Aluno</h3>
                
                <div className="mb-4 p-4 bg-muted/30 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Buscar aluno existente</h4>
                  <CpfCustomerSearch 
                    onCustomerSelect={(customerData) => {
                      // Preencher os campos do formulário com os dados do cliente
                      form.setValue("studentName", customerData.name);
                      form.setValue("studentEmail", customerData.email);
                      form.setValue("studentCpf", customerData.document);
                      
                      // Notificar o usuário
                      toast({
                        title: "Cliente encontrado",
                        description: "Os dados do cliente foram preenchidos automaticamente.",
                        variant: "default"
                      });
                    }} 
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome completo do aluno" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Email do aluno" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="studentCpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(formatCPF(e.target.value));
                            }}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Curso</h3>
                
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curso</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoadingCourses}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(courses) 
                              ? courses.length === 0
                                ? <SelectItem value="no-courses">Nenhum curso disponível</SelectItem>
                                : courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                      {course.name}
                                    </SelectItem>
                                  ))
                              : courses?.data && Array.isArray(courses.data)
                                ? courses.data.length === 0
                                  ? <SelectItem value="no-courses">Nenhum curso disponível</SelectItem>
                                  : courses.data.map((course) => (
                                      <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.name}
                                      </SelectItem>
                                    ))
                                : <SelectItem value="no-courses">Nenhum curso disponível</SelectItem>
                            }
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/polo/simplified-enrollment")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Criar Matrícula
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}