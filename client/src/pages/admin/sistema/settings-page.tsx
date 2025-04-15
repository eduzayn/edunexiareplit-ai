import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: integrations, isLoading: isLoadingIntegrations } = useQuery({
    queryKey: ["/api/integrations"],
    enabled: activeTab === "integrations",
  });

  const handleSaveSettings = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
    }, 1000);
  };

  if (isLoadingSettings) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <title>Configurações | EdunexIA</title>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <Button onClick={handleSaveSettings} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="branding">Marca e Aparência</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="backup">Backup e Exportação</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nome da Plataforma</Label>
                  <Input id="site-name" defaultValue="EdunexIA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">URL da Plataforma</Label>
                  <Input id="site-url" defaultValue="https://app.edunexia.com.br" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email do Administrador</Label>
                  <Input id="admin-email" defaultValue="admin@edunexia.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de Suporte</Label>
                  <Input id="support-email" defaultValue="suporte@edunexia.com.br" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="America/Sao_Paulo">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Selecione um fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">América/São Paulo</SelectItem>
                      <SelectItem value="America/Manaus">América/Manaus</SelectItem>
                      <SelectItem value="America/Bahia">América/Bahia</SelectItem>
                      <SelectItem value="America/Fortaleza">América/Fortaleza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Data</Label>
                  <Select defaultValue="DD/MM/YYYY">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Selecione um formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações de Funcionalidades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="enable-blog" className="flex flex-col">
                      <span>Habilitar Blog</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Exibir seção de blog no site público
                      </span>
                    </Label>
                    <Switch id="enable-blog" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="enable-forum" className="flex flex-col">
                      <span>Habilitar Fórum</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Permitir que alunos participem de discussões
                      </span>
                    </Label>
                    <Switch id="enable-forum" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="enable-certificates" className="flex flex-col">
                      <span>Habilitar Certificados</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Geração automática de certificados para alunos
                      </span>
                    </Label>
                    <Switch id="enable-certificates" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="maintenance-mode" className="flex flex-col">
                      <span>Modo de Manutenção</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Desativar acesso ao site para manutenção
                      </span>
                    </Label>
                    <Switch id="maintenance-mode" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Marca e Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex space-x-2">
                    <Input id="primary-color" type="color" defaultValue="#0066cc" className="w-16 h-10" />
                    <Input defaultValue="#0066cc" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex space-x-2">
                    <Input id="secondary-color" type="color" defaultValue="#ff6600" className="w-16 h-10" />
                    <Input defaultValue="#ff6600" className="flex-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select defaultValue="light">
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema (automático)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font">Fonte Principal</Label>
                  <Select defaultValue="inter">
                    <SelectTrigger id="font">
                      <SelectValue placeholder="Selecione uma fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo da Plataforma</Label>
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-center h-32 mb-4 bg-muted rounded-md">
                    <img src="/logo.png" alt="Logo atual" className="max-h-full" />
                  </div>
                  <div className="flex justify-center">
                    <Button variant="outline">Alterar Logo</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-center h-16 mb-4 bg-muted rounded-md">
                    <img src="/favicon.ico" alt="Favicon atual" className="max-h-full" />
                  </div>
                  <div className="flex justify-center">
                    <Button variant="outline">Alterar Favicon</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure como os emails são enviados pela plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Provedor de Email</Label>
                  <Select defaultValue="smtp">
                    <SelectTrigger id="email-provider">
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailchimp">Mailchimp</SelectItem>
                      <SelectItem value="aws-ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">Email de Envio</Label>
                  <Input id="from-email" defaultValue="no-reply@edunexia.com.br" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input id="smtp-host" defaultValue="smtp.edunexia.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta SMTP</Label>
                  <Input id="smtp-port" defaultValue="587" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário SMTP</Label>
                  <Input id="smtp-user" defaultValue="smtp@edunexia.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Senha SMTP</Label>
                  <Input id="smtp-password" type="password" defaultValue="**********" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-ssl" className="flex flex-col">
                    <span>Habilitar SSL/TLS</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Use conexão segura para envio de emails
                    </span>
                  </Label>
                  <Switch id="enable-ssl" defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Modelos de Email</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between space-x-4 bg-muted p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Boas-vindas</h4>
                      <p className="text-sm text-muted-foreground">Enviado quando um novo usuário se cadastra</p>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                  <div className="flex items-center justify-between space-x-4 bg-muted p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Recuperação de Senha</h4>
                      <p className="text-sm text-muted-foreground">Enviado quando um usuário solicita recuperação de senha</p>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                  <div className="flex items-center justify-between space-x-4 bg-muted p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Confirmação de Matrícula</h4>
                      <p className="text-sm text-muted-foreground">Enviado quando uma matrícula é confirmada</p>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                  <div className="flex items-center justify-between space-x-4 bg-muted p-3 rounded-md">
                    <div>
                      <h4 className="font-medium">Certificado Emitido</h4>
                      <p className="text-sm text-muted-foreground">Enviado quando um certificado é gerado</p>
                    </div>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
              <CardDescription>
                Configure integrações com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingIntegrations ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="bg-muted p-4 rounded-md mb-6">
                    <h3 className="text-lg font-medium mb-2">Integrações com Gateways de Pagamento</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/stripe.svg" alt="Stripe" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Stripe</h4>
                            <p className="text-sm text-muted-foreground">Processamento de pagamentos</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="stripe-enabled" defaultChecked />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/mercadopago.svg" alt="Mercado Pago" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Mercado Pago</h4>
                            <p className="text-sm text-muted-foreground">Processamento de pagamentos</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="mercadopago-enabled" defaultChecked />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/asaas.svg" alt="Asaas" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Asaas</h4>
                            <p className="text-sm text-muted-foreground">Gestão de cobranças e assinaturas</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="asaas-enabled" />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-md mb-6">
                    <h3 className="text-lg font-medium mb-2">Integrações com Armazenamento</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/aws.svg" alt="AWS S3" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Amazon S3</h4>
                            <p className="text-sm text-muted-foreground">Armazenamento de arquivos</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="s3-enabled" defaultChecked />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/google-cloud.svg" alt="Google Cloud Storage" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Google Cloud Storage</h4>
                            <p className="text-sm text-muted-foreground">Armazenamento de arquivos</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="gcs-enabled" />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Integrações com API</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/zapier.svg" alt="Zapier" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Zapier</h4>
                            <p className="text-sm text-muted-foreground">Automação entre serviços</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="zapier-enabled" />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <img src="/integrations/webhook.svg" alt="Webhooks" className="w-8 h-8" />
                          <div>
                            <h4 className="font-medium">Webhooks</h4>
                            <p className="text-sm text-muted-foreground">Eventos HTTP personalizados</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="webhooks-enabled" defaultChecked />
                          <Button variant="outline" size="sm">Configurar</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Exportação</CardTitle>
              <CardDescription>
                Gerencie backups e exportações de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium mb-2">Configurações de Backup</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Frequência de Backup</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger id="backup-frequency">
                          <SelectValue placeholder="Selecione uma frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backup-retention">Período de Retenção</Label>
                      <Select defaultValue="30">
                        <SelectTrigger id="backup-retention">
                          <SelectValue placeholder="Selecione um período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="14">14 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backup-location">Local de Armazenamento</Label>
                    <Select defaultValue="s3">
                      <SelectTrigger id="backup-location">
                        <SelectValue placeholder="Selecione um local" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Servidor Local</SelectItem>
                        <SelectItem value="s3">Amazon S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="backup-encryption" className="flex flex-col">
                      <span>Criptografar Backups</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        Proteja os backups com criptografia
                      </span>
                    </Label>
                    <Switch id="backup-encryption" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium mb-4">Backups Recentes</h3>
                <div className="relative overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-card">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left">Data</th>
                        <th scope="col" className="px-6 py-3 text-left">Tamanho</th>
                        <th scope="col" className="px-6 py-3 text-left">Status</th>
                        <th scope="col" className="px-6 py-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-card border-b">
                        <td className="px-6 py-4">15/04/2025 02:00</td>
                        <td className="px-6 py-4">1.2 GB</td>
                        <td className="px-6 py-4">
                          <span className="text-green-500">Completo</span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">Restaurar</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </td>
                      </tr>
                      <tr className="bg-card border-b">
                        <td className="px-6 py-4">14/04/2025 02:00</td>
                        <td className="px-6 py-4">1.2 GB</td>
                        <td className="px-6 py-4">
                          <span className="text-green-500">Completo</span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">Restaurar</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </td>
                      </tr>
                      <tr className="bg-card">
                        <td className="px-6 py-4">13/04/2025 02:00</td>
                        <td className="px-6 py-4">1.1 GB</td>
                        <td className="px-6 py-4">
                          <span className="text-green-500">Completo</span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm">Restaurar</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-lg font-medium mb-4">Exportação de Dados</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Exporte dados do sistema para análise ou migração. Selecione o tipo de dados que deseja exportar.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 bg-card">
                      <h4 className="font-medium mb-2">Exportar Usuários</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporta informações de todos os usuários cadastrados
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">CSV</Button>
                        <Button variant="outline" size="sm">JSON</Button>
                        <Button variant="outline" size="sm">Excel</Button>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 bg-card">
                      <h4 className="font-medium mb-2">Exportar Matrículas</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporta dados de matrículas dos alunos
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">CSV</Button>
                        <Button variant="outline" size="sm">JSON</Button>
                        <Button variant="outline" size="sm">Excel</Button>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 bg-card">
                      <h4 className="font-medium mb-2">Exportar Transações</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporta histórico de transações financeiras
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">CSV</Button>
                        <Button variant="outline" size="sm">JSON</Button>
                        <Button variant="outline" size="sm">Excel</Button>
                      </div>
                    </div>
                    <div className="border rounded-md p-4 bg-card">
                      <h4 className="font-medium mb-2">Exportar Relatórios</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporta relatórios gerados pelo sistema
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">CSV</Button>
                        <Button variant="outline" size="sm">JSON</Button>
                        <Button variant="outline" size="sm">Excel</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}