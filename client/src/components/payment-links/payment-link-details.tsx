import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EdunexaPaymentLink } from '@shared/types';
import { formatCurrency } from '@/lib/utils';
import { Copy, ExternalLink, Image, Edit, AlertTriangle } from 'lucide-react';
import { ImageUploadForm } from './image-upload-form';

interface PaymentLinkDetailsProps {
  paymentLink: EdunexaPaymentLink;
  onEditRequest?: (link: EdunexaPaymentLink) => void;
}

export function PaymentLinkDetails({ paymentLink, onEditRequest }: PaymentLinkDetailsProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Função para copiar URL para a área de transferência
  const copyToClipboard = () => {
    if (paymentLink.asaasPaymentLinkUrl) {
      navigator.clipboard.writeText(paymentLink.asaasPaymentLinkUrl);
      toast({
        title: 'URL copiada',
        description: 'Link de pagamento copiado para a área de transferência',
      });
    }
  };
  
  // Status do link em português
  const getStatusBadge = () => {
    switch (paymentLink.internalStatus) {
      case 'Active':
        return <Badge variant="success">Ativo</Badge>;
      case 'Error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'ImageError':
        return <Badge variant="warning">Sem Imagem</Badge>;
      default:
        return <Badge variant="outline">{paymentLink.internalStatus}</Badge>;
    }
  };
  
  // Função de callback para o sucesso do upload de imagem
  const handleImageUploadSuccess = () => {
    setImageDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: [`/api/payment-links/course/${paymentLink.courseId}`] });
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{paymentLink.linkName}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              ID: {paymentLink.asaasPaymentLinkId}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Badge variant="outline">R$ {formatCurrency(paymentLink.amount)}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            {/* Detalhes do link de pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm">Descrição</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentLink.description || 'Sem descrição'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">Criado em</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(paymentLink.creationTimestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            {/* URL do link */}
            <div className="mt-4">
              <h4 className="font-medium text-sm">URL do link</h4>
              <div className="flex items-center mt-1">
                <div className="bg-muted p-2 rounded-l-md text-xs text-muted-foreground truncate flex-1">
                  {paymentLink.asaasPaymentLinkUrl}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 rounded-l-none"
                  onClick={copyToClipboard}
                >
                  <Copy size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 ml-2"
                  onClick={() => window.open(paymentLink.asaasPaymentLinkUrl, '_blank')}
                >
                  <ExternalLink size={14} className="mr-1" />
                  Abrir
                </Button>
              </div>
            </div>
            
            {/* Avisos ou informações adicionais */}
            {paymentLink.internalStatus === 'ImageError' && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 flex items-start space-x-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-700">
                  Este link de pagamento não possui uma imagem personalizada. 
                  Recomendamos adicionar uma imagem para melhorar a experiência do cliente.
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview">
            {/* Previsualização do link */}
            <div className="flex justify-center">
              <div className="border border-border rounded-md overflow-hidden max-w-md w-full">
                {/* Imagem do link (se houver, senão mostra placeholder) */}
                <div className="aspect-video bg-muted relative">
                  {paymentLink.internalStatus === 'Active' ? (
                    <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center text-muted-foreground">
                      Imagem vinculada no Asaas
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>
                
                {/* Detalhes do link em formato preview */}
                <div className="p-4">
                  <h3 className="font-medium">{paymentLink.linkName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentLink.description || 'Sem descrição'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <span className="font-bold">R$ {formatCurrency(paymentLink.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Image size={14} className="mr-2" />
                {paymentLink.internalStatus === 'Active' ? 'Trocar Imagem' : 'Adicionar Imagem'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Upload de Imagem</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <ImageUploadForm 
                  paymentLinkId={paymentLink.internalId} 
                  paymentLinkName={paymentLink.linkName}
                  onSuccess={handleImageUploadSuccess}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditRequest && onEditRequest(paymentLink)}
        >
          <Edit size={14} className="mr-2" />
          Editar Link
        </Button>
      </CardFooter>
    </Card>
  );
}