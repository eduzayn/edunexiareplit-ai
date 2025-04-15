/**
 * Página de Cadastro e Edição de Usuário
 * Esta página permite criar ou editar um usuário com todos os campos e configurações necessárias
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AdminLayout from "@/components/layout/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { Save, ArrowLeft, Trash2, Loader2, User, Key, AtSign, Phone, MapPin, Calendar, Building } from "lucide-react";

// Componentes UI
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

// Schema de validação
const userFormSchema = z.object({
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }).max(50),
  email: z.string().email({ message: "Email inválido" }),
  fullName: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres" }).max(100),
  password: z.string()
    .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
    .optional()
    .refine(val => val === undefined || val.length >= 8, {
      message: "Senha deve ter pelo menos 8 caracteres"
    }),
  confirmPassword: z.string().optional(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  birthDate: z.string().optional(),
  portalType: z.enum(["admin", "student", "polo", "partner"], {
    required_error: "Selecione um tipo de portal",
  }),
  poloId: z.number().optional(),
  isActive: z.boolean().default(true),
  roles: z.array(z.number()).optional(),
}).refine(data => {
  // Se estiver criando um novo usuário ou se a senha for fornecida
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function UsuarioFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Formulário
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      cpf: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      birthDate: "",
      portalType: "admin",
      isActive: true,
      roles: [],
    },
  });

  // Buscar dados do usuário se estiver editando
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: isEditing,
  });

  // Buscar polos disponíveis (para usuários de tipo "polo")
  const { data: polos } = useQuery({
    queryKey: ['/api/polos'],
    enabled: form.watch('portalType') === 'polo',
  });

  // Buscar papéis (roles) disponíveis
  const { data: roles } = useQuery({
    queryKey: ['/api/roles'],
  });

  // Buscar papéis do usuário atual
  const { data: userRoles } = useQuery({
    queryKey: [`/api/users/${id}/roles`],
    enabled: isEditing,
  });

  // Mutação para salvar usuário
  const saveUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof userFormSchema>) => {
      if (isEditing) {
        return apiRequest(`/api/users/${id}`, {
          method: 'PATCH',
          data
        });
      } else {
        return apiRequest('/api/users', {
          method: 'POST',
          data
        });
      }
    },
    onSuccess: () => {
      toast({
        title: `Usuário ${isEditing ? "atualizado" : "criado"} com sucesso`,
        description: `O usuário foi ${isEditing ? "atualizado" : "criado"} com sucesso no sistema.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate("/admin/pessoas/usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || `Ocorreu um erro ao ${isEditing ? "atualizar" : "criar"} o usuário.`,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate("/admin/pessoas/usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  // Atualizar formulário quando os dados do usuário são carregados
  useEffect(() => {
    if (userData && isEditing) {
      // Preencher valores existentes no formulário
      form.reset({
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        // Não preencher a senha
        cpf: userData.cpf || "",
        phone: userData.phone || "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        zipCode: userData.zipCode || "",
        birthDate: userData.birthDate || "",
        portalType: userData.portalType,
        poloId: userData.poloId,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        roles: userRoles?.map(role => role.id) || [],
      });
    }
  }, [userData, userRoles, isEditing, form]);

  // Função para lidar com o envio do formulário
  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    // Remover confirmPassword antes de enviar para a API
    const { confirmPassword, ...submitData } = data;
    
    // Se a senha estiver vazia e estivermos editando, remova-a do objeto
    if (isEditing && !submitData.password) {
      delete submitData.password;
    }
    
    saveUserMutation.mutate(submitData);
  };

  return (
    <AdminLayout>
      <title>{isEditing ? "Editar" : "Novo"} Usuário | EdunexIA</title>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/pessoas/usuarios")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{isEditing ? "Editar" : "Novo"} Usuário</h1>
        </div>
        
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saveUserMutation.isPending}>
            {saveUserMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoadingUser ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="general">Informações Gerais</TabsTrigger>
                <TabsTrigger value="access">Acesso</TabsTrigger>
                <TabsTrigger value="permissions">Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                      Dados básicos do usuário no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Nome completo" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="email@exemplo.com" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cpf"
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

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="(00) 00000-0000" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="date" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Endereço</h3>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rua, número, complemento" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
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
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="UF" maxLength={2} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="access" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados de Acesso</CardTitle>
                    <CardDescription>
                      Configurações de autenticação e tipo de acesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="nomeusuario" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Nome utilizado para login no sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="portalType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Portal</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Limpar poloId se o tipo não for polo
                                if (value !== "polo") {
                                  form.setValue("poloId", undefined);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um tipo de portal" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="student">Aluno</SelectItem>
                                <SelectItem value="polo">Polo</SelectItem>
                                <SelectItem value="partner">Parceiro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Define o tipo de acesso e funcionalidades disponíveis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("portalType") === "polo" && (
                      <FormField
                        control={form.control}
                        name="poloId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Polo</FormLabel>
                            <Select 
                              value={field.value ? String(field.value) : undefined} 
                              onValueChange={(value) => field.onChange(Number(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um polo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {polos?.map((polo: any) => (
                                  <SelectItem key={polo.id} value={String(polo.id)}>
                                    {polo.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Polo ao qual o usuário está vinculado
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{isEditing ? "Nova Senha" : "Senha"}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="password" 
                                  placeholder={isEditing ? "Nova senha (deixe em branco para manter a atual)" : "Senha"} 
                                  className="pl-8" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            {isEditing && (
                              <FormDescription>
                                Deixe em branco para manter a senha atual
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="password" 
                                  placeholder="Confirme a senha" 
                                  className="pl-8" 
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Status do Usuário</FormLabel>
                            <FormDescription>
                              Usuários inativos não podem acessar o sistema
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Permissões e Papéis</CardTitle>
                    <CardDescription>
                      Configure os papéis e permissões do usuário
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6">
                      <AlertTitle>Importante</AlertTitle>
                      <AlertDescription>
                        Os papéis atribuídos ao usuário determinam suas permissões no sistema. Selecione os papéis adequados de acordo com as funções do usuário.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Papéis do Usuário</h3>
                      
                      <FormField
                        control={form.control}
                        name="roles"
                        render={() => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {roles?.map((role: any) => (
                                <FormField
                                  key={role.id}
                                  control={form.control}
                                  name="roles"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={role.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(role.id)}
                                            onCheckedChange={(checked) => {
                                              const updatedRoles = checked
                                                ? [...(field.value || []), role.id]
                                                : (field.value || []).filter((id) => id !== role.id);
                                              field.onChange(updatedRoles);
                                            }}
                                          />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                          <FormLabel className="text-sm font-medium">
                                            {role.name}
                                          </FormLabel>
                                          <p className="text-xs text-muted-foreground">
                                            {role.description || "Sem descrição"}
                                          </p>
                                        </div>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      )}

      {/* Dialog de confirmação para excluir */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}