import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Esquema de validação do formulário
const cadastroSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  cnpj: z.string().min(14, { message: "CNPJ inválido" }).max(18),
  email: z.string().email({ message: "Email inválido" }),
  telefone: z.string().min(10, { message: "Telefone inválido" }),
  senha: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmarSenha: z.string(),
  nomeInstituicao: z.string().min(3, { message: "Nome da instituição deve ter pelo menos 3 caracteres" }),
  descricaoInstituicao: z.string().optional(),
  website: z.string().optional(),
  endereco: z.string().min(5, { message: "Endereço inválido" }),
  cidade: z.string().min(2, { message: "Cidade inválida" }),
  estado: z.string().length(2, { message: "Use a sigla do estado (ex: SP)" }),
  cep: z.string().min(8, { message: "CEP inválido" }),
}).refine(data => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type CadastroFormValues = z.infer<typeof cadastroSchema>;

export default function CadastroPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/cadastro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const planoId = searchParams.get('plano');

  // Buscar detalhes do plano selecionado
  const { data: planData, isLoading: isPlanLoading } = useQuery({
    queryKey: ['subscription-plan', planoId],
    queryFn: async () => {
      if (!planoId) return null;
      try {
        const response = await axios.get(`/api/public/subscription-plans/public`);
        const plans = response.data.plans || [];
        return plans.find((p: any) => p.id === Number(planoId)) || null;
      } catch (error) {
        console.error('Erro ao buscar plano:', error);
        return null;
      }
    },
    enabled: !!planoId
  });

  // Configurar o formulário com react-hook-form e zod
  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
      nomeInstituicao: "",
      descricaoInstituicao: "",
      website: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  });

  // Função para lidar com a submissão do formulário
  async function onSubmit(data: CadastroFormValues) {
    setIsSubmitting(true);
    try {
      // Preparar os dados para envio à API
      const cadastroData = {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email,
        telefone: data.telefone,
        senha: data.senha,
        instituicao: {
          nome: data.nomeInstituicao,
          descricao: data.descricaoInstituicao || "",
          website: data.website || "",
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep
        },
        planoId: planoId ? parseInt(planoId) : null,
        iniciarTrial: true
      };

      // Fazer a chamada à API para criar o cadastro
      const response = await axios.post('/api/public/register', cadastroData);
      
      // Mostrar mensagem de sucesso e redirecionar
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu período de teste foi iniciado. Verifique seu email para ativar sua conta.",
        variant: "default",
      });
      
      // Redirecionar para a página de confirmação
      setTimeout(() => {
        navigate("/cadastro-sucesso");
      }, 2000);
      
    } catch (error: any) {
      // Mostrar mensagem de erro
      toast({
        title: "Erro ao realizar cadastro",
        description: error.response?.data?.message || "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={() => navigate("/portal-selection")} />
      
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cadastre-se e comece seu período de teste
            </h1>
            {planoId && planData ? (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Você selecionou o plano <span className="font-semibold text-primary">{planData.name}</span>. 
                Preencha o formulário abaixo para iniciar seu período de teste de {planData.trialDays} dias.
              </p>
            ) : (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Preencha o formulário abaixo para criar sua conta e começar a usar a plataforma.
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Formulário de Cadastro</CardTitle>
                  <CardDescription>
                    Preencha todos os campos para criar sua conta e instituição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados Pessoais</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Digite seu nome completo" {...field} />
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
                                  <Input type="email" placeholder="Digite seu email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="telefone"
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
                            name="cnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                  <Input placeholder="00.000.000/0001-00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="senha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Digite sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="confirmarSenha"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Confirme sua senha" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Dados da Instituição</h3>
                        
                        <FormField
                          control={form.control}
                          name="nomeInstituicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Instituição</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o nome da instituição" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="descricaoInstituicao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição (opcional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Breve descrição sobre a instituição" 
                                  className="resize-none h-20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.seusite.com.br" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endereco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Rua, número, complemento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="cidade"
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
                            name="estado"
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
                            name="cep"
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
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          "Cadastrar e Iniciar Período de Teste"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{planoId && planData ? planData.name : "Seu Plano"}</CardTitle>
                  <CardDescription>
                    {planoId && planData ? planData.description : "Detalhes do plano selecionado"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isPlanLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : planoId && planData ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold">
                          {planData.code === 'enterprise' 
                            ? "Personalizado" 
                            : `R$ ${planData.price.toFixed(2).replace('.', ',')}`}
                        </span>
                        <span className="text-sm text-gray-500">
                          {planData.code === 'enterprise' 
                            ? "" 
                            : `/${planData.billingCycle === 'monthly' ? 'mês' : 'ano'}`}
                        </span>
                      </div>
                      
                      <div className="rounded-lg bg-primary/10 p-3 text-center">
                        <span className="text-primary font-semibold">
                          Teste grátis por {planData.trialDays} dias
                        </span>
                      </div>
                      
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Até {planData.maxStudents} alunos ativos
                        </li>
                        {planData.hasFinanceModule && (
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Módulo financeiro completo
                          </li>
                        )}
                        {planData.hasCrmModule && (
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Módulo CRM
                          </li>
                        )}
                        {planData.maxPolos !== null && (
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {planData.maxPolos === 0 ? "Polos ilimitados" : `Até ${planData.maxPolos} polos`}
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum plano selecionado. Você pode retornar à página de planos para escolher um.
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/planos")}
                  >
                    Mudar plano
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="mt-6 p-5 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Informações importantes</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>O período de teste é gratuito e não requer cartão de crédito.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Você terá acesso a todas as funcionalidades do plano selecionado durante o período de teste.</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Enviaremos lembretes antes do término do período de teste.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}