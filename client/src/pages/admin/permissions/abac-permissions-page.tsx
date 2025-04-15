/**
 * Página de Gerenciamento de Permissões Contextuais (ABAC)
 */

import React, { useState } from 'react';
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
import { usePermissions } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/guards';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Edit, PlusCircle, Clock, CalendarClock, Award, ListFilter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';

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
  daysBeforeStart: z.number().int().nonnegative({ message: 'Deve ser um número não negativo' }),
  daysAfterEnd: z.number().int().nonnegative({ message: 'Deve ser um número não negativo' }),
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
  const { permissionsList, isLoading: isLoadingPermissions } = usePermissionsList();
  const [activeTab, setActiveTab] = useState('institution-phase');

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

  // Função para buscar recursos e permissões disponíveis
  function usePermissionsList() {
    const permissionsQuery = useQuery({
      queryKey: ['/api/permissions/list'],
      queryFn: () => apiRequest<{ resource: string; action: string; description: string; }[]>('/api/permissions/list')
    });

    // Extrair recursos únicos
    const uniqueResources = [...new Set((permissionsQuery.data || []).map(p => p.resource))];
    
    // Obter ações para um recurso específico
    const getActionsForResource = (resource: string) => {
      return (permissionsQuery.data || [])
        .filter(p => p.resource === resource)
        .map(p => ({ value: p.action, label: p.description }));
    };

    return {
      permissionsList: permissionsQuery.data || [],
      resources: uniqueResources,
      getActionsForResource,
      isLoading: permissionsQuery.isLoading
    };
  }

  // Mutação para criar regra de permissão de fase de instituição
  const createInstitutionPhaseMutation = useMutation({
    mutationFn: (data: InstitutionPhaseFormValues) => 
      apiRequest<{}>('/api/permissions/abac/institution-phase', { 
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
      apiRequest<{}>('/api/permissions/abac/period-rules', { 
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
      apiRequest<{}>('/api/permissions/abac/payment-status', { 
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
      apiRequest<{}>(`/api/permissions/abac/institution-phase/${id}`, { method: 'DELETE' }),
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
      apiRequest<{}>(`/api/permissions/abac/period-rules/${id}`, { method: 'DELETE' }),
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
      apiRequest<{}>(`/api/permissions/abac/payment-status/${id}`, { method: 'DELETE' }),
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
    createPeriodPermissionMutation.mutate({
      ...values,
      daysBeforeStart: Number(values.daysBeforeStart),
      daysAfterEnd: Number(values.daysAfterEnd)
    });
  }

  function onSubmitPaymentStatus(values: PaymentStatusFormValues) {
    createPaymentStatusMutation.mutate(values);
  }

  // Atualizar ações quando o recurso muda
  const watchResourceInstitutionPhase = institutionPhaseForm.watch('resource');
  const watchResourcePeriod = periodPermissionForm.watch('resource');
  const watchResourcePaymentStatus = paymentStatusForm.watch('resource');

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
    <PermissionGuard resource="permissions" action="manage">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Gerenciamento de Permissões Contextuais (ABAC)</h1>
        <Tabs defaultValue="institution-phase" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="institution-phase">
              <Award className="h-4 w-4 mr-2" />
              Fases de Instituição
            </TabsTrigger>
            <TabsTrigger value="period-rules">
              <CalendarClock className="h-4 w-4 mr-2" />
              Regras de Período
            </TabsTrigger>
            <TabsTrigger value="payment-status">
              <ListFilter className="h-4 w-4 mr-2" />
              Status de Pagamento
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Permissão por Fase de Instituição */}
          <TabsContent value="institution-phase">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Nova Regra de Fase</CardTitle>
                  <CardDescription>
                    Crie regras para controlar permissões baseadas na fase atual de uma instituição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...institutionPhaseForm}>
                    <form onSubmit={institutionPhaseForm.handleSubmit(onSubmitInstitutionPhase)} className="space-y-6">
                      <FormField
                        control={institutionPhaseForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {permissionsList.resources?.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourceInstitutionPhase || isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchResourceInstitutionPhase &&
                                  permissionsList.getActionsForResource(watchResourceInstitutionPhase).map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                      {action.label}
                                    </SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma fase" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prospecting">Prospecção</SelectItem>
                                <SelectItem value="onboarding">Onboarding</SelectItem>
                                <SelectItem value="implementation">Implementação</SelectItem>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="suspended">Suspensa</SelectItem>
                                <SelectItem value="canceled">Cancelada</SelectItem>
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
                              <Input placeholder="Descrição da regra" {...field} />
                            </FormControl>
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
                              <FormLabel className="text-base">Regra Ativa</FormLabel>
                              <FormDescription>
                                Desative temporariamente sem precisar excluir
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
                        disabled={createInstitutionPhaseMutation.isPending || isLoadingPermissions}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Fase Existentes</CardTitle>
                  <CardDescription>
                    Gerencie as regras de permissão baseadas em fase de instituição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {institutionPhaseQuery.isLoading ? (
                    <div className="py-10 text-center">Carregando regras...</div>
                  ) : institutionPhaseQuery.data && institutionPhaseQuery.data.length > 0 ? (
                    <DataTable 
                      columns={institutionPhaseColumns} 
                      data={institutionPhaseQuery.data}
                    />
                  ) : (
                    <div className="py-10 text-center">
                      Nenhuma regra de fase cadastrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Regras de Período */}
          <TabsContent value="period-rules">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Nova Regra de Período</CardTitle>
                  <CardDescription>
                    Crie regras para controlar permissões baseadas em períodos de tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...periodPermissionForm}>
                    <form onSubmit={periodPermissionForm.handleSubmit(onSubmitPeriodPermission)} className="space-y-6">
                      <FormField
                        control={periodPermissionForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {permissionsList.resources?.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourcePeriod || isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchResourcePeriod &&
                                  permissionsList.getActionsForResource(watchResourcePeriod).map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                      {action.label}
                                    </SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um tipo de período" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="financial">Financeiro</SelectItem>
                                <SelectItem value="academic">Acadêmico</SelectItem>
                                <SelectItem value="enrollment">Matrícula</SelectItem>
                                <SelectItem value="certification">Certificação</SelectItem>
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
                              <FormLabel>Dias Antes do Início</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Quantos dias antes do início do período
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
                              <FormLabel>Dias Após o Término</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Quantos dias após o término do período
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
                              <Input placeholder="Descrição da regra" {...field} />
                            </FormControl>
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
                              <FormLabel className="text-base">Regra Ativa</FormLabel>
                              <FormDescription>
                                Desative temporariamente sem precisar excluir
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
                        disabled={createPeriodPermissionMutation.isPending || isLoadingPermissions}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Período Existentes</CardTitle>
                  <CardDescription>
                    Gerencie as regras de permissão baseadas em períodos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {periodPermissionQuery.isLoading ? (
                    <div className="py-10 text-center">Carregando regras...</div>
                  ) : periodPermissionQuery.data && periodPermissionQuery.data.length > 0 ? (
                    <DataTable 
                      columns={periodRuleColumns} 
                      data={periodPermissionQuery.data}
                    />
                  ) : (
                    <div className="py-10 text-center">
                      Nenhuma regra de período cadastrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Status de Pagamento */}
          <TabsContent value="payment-status">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Nova Regra de Status de Pagamento</CardTitle>
                  <CardDescription>
                    Crie regras para controlar permissões baseadas no status de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...paymentStatusForm}>
                    <form onSubmit={paymentStatusForm.handleSubmit(onSubmitPaymentStatus)} className="space-y-6">
                      <FormField
                        control={paymentStatusForm.control}
                        name="resource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recurso</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um recurso" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {permissionsList.resources?.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource}
                                  </SelectItem>
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
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!watchResourcePaymentStatus || isLoadingPermissions}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchResourcePaymentStatus &&
                                  permissionsList.getActionsForResource(watchResourcePaymentStatus).map((action) => (
                                    <SelectItem key={action.value} value={action.value}>
                                      {action.label}
                                    </SelectItem>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                <SelectItem value="canceled">Cancelado</SelectItem>
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
                              <Input placeholder="Descrição da regra" {...field} />
                            </FormControl>
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
                              <FormLabel className="text-base">Regra Ativa</FormLabel>
                              <FormDescription>
                                Desative temporariamente sem precisar excluir
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
                        disabled={createPaymentStatusMutation.isPending || isLoadingPermissions}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Regras de Status de Pagamento Existentes</CardTitle>
                  <CardDescription>
                    Gerencie as regras de permissão baseadas em status de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentStatusQuery.isLoading ? (
                    <div className="py-10 text-center">Carregando regras...</div>
                  ) : paymentStatusQuery.data && paymentStatusQuery.data.length > 0 ? (
                    <DataTable 
                      columns={paymentStatusColumns} 
                      data={paymentStatusQuery.data}
                    />
                  ) : (
                    <div className="py-10 text-center">
                      Nenhuma regra de status de pagamento cadastrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}