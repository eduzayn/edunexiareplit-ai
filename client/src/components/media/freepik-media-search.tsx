import React, { useState } from 'react';
import { Search, Image, FileVideo, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export interface MediaItem {
  id: number;
  type: 'vector' | 'photo' | 'psd' | 'video';
  title: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  is_premium: boolean;
}

export interface FreepikMediaSearchProps {
  onMediaSelect: (media: any) => void;
  maxHeight?: string;
}

const FreepikMediaSearch: React.FC<FreepikMediaSearchProps> = ({ 
  onMediaSelect,
  maxHeight = '400px' 
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('photos');
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({});

  // Buscar mídia quando o usuário envia a pesquisa
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: 'Pesquisa vazia',
        description: 'Digite algo para pesquisar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Configurar o tipo de mídia com base na aba ativa
      let mediaType = 'all';
      switch (activeTab) {
        case 'photos':
          mediaType = 'photos';
          break;
        case 'vectors':
          mediaType = 'vectors';
          break;
        case 'videos':
          mediaType = 'videos';
          break;
      }

      const response = await fetch('/api/media-generation/search-stock-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          mediaType,
          limit: 20,
          sort: 'popular'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar mídia do Freepik');
      }

      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao buscar mídia. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Selecionar um item de mídia
  const handleSelectMedia = async (media: MediaItem) => {
    setSelectedMedia(media);
    setSelectedIds(prev => ({ ...prev, [media.id]: true }));

    try {
      const response = await fetch('/api/media-generation/select-stock-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaUrl: media.preview_url,
          mediaType: media.type,
          title: media.title
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao selecionar mídia');
      }

      const result = await response.json();
      onMediaSelect(result.media);
      
      toast({
        title: 'Mídia selecionada',
        description: 'A mídia foi selecionada com sucesso e será incluída no e-book.',
      });
    } catch (error) {
      console.error('Erro ao selecionar mídia:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao selecionar a mídia. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Função auxiliar para renderizar os resultados
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative aspect-video rounded-md overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-gray-500">
            {searchQuery 
              ? 'Nenhum resultado encontrado. Tente outra pesquisa.' 
              : 'Faça uma pesquisa para encontrar mídia.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {searchResults.map((media) => (
          <div 
            key={media.id} 
            className={`relative group rounded-md overflow-hidden cursor-pointer border ${
              selectedIds[media.id] ? 'border-primary' : 'border-border'
            }`}
            onClick={() => handleSelectMedia(media)}
          >
            {/* Preview da mídia */}
            {media.type === 'video' ? (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <FileVideo className="h-8 w-8 text-muted-foreground" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
              </div>
            ) : (
              <img 
                src={media.preview_url} 
                alt={media.title} 
                className="w-full h-auto aspect-video object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/png?text=Imagem+não+disponível';
                }}
              />
            )}
            
            {/* Overlay para seleção */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button size="sm" variant="outline" className="bg-white">
                {selectedIds[media.id] ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Selecionado
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Selecionar
                  </>
                )}
              </Button>
            </div>
            
            {/* Ícone visual do tipo de mídia */}
            <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded text-xs">
              {media.type === 'video' ? (
                <FileVideo className="h-3 w-3" />
              ) : (
                <Image className="h-3 w-3" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Buscar no Freepik</h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="vectors">Vetores</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 mb-4">
            <Input
              type="text"
              placeholder="Buscar no Freepik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <ScrollArea className={`w-full rounded-md border`} style={{ maxHeight }}>
            <div className="p-4">
              {renderResults()}
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default FreepikMediaSearch;