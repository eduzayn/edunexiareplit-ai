import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import NavbarMain from "../components/layout/navbar-main";
import FooterMain from "../components/layout/footer-main";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";

// Schema de validação para o formulário de cadastro
const cadastroSchema = z.object({
  institutionName: z.string().min(3, "Nome da instituição deve ter pelo menos 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  fullName: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(3, "Cidade deve ter pelo menos 3 caracteres"),
  state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  zipCode: z.string().min(8, "CEP deve ter pelo menos 8 caracteres"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme a senha"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve aceitar os termos e condições",
  }),
  planId: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type CadastroFormValues = z.infer<typeof cadastroSchema>;

export default function CadastroPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState("");

  const form = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      institutionName: "",
      cnpj: "",
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      username: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      planId: planId
    },
  });

  // Obter o ID do plano a partir da URL, se existir
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    if (plan) {
      setPlanId(plan);
      form.setValue('planId', plan);
    }
  });

  async function onSubmit(data: CadastroFormValues) {
    setLoading(true);
    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Você será redirecionado para a página de confirmação.",
        });
        setTimeout(() => {
          setLocation('/cadastro-sucesso');
        }, 2000);
      } else {
        throw new Error(responseData.message || 'Erro ao cadastrar');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro durante o cadastro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarMain />
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Cadastro da Instituição</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para iniciar seu período de teste gratuito de 14 dias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados da Instituição</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="institutionName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Instituição</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua instituição" {...field} />
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
                              <Input placeholder="00.000.000/0000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados do Administrador</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
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
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
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
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
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
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Sua cidade" {...field} />
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
                              <Input placeholder="UF" {...field} />
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados de Acesso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input placeholder="Escolha um nome de usuário" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div></div>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Escolha uma senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirme a Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirme sua senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <input type="hidden" {...form.register('planId')} />

                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label className="flex flex-wrap gap-1 cursor-pointer">
                              <span>Eu aceito os</span> 
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-primary underline cursor-pointer" type="button">
                                    termos e condições de uso
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Termos e Condições de Uso</DialogTitle>
                                    <DialogDescription>
                                      Por favor, leia atentamente os nossos termos e condições.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 text-sm">
                                    <h3 className="font-bold text-base">1. Aceitação dos Termos</h3>
                                    <p>Ao se cadastrar na plataforma Edunexia, você concorda em cumprir e ficar vinculado aos presentes Termos e Condições de Uso, todas as leis e regulamentos aplicáveis. Se você não concordar com qualquer um destes termos, está proibido de usar ou acessar este site.</p>
                                    
                                    <h3 className="font-bold text-base">2. Período de Teste Gratuito</h3>
                                    <p>Ao se cadastrar, você terá acesso a um período de teste gratuito de 14 dias para conhecer e utilizar a plataforma. Durante este período, você terá acesso a todas as funcionalidades disponíveis no plano escolhido. Após o término do período de teste, caso não haja contratação de um plano pago, o acesso à plataforma será limitado.</p>
                                    
                                    <h3 className="font-bold text-base">3. Proteção de Dados</h3>
                                    <p>Todas as informações pessoais fornecidas durante o cadastro serão tratadas de acordo com a nossa Política de Privacidade e com a Lei Geral de Proteção de Dados (LGPD). Ao se cadastrar, você consente com a coleta, armazenamento e processamento dos seus dados conforme descrito em nossa Política de Privacidade.</p>
                                    
                                    <h3 className="font-bold text-base">4. Responsabilidades do Usuário</h3>
                                    <p>O usuário é responsável por manter a confidencialidade de sua conta e senha, bem como por restringir o acesso ao seu computador. Você concorda em aceitar a responsabilidade por todas as atividades que ocorrerem em sua conta ou com sua senha.</p>
                                    
                                    <h3 className="font-bold text-base">5. Limitação de Responsabilidade</h3>
                                    <p>A Edunexia não será responsável por quaisquer danos diretos, indiretos, incidentais, consequenciais ou punitivos resultantes do uso ou incapacidade de uso da plataforma.</p>
                                    
                                    <h3 className="font-bold text-base">6. Alterações nos Termos</h3>
                                    <p>A Edunexia reserva-se o direito de alterar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado da plataforma após a publicação das alterações constituirá sua aceitação desses termos revisados.</p>
                                    
                                    <h3 className="font-bold text-base">7. Lei Aplicável</h3>
                                    <p>Estes termos e condições são regidos e interpretados de acordo com as leis do Brasil, e quaisquer disputas relacionadas a estes termos estarão sujeitas à jurisdição exclusiva dos tribunais brasileiros.</p>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button">
                                        Fechar
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <span>, bem como a</span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-primary underline cursor-pointer" type="button">
                                    política de privacidade
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Política de Privacidade</DialogTitle>
                                    <DialogDescription>
                                      Por favor, leia atentamente nossa política de privacidade.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 text-sm">
                                    <h3 className="font-bold text-base">1. Coleta de Informações</h3>
                                    <p>A Edunexia coleta informações pessoais durante o cadastro na plataforma, incluindo nome, e-mail, telefone, endereço e dados de acesso. Também podemos coletar informações sobre como você utiliza a plataforma, incluindo dados de acesso, interações e preferências.</p>
                                    
                                    <h3 className="font-bold text-base">2. Uso das Informações</h3>
                                    <p>As informações coletadas são utilizadas para fornecer e melhorar nossos serviços, personalizar a experiência do usuário, processar transações, enviar comunicações sobre a plataforma e para fins administrativos e de suporte.</p>
                                    
                                    <h3 className="font-bold text-base">3. Compartilhamento de Informações</h3>
                                    <p>A Edunexia não vende, aluga ou compartilha informações pessoais dos usuários com terceiros para fins de marketing sem seu consentimento. Podemos compartilhar informações com prestadores de serviços que nos auxiliam na operação da plataforma, sempre sob rigorosos acordos de confidencialidade.</p>
                                    
                                    <h3 className="font-bold text-base">4. Segurança</h3>
                                    <p>Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.</p>
                                    
                                    <h3 className="font-bold text-base">5. Seus Direitos</h3>
                                    <p>De acordo com a LGPD, você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais. Você também pode se opor ao processamento de suas informações ou solicitar a portabilidade dos seus dados.</p>
                                    
                                    <h3 className="font-bold text-base">6. Alterações na Política</h3>
                                    <p>A Edunexia pode modificar esta Política de Privacidade de tempos em tempos. Quaisquer alterações serão publicadas na plataforma e, em caso de alterações significativas, forneceremos um aviso mais proeminente, que pode incluir notificação por e-mail.</p>
                                    
                                    <h3 className="font-bold text-base">7. Contato</h3>
                                    <p>Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco através dos canais de comunicação disponíveis na plataforma.</p>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button">
                                        Fechar
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <span>.</span>
                            </Label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center">
                    <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                      {loading ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <FooterMain />
    </div>
  );
}