import React, { useState } from "react";
import { InboxLayout } from "@/components/layout/inbox-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  InboxIcon, 
  WhatsAppIcon, 
  MailIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TelegramIcon, 
  WidgetIcon 
} from "@/components/ui/icons";

const InboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("todos");

  return (
    <InboxLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Caixa de Entrada</h1>
        </div>

        <Card>
          <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="flex justify-start h-14 bg-transparent border-b-0">
                <TabsTrigger value="todos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <InboxIcon className="h-5 w-5" />
                    <span>Todos</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <WhatsAppIcon className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-5 w-5" />
                    <span>Email</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="instagram" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <InstagramIcon className="h-5 w-5" />
                    <span>Instagram</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="facebook" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <FacebookIcon className="h-5 w-5" />
                    <span>Facebook</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="telegram" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <TelegramIcon className="h-5 w-5" />
                    <span>Telegram</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="widget" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <div className="flex items-center gap-2">
                    <WidgetIcon className="h-5 w-5" />
                    <span>Widget</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="p-0">
              <TabsContent value="todos" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Caixa de entrada unificada" 
                    description="Todas as mensagens de todos os canais serão exibidas aqui."
                    icon={<InboxIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="whatsapp" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Conecte o WhatsApp" 
                    description="Configure a integração com o WhatsApp para ver as conversas aqui."
                    icon={<WhatsAppIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Configure o Email" 
                    description="Integre sua conta de email para visualizar e responder emails."
                    icon={<MailIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="instagram" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Conecte o Instagram" 
                    description="Configure a integração com Instagram Direct para gerenciar conversas."
                    icon={<InstagramIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="facebook" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Conecte o Facebook" 
                    description="Configure a integração com Facebook Messenger para gerenciar conversas."
                    icon={<FacebookIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="telegram" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Conecte o Telegram" 
                    description="Configure a integração com Telegram para gerenciar conversas."
                    icon={<TelegramIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="widget" className="m-0">
                <div className="p-4">
                  <EmptyState 
                    title="Configure o Widget do Site" 
                    description="Adicione o chat widget ao seu site para receber mensagens de visitantes."
                    icon={<WidgetIcon className="h-12 w-12 text-muted-foreground" />}
                  />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </InboxLayout>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
      <button 
        className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Configurar
      </button>
    </div>
  );
};

export default InboxPage;