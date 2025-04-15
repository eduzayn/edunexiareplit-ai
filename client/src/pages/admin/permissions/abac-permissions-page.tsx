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
    'users',
    'roles',
    'permissions',
    'institutions',
    'polos',
    'courses',
    'enrollments',
    'financial_transactions',
    'leads',
    'clients',
    'contracts',
    'products',
    'invoices',
    'payments',
    'certificates',
    'certificate_templates',
    'certificate_signers',
    'subscription_plans',
    'subscriptions',
    'reports',
    'settings',
    'communications'
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

  // Lista fixa de ações comuns
  const commonActions = [
    { value: 'read', label: 'Visualizar' },
    { value: 'create', label: 'Criar' },
    { value: 'update', label: 'Atualizar' },
    { value: 'delete', label: 'Excluir' },
    { value: 'manage', label: 'Gerenciar' },
    { value: 'approve', label: 'Aprovar' },
    { value: 'reject', label: 'Rejeitar' },
    { value: 'cancel', label: 'Cancelar' },
    { value: 'assign', label: 'Atribuir' },
    { value: 'unassign', label: 'Desatribuir' },
    { value: 'export', label: 'Exportar' },
    { value: 'import', label: 'Importar' },
    { value: 'activate', label: 'Ativar' },
    { value: 'deactivate', label: 'Desativar' },
    { value: 'generate', label: 'Gerar' },
    { value: 'validate', label: 'Validar' },
    { value: 'finalize', label: 'Finalizar' }
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
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Permissões Contextuais (ABAC)</h1>
        <Tabs defaultValue="institution-phase" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="institution-phase">
              <Award className="mr-2 h-4 w-4" />
              Fase de Instituição
            </TabsTrigger>
            <TabsTrigger value="period-rules">
              <CalendarClock className="mr-2 h-4 w-4" />
              Regras de Período
            </TabsTrigger>
            <TabsTrigger value="payment-status">
              <ListFilter className="mr-2 h-4 w-4" />
              Status de Pagamento
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Fase de Instituição */}
          <TabsContent value="institution-phase">
            <Card>
              <CardHeader>
                <CardTitle>Permissões por Fase de Instituição</CardTitle>
                <CardDescription>
                  Configure permissões baseadas na fase atual da instituição.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...institutionPhaseForm}>
                  <form onSubmit={institutionPhaseForm.handleSubmit(onSubmitInstitutionPhase)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={institutionPhaseForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                updateActionsForResource(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {resourceOptions.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              O recurso que será afetado por esta permissão.
                            </FormDescription>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourceInstitutionPhase || actionOptions.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {actionOptions.map((action) => (
                                  <SelectItem key={action.value} value={action.value}>
                                    {action.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              A ação que será permitida ou negada.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={institutionPhaseForm.control}
                      name="phase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fase da Instituição</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma fase" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="setup">Configuração</SelectItem>
                              <SelectItem value="active">Ativa</SelectItem>
                              <SelectItem value="inactive">Inativa</SelectItem>
                              <SelectItem value="suspended">Suspensa</SelectItem>
                              <SelectItem value="closed">Fechada</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            A fase da instituição em que esta permissão será aplicada.
                          </FormDescription>
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
                            <Input placeholder="Descrição da regra de permissão" {...field} />
                          </FormControl>
                          <FormDescription>
                            Uma descrição clara do que esta regra faz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={institutionPhaseForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <FormDescription>
                              Determina se esta regra está ativa ou não.
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

                    <Button type="submit" disabled={createInstitutionPhaseMutation.isPending}>
                      {createInstitutionPhaseMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
                    </Button>
                  </form>
                </Form>

                <Separator className="my-8" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Regras de Permissão Existentes</h3>
                  
                  {institutionPhaseQuery.isLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : institutionPhaseQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        Ocorreu um erro ao carregar as regras de permissão.
                      </AlertDescription>
                    </Alert>
                  ) : institutionPhaseQuery.data && institutionPhaseQuery.data.length > 0 ? (
                    <DataTable 
                      columns={institutionPhaseColumns} 
                      data={institutionPhaseQuery.data} 
                    />
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      Nenhuma regra de permissão encontrada.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content - Regras de Período */}
          <TabsContent value="period-rules">
            <Card>
              <CardHeader>
                <CardTitle>Permissões por Período</CardTitle>
                <CardDescription>
                  Configure permissões baseadas em períodos específicos (matrícula, pagamento, etc).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...periodPermissionForm}>
                  <form onSubmit={periodPermissionForm.handleSubmit(onSubmitPeriodPermission)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={periodPermissionForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                updateActionsForResource(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {resourceOptions.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              O recurso que será afetado por esta permissão.
                            </FormDescription>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourcePeriod || actionOptions.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {actionOptions.map((action) => (
                                  <SelectItem key={action.value} value={action.value}>
                                    {action.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              A ação que será permitida ou negada.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={periodPermissionForm.control}
                      name="periodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Período</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo de período" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="enrollment">Período de Matrícula</SelectItem>
                              <SelectItem value="course">Período do Curso</SelectItem>
                              <SelectItem value="payment">Período de Pagamento</SelectItem>
                              <SelectItem value="financial">Período Financeiro</SelectItem>
                              <SelectItem value="academic">Período Acadêmico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            O tipo de período ao qual esta regra se aplica.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={periodPermissionForm.control}
                        name="daysBeforeStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dias Antes do Início</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Número de dias antes do início do período em que a regra é válida.
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
                            <FormLabel>Dias Após o Fim</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Número de dias após o fim do período em que a regra é válida.
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
                            <Input placeholder="Descrição da regra de período" {...field} />
                          </FormControl>
                          <FormDescription>
                            Uma descrição clara do que esta regra faz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={periodPermissionForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <FormDescription>
                              Determina se esta regra está ativa ou não.
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

                    <Button type="submit" disabled={createPeriodPermissionMutation.isPending}>
                      {createPeriodPermissionMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
                    </Button>
                  </form>
                </Form>

                <Separator className="my-8" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Regras de Período Existentes</h3>
                  
                  {periodPermissionQuery.isLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : periodPermissionQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        Ocorreu um erro ao carregar as regras de período.
                      </AlertDescription>
                    </Alert>
                  ) : periodPermissionQuery.data && periodPermissionQuery.data.length > 0 ? (
                    <DataTable 
                      columns={periodRuleColumns} 
                      data={periodPermissionQuery.data} 
                    />
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      Nenhuma regra de período encontrada.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content - Status de Pagamento */}
          <TabsContent value="payment-status">
            <Card>
              <CardHeader>
                <CardTitle>Permissões por Status de Pagamento</CardTitle>
                <CardDescription>
                  Configure permissões baseadas no status de pagamento (pendente, pago, atrasado, etc).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentStatusForm}>
                  <form onSubmit={paymentStatusForm.handleSubmit(onSubmitPaymentStatus)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={paymentStatusForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                updateActionsForResource(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {resourceOptions.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              O recurso que será afetado por esta permissão.
                            </FormDescription>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourcePaymentStatus || actionOptions.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {actionOptions.map((action) => (
                                  <SelectItem key={action.value} value={action.value}>
                                    {action.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              A ação que será permitida ou negada.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={paymentStatusForm.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status de Pagamento</FormLabel>
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
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Atrasado</SelectItem>
                              <SelectItem value="refunded">Reembolsado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                              <SelectItem value="partial">Parcialmente Pago</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            O status de pagamento em que esta permissão será aplicada.
                          </FormDescription>
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
                            <Input placeholder="Descrição da regra de status de pagamento" {...field} />
                          </FormControl>
                          <FormDescription>
                            Uma descrição clara do que esta regra faz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentStatusForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ativo</FormLabel>
                            <FormDescription>
                              Determina se esta regra está ativa ou não.
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

                    <Button type="submit" disabled={createPaymentStatusMutation.isPending}>
                      {createPaymentStatusMutation.isPending ? 'Salvando...' : 'Salvar Regra'}
                    </Button>
                  </form>
                </Form>

                <Separator className="my-8" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Regras de Status de Pagamento Existentes</h3>
                  
                  {paymentStatusQuery.isLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : paymentStatusQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>
                        Ocorreu um erro ao carregar as regras de status de pagamento.
                      </AlertDescription>
                    </Alert>
                  ) : paymentStatusQuery.data && paymentStatusQuery.data.length > 0 ? (
                    <DataTable 
                      columns={paymentStatusColumns} 
                      data={paymentStatusQuery.data} 
                    />
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      Nenhuma regra de status de pagamento encontrada.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}