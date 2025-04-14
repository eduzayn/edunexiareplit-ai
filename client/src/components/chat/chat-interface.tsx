import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  PaperclipIcon, 
  SendIcon, 
  SmileIcon, 
  ImageIcon,
  FileIcon,
  DocumentIcon,
  DotsVerticalIcon
} from "@/components/ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation } from "./conversation-list";

export interface Message {
  id: string;
  text: string;
  attachment?: {
    type: 'image' | 'document' | 'file';
    url: string;
    name?: string;
  };
  sender: 'user' | 'contact';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

interface ChatInterfaceProps {
  conversation: Conversation | null;
}

// Formata a hora da mensagem no formato HH:MM
const formatMessageTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversation }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Efeito para simular o carregamento de mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (conversation) {
      // Aqui seria feita uma chamada à API para obter as mensagens da conversa
      // Estamos simulando com mensagens fictícias para demonstração
      const mockMessages: Message[] = [
        {
          id: '1',
          text: 'Olá, gostaria de saber mais sobre o curso de pós-graduação',
          sender: 'contact',
          timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 minutos atrás
        },
        {
          id: '2',
          text: 'Claro! Em qual área você tem interesse?',
          sender: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 35), // 35 minutos atrás
          status: 'read'
        },
        {
          id: '3',
          text: 'Estou interessado na área de gestão de projetos',
          sender: 'contact',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        },
        {
          id: '4',
          text: 'Temos o MBA em Gestão de Projetos com duração de 12 meses. Posso enviar a grade curricular para você avaliar.',
          sender: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutos atrás
          status: 'read'
        },
        {
          id: '5',
          text: 'Seria ótimo! Qual o valor do investimento e formas de pagamento?',
          sender: 'contact',
          timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutos atrás
        },
        {
          id: '6',
          attachment: {
            type: 'document',
            url: '#',
            name: 'Grade_Curricular_MBA_Gestao_Projetos.pdf'
          },
          text: 'Aqui está a grade curricular. O investimento é de R$ 12.000,00 que pode ser parcelado em até 12x sem juros ou com 10% de desconto para pagamento à vista.',
          sender: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
          status: 'read'
        }
      ];
      
      setMessages(mockMessages);
    } else {
      setMessages([]);
    }
  }, [conversation]);
  
  // Efeito para rolar para o final da conversa quando novas mensagens são adicionadas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (newMessage.trim() && conversation) {
      const newMsg: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent'
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage("");
      
      // Simular resposta após alguns segundos (para demonstração)
      setTimeout(() => {
        const replyMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: "Obrigado pelas informações. Quando começa a próxima turma?",
          sender: 'contact',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, replyMsg]);
      }, 3000);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-muted/10">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
          <p className="text-muted-foreground text-sm">
            Escolha uma conversa da lista para visualizar e responder às mensagens de seus alunos.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho do chat */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/10">
        <div className="flex items-center">
          <div className="relative mr-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.contactAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {conversation.contactName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <h3 className="font-medium leading-none">{conversation.contactName}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {conversation.isActive ? (
                <span className="text-green-500">Online</span>
              ) : (
                "Último acesso há 2 horas"
              )}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver informações do contato</DropdownMenuItem>
            <DropdownMenuItem>Ver anexos</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">Arquivar conversa</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Corpo do chat com as mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50'
              }`}
            >
              {/* Renderiza o anexo, se houver */}
              {message.attachment && (
                <div className="mb-2">
                  {message.attachment.type === 'image' ? (
                    <img 
                      src={message.attachment.url} 
                      alt="Anexo" 
                      className="max-w-full rounded" 
                    />
                  ) : (
                    <div className="flex items-center p-2 bg-background/30 rounded">
                      <FileIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm truncate">
                        {message.attachment.name || 'Arquivo anexado'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Texto da mensagem */}
              <div className="whitespace-pre-wrap">{message.text}</div>
              
              {/* Horário e status */}
              <div className={`text-xs mt-1 flex justify-end ${
                message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {formatMessageTime(message.timestamp)}
                {message.status && message.sender === 'user' && (
                  <span className="ml-1">
                    {message.status === 'read' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Área de entrada de mensagem */}
      <div className="p-3 border-t">
        <div className="flex items-end gap-2">
          <div className="flex-none">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <PaperclipIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-grow">
            <Textarea
              placeholder="Digite sua mensagem..."
              className="min-h-[64px] resize-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className="flex-none flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <SmileIcon className="h-5 w-5" />
            </Button>
            <Button 
              variant="primary" 
              size="icon" 
              className="rounded-full h-9 w-9"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <SendIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};