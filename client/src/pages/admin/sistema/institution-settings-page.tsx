import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Save, Plus, Trash2, AlertCircle, CheckCircle, ShieldAlert, Settings2 } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Defina o esquema de validação para o formulário de configurações
const settingFormSchema = z.object({
  key: z.string().min(1, {
    message: "A chave é obrigatória.",
  }),
  value: z.string().min(1, {
    message: "O valor é obrigatório.",
  }),
  encrypted: z.boolean().default(false),
});

type SettingFormValues = z.infer<typeof settingFormSchema>;

// Esquema para chave do Asaas
const asaasApiKeySchema = z.object({
  apiKey: z.string()
    .min(5, { message: "A chave de API deve ter pelo menos 5 caracteres" })
    .startsWith("$", { message: "A chave de API do Asaas deve começar com $" }),
});

type AsaasApiKeyValues = z.infer<typeof asaasApiKeySchema>;

// Interface para os dados de configuração
interface SettingItem {
  key: string;
  value: string;
  encrypted: boolean;
}

const InstitutionSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewSettingDialogOpen, setIsNewSettingDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Consulta para obter as configurações existentes
  const { data: settings, isLoading, error } = useQuery<SettingItem[]>({
    queryKey: ['/api/institution-settings'],
    retry: false,
  });

  // Consulta para verificar se a chave da API Asaas está configurada
  const { 
    data: asaasConfig, 
    isLoading: isAsaasLoading 
  } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/institution-settings/integrations/asaas'],
    retry: false,
    onError: () => {
      // Silenciar erro
    }
  });

  // Formulário para nova configuração
  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      key: "",
      value: "",
      encrypted: false,
    },
  });

  // Formulário para chave da API Asaas
  const asaasForm = useForm<AsaasApiKeyValues>({
    resolver: zodResolver(asaasApiKeySchema),
    defaultValues: {
      apiKey: "",
    },
  });

  // Mutação para criar/atualizar configuração
  const createSettingMutation = useMutation({
    mutationFn: async (data: SettingFormValues) => {
      return apiRequest('/api/institution-settings', {
        method: 'POST', 
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "A configuração foi salva com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/institution-settings'] });
      form.reset();
      setIsNewSettingDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      });
    },
  });

  // Mutação para configurar a chave da API Asaas
  const configureAsaasMutation = useMutation({
    mutationFn: async (data: AsaasApiKeyValues) => {
      return apiRequest('/api/institution-settings/integrations/asaas', {
        method: 'POST', 
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Chave da API Asaas configurada",
        description: "A chave da API Asaas foi configurada com sucesso.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/institution-settings/integrations/asaas'] 
      });
      asaasForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao configurar",
        description: "Ocorreu um erro ao configurar a chave da API Asaas.",
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir configuração
  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest(`/api/institution-settings/${key}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuração excluída",
        description: "A configuração foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/institution-settings'] });
      setIsDeleteConfirmOpen(false);
      setSelectedSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir a configuração.",
        variant: "destructive",
      });
    },
  });

  // Handler para criar/atualizar configuração
  const onSubmit = (data: SettingFormValues) => {
    createSettingMutation.mutate(data);
  };

  // Handler para configurar a chave da API Asaas
  const onSubmitAsaasKey = (data: AsaasApiKeyValues) => {
    configureAsaasMutation.mutate(data);
  };

  // Handler para confirmar exclusão
  const handleConfirmDelete = () => {
    if (selectedSetting) {
      deleteSettingMutation.mutate(selectedSetting);
    }
  };

  // Handler para abrir o diálogo de exclusão
  const handleDeleteClick = (key: string) => {
    setSelectedSetting(key);
    setIsDeleteConfirmOpen(true);
  };

  if (isLoading && activeTab === "general") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (error && activeTab === "general") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Ocorreu um erro ao carregar as configurações. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configurações da Instituição</h1>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        {/* Aba de Configurações Gerais */}
        <TabsContent value="general">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Configurações da Plataforma</h2>
            
            <Button onClick={() => setIsNewSettingDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Configuração
            </Button>
          </div>

          {settings && settings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {settings.map((setting) => (
                <Card key={setting.key} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">{setting.key}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteClick(setting.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {setting.encrypted && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Criptografado
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-3 bg-muted/50">
                      {setting.encrypted ? "••••••••••••••••" : setting.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma configuração encontrada. Adicione uma nova configuração para começar.
                  </p>
                  <Button onClick={() => setIsNewSettingDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Aba de Integrações */}
        <TabsContent value="integrations">
          <div className="grid gap-6">
            {/* Asaas */}
            <Card>
              <CardHeader>
                <CardTitle>Integração com Asaas</CardTitle>
                <CardDescription>
                  Configure a integração com o Asaas para processar pagamentos e gerenciar cobranças.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAsaasLoading ? (
                  <div className="flex items-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Verificando configuração...</span>
                  </div>
                ) : asaasConfig?.configured ? (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Integração Configurada</AlertTitle>
                    <AlertDescription className="text-green-600">
                      A chave da API Asaas está configurada e pronta para uso.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mb-4 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700">Configuração Necessária</AlertTitle>
                    <AlertDescription className="text-amber-600">
                      Configure sua chave da API Asaas para habilitar o processamento de pagamentos.
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...asaasForm}>
                  <form onSubmit={asaasForm.handleSubmit(onSubmitAsaasKey)} className="space-y-4">
                    <FormField
                      control={asaasForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave da API Asaas</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={asaasConfig?.configured ? "••••••••••••••••" : "$aact_YourApiKey"}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {asaasConfig?.configured 
                              ? "Insira uma nova chave para substituir a atual." 
                              : "Insira sua chave de API do Asaas. Começa com $aact_"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit"
                      disabled={configureAsaasMutation.isPending}
                    >
                      {configureAsaasMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {asaasConfig?.configured ? "Atualizar Chave" : "Configurar Integração"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Outras integrações podem ser adicionadas aqui */}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para adicionar nova configuração */}
      <Dialog open={isNewSettingDialogOpen} onOpenChange={setIsNewSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Configuração</DialogTitle>
            <DialogDescription>
              Adicione uma nova configuração para sua instituição.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave</FormLabel>
                    <FormControl>
                      <Input placeholder="nome_da_configuracao" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome único para identificar esta configuração.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input placeholder="valor_da_configuracao" {...field} />
                    </FormControl>
                    <FormDescription>
                      Valor da configuração.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="encrypted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Criptografar valor</FormLabel>
                      <FormDescription>
                        Ative para armazenar este valor de forma criptografada.
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
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewSettingDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createSettingMutation.isPending}
                >
                  {createSettingMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSettingMutation.isPending}
            >
              {deleteSettingMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstitutionSettingsPage;