import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useLocation } from "wouter";
import { SchoolIcon, MapPinIcon } from "@/components/ui/icons";

// Form schema
const loginSchema = z.object({
  username: z.string().min(3, "Nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function PoloAuthPage() {
  const { loginMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
      portalType: "polo",
    });
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
              Acesso ao Portal do Polo
            </h2>
            <div className="mt-4 flex items-center">
              <div className="flex items-center justify-center rounded-full h-12 w-12 text-[#F79009] bg-orange-100">
                <MapPinIcon className="h-8 w-8" />
              </div>
              <p className="ml-4 text-gray-600">
                Área restrita para gestores de polos educacionais.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="p-4 border border-orange-100 rounded-md bg-orange-50">
              <p className="text-sm text-orange-800">
                <strong>Área de gestão de polos.</strong> Acesso permitido somente para coordenadores e gestores de polos autorizados.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="polo.usuario" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
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
                  control={form.control}
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
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
              
              <p className="text-center text-xs text-gray-500 mt-2">
                Esta área é exclusiva para gestores de polos.{" "}
                <Button 
                  variant="link" 
                  className="p-0 text-xs" 
                  onClick={() => navigate("/portal-selection")}
                >
                  Voltar para seleção de portal
                </Button>
              </p>
            </form>
          </Form>
        </div>
      </div>
      
      {/* Hero Image/Content Column */}
      <div className="hidden lg:block relative lg:w-1/2 xl:w-3/5">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-[#B54708] to-[#F79009]">
          <div className="flex flex-col justify-center items-center h-full px-12 text-white">
            <div className="max-w-md text-center">
              <MapPinIcon className="h-16 w-16 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Portal do Polo EdunexIA
              </h2>
              <p className="text-lg mb-8">
                Gerencie sua unidade educacional, acompanhe matrículas, gere relatórios e crie links personalizados de venda.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="font-bold mb-2">Gestão de Alunos</h3>
                  <p className="text-sm opacity-90">Acompanhe matrículas e o desempenho dos alunos de sua unidade.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Relatórios</h3>
                  <p className="text-sm opacity-90">Acesse estatísticas e indicadores para tomada de decisões estratégicas.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Links de Vendas</h3>
                  <p className="text-sm opacity-90">Crie links de inscrição personalizados para captar novos alunos.</p>
                </div>
                <div className="text-left">
                  <h3 className="font-bold mb-2">Configurações</h3>
                  <p className="text-sm opacity-90">Personalize as informações e preferências do seu polo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}