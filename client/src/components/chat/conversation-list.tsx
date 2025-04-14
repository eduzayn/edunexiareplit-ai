import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  WhatsAppIcon, 
  MailIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TelegramIcon, 
  WidgetIcon 
} from "@/components/ui/icons";

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  channelType: 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'telegram' | 'widget';
  isActive: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
}

const getChannelIcon = (channelType: Conversation['channelType']) => {
  switch (channelType) {
    case 'whatsapp':
      return <WhatsAppIcon className="w-4 h-4 text-green-500" />;
    case 'email':
      return <MailIcon className="w-4 h-4 text-blue-500" />;
    case 'instagram':
      return <InstagramIcon className="w-4 h-4 text-pink-500" />;
    case 'facebook':
      return <FacebookIcon className="w-4 h-4 text-blue-600" />;
    case 'telegram':
      return <TelegramIcon className="w-4 h-4 text-blue-400" />;
    case 'widget':
      return <WidgetIcon className="w-4 h-4 text-purple-500" />;
  }
};

// Função para formatar a data
const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Mensagem de hoje: exibir apenas hora
  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Mensagem de ontem
  if (date >= yesterday) {
    return "Ontem";
  }
  
  // Mensagem desta semana (até 7 dias atrás)
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  if (date >= sixDaysAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  
  // Mais antigo: exibir data
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
};

export const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  activeConversationId,
  onSelectConversation 
}) => {
  return (
    <div className="flex flex-col space-y-1 py-2">
      {conversations.map((conversation) => (
        <div 
          key={conversation.id}
          className={`flex items-center p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors ${
            activeConversationId === conversation.id ? 'bg-muted/80' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="relative mr-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.contactAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {conversation.contactName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 bg-background">
              {getChannelIcon(conversation.channelType)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{conversation.contactName}</span>
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(conversation.timestamp)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage}
              </p>
              {conversation.unreadCount > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-center p-4">
          <p className="text-muted-foreground">Nenhuma conversa ativa no momento</p>
          <p className="text-xs text-muted-foreground mt-1">
            As conversas aparecerão aqui quando seus alunos entrarem em contato
          </p>
        </div>
      )}
    </div>
  );
};