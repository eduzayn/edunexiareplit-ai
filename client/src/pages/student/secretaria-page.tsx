import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
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
  UploadIcon,
  LayersIcon,
  FileTextIcon,
  SearchIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { 
  Download as DownloadIcon, 
  User as UserIcon, 
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Definição das interfaces
interface RequestType {
  id: string;
  name: string;
  category: string;
  description: string;
  deadline: number; // em dias
  price: number | null;
  required_documents: string[];
}

interface UserRequest {
  id: number;
  requestTypeId: string;
  status: "pending" | "processing" | "completed" | "rejected";
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
  documents: UserDocument[];
  comments: string | null;
  requestTypeName: string;
}

interface UserDocument {
  id: number;
  name: string;
  url: string;
  uploadedAt: string;
}

// Esquemas de validação
const documentUploadSchema = z.object({
  files: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Pelo menos um arquivo deve ser enviado.",
  }),
});

const newRequestSchema = z.object({
  requestTypeId: z.string().min(1, "Selecione um tipo de solicitação"),
  comments: z.string().optional(),
});

export default function SecretariaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Simular tipos de solicitações disponíveis
  const requestTypes: RequestType[] = [
    {
      id: "transcript",
      name: "Histórico Escolar",
      category: "documentos",
      description: "Solicite seu histórico escolar completo com todas as disciplinas cursadas.",
      deadline: 5,
      price: 25.90,
      required_documents: ["Documento de identidade"],
    },
    {
      id: "certificate",
      name: "Certificado de Conclusão",
      category: "documentos",
      description: "Obtenha seu certificado de conclusão de curso.",
      deadline: 15,
      price: 49.90,
      required_documents: ["Documento de identidade", "Comprovante de quitação de débitos"],
    },
    {
      id: "enrollment",
      name: "Comprovante de Matrícula",
      category: "documentos",
      description: "Documento que comprova sua matrícula atual na instituição.",
      deadline: 2,
      price: null,
      required_documents: [],
    },
    {
      id: "course_change",
      name: "Transferência de Curso",
      category: "acadêmico",
      description: "Solicite transferência para outro curso dentro da instituição.",
      deadline: 30,
      price: 75.00,
      required_documents: ["Justificativa", "Histórico atual", "Formulário de transferência"],
    },
    {
      id: "review_request",
      name: "Revisão de Prova",
      category: "acadêmico",
      description: "Solicite a revisão de uma avaliação específica.",
      deadline: 10,
      price: null,
      required_documents: ["Comprovante da avaliação", "Justificativa detalhada"],
    },
    {
      id: "academic_calendar",
      name: "Calendário Acadêmico",
      category: "documentos",
      description: "Acesse o calendário acadêmico oficial do semestre atual.",
      deadline: 1,
      price: null,
      required_documents: [],
    },
    {
      id: "cancellation",
      name: "Cancelamento de Matrícula",
      category: "acadêmico",
      description: "Solicite o cancelamento da sua matrícula na instituição.",
      deadline: 20,
      price: 35.00,
      required_documents: ["Justificativa", "Formulário de cancelamento", "Comprovante de quitação de débitos"],
    },
  ];

  // Simular solicitações do usuário
  const mockUserRequests: UserRequest[] = [
    {
      id: 1,
      requestTypeId: "transcript",
      status: "completed",
      createdAt: "2023-03-10T10:30:00",
      updatedAt: "2023-03-12T14:20:00",
      completedAt: "2023-03-15T09:45:00",
      documents: [
        {
          id: 101,
          name: "RG.pdf",
          url: "#",
          uploadedAt: "2023-03-10T10:35:00",
        }
      ],
      comments: "Preciso do histórico para inscrição em pós-graduação.",
      requestTypeName: "Histórico Escolar",
    },
    {
      id: 2,
      requestTypeId: "review_request",
      status: "rejected",
      createdAt: "2023-04-05T16:20:00",
      updatedAt: "2023-04-07T11:10:00",
      completedAt: "2023-04-07T11:10:00",
      documents: [
        {
          id: 102,
          name: "Prova_Matemática.pdf",
          url: "#",
          uploadedAt: "2023-04-05T16:25:00",
        },
        {
          id: 103,
          name: "Justificativa.pdf",
          url: "#",
          uploadedAt: "2023-04-05T16:28:00",
        }
      ],
      comments: "Creio que houve erro na correção da questão 5.",
      requestTypeName: "Revisão de Prova",
    },
    {
      id: 3,
      requestTypeId: "enrollment",
      status: "pending",
      createdAt: "2023-05-20T09:15:00",
      updatedAt: null,
      completedAt: null,
      documents: [],
      comments: "Preciso do comprovante para estágio.",
      requestTypeName: "Comprovante de Matrícula",
    },
    {
      id: 4,
      requestTypeId: "certificate",
      status: "processing",
      createdAt: "2023-06-01T14:30:00",
      updatedAt: "2023-06-02T10:20:00",
      completedAt: null,
      documents: [
        {
          id: 104,
          name: "RG_Frente_Verso.pdf",
          url: "#",
          uploadedAt: "2023-06-01T14:40:00",
        },
        {
          id: 105,
          name: "Comprovante_Quitacao.pdf",
          url: "#",
          uploadedAt: "2023-06-01T14:45:00",
        }
      ],
      comments: null,
      requestTypeName: "Certificado de Conclusão",
    }
  ];

  // Form para upload de documentos
  const documentForm = useForm<z.infer<typeof documentUploadSchema>>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {},
  });

  // Form para nova solicitação
  const newRequestForm = useForm<z.infer<typeof newRequestSchema>>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      requestTypeId: "",
      comments: "",
    },
  });

  // Funções de gerenciamento
  const handleDocumentUpload = (data: z.infer<typeof documentUploadSchema>) => {
    // Simular upload
    toast({
      title: "Documentos enviados",
      description: `${data.files.length} arquivos enviados com sucesso.`,
    });
    documentForm.reset();
  };

  const handleNewRequest = (data: z.infer<typeof newRequestSchema>) => {
    // Simular criação de nova solicitação
    const requestType = requestTypes.find(type => type.id === data.requestTypeId);
    
    if (requestType) {
      toast({
        title: "Solicitação criada",
        description: `Sua solicitação de ${requestType.name} foi enviada com sucesso.`,
      });
      setIsDialogOpen(false);
      newRequestForm.reset();
    }
  };

  // Filtragem de solicitações
  const filteredRequests = mockUserRequests.filter(request => {
    // Filtro de busca
    const searchMatch = 
      request.requestTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.comments?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Filtro de status
    const statusMatch = filterStatus === "all" || request.status === filterStatus;
    
    return searchMatch && statusMatch;
  });

  // Determinar cor do badge de status
  const getStatusBadgeVariant = (status: UserRequest["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "processing":
        return "secondary";
      case "completed":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Formatar status para exibição
  const formatStatus = (status: UserRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "processing":
        return "Em Processamento";
      case "completed":
        return "Concluído";
      case "rejected":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sidebar items for student portal
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, href: "/student/courses" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Biblioteca", icon: <LayersIcon />, href: "/student/library" },
    { name: "Secretaria", icon: <FileTextIcon />, active: true, href: "/student/secretaria" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secretaria Acadêmica</h1>
              <p className="text-gray-600">Faça solicitações e acompanhe o status dos seus pedidos</p>
            </div>
            <Button className="mt-4 md:mt-0" onClick={() => setIsDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="requests" className="mb-6">
            <TabsList>
              <TabsTrigger value="requests">Minhas Solicitações</TabsTrigger>
              <TabsTrigger value="services">Serviços Disponíveis</TabsTrigger>
              <TabsTrigger value="info">Informações e Prazos</TabsTrigger>
            </TabsList>

            {/* Tab - Minhas Solicitações */}
            <TabsContent value="requests">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  placeholder="Buscar solicitações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-1/3"
                  icon={<SearchIcon className="h-4 w-4" />}
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-60">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Em Processamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileTextIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação encontrada</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== "all"
                      ? "Tente ajustar seus filtros de busca"
                      : "Você ainda não possui solicitações. Clique em 'Nova Solicitação' para começar."}
                  </p>
                  {(searchTerm || filterStatus !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                              <h3 className="font-medium text-gray-900">{request.requestTypeName}</h3>
                              <p className="text-sm text-gray-600">
                                Solicitado em: {formatDate(request.createdAt)}
                              </p>
                            </div>
                            <Badge 
                              variant={getStatusBadgeVariant(request.status)} 
                              className="mt-2 md:mt-0"
                            >
                              {formatStatus(request.status)}
                            </Badge>
                          </div>
                          {request.comments && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{request.comments}"
                            </p>
                          )}
                          {request.documents.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Documentos anexados:</p>
                              <div className="flex flex-wrap gap-2">
                                {request.documents.map((doc) => (
                                  <Badge key={doc.id} variant="outline" className="flex items-center">
                                    <FileTextIcon className="h-3 w-3 mr-1" />
                                    {doc.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row md:flex-col justify-end p-4 border-t md:border-t-0 md:border-l">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Ver detalhes
                          </Button>
                          {request.status === "completed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-2 md:ml-0 md:mt-2 text-sm flex items-center"
                            >
                              <DownloadIcon className="h-3 w-3 mr-1" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab - Serviços Disponíveis */}
            <TabsContent value="services">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requestTypes.map((type) => (
                  <Card key={type.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>{type.name}</CardTitle>
                      <CardDescription>
                        Categoria: {type.category.charAt(0).toUpperCase() + type.category.slice(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {type.description}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Prazo: {type.deadline} dias úteis</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <PaymentsIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Valor: {type.price ? `R$ ${type.price.toFixed(2)}` : "Gratuito"}</span>
                        </div>
                        {type.required_documents.length > 0 && (
                          <div className="text-sm">
                            <div className="flex items-start">
                              <FileTextIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                              <div>
                                <span>Documentos necessários:</span>
                                <ul className="list-disc ml-5 mt-1 text-xs text-gray-600">
                                  {type.required_documents.map((doc, index) => (
                                    <li key={index}>{doc}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          newRequestForm.setValue("requestTypeId", type.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        Solicitar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab - Informações e Prazos */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais sobre Solicitações</CardTitle>
                  <CardDescription>
                    Confira as regras e prazos para as solicitações acadêmicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Prazos de Atendimento</h3>
                    <p className="text-gray-700 mb-2">
                      Os prazos indicados para cada tipo de solicitação são estimados em dias úteis a partir da data de aprovação da solicitação.
                      Solicitações realizadas em finais de semana ou feriados começarão a ser processadas no próximo dia útil.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <h4 className="font-medium mb-2">Tempos médios de atendimento:</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex justify-between"><span>Comprovante de matrícula:</span> <span className="font-medium">1-2 dias úteis</span></li>
                        <li className="flex justify-between"><span>Histórico escolar:</span> <span className="font-medium">3-5 dias úteis</span></li>
                        <li className="flex justify-between"><span>Declarações simples:</span> <span className="font-medium">2-3 dias úteis</span></li>
                        <li className="flex justify-between"><span>Certificados e diplomas:</span> <span className="font-medium">15-30 dias úteis</span></li>
                        <li className="flex justify-between"><span>Revisão de provas:</span> <span className="font-medium">7-10 dias úteis</span></li>
                        <li className="flex justify-between"><span>Transferências internas:</span> <span className="font-medium">15-20 dias úteis</span></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Documentos Necessários</h3>
                    <p className="text-gray-700 mb-2">
                      Para cada tipo de solicitação, é necessário anexar documentos específicos. 
                      Os documentos devem ser anexados em formato PDF, JPG ou PNG e devem estar legíveis.
                      Documentos incompletos ou ilegíveis resultarão em atraso ou rejeição da solicitação.
                    </p>
                    <div className="flex items-center bg-amber-50 p-3 rounded-md text-amber-800 text-sm">
                      <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p>O prazo só começa a contar após o envio de todos os documentos necessários.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Taxas e Pagamentos</h3>
                    <p className="text-gray-700 mb-2">
                      Algumas solicitações podem exigir o pagamento de taxas administrativas. O processamento só 
                      será iniciado após a confirmação do pagamento. As taxas podem ser pagas através do Portal Financeiro.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md mt-2">
                      <h4 className="font-medium mb-2">Situações de isenção de taxas:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Primeira via de comprovante de matrícula</li>
                        <li>Primeira via de histórico escolar (por semestre)</li>
                        <li>Alunos participantes de programas sociais (mediante comprovação)</li>
                        <li>Erros administrativos identificados pela secretaria</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Status das Solicitações</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Badge variant="default" className="mt-1 flex-shrink-0">Pendente</Badge>
                        <p className="text-sm text-gray-700 ml-3">
                          Sua solicitação foi registrada mas ainda não foi analisada pela secretaria 
                          ou está aguardando documentos/pagamento.
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Badge variant="secondary" className="mt-1 flex-shrink-0">Em Processamento</Badge>
                        <p className="text-sm text-gray-700 ml-3">
                          Sua solicitação está sendo analisada e processada pela equipe responsável.
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Badge variant="default" className="mt-1 flex-shrink-0">Concluído</Badge>
                        <p className="text-sm text-gray-700 ml-3">
                          Sua solicitação foi concluída e o documento/serviço solicitado está disponível.
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Badge variant="destructive" className="mt-1 flex-shrink-0">Rejeitado</Badge>
                        <p className="text-sm text-gray-700 ml-3">
                          Sua solicitação não pôde ser atendida. Verifique os comentários para mais informações.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Contato da Secretaria</h3>
                    <p className="text-gray-700 mb-4">
                      Para dúvidas específicas que não estejam contempladas nas informações acima, entre em contato:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Atendimento presencial: Segunda a sexta, 8h às 17h</span>
                      </div>
                      <div className="flex items-center">
                        <UploadIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>E-mail: secretaria@edunexia.edu.br</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Detalhes da Solicitação */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
              <DialogDescription>
                {selectedRequest.requestTypeName} - Protocolo #{selectedRequest.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                  {formatStatus(selectedRequest.status)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Data da solicitação:</span>
                  <span className="text-sm">{formatDate(selectedRequest.createdAt)}</span>
                </div>
                
                {selectedRequest.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Última atualização:</span>
                    <span className="text-sm">{formatDate(selectedRequest.updatedAt)}</span>
                  </div>
                )}
                
                {selectedRequest.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Data de conclusão:</span>
                    <span className="text-sm">{formatDate(selectedRequest.completedAt)}</span>
                  </div>
                )}
              </div>
              
              {selectedRequest.comments && (
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">Observações:</span>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRequest.comments}</p>
                </div>
              )}
              
              {selectedRequest.documents.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-500">Documentos anexados:</span>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex justify-between items-center bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <FileTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(selectedRequest.status === "pending" || selectedRequest.status === "processing") && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-500">Adicionar documentos:</span>
                  <Form {...documentForm}>
                    <form onSubmit={documentForm.handleSubmit(handleDocumentUpload)} className="space-y-3">
                      <FormField
                        control={documentForm.control}
                        name="files"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                id="document-upload"
                                type="file"
                                multiple
                                onChange={(e) => onChange(e.target.files)}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">Enviar Documentos</Button>
                    </form>
                  </Form>
                </div>
              )}
              
              {selectedRequest.status === "rejected" && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-md text-red-700 text-sm">
                  <div className="flex items-start">
                    <XCircleIcon className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Solicitação rejeitada</p>
                      <p>
                        Esta solicitação foi rejeitada. Para mais informações, entre em contato com a secretaria 
                        ou abra uma nova solicitação.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedRequest.status === "completed" && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-md text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Solicitação concluída</p>
                      <p>
                        Sua solicitação foi processada com sucesso. Você pode baixar o documento 
                        solicitado através do botão de download.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              {selectedRequest.status === "completed" && (
                <Button className="w-full sm:w-auto">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Baixar Documento
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setSelectedRequest(null)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Nova Solicitação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
            <DialogDescription>
              Preencha o formulário para criar uma nova solicitação
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newRequestForm}>
            <form onSubmit={newRequestForm.handleSubmit(handleNewRequest)} className="space-y-4 py-2">
              <FormField
                control={newRequestForm.control}
                name="requestTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Solicitação</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo de solicitação" />
                        </SelectTrigger>
                        <SelectContent>
                          {requestTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} {type.price ? `(R$ ${type.price.toFixed(2)})` : "(Gratuito)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {newRequestForm.watch("requestTypeId") && (
                <div className="bg-gray-50 p-3 rounded-md text-sm space-y-2">
                  {(() => {
                    const selectedType = requestTypes.find(
                      (type) => type.id === newRequestForm.watch("requestTypeId")
                    );
                    return selectedType ? (
                      <>
                        <p><span className="font-medium">Descrição:</span> {selectedType.description}</p>
                        <p><span className="font-medium">Prazo estimado:</span> {selectedType.deadline} dias úteis</p>
                        <p>
                          <span className="font-medium">Valor:</span> {selectedType.price 
                            ? `R$ ${selectedType.price.toFixed(2)}` 
                            : "Gratuito"}
                        </p>
                        {selectedType.required_documents.length > 0 && (
                          <div>
                            <p className="font-medium">Documentos necessários:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {selectedType.required_documents.map((doc, i) => (
                                <li key={i}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : null;
                  })()}
                </div>
              )}
              
              <FormField
                control={newRequestForm.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione informações relevantes para o processamento da sua solicitação"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Limite de 500 caracteres.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    newRequestForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Enviar Solicitação</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}