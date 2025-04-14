import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAdminSidebarItems } from "@/components/layout/admin-sidebar-items";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader, ChevronDown, Edit, Trash2, CheckCircle, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Integration = {
  id: number;
  name: string;
  type: "asaas" | "lytex" | "openai" | "elevenlabs" | "zapi";
  apiKey: string;
  apiSecret: string | null;
  additionalConfig: any;
  isActive: boolean;
  institutionId: number | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
};

type IntegrationFormData = {
  name: string;
  type: "asaas" | "lytex" | "openai" | "elevenlabs" | "zapi";
  apiKey: string;
  apiSecret?: string;
  additionalConfig?: any;
  isActive: boolean;
  institutionId?: number;
};

// Componente para renderizar cada card de integração
const IntegrationCard: React.FC<{
  integration: Integration;
  onEdit: (integration: Integration) => void;
  onDelete: (id: number) => void;
  onTest: (id: number) => void;
  onSetDefault?: (id: number) => void;
  isDefault?: boolean;
}> = ({ integration, onEdit, onDelete, onTest, onSetDefault, isDefault }) => {
  const typeLabels = {
    asaas: "Asaas - Pagamentos",
    lytex: "Lytex - Pagamentos",
    openai: "OpenAI - IA",
    elevenlabs: "ElevenLabs - Voz",
    zapi: "Z-API - WhatsApp",
  };

  const typeColor = {
    asaas: "bg-blue-100 text-blue-700 border-blue-200",
    lytex: "bg-indigo-100 text-indigo-700 border-indigo-200",
    openai: "bg-green-100 text-green-700 border-green-200",
    elevenlabs: "bg-purple-100 text-purple-700 border-purple-200",
    zapi: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  
  const typeDescriptions = {
    asaas: "Gateway de pagamento para boletos, cartões e PIX",
    lytex: "Plataforma de pagamentos para cobrança de mensalidades",
    openai: "Inteligência artificial para geração de conteúdo",
    elevenlabs: "Conversão de texto em áudio com voz natural",
    zapi: "Integração com WhatsApp para comunicação",
  };

  return (
    <Card className={`mb-4 relative ${isDefault ? `border-2 ${typeColor[integration.type].split(' ')[2]}` : ''}`}>
      {isDefault && (
        <div className="absolute -top-3 left-3 bg-white border border-primary text-primary text-xs px-2 py-0.5 rounded-full font-medium">
          Padrão
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{integration.name}</CardTitle>
            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium mt-1 ${typeColor[integration.type].split(' ').slice(0, 2).join(' ')}`}>
              {typeLabels[integration.type]}
            </span>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onTest(integration.id)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Testar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(integration)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {onSetDefault && !isDefault && (
                  <DropdownMenuItem onClick={() => onSetDefault(integration.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Definir como Padrão
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(integration.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {typeDescriptions[integration.type]}
        </p>
        <div className="text-sm text-muted-foreground mb-3 mt-3 border-t pt-3 border-dashed">
          <span className="block">Chave de API: {integration.apiKey}</span>
          {integration.apiSecret && <span className="block">Chave Secreta: {integration.apiSecret}</span>}
        </div>
        <div className={`absolute top-2 right-2 ${integration.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs px-2 py-1 rounded-full font-medium`}>
          {integration.isActive ? 'Ativo' : 'Inativo'}
        </div>
      </CardContent>
    </Card>
  );
};

export default function IntegrationsPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  // Estado para armazenar as integrações padrão por tipo
  const [defaultIntegrations, setDefaultIntegrations] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: "",
    type: "asaas",
    apiKey: "",
    apiSecret: "",
    isActive: true,
  });
  const [isEdit, setIsEdit] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "asaas",
      apiKey: "",
      apiSecret: "",
      isActive: true,
    });
    setIsEdit(false);
    setCurrentId(null);
  };

  // Consulta para buscar integrações
  const {
    data: integrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/integrations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/integrations");
      return await res.json();
    },
  });

  // Mutação para criar integração
  const createMutation = useMutation({
    mutationFn: async (data: IntegrationFormData) => {
      const res = await apiRequest("POST", "/api/integrations", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integração criada",
        description: "A integração foi criada com sucesso.",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar integração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar integração
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IntegrationFormData }) => {
      const res = await apiRequest("PUT", `/api/integrations/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integração atualizada",
        description: "A integração foi atualizada com sucesso.",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar integração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para excluir integração
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Integração excluída",
        description: "A integração foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setCurrentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir integração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para testar integração
  const testMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/integrations/${id}/test`);
      return await res.json();
    },
    onSuccess: (data) => {
      setTestResults(data);
      setTestDialogOpen(true);
    },
    onError: (error: Error) => {
      setTestResults({
        success: false,
        message: "Erro ao testar integração",
        details: error.message,
      });
      setTestDialogOpen(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEdit && currentId) {
      updateMutation.mutate({ id: currentId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (integration: Integration) => {
    setFormData({
      name: integration.name,
      type: integration.type,
      apiKey: integration.apiKey,
      apiSecret: integration.apiSecret || "",
      additionalConfig: integration.additionalConfig,
      isActive: integration.isActive,
      institutionId: integration.institutionId || undefined,
    });
    setIsEdit(true);
    setCurrentId(integration.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setCurrentId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currentId) {
      deleteMutation.mutate(currentId);
    }
  };

  const handleTest = (id: number) => {
    testMutation.mutate(id);
  };
  
  // Mutação para definir uma integração como padrão para seu tipo
  const defaultIntegrationMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      const res = await apiRequest("PUT", `/api/integrations/${id}/set-default`, { type });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      
      // Atualiza o estado de integrações padrão
      setDefaultIntegrations(prev => ({
        ...prev,
        [data.type]: data.id
      }));
      
      toast({
        title: "Integração definida como padrão",
        description: `Esta integração agora é a padrão para ${data.type}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao definir integração como padrão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Função para definir uma integração como padrão
  const handleSetDefault = (id: number) => {
    const integration = integrations?.find((i: Integration) => i.id === id);
    if (integration) {
      defaultIntegrationMutation.mutate({ id, type: integration.type });
    }
  };
  
  // Verificar se uma integração é a padrão para seu tipo
  const isDefaultIntegration = (integration: Integration) => {
    return defaultIntegrations[integration.type] === integration.id;
  };

  const typeOptions = [
    { value: "asaas", label: "Asaas - Pagamentos" },
    { value: "lytex", label: "Lytex - Pagamentos" },
    { value: "openai", label: "OpenAI - IA" },
    { value: "elevenlabs", label: "ElevenLabs - Voz" },
    { value: "zapi", label: "Z-API - WhatsApp" },
  ];

  // Filtrar integrações por tipo
  const filterIntegrationsByType = (type: string) => {
    if (type === "all") return integrations;
    return integrations?.filter((integration: Integration) => integration.type === type);
  };

  if (!user || user.portalType !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página é exclusiva para administradores.
          </p>
        </div>
      </div>
    );
  }

  const isMobile = useIsMobile();
  const sidebarItems = getAdminSidebarItems(location);
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar items={sidebarItems} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as integrações da plataforma com serviços externos
            </p>
          </div>
          <Button onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Integração
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <p className="font-medium">Erro ao carregar integrações</p>
            <p className="text-sm">Tente novamente mais tarde.</p>
          </div>
        )}

        {integrations && integrations.length === 0 && (
          <div className="bg-muted border border-border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Nenhuma integração configurada</h3>
            <p className="text-muted-foreground mb-4">
              Configure integrações para conectar a plataforma com serviços externos de pagamento, IA e comunicação.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Integração
            </Button>
          </div>
        )}

        {integrations && integrations.length > 0 && (
          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="asaas">Asaas</TabsTrigger>
              <TabsTrigger value="lytex">Lytex</TabsTrigger>
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
              <TabsTrigger value="zapi">Z-API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((integration: Integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onTest={handleTest}
                    onSetDefault={handleSetDefault}
                    isDefault={isDefaultIntegration(integration)}
                  />
                ))}
              </div>
            </TabsContent>
            
            {["asaas", "lytex", "openai", "elevenlabs", "zapi"].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterIntegrationsByType(type)?.map((integration: Integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTest={handleTest}
                      onSetDefault={handleSetDefault}
                      isDefault={isDefaultIntegration(integration)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Modal para criar/editar integração */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Editar Integração" : "Nova Integração"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Atualize os dados da integração com serviços externos."
                  : "Configure uma nova integração com serviços externos."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    disabled={isEdit}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo de integração" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiKey" className="text-right">
                    Chave API
                  </Label>
                  <Input
                    id="apiKey"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiSecret" className="text-right">
                    Secret
                  </Label>
                  <Input
                    id="apiSecret"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    className="col-span-3"
                    type="password"
                    placeholder="Opcional para alguns serviços"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Ativo
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formData.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEdit ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Integração</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta integração? Esta ação não pode ser desfeita
                e pode afetar funcionalidades do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de resultados de teste */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resultado do Teste</DialogTitle>
            </DialogHeader>
            {testResults && (
              <div className="py-4">
                <div className={`p-4 rounded-md mb-4 ${
                  testResults.success 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-start">
                    {testResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`text-sm font-medium ${
                        testResults.success ? "text-green-800" : "text-red-800"
                      }`}>
                        {testResults.message}
                      </h3>
                      {testResults.details && (
                        <p className={`mt-1 text-sm ${
                          testResults.success ? "text-green-700" : "text-red-700"
                        }`}>
                          {testResults.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {testResults.success
                    ? "A integração foi testada com sucesso. Você pode utilizá-la no sistema."
                    : "Ocorreu um erro ao testar a integração. Verifique as credenciais e tente novamente."}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setTestDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  );
}