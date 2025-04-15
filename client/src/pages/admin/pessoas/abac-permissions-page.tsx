/**
 * Página de Gerenciamento de Permissões Contextuais (ABAC)
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Edit, PlusCircle, Clock, CalendarClock, Award, ListFilter, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/admin-layout';
import { Skeleton } from '@/components/ui/skeleton';

// Tipos
interface InstitutionPhasePermission {
  id: number;
  resource: string;
  action: string;
  phase: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PeriodPermissionRule {
  id: number;
  resource: string;
  action: string;
  periodType: string;
  daysBeforeStart: number;
  daysAfterEnd: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStatusPermission {
  id: number;
  resource: string;
  action: string;
  paymentStatus: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
}

// Schemas de formulário
const institutionPhaseSchema = z.object({
  resource: z.string().min(1, { message: 'Recurso é obrigatório' }),
  action: z.string().min(1, { message: 'Ação é obrigatória' }),
  phase: z.string().min(1, { message: 'Fase é obrigatória' }),
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres' }),
  isAllowed: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

const periodPermissionSchema = z.object({
  resource: z.string().min(1, { message: 'Recurso é obrigatório' }),
  action: z.string().min(1, { message: 'Ação é obrigatória' }),
  periodType: z.string().min(1, { message: 'Tipo de período é obrigatório' }),
  daysBeforeStart: z.coerce.number().int().nonnegative({ message: 'Deve ser um número não negativo' }),
  daysAfterEnd: z.coerce.number().int().nonnegative({ message: 'Deve ser um número não negativo' }),
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres' }),
  isActive: z.boolean().default(true)
});

const paymentStatusSchema = z.object({
  resource: z.string().min(1, { message: 'Recurso é obrigatório' }),
  action: z.string().min(1, { message: 'Ação é obrigatória' }),
  paymentStatus: z.string().min(1, { message: 'Status de pagamento é obrigatório' }),
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres' }),
  isAllowed: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

// Tipos para os formulários
type InstitutionPhaseFormValues = z.infer<typeof institutionPhaseSchema>;
type PeriodPermissionFormValues = z.infer<typeof periodPermissionSchema>;
type PaymentStatusFormValues = z.infer<typeof paymentStatusSchema>;

export default function AbacPermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('institution-phase');
  const [resourceOptions, setResourceOptions] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<Array<{ value: string; label: string }>>([]);

  // Lista fixa de recursos do sistema
  const fixedResources = [
    'usuarios',
    'papeis',
    'permissoes',
    'instituicoes',
    'polos',
    'cursos',
    'matriculas',
    'transacoes_financeiras',
    'leads',
    'clientes',
    'contratos',
    'produtos',
    'faturas',
    'pagamentos',
    'certificados',
    'modelos_certificados',
    'signatarios_certificados',
    'planos_assinatura',
    'assinaturas',
    'relatorios',
    'configuracoes',
    'comunicacoes'
  ];

  // Consulta para buscar permissões disponíveis
  const permissionsQuery = useQuery({
    queryKey: ['/api/permissions/list'],
    queryFn: () => apiRequest<Permission[]>('/api/permissions/list')
  });

  // Extrair recursos únicos das permissões ou usar recursos fixos
  useEffect(() => {
    if (permissionsQuery.data && permissionsQuery.data.length > 0) {
      // Se tiver dados da API, usar esses recursos
      const uniqueResources = Array.from(new Set(permissionsQuery.data.map(p => p.resource)));
      setResourceOptions(uniqueResources);
    } else {
      // Caso contrário, usar a lista fixa
      setResourceOptions(fixedResources);
    }
  }, [permissionsQuery.data]);

  // Lista fixa de ações comuns em português
  const commonActions = [
    { value: 'ler', label: 'Visualizar' },
    { value: 'criar', label: 'Criar' },
    { value: 'atualizar', label: 'Atualizar' },
    { value: 'deletar', label: 'Excluir' },
    { value: 'gerenciar', label: 'Gerenciar' },
    { value: 'aprovar', label: 'Aprovar' },
    { value: 'rejeitar', label: 'Rejeitar' },
    { value: 'cancelar', label: 'Cancelar' },
    { value: 'atribuir', label: 'Atribuir' },
    { value: 'desatribuir', label: 'Desatribuir' },
    { value: 'exportar', label: 'Exportar' },
    { value: 'importar', label: 'Importar' },
    { value: 'ativar', label: 'Ativar' },
    { value: 'desativar', label: 'Desativar' },
    { value: 'gerar', label: 'Gerar' },
    { value: 'validar', label: 'Validar' },
    { value: 'finalizar', label: 'Finalizar' }
  ];

  // Função para obter ações disponíveis para um recurso específico
  const getActionsForResource = (resource: string) => {
    if (permissionsQuery.data && permissionsQuery.data.length > 0) {
      // Se tiver dados da API, usar ações específicas para o recurso
      return permissionsQuery.data
        .filter(p => p.resource === resource)
        .map(p => ({ value: p.action, label: p.description }));
    } else {
      // Caso contrário, usar ações comuns
      return commonActions;
    }
  };

  // Atualizar ações disponíveis quando o recurso selecionado muda
  const updateActionsForResource = (resource: string) => {
    const actions = getActionsForResource(resource);
    setActionOptions(actions);
  };

  // Consultas para buscar dados
  const institutionPhaseQuery = useQuery({
    queryKey: ['/api/permissions/abac/institution-phase'],
    queryFn: () => apiRequest<InstitutionPhasePermission[]>('/api/permissions/abac/institution-phase')
  });

  const periodPermissionQuery = useQuery({
    queryKey: ['/api/permissions/abac/period-rules'],
    queryFn: () => apiRequest<PeriodPermissionRule[]>('/api/permissions/abac/period-rules')
  });

  const paymentStatusQuery = useQuery({
    queryKey: ['/api/permissions/abac/payment-status'],
    queryFn: () => apiRequest<PaymentStatusPermission[]>('/api/permissions/abac/payment-status')
  });

  // Mutação para criar regra de permissão de fase de instituição
  const createInstitutionPhaseMutation = useMutation({
    mutationFn: (data: InstitutionPhaseFormValues) => 
      apiRequest('/api/permissions/abac/institution-phase', { 
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/institution-phase'] });
      toast({
        title: "Permissão ABAC criada",
        description: "A regra de permissão contextual foi criada com sucesso.",
      });
      institutionPhaseForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar permissão",
        description: error.message || "Ocorreu um erro ao criar a regra de permissão.",
        variant: "destructive",
      });
    }
  });

  // Mutação para criar regra de permissão de período
  const createPeriodPermissionMutation = useMutation({
    mutationFn: (data: PeriodPermissionFormValues) => 
      apiRequest('/api/permissions/abac/period-rules', { 
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/period-rules'] });
      toast({
        title: "Regra de período criada",
        description: "A regra de permissão de período foi criada com sucesso.",
      });
      periodPermissionForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar regra",
        description: error.message || "Ocorreu um erro ao criar a regra de período.",
        variant: "destructive",
      });
    }
  });

  // Mutação para criar regra de permissão de status de pagamento
  const createPaymentStatusMutation = useMutation({
    mutationFn: (data: PaymentStatusFormValues) => 
      apiRequest('/api/permissions/abac/payment-status', { 
        method: 'POST',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/payment-status'] });
      toast({
        title: "Regra de pagamento criada",
        description: "A regra de permissão de status de pagamento foi criada com sucesso.",
      });
      paymentStatusForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar regra",
        description: error.message || "Ocorreu um erro ao criar a regra de status de pagamento.",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir permissão por fase de instituição
  const deleteInstitutionPhaseMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/permissions/abac/institution-phase/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/institution-phase'] });
      toast({
        title: "Permissão excluída",
        description: "A regra de permissão foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir permissão",
        description: error.message || "Ocorreu um erro ao excluir a regra de permissão.",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir regra de período
  const deletePeriodRuleMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/permissions/abac/period-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/period-rules'] });
      toast({
        title: "Regra excluída",
        description: "A regra de período foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir regra",
        description: error.message || "Ocorreu um erro ao excluir a regra de período.",
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir regra de status de pagamento
  const deletePaymentStatusMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/permissions/abac/payment-status/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/abac/payment-status'] });
      toast({
        title: "Regra excluída",
        description: "A regra de status de pagamento foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir regra",
        description: error.message || "Ocorreu um erro ao excluir a regra de status de pagamento.",
        variant: "destructive",
      });
    }
  });

  // Formulários
  const institutionPhaseForm = useForm<InstitutionPhaseFormValues>({
    resolver: zodResolver(institutionPhaseSchema),
    defaultValues: {
      resource: '',
      action: '',
      phase: '',
      description: '',
      isAllowed: true,
      isActive: true
    }
  });

  const periodPermissionForm = useForm<PeriodPermissionFormValues>({
    resolver: zodResolver(periodPermissionSchema),
    defaultValues: {
      resource: '',
      action: '',
      periodType: '',
      daysBeforeStart: 0,
      daysAfterEnd: 0,
      description: '',
      isActive: true
    }
  });

  const paymentStatusForm = useForm<PaymentStatusFormValues>({
    resolver: zodResolver(paymentStatusSchema),
    defaultValues: {
      resource: '',
      action: '',
      paymentStatus: '',
      description: '',
      isAllowed: true,
      isActive: true
    }
  });

  // Manipuladores de envio de formulário
  function onSubmitInstitutionPhase(values: InstitutionPhaseFormValues) {
    createInstitutionPhaseMutation.mutate(values);
  }

  function onSubmitPeriodPermission(values: PeriodPermissionFormValues) {
    createPeriodPermissionMutation.mutate(values);
  }

  function onSubmitPaymentStatus(values: PaymentStatusFormValues) {
    createPaymentStatusMutation.mutate(values);
  }

  // Atualizar ações quando o recurso muda
  const watchResourceInstitutionPhase = institutionPhaseForm.watch('resource');
  const watchResourcePeriod = periodPermissionForm.watch('resource');
  const watchResourcePaymentStatus = paymentStatusForm.watch('resource');

  // Efeitos para atualizar as ações disponíveis quando o recurso muda
  useEffect(() => {
    if (watchResourceInstitutionPhase) {
      updateActionsForResource(watchResourceInstitutionPhase);
    }
  }, [watchResourceInstitutionPhase]);

  useEffect(() => {
    if (watchResourcePeriod) {
      updateActionsForResource(watchResourcePeriod);
    }
  }, [watchResourcePeriod]);

  useEffect(() => {
    if (watchResourcePaymentStatus) {
      updateActionsForResource(watchResourcePaymentStatus);
    }
  }, [watchResourcePaymentStatus]);

  // Colunas para tabelas
  const institutionPhaseColumns: ColumnDef<InstitutionPhasePermission>[] = [
    {
      accessorKey: 'resource',
      header: 'Recurso',
    },
    {
      accessorKey: 'action',
      header: 'Ação',
    },
    {
      accessorKey: 'phase',
      header: 'Fase',
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'isAllowed',
      header: 'Tipo',
      cell: ({ row }) => (
        <div className={`text-center font-medium ${row.original.isAllowed ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.isAllowed ? 'Permitir' : 'Negar'}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Ativo',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isActive ? 'Sim' : 'Não'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteInstitutionPhaseMutation.mutate(row.original.id)}
            disabled={deleteInstitutionPhaseMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const periodRuleColumns: ColumnDef<PeriodPermissionRule>[] = [
    {
      accessorKey: 'resource',
      header: 'Recurso',
    },
    {
      accessorKey: 'action',
      header: 'Ação',
    },
    {
      accessorKey: 'periodType',
      header: 'Tipo de Período',
    },
    {
      accessorKey: 'daysBeforeStart',
      header: 'Dias Antes',
    },
    {
      accessorKey: 'daysAfterEnd',
      header: 'Dias Depois',
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'isActive',
      header: 'Ativo',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isActive ? 'Sim' : 'Não'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deletePeriodRuleMutation.mutate(row.original.id)}
            disabled={deletePeriodRuleMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const paymentStatusColumns: ColumnDef<PaymentStatusPermission>[] = [
    {
      accessorKey: 'resource',
      header: 'Recurso',
    },
    {
      accessorKey: 'action',
      header: 'Ação',
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Status de Pagamento',
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'isAllowed',
      header: 'Tipo',
      cell: ({ row }) => (
        <div className={`text-center font-medium ${row.original.isAllowed ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.isAllowed ? 'Permitir' : 'Negar'}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Ativo',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isActive ? 'Sim' : 'Não'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deletePaymentStatusMutation.mutate(row.original.id)}
            disabled={deletePaymentStatusMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Gerenciamento de Permissões Contextuais (ABAC)</h1>
        
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            As permissões contextuais (ABAC) permitem um controle mais granular sobre as permissões dos usuários com base em diferentes contextos, como fase da instituição, período de tempo ou status de pagamento.
          </AlertDescription>
        </Alert>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="institution-phase" className="flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Fase da Instituição
              </TabsTrigger>
              <TabsTrigger value="period-rules" className="flex items-center">
                <CalendarClock className="mr-2 h-4 w-4" />
                Regras de Período
              </TabsTrigger>
              <TabsTrigger value="payment-status" className="flex items-center">
                <ListFilter className="mr-2 h-4 w-4" />
                Status de Pagamento
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Fase da Instituição */}
          <TabsContent value="institution-phase" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Regra por Fase</CardTitle>
                    <CardDescription>
                      Crie regras de permissão baseadas na fase da instituição educacional.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...institutionPhaseForm}>
                      <form onSubmit={institutionPhaseForm.handleSubmit(onSubmitInstitutionPhase)} className="space-y-4">
                        <FormField
                          control={institutionPhaseForm.control}
                          name="resource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recurso</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um recurso" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {resourceOptions.map((resource) => (
                                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={institutionPhaseForm.control}
                          name="action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ação</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                                disabled={!watchResourceInstitutionPhase}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma ação" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actionOptions.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={institutionPhaseForm.control}
                          name="phase"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fase da Instituição</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma fase" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="credenciamento">Credenciamento</SelectItem>
                                  <SelectItem value="analise_documental">Análise Documental</SelectItem>
                                  <SelectItem value="visita_tecnica">Visita Técnica</SelectItem>
                                  <SelectItem value="aprovada">Aprovada</SelectItem>
                                  <SelectItem value="ativa">Ativa</SelectItem>
                                  <SelectItem value="suspensa">Suspensa</SelectItem>
                                  <SelectItem value="descredenciada">Descredenciada</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={institutionPhaseForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descreva a regra de permissão" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={institutionPhaseForm.control}
                            name="isAllowed"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Tipo de Regra</FormLabel>
                                  <FormDescription>
                                    {field.value ? 'Permitir' : 'Negar'}
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
                            control={institutionPhaseForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Status</FormLabel>
                                  <FormDescription>
                                    {field.value ? 'Ativo' : 'Inativo'}
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

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createInstitutionPhaseMutation.isPending}
                        >
                          {createInstitutionPhaseMutation.isPending ? 'Criando...' : 'Criar Regra'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Regras por Fase da Instituição</CardTitle>
                    <CardDescription>
                      Lista de regras de permissão definidas por fase da instituição.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {institutionPhaseQuery.isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : institutionPhaseQuery.isError ? (
                      <div className="text-center py-4 text-red-500">
                        Erro ao carregar dados: {(institutionPhaseQuery.error as any)?.message || 'Erro desconhecido'}
                      </div>
                    ) : (institutionPhaseQuery.data && institutionPhaseQuery.data.length === 0) ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhuma regra de permissão por fase encontrada.</p>
                        <p className="text-sm text-muted-foreground mt-1">Crie uma nova regra usando o formulário.</p>
                      </div>
                    ) : (
                      <DataTable 
                        columns={institutionPhaseColumns} 
                        data={institutionPhaseQuery.data || []} 
                        searchPlaceholder="Buscar regras por recurso, ação ou fase..." 
                        searchColumn="description"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Regras de Período */}
          <TabsContent value="period-rules" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Regra de Período</CardTitle>
                    <CardDescription>
                      Crie regras de permissão baseadas em períodos de tempo antes ou após eventos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...periodPermissionForm}>
                      <form onSubmit={periodPermissionForm.handleSubmit(onSubmitPeriodPermission)} className="space-y-4">
                        <FormField
                          control={periodPermissionForm.control}
                          name="resource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recurso</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um recurso" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {resourceOptions.map((resource) => (
                                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={periodPermissionForm.control}
                          name="action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ação</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                                disabled={!watchResourcePeriod}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma ação" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actionOptions.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={periodPermissionForm.control}
                          name="periodType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Período</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um tipo de período" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="inscricao_curso">Inscrição em Curso</SelectItem>
                                  <SelectItem value="inicio_curso">Início de Curso</SelectItem>
                                  <SelectItem value="fim_curso">Fim de Curso</SelectItem>
                                  <SelectItem value="matricula">Matrícula</SelectItem>
                                  <SelectItem value="data_prova">Data de Prova</SelectItem>
                                  <SelectItem value="data_evento">Data de Evento</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={periodPermissionForm.control}
                            name="daysBeforeStart"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dias Antes</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Quantidade de dias antes do evento
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={periodPermissionForm.control}
                            name="daysAfterEnd"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dias Depois</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Quantidade de dias após o evento
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={periodPermissionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descreva a regra de período" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={periodPermissionForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Status</FormLabel>
                                <FormDescription>
                                  {field.value ? 'Ativo' : 'Inativo'}
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

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createPeriodPermissionMutation.isPending}
                        >
                          {createPeriodPermissionMutation.isPending ? 'Criando...' : 'Criar Regra de Período'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Regras de Período</CardTitle>
                    <CardDescription>
                      Lista de regras de permissão baseadas em períodos de tempo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {periodPermissionQuery.isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : periodPermissionQuery.isError ? (
                      <div className="text-center py-4 text-red-500">
                        Erro ao carregar dados: {(periodPermissionQuery.error as any)?.message || 'Erro desconhecido'}
                      </div>
                    ) : (periodPermissionQuery.data && periodPermissionQuery.data.length === 0) ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhuma regra de período encontrada.</p>
                        <p className="text-sm text-muted-foreground mt-1">Crie uma nova regra usando o formulário.</p>
                      </div>
                    ) : (
                      <DataTable 
                        columns={periodRuleColumns} 
                        data={periodPermissionQuery.data || []} 
                        searchPlaceholder="Buscar regras por recurso, ação ou tipo de período..." 
                        searchColumn="description"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Status de Pagamento */}
          <TabsContent value="payment-status" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Regra por Status de Pagamento</CardTitle>
                    <CardDescription>
                      Crie regras de permissão baseadas no status de pagamento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...paymentStatusForm}>
                      <form onSubmit={paymentStatusForm.handleSubmit(onSubmitPaymentStatus)} className="space-y-4">
                        <FormField
                          control={paymentStatusForm.control}
                          name="resource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recurso</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um recurso" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {resourceOptions.map((resource) => (
                                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentStatusForm.control}
                          name="action"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ação</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                                disabled={!watchResourcePaymentStatus}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma ação" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {actionOptions.map((action) => (
                                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentStatusForm.control}
                          name="paymentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status de Pagamento</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="em_processamento">Em Processamento</SelectItem>
                                  <SelectItem value="pago">Pago</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                  <SelectItem value="reembolsado">Reembolsado</SelectItem>
                                  <SelectItem value="atrasado">Atrasado</SelectItem>
                                  <SelectItem value="parcialmente_pago">Parcialmente Pago</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={paymentStatusForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Descreva a regra de permissão" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={paymentStatusForm.control}
                            name="isAllowed"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Tipo de Regra</FormLabel>
                                  <FormDescription>
                                    {field.value ? 'Permitir' : 'Negar'}
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
                            control={paymentStatusForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Status</FormLabel>
                                  <FormDescription>
                                    {field.value ? 'Ativo' : 'Inativo'}
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

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createPaymentStatusMutation.isPending}
                        >
                          {createPaymentStatusMutation.isPending ? 'Criando...' : 'Criar Regra'}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Regras por Status de Pagamento</CardTitle>
                    <CardDescription>
                      Lista de regras de permissão baseadas em status de pagamento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentStatusQuery.isLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : paymentStatusQuery.isError ? (
                      <div className="text-center py-4 text-red-500">
                        Erro ao carregar dados: {(paymentStatusQuery.error as any)?.message || 'Erro desconhecido'}
                      </div>
                    ) : (paymentStatusQuery.data && paymentStatusQuery.data.length === 0) ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhuma regra de status de pagamento encontrada.</p>
                        <p className="text-sm text-muted-foreground mt-1">Crie uma nova regra usando o formulário.</p>
                      </div>
                    ) : (
                      <DataTable 
                        columns={paymentStatusColumns} 
                        data={paymentStatusQuery.data || []} 
                        searchPlaceholder="Buscar regras por recurso, ação ou status..." 
                        searchColumn="description"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}