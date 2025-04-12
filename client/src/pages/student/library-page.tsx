import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { getStudentSidebarItems } from "@/components/layout/student-sidebar-items";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartIcon,
  SchoolIcon,
  MenuBookIcon,
  EventNoteIcon,
  DescriptionIcon,
  PaymentsIcon,
  HelpOutlineIcon,
  SearchIcon,
  BookmarkIcon,
  FilterIcon,
  SortIcon,
  PictureAsPdfIcon,
  BookIcon,
  LayersIcon,
  CloudIcon,
  FileTextIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interface para materiais da biblioteca
interface LibraryItem {
  id: number;
  title: string;
  author: string;
  category: string;
  type: "ebook" | "article" | "thesis" | "textbook" | "paper";
  coverImage?: string;
  downloadUrl?: string;
  publishedAt: string;
  publisher: string;
  description: string;
  tags: string[];
  isBorrowed?: boolean;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [myBookmarks, setMyBookmarks] = useState<number[]>([]);
  const [myBorrowings, setMyBorrowings] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");

  // Simular itens da biblioteca
  const mockLibraryItems: LibraryItem[] = [
    {
      id: 1,
      title: "Fundamentos de Programação em Python",
      author: "Ana Silva",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Python",
      downloadUrl: "#",
      publishedAt: "2023-05-15",
      publisher: "EdunexIA Press",
      description: "Um guia completo para iniciantes em programação Python, abordando conceitos fundamentais e práticas modernas.",
      tags: ["python", "programação", "tecnologia"]
    },
    {
      id: 2,
      title: "Gestão Estratégica de Projetos",
      author: "Carlos Mendes",
      category: "Administração",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Gestão",
      downloadUrl: "#",
      publishedAt: "2022-10-20",
      publisher: "Business Academy",
      description: "Material didático sobre metodologias modernas de gestão de projetos e planejamento estratégico.",
      tags: ["gestão", "projetos", "estratégia", "administração"]
    },
    {
      id: 3,
      title: "A Evolução da Inteligência Artificial",
      author: "Roberto Almeida",
      category: "Tecnologia",
      type: "article",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=IA",
      downloadUrl: "#",
      publishedAt: "2023-02-10",
      publisher: "Revista TechWorld",
      description: "Artigo científico que analisa o desenvolvimento da IA nos últimos anos e suas aplicações práticas.",
      tags: ["inteligência artificial", "tecnologia", "inovação"]
    },
    {
      id: 4,
      title: "Análise de Dados com Python e Pandas",
      author: "Juliana Costa",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Pandas",
      downloadUrl: "#",
      publishedAt: "2023-01-05",
      publisher: "EdunexIA Press",
      description: "E-book prático sobre análise de dados utilizando a biblioteca Pandas do Python e técnicas de visualização.",
      tags: ["python", "pandas", "análise de dados", "data science"]
    },
    {
      id: 5,
      title: "Marketing Digital para Pequenas Empresas",
      author: "Fernanda Lima",
      category: "Marketing",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Marketing",
      downloadUrl: "#",
      publishedAt: "2022-09-18",
      publisher: "Business Academy",
      description: "Guia completo de estratégias de marketing digital focadas em pequenos negócios.",
      tags: ["marketing", "digital", "negócios", "redes sociais"]
    },
    {
      id: 6,
      title: "Impactos da Indústria 4.0 no Mercado de Trabalho",
      author: "Ricardo Oliveira",
      category: "Economia",
      type: "thesis",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Indústria+4.0",
      downloadUrl: "#",
      publishedAt: "2023-03-22",
      publisher: "Universidade Federal",
      description: "Tese de doutorado analisando as transformações no mercado de trabalho decorrentes da quarta revolução industrial.",
      tags: ["indústria 4.0", "mercado de trabalho", "automação", "economia"]
    },
    {
      id: 7,
      title: "React.js na Prática: Desenvolvimento de Aplicações Web",
      author: "Marcos Paulo",
      category: "Tecnologia",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=React.js",
      downloadUrl: "#",
      publishedAt: "2023-04-10",
      publisher: "EdunexIA Press",
      description: "Manual prático para desenvolvimento de aplicações modernas com React.js e seu ecossistema.",
      tags: ["react", "javascript", "frontend", "desenvolvimento web"]
    },
    {
      id: 8,
      title: "Sustentabilidade nas Organizações",
      author: "Luísa Cardoso",
      category: "Meio Ambiente",
      type: "paper",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Sustentabilidade",
      downloadUrl: "#",
      publishedAt: "2022-12-05",
      publisher: "Revista EcoEmpresa",
      description: "Artigo sobre práticas sustentáveis aplicadas ao ambiente corporativo e seus benefícios.",
      tags: ["sustentabilidade", "ESG", "meio ambiente", "gestão"]
    },
    {
      id: 9,
      title: "Psicologia Positiva na Educação",
      author: "Daniela Martins",
      category: "Psicologia",
      type: "textbook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Psicologia",
      downloadUrl: "#",
      publishedAt: "2023-02-18",
      publisher: "EdunexIA Press",
      description: "Manual sobre aplicação de técnicas da psicologia positiva no contexto educacional.",
      tags: ["psicologia", "educação", "bem-estar", "desenvolvimento humano"]
    },
    {
      id: 10,
      title: "Blockchain e Criptomoedas: Fundamentos e Aplicações",
      author: "Henrique Silva",
      category: "Finanças",
      type: "ebook",
      coverImage: "https://placehold.co/600x800/e2e8f0/475569?text=Blockchain",
      downloadUrl: "#",
      publishedAt: "2023-01-30",
      publisher: "FinTech Books",
      description: "Introdução às tecnologias blockchain e ao universo das criptomoedas, abordando aspectos técnicos e financeiros.",
      tags: ["blockchain", "criptomoedas", "finanças", "tecnologia"]
    }
  ];

