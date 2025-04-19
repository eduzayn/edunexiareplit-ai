/**
 * Componente para listar links de pagamento com ações
 */
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Copy, 
  Trash, 
  ExternalLink, 
  Eye, 
  Image as ImageIcon, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';

// Interface para as props do componente
interface PaymentLinksListProps {
  links: any[];
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

/**
 * Componente que exibe a lista de links de pagamento
 */
export function PaymentLinksList({ links, onDelete, isDeleting = false }: PaymentLinksListProps) {
  // Função para copiar o link para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  // Função para abrir o link em uma nova aba
  const openLinkInNewTab = (url: string) => {
    window.open(url, '_blank');
  };
  
  // Função para formatar o valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Função para formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Função para obter o status com ícone
  const renderStatus = (link: any) => {
    if (!link.status) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Desconhecido
        </Badge>
      );
    }
    
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      'ACTIVE': { 
        label: 'Ativo', 
        variant: 'default',
        icon: <Check className="h-3 w-3" />
      },
      'INACTIVE': { 
        label: 'Inativo', 
        variant: 'secondary',
        icon: <AlertCircle className="h-3 w-3" />
      },
      'EXPIRED': { 
        label: 'Expirado', 
        variant: 'destructive',
        icon: <AlertCircle className="h-3 w-3" />
      },
      'PENDING': { 
        label: 'Pendente', 
        variant: 'outline',
        icon: <Loader2 className="h-3 w-3 animate-spin" />
      },
    };
    
    const statusInfo = statusMap[link.status] || {
      label: link.status,
      variant: 'outline',
      icon: <AlertCircle className="h-3 w-3" />
    };
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };
  
  // Se não houver links, exibir mensagem
  if (links.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Nenhum link de pagamento cadastrado.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Renderização da tabela
  return (
    <TooltipProvider>
      <Table>
        <TableCaption>Lista de links de pagamento disponíveis</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Imagem</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.name}</TableCell>
              <TableCell>{formatCurrency(link.value || link.amount || 0)}</TableCell>
              <TableCell>{renderStatus(link)}</TableCell>
              <TableCell>{formatDate(link.createdAt || link.dateCreated)}</TableCell>
              <TableCell>
                {link.imageUrl ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.open(link.imageUrl, '_blank')}
                      >
                        <ImageIcon className="h-4 w-4 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver imagem do link</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Badge variant="outline">Sem imagem</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(link.url || link.externalUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copiar link</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => openLinkInNewTab(link.url || link.externalUrl)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Abrir link</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(link.id)}
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Excluir link</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}