import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createSimplifiedEnrollment } from '../../../services/new-simplified-enrollment-service';

// Esquema de validação
const formSchema = z.object({
  studentName: z.string().min(3, { message: 'Nome do aluno deve ter pelo menos 3 caracteres' }),
  studentEmail: z.string().email({ message: 'E-mail inválido' }),
  studentCpf: z.string()
    .min(11, { message: 'CPF deve ter 11 dígitos' })
    .max(14, { message: 'CPF inválido' })
    .refine((cpf) => {
      // Remove caracteres não numéricos
      const cpfNumbers = cpf.replace(/\D/g, '');
      return cpfNumbers.length === 11;
    }, { message: 'CPF inválido' }),
  studentPhone: z.string().optional(),
  courseId: z.string().min(1, { message: 'Selecione um curso' }).transform(Number),
  institutionId: z.string().min(1, { message: 'Selecione uma instituição' }).transform(Number),
  amount: z.string()
    .min(1, { message: 'Informe o valor da matrícula' })
    .transform((val) => parseFloat(val.replace(',', '.'))),
  poloId: z.string().optional().transform((val) => val ? Number(val) : null),
  sourceChannel: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewSimplifiedEnrollmentCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar cursos
  const { data: coursesResponse } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Falha ao carregar cursos');
      return response.json();
    },
  });

  // Buscar instituições
  const { data: institutionsResponse } = useQuery({
    queryKey: ['/api/institutions'],
    queryFn: async () => {
      const response = await fetch('/api/institutions');
      if (!response.ok) throw new Error('Falha ao carregar instituições');
      return response.json();
    },
  });

  // Buscar polos
  const { data: polosResponse } = useQuery({
    queryKey: ['/api/polos'],
    queryFn: async () => {
      const response = await fetch('/api/polos');
      if (!response.ok) throw new Error('Falha ao carregar polos');
      return response.json();
    },
  });

  const courses = coursesResponse?.data || [];
  const institutions = institutionsResponse?.data || [];
  const polos = polosResponse?.data || [];

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      studentEmail: '',
      studentCpf: '',
      studentPhone: '',
      courseId: '',
      institutionId: '',
      amount: '',
      poloId: '',
      sourceChannel: 'admin-portal',
    },
  });

  // Mutation para criar matrícula
  const createEnrollmentMutation = useMutation({
    mutationFn: createSimplifiedEnrollment,
    onSuccess: (data) => {
      toast({
        title: 'Matrícula criada com sucesso',
        description: 'A nova matrícula foi criada e pode ser gerenciada na lista de matrículas.',
      });
      
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['/api/v2/simplified-enrollments'] });
      
      // Redirecionar para a página de detalhes
      navigate(`/admin/crm/new-simplified-enrollments/${data.data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar matrícula',
        description: error.message || 'Ocorreu um erro ao criar a matrícula. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  // Submit handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createEnrollmentMutation.mutate({
      studentName: values.studentName,
      studentEmail: values.studentEmail,
      studentCpf: values.studentCpf.replace(/\D/g, ''), // Remover formatação
      studentPhone: values.studentPhone,
      courseId: values.courseId,
      institutionId: values.institutionId,
      amount: values.amount,
      poloId: values.poloId,
      sourceChannel: values.sourceChannel || 'admin-portal',
    });
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/crm/new-simplified-enrollments')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
      </div>

      <div className="flex flex-col space-y-4 mb-6">
        <h1 className="text-2xl font-bold">Nova Matrícula Simplificada</h1>
        <p className="text-muted-foreground">
          Preencha os dados abaixo para criar uma nova matrícula simplificada.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Matrícula</CardTitle>
          <CardDescription>
            Informe os dados do aluno e do curso para criar a matrícula.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Aluno</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo*</FormLabel>
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
                        <FormLabel>E-mail*</FormLabel>
                        <FormControl>
                          <Input placeholder="E-mail do aluno" type="email" {...field} />
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
                        <FormLabel>CPF*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CPF do aluno"
                            {...field}
                            value={formatCPF(field.value)}
                            maxLength={14}
                          />
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
                          <Input placeholder="Telefone do aluno" {...field} />
                        </FormControl>
                        <FormDescription>
                          Formato recomendado: (XX) XXXXX-XXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Curso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curso*</FormLabel>
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
                            {courses.map((course: any) => (
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
                  <FormField
                    control={form.control}
                    name="institutionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instituição*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma instituição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {institutions.map((institution: any) => (
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
                        <FormLabel>Polo (opcional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um polo (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {polos.map((polo: any) => (
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Valor da matrícula"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9,.]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe o valor em reais (ex: 1200,00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/crm/new-simplified-enrollments')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Criar Matrícula
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}