  // Usar o componente padronizado para os itens da barra lateral
  const [location] = useLocation();
  const sidebarItems = getStudentSidebarItems(location);

  // Filtrar e ordenar itens da biblioteca
  const filteredItems = mockLibraryItems
    .filter(item => {
      // Aplicar filtro de busca
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.author.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Aplicar filtro de categoria
      if (filterCategory !== "all" && item.category !== filterCategory) {
        return false;
      }
      
      // Aplicar filtro de tipo
      if (filterType !== "all" && item.type !== filterType) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Aplicar ordenação
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "author":
          return a.author.localeCompare(b.author);
        case "recent":
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // Extrair categorias únicas para o filtro
  const uniqueCategories = Array.from(new Set(mockLibraryItems.map(item => item.category)));
  
  // Função para alternar item nos favoritos
  const toggleBookmark = (id: number) => {
    if (myBookmarks.includes(id)) {
      setMyBookmarks(myBookmarks.filter(bookmark => bookmark !== id));
    } else {
      setMyBookmarks([...myBookmarks, id]);
    }
  };
  
  // Função para alternar empréstimo do item
  const toggleBorrowing = (id: number) => {
    if (myBorrowings.includes(id)) {
      setMyBorrowings(myBorrowings.filter(borrowing => borrowing !== id));
    } else {
      setMyBorrowings([...myBorrowings, id]);
    }
  };

  // Função para navegar para a tab "all"
  const navigateToAllTab = () => {
    setSelectedTab("all");
  };

  // Renderizar detalhes do item selecionado
  const renderItemDetails = () => {
    if (!selectedItem) return null;
    
    return (
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{selectedItem.title}</DialogTitle>
          <DialogDescription>
            Por {selectedItem.author} • {selectedItem.publisher}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="md:col-span-1">
            <div className="overflow-hidden rounded-md">
              <img 
                src={selectedItem.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
                alt={selectedItem.title}
                className="w-full object-cover aspect-[3/4]"
              />
            </div>
            <div className="mt-4 space-y-2">
              <Badge variant="outline" className="mr-1">{selectedItem.category}</Badge>
              <Badge variant="outline" className="mr-1">{
                selectedItem.type === "ebook" ? "E-book" :
                selectedItem.type === "article" ? "Artigo" :
                selectedItem.type === "thesis" ? "Tese" :
                selectedItem.type === "textbook" ? "Livro Didático" :
                selectedItem.type === "paper" ? "Artigo Científico" : 
                "Outro"
              }</Badge>
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleBookmark(selectedItem.id)}
                >
                  <BookmarkIcon className={`h-4 w-4 mr-2 ${myBookmarks.includes(selectedItem.id) ? 'text-yellow-500' : ''}`} />
                  {myBookmarks.includes(selectedItem.id) ? 'Favorito' : 'Favoritar'}
                </Button>
                <Button 
                  variant={myBorrowings.includes(selectedItem.id) ? "destructive" : "default"} 
                  size="sm"
                  onClick={() => toggleBorrowing(selectedItem.id)}
                >
                  {myBorrowings.includes(selectedItem.id) ? 'Devolver' : 'Emprestar'}
                </Button>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Descrição</h3>
              <p className="text-gray-700">{selectedItem.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Informações</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Autor</p>
                  <p className="text-gray-900">{selectedItem.author}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Editora</p>
                  <p className="text-gray-900">{selectedItem.publisher}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de publicação</p>
                  <p className="text-gray-900">{new Date(selectedItem.publishedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="text-gray-900">{selectedItem.category}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {selectedItem.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="mr-1">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedItem(null)}>Fechar</Button>
          <Button>
            <UploadIcon className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  // Renderizar item da biblioteca na visualização em grid
  const renderGridItem = (item: LibraryItem) => {
    return (
      <Card key={item.id} className="overflow-hidden">
        <div className="relative">
          <img 
            src={item.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
            alt={item.title}
            className="w-full h-48 object-cover"
          />
          <button 
            className="absolute top-2 right-2 bg-white p-1 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(item.id);
            }}
          >
            <BookmarkIcon className={`h-5 w-5 ${myBookmarks.includes(item.id) ? 'text-yellow-500' : 'text-gray-400'}`} />
          </button>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-gray-600 mb-1">{item.author}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {item.type === "ebook" && "E-book"}
              {item.type === "article" && "Artigo"}
              {item.type === "thesis" && "Tese"}
              {item.type === "textbook" && "Livro Didático"}
              {item.type === "paper" && "Artigo Científico"}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <Button variant="ghost" size="sm" className="px-0" onClick={() => setSelectedItem(item)}>
            Ver detalhes
          </Button>
          <Badge 
            variant={myBorrowings.includes(item.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleBorrowing(item.id)}
          >
            {myBorrowings.includes(item.id) ? "Emprestado" : "Disponível"}
          </Badge>
        </CardFooter>
      </Card>
    );
  };

  // Renderizar item da biblioteca na visualização em lista
  const renderListItem = (item: LibraryItem) => {
    return (
      <Card key={item.id} className="overflow-hidden">
        <div className="flex">
          <div className="w-24 h-24 overflow-hidden flex-shrink-0">
            <img 
              src={item.coverImage || "https://placehold.co/600x800/e2e8f0/475569?text=Sem+Imagem"} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.author}</p>
              </div>
              <button onClick={() => toggleBookmark(item.id)}>
                <BookmarkIcon className={`h-5 w-5 ${myBookmarks.includes(item.id) ? 'text-yellow-500' : 'text-gray-400'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.type === "ebook" && "E-book"}
                  {item.type === "article" && "Artigo"}
                  {item.type === "thesis" && "Tese"}
                  {item.type === "textbook" && "Livro Didático"}
                  {item.type === "paper" && "Artigo Científico"}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center p-4 border-l">
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => setSelectedItem(item)}>
              Ver detalhes
            </Button>
            <Button 
              variant={myBorrowings.includes(item.id) ? "destructive" : "default"} 
              size="sm"
              onClick={() => toggleBorrowing(item.id)}
            >
              {myBorrowings.includes(item.id) ? 'Devolver' : 'Emprestar'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        user={user}
        portalType="student"
        portalColor="#12B76A"
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-20 md:py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Biblioteca Digital</h1>
            <p className="text-gray-600">Acesse e-books, artigos, teses e outros materiais digitais</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="mb-6" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="borrowed">Meus Empréstimos</TabsTrigger>
              <TabsTrigger value="bookmarked">Favoritos</TabsTrigger>
              <TabsTrigger value="recent">Adicionados Recentemente</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  placeholder="Buscar por título, autor ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-1/3"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
                <div className="flex gap-4 flex-1">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full md:w-40">
                      <div className="flex items-center">
                        <FilterIcon className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-40">
                      <div className="flex items-center">
                        <FilterIcon className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Tipo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="ebook">E-books</SelectItem>
                      <SelectItem value="article">Artigos</SelectItem>
                      <SelectItem value="thesis">Teses</SelectItem>
                      <SelectItem value="textbook">Livros Didáticos</SelectItem>
                      <SelectItem value="paper">Artigos Científicos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-40">
                      <div className="flex items-center">
                        <SortIcon className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Ordenar por" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Título (A-Z)</SelectItem>
                      <SelectItem value="author">Autor (A-Z)</SelectItem>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="category">Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={viewType === "grid" ? "default" : "outline"} 
                    size="icon"
                    onClick={() => setViewType("grid")}
                    className="w-10 h-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </Button>
                  <Button 
                    variant={viewType === "list" ? "default" : "outline"} 
                    size="icon"
                    onClick={() => setViewType("list")}
                    className="w-10 h-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Library Items Grid/List */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <LayersIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum item encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterCategory !== "all" || filterType !== "all"
                      ? "Tente ajustar seus filtros de busca"
                      : "Não há itens disponíveis na biblioteca"}
                  </p>
                  {(searchTerm || filterCategory !== "all" || filterType !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCategory("all");
                        setFilterType("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className={viewType === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {viewType === "grid"
                    ? filteredItems.map(item => renderGridItem(item))
                    : filteredItems.map(item => renderListItem(item))
                  }
                </div>
              )}
            </TabsContent>

            <TabsContent value="borrowed">
              {myBorrowings.length === 0 ? (
                <div className="text-center py-12">
                  <BookIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum empréstimo ativo</h3>
                  <p className="text-gray-600 mb-4">
                    Você não possui nenhum material emprestado no momento.
                  </p>
                  <Button onClick={() => navigateToAllTab()}>
                    Explorar biblioteca
                  </Button>
                </div>
              ) : (
                <div className={viewType === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {viewType === "grid"
                    ? mockLibraryItems.filter(item => myBorrowings.includes(item.id)).map(item => renderGridItem(item))
                    : mockLibraryItems.filter(item => myBorrowings.includes(item.id)).map(item => renderListItem(item))
                  }
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookmarked">
              {myBookmarks.length === 0 ? (
                <div className="text-center py-12">
                  <BookmarkIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum favorito</h3>
                  <p className="text-gray-600 mb-4">
                    Você ainda não adicionou itens aos seus favoritos.
                  </p>
                  <Button onClick={() => navigateToAllTab()}>
                    Explorar biblioteca
                  </Button>
                </div>
              ) : (
                <div className={viewType === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                  : "space-y-4"
                }>
                  {viewType === "grid"
                    ? mockLibraryItems.filter(item => myBookmarks.includes(item.id)).map(item => renderGridItem(item))
                    : mockLibraryItems.filter(item => myBookmarks.includes(item.id)).map(item => renderListItem(item))
                  }
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              <div className={viewType === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
                : "space-y-4"
              }>
                {viewType === "grid"
                  ? mockLibraryItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 8).map(item => renderGridItem(item))
                  : mockLibraryItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 8).map(item => renderListItem(item))
                }
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}>
        {renderItemDetails()}
      </Dialog>
    </div>
  );
}