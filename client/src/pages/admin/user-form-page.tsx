import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { AlertTriangle } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Esquema para criar/editar usuário
const userFormSchema = z.object({
  username: z.string().min(3, { message: "Username deve ter pelo menos 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).optional(),
  fullName: z.string().min(3, { message: "Nome completo é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  cpf: z.string().min(11, { message: "CPF inválido" }).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  birthDate: z.string().optional(),
  portalType: z.enum(["student", "admin", "polo", "partner"], {
    required_error: "Tipo de portal é obrigatório",
  }),
  // Campos RBAC
  roleId: z.number().optional(),
  // Campos ABAC
  institutionId: z.number().optional(),
  poloId: z.number().optional(),
}).superRefine((data, ctx) => {
  // CPF é obrigatório para alunos
  if (data.portalType === "student" && (!data.cpf || data.cpf.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CPF é obrigatório para alunos",
      path: ["cpf"],
    });
  }
  
  // Instituição é obrigatória para usuários do tipo partner ou polo
  if ((data.portalType === "partner" || data.portalType === "polo") && !data.institutionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A instituição é obrigatória para este tipo de usuário",
      path: ["institutionId"],
    });
  }
  
  // Polo é obrigatório para usuários do tipo polo
  if (data.portalType === "polo" && !data.poloId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O polo é obrigatório para este tipo de usuário",
      path: ["poloId"],
    });
  }
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface User {
  id: number;
  username: string;
  portalType: "student" | "partner" | "polo" | "admin";
  fullName: string;
  email: string;
  cpf?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  birthDate?: string;
  roleId?: number;
  institutionId?: number;
  poloId?: number;
}

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Inicializando o formulário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: isEditing ? undefined : "", // Senha obrigatória apenas em criação
      fullName: "",
      email: "",
      cpf: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      birthDate: "",
      portalType: "student",
      roleId: undefined,
      institutionId: undefined,
      poloId: undefined,
    },
  });
  
  // Obter valores atuais do formulário para renderização condicional
  const watchPortalType = form.watch("portalType");
  const watchInstitutionId = form.watch("institutionId");
  
  // Consulta para buscar usuário quando estiver editando
  const { 
    data: user,
    isLoading: isLoadingUser 
  } = useQuery({
    queryKey: [`/api/admin/users/${id}`],
    queryFn: () => apiRequest<User>(`/api/admin/users/${id}`),
    enabled: isEditing,
    onSuccess: (data) => {
      // Preencher formulário com dados do usuário
      form.reset({
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        cpf: data.cpf || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        birthDate: data.birthDate || "",
        portalType: data.portalType,
        roleId: data.roleId,
        institutionId: data.institutionId,
        poloId: data.poloId,
      });
      
      // Definir instituição selecionada para carregar polos
      if (data.institutionId) {
        setSelectedInstitutionId(data.institutionId);
      }
    }
  });
  
  // Estado para rastrear instituição selecionada para buscar polos
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  
  // Consulta para listar papéis (roles)
  const { 
    data: roles, 
    isLoading: isLoadingRoles 
  } = useQuery({
    queryKey: ['/api/admin/roles'],
    queryFn: () => apiRequest<Array<{id: number, name: string, description: string, scope: string}>>('/api/admin/roles'),
  });

  // Consulta para listar instituições
  const { 
    data: institutions, 
    isLoading: isLoadingInstitutions 
  } = useQuery({
    queryKey: ['/api/admin/institutions'],
    queryFn: () => apiRequest<Array<{id: number, name: string, code: string}>>('/api/admin/institutions'),
  });

  // Consulta para listar polos (filtrada por instituição selecionada)
  const { 
    data: polos, 
    isLoading: isLoadingPolos 
  } = useQuery({
    queryKey: ['/api/admin/polos', selectedInstitutionId],
    queryFn: () => {
      let url = `/api/admin/polos`;
      if (selectedInstitutionId) {
        url += `?institutionId=${selectedInstitutionId}`;
      }
      return apiRequest<Array<{id: number, name: string, code: string}>>(url);
    },
    // Só buscar polos se tiver uma instituição selecionada
    enabled: !!selectedInstitutionId,
  });
  
  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormValues) => 
      apiRequest('/api/admin/users', { 
        method: 'POST',
        data
      }),
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso!",
        description: "O novo usuário foi adicionado ao sistema.",
      });
      
      // Verificar se existe redirecionamento salvo
      const redirectData = sessionStorage.getItem('userRedirect');
      if (redirectData) {
        try {
          const { redirectTo } = JSON.parse(redirectData);
          if (redirectTo === 'enrollments/new') {
            // Redirecionar para a página de nova matrícula
            navigate('/admin/enrollments/new');
          }
        } catch (e) {
          console.error('Erro ao processar redirecionamento:', e);
        }
        // Limpar dados de redirecionamento
        sessionStorage.removeItem('userRedirect');
      } else {
        // Comportamento padrão: voltar para lista de usuários
        navigate('/admin/users');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao tentar criar o usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: (data: Partial<UserFormValues>) => 
      apiRequest(`/api/admin/users/${id}`, { 
        method: 'PUT',
        data
      }),
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso!",
        description: "As alterações foram salvas no sistema.",
      });
      navigate('/admin/users');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao tentar atualizar o usuário.",
        variant: "destructive",
      });
    },
  });
  
  // Funções para enviar formulários
  const onSubmit = (data: UserFormValues) => {
    if (isEditing) {
      // Se estiver editando, remover campos vazios e senha se não foi alterada
      const updateData = { ...data };
      
      // Remover senha se estiver vazia (não foi alterada)
      if (!updateData.password) {
        delete updateData.password;
      }
      
      updateUserMutation.mutate(updateData);
    } else {
      createUserMutation.mutate(data);
    }
  };
  
  // Efeito para rastrear mudanças na instituição selecionada
  useEffect(() => {
    if (watchInstitutionId) {
      setSelectedInstitutionId(Number(watchInstitutionId));
    } else {
      setSelectedInstitutionId(null);
    }
  }, [watchInstitutionId]);
  
  // Efeito para verificar parâmetros de redirecionamento na URL
  useEffect(() => {
    // Verificar se há parâmetros de redirecionamento na URL
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirectTo');
    
    if (redirectTo) {
      // Guardar para uso após a criação do usuário
      sessionStorage.setItem('userRedirect', JSON.stringify({
        redirectTo
      }));
    }
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Editar Usuário" : "Criar Novo Usuário"}
          </h1>
          <p className="text-gray-600">
            {isEditing 
              ? "Atualize as informações do usuário" 
              : "Preencha o formulário para criar um novo usuário no sistema"
            }
          </p>
        </div>
        
        {isLoadingUser && isEditing ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados do Usuário</CardTitle>
                  <CardDescription>Informações pessoais do usuário</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do usuário" {...field} />
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
                            <Input placeholder="Email de contato" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
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
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF {watchPortalType === "student" && <span className="text-red-500">*</span>}</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormDescription>
                            {watchPortalType === "student" && "CPF é obrigatório para alunos"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
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
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                            <Input placeholder="Estado" {...field} />
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados de Acesso</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Selecione o tipo de portal adequado para o usuário que está sendo cadastrado.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="portalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Portal</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">Aluno</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="polo">Polo</SelectItem>
                              <SelectItem value="partner">Parceiro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="nome.sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEditing ? "Nova Senha (deixe em branco para manter a atual)" : "Senha"}</FormLabel>
                        <FormControl>
                          <Input placeholder="******" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          {isEditing ? 
                            "Preencha apenas se desejar alterar a senha atual" : 
                            "A senha deve ter pelo menos 6 caracteres"
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Sistema de Permissionamento</CardTitle>
                  <CardDescription>Atribua papéis, instituições e outras configurações de acesso</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel/Função</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um papel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingRoles ? (
                              <SelectItem value="loading" disabled>Carregando papéis...</SelectItem>
                            ) : roles && roles.length > 0 ? (
                              roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name} - {role.scope === "global" ? "Global" : "Específico"}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>Nenhum papel encontrado</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Atribui um papel ao usuário para definir suas permissões básicas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Instituição - exibir para parceiros e polos */}
                  {(watchPortalType === "partner" || watchPortalType === "polo") && (
                    <FormField
                      control={form.control}
                      name="institutionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instituição</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma instituição" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingInstitutions ? (
                                <SelectItem value="loading" disabled>Carregando instituições...</SelectItem>
                              ) : institutions && institutions.length > 0 ? (
                                institutions.map((institution) => (
                                  <SelectItem key={institution.id} value={institution.id.toString()}>
                                    {institution.name} ({institution.code})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>Nenhuma instituição encontrada</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {watchPortalType === "partner" ? 
                              "Instituição é obrigatória para parceiros" : 
                              "Instituição é obrigatória para polos"
                            }
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Polo - exibir apenas para usuários de polo */}
                  {watchPortalType === "polo" && (
                    <FormField
                      control={form.control}
                      name="poloId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Polo</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString()}
                            disabled={!selectedInstitutionId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !selectedInstitutionId 
                                    ? "Selecione uma instituição primeiro" 
                                    : "Selecione um polo"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {!selectedInstitutionId ? (
                                <SelectItem value="none" disabled>Selecione uma instituição primeiro</SelectItem>
                              ) : isLoadingPolos ? (
                                <SelectItem value="loading" disabled>Carregando polos...</SelectItem>
                              ) : polos && polos.length > 0 ? (
                                polos.map((polo) => (
                                  <SelectItem key={polo.id} value={polo.id.toString()}>
                                    {polo.name} ({polo.code})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>Nenhum polo encontrado para esta instituição</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Polo é obrigatório para usuários do tipo polo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Accordion type="single" collapsible className="mt-4">
                    <AccordionItem value="permissions-info">
                      <AccordionTrigger className="text-sm font-medium">
                        Informações sobre Permissões
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                          O sistema utiliza um modelo híbrido de permissões:
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                          <li>
                            <strong>Papéis (RBAC):</strong> Define permissões base para ações que o usuário pode executar
                          </li>
                          <li>
                            <strong>Contexto (ABAC):</strong> Restringe permissões com base em fase da instituição, status de pagamento e períodos
                          </li>
                        </ul>
                        <p className="mt-2">
                          Os papéis básicos incluem Administrador, Diretor, Coordenador, Secretaria, Professor, Tutor, 
                          Financeiro, Marketing, Comercial, Suporte e outros conforme necessidade.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
              
              <div className="flex justify-between pt-4 pb-20">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/users')}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createUserMutation.isPending || updateUserMutation.isPending ? 
                    "Salvando..." : 
                    isEditing ? "Atualizar" : "Criar Usuário"
                  }
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AdminLayout>
  );
}

// Importação necessária para o useState
import { useState } from "react";