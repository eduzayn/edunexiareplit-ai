import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, PortalType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation, useSearch } from "wouter";
import { SchoolIcon, HandshakeIcon, MapPinIcon, ShieldIcon } from "@/components/ui/icons";

// Form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

// Criar um novo schema baseado em insertUserSchema mas com Zod diretamente
const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  cpf: z.string().optional(),
  portalType: z.enum(["student", "partner", "polo", "admin"]),
  confirmPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Você deve concordar com os termos e condições.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  // CPF obrigatório apenas para alunos
  if (data.portalType === 'student' && !data.cpf) {
    return false;
  }
  return true;
}, {
  message: "CPF é obrigatório para alunos",
  path: ["cpf"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthPageProps {
  adminOnly?: boolean;
}

export default function AuthPage({ adminOnly = false }: AuthPageProps) {
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const portalParam = params.get("portal") as PortalType;
  const portalType = adminOnly ? "admin" : (portalParam || "student");
  const [selectedTab, setSelectedTab] = useState<"login" | "register">("login");

  const portalIcons = {
    student: <SchoolIcon className="h-8 w-8 text-[#12B76A]" />,
    partner: <HandshakeIcon className="h-8 w-8 text-[#7C4DFC]" />,
    polo: <MapPinIcon className="h-8 w-8 text-[#F79009]" />,
    admin: <ShieldIcon className="h-8 w-8 text-[#3451B2]" />,
  };

  const portalColors = {
    student: "text-[#12B76A] bg-green-100",
    partner: "text-[#7C4DFC] bg-purple-100",
    polo: "text-[#F79009] bg-orange-100",
    admin: "text-[#3451B2] bg-blue-100",
  };

  const portalTitles = {
    student: "Portal do Aluno",
    partner: "Portal do Parceiro",
    polo: "Portal do Polo",
    admin: "Portal Administrativo",
  };

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      cpf: "",
      portalType: portalType,
      terms: false,
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
      portalType: portalType,
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, terms, ...userData } = data;
    registerMutation.mutate(userData);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Auth Form Column */}
      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-2/5">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-6">
            <Link to="/" className="flex items-center text-2xl font-bold text-primary">
              <SchoolIcon className="h-8 w-8 mr-2" />
              EdunexIA
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Acesso ao {portalTitles[portalType]}
            </h2>
            <div className="mt-4 flex items-center">
              <div className={`flex items-center justify-center rounded-full h-12 w-12 ${portalColors[portalType]}`}>
                {portalIcons[portalType]}
              </div>
              <p className="ml-4 text-gray-600">
                {adminOnly 
                  ? "Área restrita para administradores do sistema." 
                  : "Faça login ou crie uma conta para acessar."}
              </p>
            </div>
            {!adminOnly && (
              <p className="mt-2 text-sm text-gray-600">
                Ou{" "}
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => navigate("/portal-selection")}
                >
                  escolha outro portal
                </Button>
              </p>
            )}
          </div>

          {adminOnly && (
            <div className="mb-6">
              <div className="p-4 border border-blue-100 rounded-md bg-blue-50">
                <p className="text-sm text-blue-800">
                  <strong>Área de administração restrita.</strong> Acesso permitido somente para administradores autorizados do sistema.
                </p>
              </div>
            </div>
          )}

          {!adminOnly ? (
            <Tabs 
              defaultValue="login" 
              value={selectedTab} 
              onValueChange={(v) => setSelectedTab(v as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usuário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seu.usuario" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Lembrar-me</FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        variant="link" 
                        className="p-0 text-sm text-primary hover:text-primary-dark"
                      >
                        Esqueceu a senha?
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="primaryLight"
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu Nome Completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {portalType === "student" && (
                      <FormField
                        control={registerForm.control}
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
                    )}
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="usuario.exemplo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="portalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Portal</FormLabel>
                          <FormControl>
                            <Input type="hidden" {...field} value={portalType} />
                          </FormControl>
                          <div className="p-2 border rounded bg-gray-50">
                            <div className="flex items-center">
                              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${portalColors[portalType]}`}>
                                {portalIcons[portalType]}
                              </div>
                              <span className="ml-2 font-medium">{portalTitles[portalType]}</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0 mt-4">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal text-sm">
                              Eu concordo com os{" "}
                              <Button variant="link" className="p-0 text-sm" onClick={(e) => e.preventDefault()}>
                                termos de serviço
                              </Button>{" "}
                              e{" "}
                              <Button variant="link" className="p-0 text-sm" onClick={(e) => e.preventDefault()}>
                                política de privacidade
                              </Button>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      variant="primaryLight"
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Criando..." : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin.usuario" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Lembrar-me</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    variant="link" 
                    className="p-0 text-sm text-primary hover:text-primary-dark"
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  variant="primaryLight"
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
      
      {/* Hero Image/Content Column */}
      <div className="hidden lg:block relative lg:w-1/2 xl:w-3/5">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-primary-dark to-primary">
          <div className="flex flex-col justify-center items-center h-full px-12 text-white">
            <div className="max-w-md text-center">
              <SchoolIcon className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                EdunexIA - Plataforma Educacional
              </h2>
              <p className="text-lg mb-8">
                A plataforma mais moderna do Brasil para instituições de ensino a distância.
                Integre todos os processos, desde a gestão acadêmica até o financeiro, com um
                sistema inteligente e intuitivo.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-bold mb-2">Gestão Completa</h3>
                  <p className="text-sm opacity-90">Sistema integrado para todas as áreas da sua instituição.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Inteligência Artificial</h3>
                  <p className="text-sm opacity-90">Automatize processos e ofereça suporte 24/7 aos alunos.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Multi-portal</h3>
                  <p className="text-sm opacity-90">Acesso personalizado para cada tipo de usuário do sistema.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Relatórios Avançados</h3>
                  <p className="text-sm opacity-90">Tome decisões baseadas em dados reais e atualizados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}