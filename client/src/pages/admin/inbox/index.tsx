import React, { useState } from "react";
import { InboxLayout } from "@/components/layout/inbox-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  InboxIcon, 
  WhatsAppIcon, 
  MailIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TelegramIcon, 
  WidgetIcon,
  SettingsIcon,
  QrCodeIcon,
  KeyIcon,
  ServerIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Interface para o estado dos canais
interface ChannelStatus {
  connected: boolean;
  lastSynced?: Date;
  error?: string;
}

// Estados dos canais de comunicação
const channelStatus: Record<string, ChannelStatus> = {
  whatsapp: { connected: false },
  email: { connected: false },
  instagram: { connected: false },
  facebook: { connected: false },
  telegram: { connected: false },
  widget: { connected: true, lastSynced: new Date(Date.now() - 1000 * 60 * 30) }, // 30 minutos atrás
};

const ChannelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("whatsapp");
  
  // Estado para o formulário de configuração do WhatsApp
  const [whatsappConfig, setWhatsappConfig] = useState({
    apiToken: "",
    phoneNumber: "",
    webhookUrl: window.location.origin + "/api/webhooks/whatsapp",
    enableNotifications: true,
    autoReplyMessages: true,
  });
  
  // Estado para o formulário de configuração de Email
  const [emailConfig, setEmailConfig] = useState({
    smtpServer: "",
    smtpPort: "587",
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    enableSsl: true,
  });

  // Estado para o formulário de configuração do Widget
  const [widgetConfig, setWidgetConfig] = useState({
    title: "Atendimento Online",
    welcomeMessage: "Olá! Como podemos ajudar você hoje?",
    offlineMessage: "Estamos offline no momento. Deixe sua mensagem e retornaremos em breve.",
    primaryColor: "#1e40af",
    position: "right",
    showOnMobile: true,
    collectVisitorData: true,
  });

  // Função para obter o status de conexão do canal
  const getConnectionStatus = (channel: string): JSX.Element => {
    const status = channelStatus[channel];
    
    if (!status) {
      return (
        <Badge variant="outline" className="gap-1 text-gray-500">
          <AlertCircleIcon className="h-3 w-3" />
          Não configurado
        </Badge>
      );
    }
    
    if (status.connected) {
      return (
        <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-300">
          <CheckCircleIcon className="h-3 w-3" />
          Conectado
          {status.lastSynced && (
            <span className="ml-1 text-xs">
              (Última sincronização: {formatTime(status.lastSynced)})
            </span>
          )}
        </Badge>
      );
    }
    
    if (status.error) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircleIcon className="h-3 w-3" />
          Erro: {status.error}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-1 text-gray-500">
        <AlertCircleIcon className="h-3 w-3" />
        Desconectado
      </Badge>
    );
  };

  // Função para exibir o formulário de configuração do canal selecionado
  const renderChannelConfig = () => {
    switch (activeTab) {
      case "whatsapp":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Configuração do WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta do WhatsApp Business API para enviar e receber mensagens.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiToken">Token da API</Label>
                  <Input 
                    id="apiToken" 
                    placeholder="Informe o token da API do WhatsApp Business" 
                    value={whatsappConfig.apiToken}
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, apiToken: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Número de Telefone</Label>
                  <Input 
                    id="phoneNumber" 
                    placeholder="Ex: +5511999999999" 
                    value={whatsappConfig.phoneNumber}
                    onChange={(e) => setWhatsappConfig({...whatsappConfig, phoneNumber: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Inclua o código do país e DDD</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <div className="flex">
                    <Input 
                      id="webhookUrl" 
                      value={whatsappConfig.webhookUrl} 
                      readOnly
                    />
                    <Button 
                      variant="outline" 
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(whatsappConfig.webhookUrl)}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Use esta URL ao configurar o webhook na plataforma do WhatsApp Business</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableNotifications" 
                    checked={whatsappConfig.enableNotifications}
                    onCheckedChange={(checked) => setWhatsappConfig({...whatsappConfig, enableNotifications: checked})}
                  />
                  <Label htmlFor="enableNotifications">Ativar notificações por email quando receber novas mensagens</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="autoReplyMessages" 
                    checked={whatsappConfig.autoReplyMessages}
                    onCheckedChange={(checked) => setWhatsappConfig({...whatsappConfig, autoReplyMessages: checked})}
                  />
                  <Label htmlFor="autoReplyMessages">Ativar mensagens automáticas de resposta</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar configurações</Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status da Conexão</h3>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">WhatsApp Business API</p>
                  <p className="text-sm text-muted-foreground">Status atual da conexão</p>
                </div>
                {getConnectionStatus("whatsapp")}
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" className="gap-2">
                  <QrCodeIcon className="h-4 w-4" />
                  Conectar via QR Code
                </Button>
                <Button>Testar Conexão</Button>
              </div>
            </div>
          </div>
        );
        
      case "email":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Configuração de Email</h3>
              <p className="text-sm text-muted-foreground">
                Configure as informações do seu servidor SMTP para enviar e receber emails.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">Servidor SMTP</Label>
                  <Input 
                    id="smtpServer" 
                    placeholder="Ex: smtp.gmail.com" 
                    value={emailConfig.smtpServer}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpServer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input 
                    id="smtpPort" 
                    placeholder="Ex: 587" 
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpPort: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input 
                    id="username" 
                    placeholder="Seu endereço de email" 
                    value={emailConfig.username}
                    onChange={(e) => setEmailConfig({...emailConfig, username: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Sua senha de email ou senha de app" 
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome de Exibição</Label>
                  <Input 
                    id="fromName" 
                    placeholder="Ex: Suporte Edunexia" 
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig({...emailConfig, fromName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email de Origem</Label>
                  <Input 
                    id="fromEmail" 
                    placeholder="Ex: suporte@edunexia.com" 
                    value={emailConfig.fromEmail}
                    onChange={(e) => setEmailConfig({...emailConfig, fromEmail: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enableSsl" 
                  checked={emailConfig.enableSsl}
                  onCheckedChange={(checked) => setEmailConfig({...emailConfig, enableSsl: checked})}
                />
                <Label htmlFor="enableSsl">Usar conexão segura (SSL/TLS)</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar configurações</Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status da Conexão</h3>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Servidor SMTP</p>
                  <p className="text-sm text-muted-foreground">Status atual da conexão</p>
                </div>
                {getConnectionStatus("email")}
              </div>
              
              <Button variant="outline" className="w-full">Testar Conexão</Button>
            </div>
          </div>
        );
        
      case "widget":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Configuração do Widget de Chat</h3>
              <p className="text-sm text-muted-foreground">
                Personalize o widget de chat que será exibido no seu site.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Widget</Label>
                  <Input 
                    id="title" 
                    placeholder="Ex: Atendimento Online" 
                    value={widgetConfig.title}
                    onChange={(e) => setWidgetConfig({...widgetConfig, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex">
                    <Input 
                      id="primaryColor" 
                      type="color" 
                      className="w-12" 
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                    />
                    <Input 
                      className="ml-2" 
                      value={widgetConfig.primaryColor}
                      onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                  <Textarea 
                    id="welcomeMessage" 
                    placeholder="Mensagem exibida quando o widget é aberto" 
                    value={widgetConfig.welcomeMessage}
                    onChange={(e) => setWidgetConfig({...widgetConfig, welcomeMessage: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="offlineMessage">Mensagem Offline</Label>
                  <Textarea 
                    id="offlineMessage" 
                    placeholder="Mensagem exibida quando não há atendentes online" 
                    value={widgetConfig.offlineMessage}
                    onChange={(e) => setWidgetConfig({...widgetConfig, offlineMessage: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Posição no Site</Label>
                  <select 
                    id="position"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={widgetConfig.position}
                    onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                  >
                    <option value="right">Direita</option>
                    <option value="left">Esquerda</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Opções Adicionais</Label>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="showOnMobile" 
                        checked={widgetConfig.showOnMobile}
                        onCheckedChange={(checked) => setWidgetConfig({...widgetConfig, showOnMobile: checked})}
                      />
                      <Label htmlFor="showOnMobile">Exibir em dispositivos móveis</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="collectVisitorData" 
                        checked={widgetConfig.collectVisitorData}
                        onCheckedChange={(checked) => setWidgetConfig({...widgetConfig, collectVisitorData: checked})}
                      />
                      <Label htmlFor="collectVisitorData">Coletar dados do visitante</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar configurações</Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Código de Instalação</h3>
              <div className="p-4 border rounded-md bg-muted/50">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {`<script>
  (function(w,d,s,o,f,js,fjs){
    w['EdunexiaChatWidget']=o;
    w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','edunexiaChat','https://app.edunexia.com/widget.js'));
  
  edunexiaChat('init', { siteId: 'SITE_ID_AQUI' });
</script>`}
                </pre>
                <Button 
                  variant="outline" 
                  className="mt-2 w-full"
                  onClick={() => navigator.clipboard.writeText(`<script>
  (function(w,d,s,o,f,js,fjs){
    w['EdunexiaChatWidget']=o;
    w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','edunexiaChat','https://app.edunexia.com/widget.js'));
  
  edunexiaChat('init', { siteId: 'SITE_ID_AQUI' });
</script>`)}
                >
                  Copiar Código
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">Status do Widget</p>
                  <p className="text-sm text-muted-foreground">Status atual da implementação</p>
                </div>
                {getConnectionStatus("widget")}
              </div>
            </div>
          </div>
        );
        
      case "instagram":
      case "facebook":
      case "telegram":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Configuração de {getChannelName(activeTab)}</h3>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta de {getChannelName(activeTab)} para gerenciar mensagens diretamente da plataforma.
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
              {getEmptyStateIcon(activeTab)}
              <h3 className="mt-4 text-lg font-medium">Conecte sua conta de {getChannelName(activeTab)}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Para integrar o {getChannelName(activeTab)} à plataforma, precisamos conectar à sua conta. 
                Clique no botão abaixo para iniciar o processo de autorização.
              </p>
              <Button className="mt-4 gap-2">
                <KeyIcon className="h-4 w-4" />
                Conectar {getChannelName(activeTab)}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status da Conexão</h3>
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{getChannelName(activeTab)}</p>
                  <p className="text-sm text-muted-foreground">Status atual da conexão</p>
                </div>
                {getConnectionStatus(activeTab)}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <SettingsIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Configuração de Canais</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Selecione um canal de comunicação na guia superior para configurar suas integrações.
            </p>
          </div>
        );
    }
  };

  return (
    <InboxLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Canais de Comunicação</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração de Canais</CardTitle>
            <CardDescription>
              Configure os canais de comunicação para interagir com seus clientes e alunos
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="whatsapp" className="w-full" onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="whatsapp" className="flex gap-1">
                  <WhatsAppIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex gap-1">
                  <MailIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex gap-1">
                  <InstagramIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Instagram</span>
                </TabsTrigger>
                <TabsTrigger value="facebook" className="flex gap-1">
                  <FacebookIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Facebook</span>
                </TabsTrigger>
                <TabsTrigger value="telegram" className="flex gap-1">
                  <TelegramIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Telegram</span>
                </TabsTrigger>
                <TabsTrigger value="widget" className="flex gap-1">
                  <WidgetIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Widget</span>
                </TabsTrigger>
                <TabsTrigger value="all" className="flex gap-1">
                  <SettingsIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="p-6">
              <TabsContent value="whatsapp" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="email" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="instagram" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="facebook" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="telegram" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="widget" className="mt-0">
                {renderChannelConfig()}
              </TabsContent>
              
              <TabsContent value="all" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Visão Geral dos Canais</h3>
                    <p className="text-sm text-muted-foreground">
                      Gerencie todos os seus canais de comunicação em um só lugar
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({
                      whatsapp: "WhatsApp",
                      email: "Email",
                      instagram: "Instagram",
                      facebook: "Facebook", 
                      telegram: "Telegram",
                      widget: "Widget de Chat"
                    }).map(([key, name]) => (
                      <div key={key} className="p-4 border rounded-md bg-muted/30 flex justify-between items-center">
                        <div className="flex items-center">
                          {getChannelIcon(key)}
                          <div className="ml-3">
                            <p className="font-medium">{name}</p>
                            <div className="mt-1">
                              {getConnectionStatus(key)}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab(key)}
                        >
                          Configurar
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 border rounded-md bg-muted/30">
                    <h4 className="font-medium mb-2">Integrações Adicionais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start gap-2">
                        <PlusCircleIcon className="h-4 w-4" />
                        Integrar com Jitsi Meet
                      </Button>
                      <Button variant="outline" className="justify-start gap-2">
                        <PlusCircleIcon className="h-4 w-4" />
                        Integrar com Microsoft Teams
                      </Button>
                      <Button variant="outline" className="justify-start gap-2">
                        <PlusCircleIcon className="h-4 w-4" />
                        Integrar com Google Meet
                      </Button>
                      <Button variant="outline" className="justify-start gap-2">
                        <PlusCircleIcon className="h-4 w-4" />
                        Integrar com Zoom
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </InboxLayout>
  );
};

// Função auxiliar para formatar o tempo
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Menos de um minuto
  if (diff < 60 * 1000) {
    return "agora mesmo";
  }
  
  // Menos de uma hora, mostrar minutos
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  // Menos de 24 horas, mostrar hora
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  // Menos de 7 dias, mostrar dia
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  
  // Mostrar data completa
  return date.toLocaleDateString();
};

// Função para obter o nome do canal com base no ID
const getChannelName = (channelId: string): string => {
  switch (channelId) {
    case 'whatsapp': return 'WhatsApp';
    case 'email': return 'Email';
    case 'instagram': return 'Instagram';
    case 'facebook': return 'Facebook';
    case 'telegram': return 'Telegram';
    case 'widget': return 'Widget de Chat';
    default: return 'Canal';
  }
};

// Função para obter o ícone do canal
const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'whatsapp': return <WhatsAppIcon className="h-5 w-5 text-green-600" />;
    case 'email': return <MailIcon className="h-5 w-5 text-blue-600" />;
    case 'instagram': return <InstagramIcon className="h-5 w-5 text-purple-600" />;
    case 'facebook': return <FacebookIcon className="h-5 w-5 text-blue-700" />;
    case 'telegram': return <TelegramIcon className="h-5 w-5 text-blue-500" />;
    case 'widget': return <WidgetIcon className="h-5 w-5 text-orange-500" />;
    default: return <SettingsIcon className="h-5 w-5 text-muted-foreground" />;
  }
};

// Função para determinar o ícone do estado vazio com base no canal
const getEmptyStateIcon = (channel: string) => {
  switch (channel) {
    case 'whatsapp': return <WhatsAppIcon className="h-12 w-12 text-muted-foreground" />;
    case 'email': return <MailIcon className="h-12 w-12 text-muted-foreground" />;
    case 'instagram': return <InstagramIcon className="h-12 w-12 text-muted-foreground" />;
    case 'facebook': return <FacebookIcon className="h-12 w-12 text-muted-foreground" />;
    case 'telegram': return <TelegramIcon className="h-12 w-12 text-muted-foreground" />;
    case 'widget': return <WidgetIcon className="h-12 w-12 text-muted-foreground" />;
    default: return <SettingsIcon className="h-12 w-12 text-muted-foreground" />;
  }
};

// Renomeamos para InboxPage para manter a consistência com outros módulos
const InboxPage = ChannelsPage;
export default InboxPage;