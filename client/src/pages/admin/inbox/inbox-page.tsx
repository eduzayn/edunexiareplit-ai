import React, { useState, useEffect } from "react";
import { InboxLayout } from "@/components/layout/inbox-layout";
import { ConversationList, Conversation } from "@/components/chat/conversation-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import {
  WhatsAppIcon,
  MailIcon,
  InstagramIcon,
  FacebookIcon,
  TelegramIcon,
  WidgetIcon,
  FilterIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Dados de exemplo para demonstração
const mockConversations: Conversation[] = [
  {
    id: "1",
    contactName: "Maria Silva",
    lastMessage: "Olá, gostaria de saber mais sobre o curso de pós-graduação",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
    unreadCount: 2,
    channelType: "whatsapp",
    isActive: true,
  },
  {
    id: "2",
    contactName: "João Oliveira",
    lastMessage: "Qual o prazo para envio do TCC?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    unreadCount: 0,
    channelType: "email",
    isActive: false,
  },
  {
    id: "3",
    contactName: "Pedro Santos",
    lastMessage: "Já confirmei o pagamento da mensalidade",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    unreadCount: 0,
    channelType: "telegram",
    isActive: true,
  },
  {
    id: "4",
    contactName: "Ana Beatriz",
    lastMessage: "Quando começa o próximo módulo?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
    unreadCount: 1,
    channelType: "instagram",
    isActive: false,
  },
  {
    id: "5",
    contactName: "Carlos Mendes",
    lastMessage: "Acabei de enviar o trabalho pelo portal",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    unreadCount: 0,
    channelType: "widget",
    isActive: false,
  },
  {
    id: "6",
    contactName: "Luiza Fernandes",
    lastMessage: "Vou precisar de uma declaração de matrícula",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
    unreadCount: 0,
    channelType: "facebook",
    isActive: true,
  },
];

const InboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  
  // Efeito para filtrar as conversas quando a aba muda
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredConversations(mockConversations);
    } else {
      setFilteredConversations(
        mockConversations.filter((conversation) => conversation.channelType === activeTab)
      );
    }
  }, [activeTab]);
  
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  return (
    <InboxLayout showSidebar={true}>
      <div className="flex flex-col h-full">
        {/* Barra de ferramentas do chat */}
        <div className="bg-background p-2 border-b flex items-center justify-between">
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">
                Todos
              </TabsTrigger>
              <TabsTrigger value="whatsapp">
                <WhatsAppIcon className="w-4 h-4 mr-1" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="email">
                <MailIcon className="w-4 h-4 mr-1" />
                Email
              </TabsTrigger>
              <TabsTrigger value="instagram">
                <InstagramIcon className="w-4 h-4 mr-1" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="facebook">
                <FacebookIcon className="w-4 h-4 mr-1" />
                Facebook
              </TabsTrigger>
              <TabsTrigger value="telegram">
                <TelegramIcon className="w-4 h-4 mr-1" />
                Telegram
              </TabsTrigger>
              <TabsTrigger value="widget">
                <WidgetIcon className="w-4 h-4 mr-1" />
                Widget
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <FilterIcon className="w-4 h-4 mr-1" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Todas as mensagens</DropdownMenuItem>
                <DropdownMenuItem>Não lidas</DropdownMenuItem>
                <DropdownMenuItem>Lidas</DropdownMenuItem>
                <DropdownMenuItem>Atendidas</DropdownMenuItem>
                <DropdownMenuItem>Não atendidas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="sm">
              <SettingsIcon className="w-4 h-4 mr-1" />
              Configurações
            </Button>
          </div>
        </div>
        
        {/* Container principal do chat */}
        <div className="flex-1 overflow-hidden">
          {isConnected ? (
            <ChatInterface conversation={selectedConversation} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium mb-2">Conexão perdida</h3>
                  <p className="text-muted-foreground mb-4">
                    A conexão com o servidor de chat foi perdida. Tentando reconectar...
                  </p>
                  <Button>Reconectar manualmente</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </InboxLayout>
  );
};

export default InboxPage;