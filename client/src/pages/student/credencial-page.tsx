import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
  LayersIcon,
  FileTextIcon,
} from "@/components/ui/icons";
import {
  Download,
  Camera,
  Upload,
  CreditCard,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { useLocation } from "wouter";

// Interface para o status do estudante
interface StudentCredentialStatus {
  hasValidPhoto: boolean;
  hasApprovedDocuments: boolean;
  hasPaidFirstInstallment: boolean;
  canGenerateCredential: boolean;
  hasGeneratedCredential: boolean;
  credentialExpiryDate: string | null;
  rejectionReason: string | null;
  pendingDocuments: string[];
  paymentStatus: 'pending' | 'paid' | 'late';
}

// Interface para o histórico de credenciais
interface CredentialHistory {
  id: number;
  status: 'active' | 'expired' | 'canceled';
  generatedAt: string;
  expiresAt: string;
  downloadUrl?: string;
}

export default function CredencialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>("https://placehold.co/400x500/e2e8f0/475569?text=Foto+do+Aluno");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();

  // Simular dados do estudante
  const mockStudentCredentialStatus: StudentCredentialStatus = {
    hasValidPhoto: true,
    hasApprovedDocuments: true,
    hasPaidFirstInstallment: true,
    canGenerateCredential: true,
    hasGeneratedCredential: true,
    credentialExpiryDate: "2025-12-31",
    rejectionReason: null,
    pendingDocuments: [],
    paymentStatus: 'paid',
  };

  // Simular histórico de credenciais
  const mockCredentialHistory: CredentialHistory[] = [
    {
      id: 1,
      status: 'active',
      generatedAt: "2023-01-15T10:20:00",
      expiresAt: "2025-12-31T23:59:59",
      downloadUrl: "#",
    },
    {
      id: 2,
      status: 'expired',
      generatedAt: "2021-01-20T14:30:00",
      expiresAt: "2022-12-31T23:59:59",
      downloadUrl: "#",
    }
  ];

  // Sidebarr
  const sidebarItems = [
    { name: "Dashboard", icon: <ChartIcon />, href: "/student/dashboard" },
    { name: "Meus Cursos", icon: <MenuBookIcon />, href: "/student/courses" },
    { name: "Credencial", icon: <CreditCard />, active: true, href: "/student/credencial" },
    { name: "Calendário", icon: <EventNoteIcon />, href: "/student/calendar" },
    { name: "Documentos", icon: <DescriptionIcon />, href: "/student/documents" },
    { name: "Biblioteca", icon: <LayersIcon />, href: "/student/library" },
    { name: "Secretaria", icon: <FileTextIcon />, href: "/student/secretaria" },
    { name: "Financeiro", icon: <PaymentsIcon />, href: "/student/financial" },
    { name: "Suporte", icon: <HelpOutlineIcon />, href: "/student/support" },
  ];

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatador de data e hora
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulação de upload
    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);

    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          toast({
            title: "Foto enviada com sucesso",
            description: "Sua foto foi enviada e está sendo analisada.",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleCameraCapture = async () => {
    setShowCamera(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erro ao acessar câmera",
        description: "Não foi possível acessar sua câmera. Verifique as permissões.",
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Aspectos da imagem
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter para imagem
        const imageDataURL = canvas.toDataURL('image/png');
        setCapturedImage(imageDataURL);
        setPhotoPreview(imageDataURL);
        
        // Parar a câmera
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        
        setShowCamera(false);
        
        // Simulação de upload
        setIsUploading(true);
        setUploadProgress(0);
        
        // Simular progresso de upload
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              
              toast({
                title: "Foto capturada com sucesso",
                description: "Sua foto foi enviada e está sendo analisada.",
              });
              
              return 100;
            }
            return prev + 10;
          });
        }, 300);
      }
    }
  };

  const cancelCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    setShowCamera(false);
  };

  const handleGenerateCredential = () => {
    setIsGenerating(true);
    
    // Simular geração
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Credencial gerada com sucesso!",
        description: "Sua credencial estudantil foi gerada e está disponível para download.",
      });
      
      // Atualizar o status
      // Na aplicação real, isso seria feito via API
    }, 2000);
  };

  // Verificar se o aluno pode gerar a credencial
  const canGenerate = mockStudentCredentialStatus.hasValidPhoto &&
                      mockStudentCredentialStatus.hasApprovedDocuments &&
                      mockStudentCredentialStatus.hasPaidFirstInstallment;

  // Verificar se o aluno já possui credencial ativa
  const hasActiveCredential = mockCredentialHistory.some(cred => cred.status === 'active');

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
            <h1 className="text-2xl font-bold text-gray-900">Credencial Estudantil</h1>
            <p className="text-gray-600">Gerencie sua credencial estudantil digital</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna esquerda - Status e Geração */}
            <div className="md:col-span-2 space-y-6">
              {/* Status da Credencial */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Credencial</CardTitle>
                  <CardDescription>
                    Verifique seu status atual e os requisitos para emissão
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasActiveCredential ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Credencial Ativa</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Você já possui uma credencial ativa válida até {formatDate(mockCredentialHistory[0].expiresAt)}.
                      </AlertDescription>
                    </Alert>
                  ) : canGenerate ? (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Pronto para Emissão</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Você atende a todos os requisitos e pode gerar sua credencial estudantil.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Pendências Encontradas</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Existem requisitos pendentes para a emissão da sua credencial.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Requisito: Foto */}
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="flex items-start">
                        {mockStudentCredentialStatus.hasValidPhoto ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">Foto do Aluno</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {mockStudentCredentialStatus.hasValidPhoto
                              ? "Foto aprovada e válida para uso na credencial."
                              : "Você precisa enviar uma foto de rosto em fundo branco."}
                          </p>
                          {!mockStudentCredentialStatus.hasValidPhoto && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-3.5 w-3.5 mr-1" />
                                Enviar Foto
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleCameraCapture}
                              >
                                <Camera className="h-3.5 w-3.5 mr-1" />
                                Tirar Foto
                              </Button>
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Requisito: Documentação */}
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="flex items-start">
                        {mockStudentCredentialStatus.hasApprovedDocuments ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">Documentação Acadêmica</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {mockStudentCredentialStatus.hasApprovedDocuments
                              ? "Documentação aprovada pela secretaria."
                              : `Você possui ${mockStudentCredentialStatus.pendingDocuments.length} documento(s) pendente(s).`}
                          </p>
                          {!mockStudentCredentialStatus.hasApprovedDocuments && (
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setLocation("/student/secretaria")}
                              >
                                Enviar Documentos
                                <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Requisito: Pagamento */}
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="flex items-start">
                        {mockStudentCredentialStatus.hasPaidFirstInstallment ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">Pagamento da 1ª Parcela</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {mockStudentCredentialStatus.hasPaidFirstInstallment
                              ? "Primeira parcela do curso quitada."
                              : "É necessário o pagamento da primeira parcela do curso."}
                          </p>
                          {!mockStudentCredentialStatus.hasPaidFirstInstallment && (
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setLocation("/student/financial")}
                              >
                                Verificar Pagamentos
                                <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status da Credencial */}
                    <div className="p-4 rounded-lg border bg-white">
                      <div className="flex items-start">
                        {hasActiveCredential ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">Status da Credencial</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {hasActiveCredential
                              ? `Credencial válida até ${formatDate(mockCredentialHistory[0].expiresAt)}`
                              : "Credencial não gerada ou expirada."}
                          </p>
                          {hasActiveCredential && (
                            <div className="mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toast({
                                  title: "Download iniciado",
                                  description: "Seu arquivo está sendo baixado.",
                                })}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Baixar Credencial
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex flex-col items-stretch sm:flex-row sm:items-center gap-3">
                  {canGenerate ? (
                    <Button 
                      className="w-full sm:w-auto" 
                      onClick={handleGenerateCredential}
                      disabled={isGenerating || hasActiveCredential}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando Credencial...
                        </>
                      ) : hasActiveCredential ? (
                        "Você já possui uma credencial ativa"
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Gerar Credencial Estudantil
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full sm:w-auto" 
                      disabled
                      variant="outline"
                    >
                      Resolva as pendências para gerar a credencial
                    </Button>
                  )}
                  
                  {hasActiveCredential && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => toast({
                        title: "Download iniciado",
                        description: "Seu arquivo está sendo baixado.",
                      })}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Credencial
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Histórico de Credenciais */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Credenciais</CardTitle>
                  <CardDescription>
                    Credenciais emitidas anteriormente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mockCredentialHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma credencial encontrada</h3>
                      <p className="text-gray-600">
                        Você ainda não gerou nenhuma credencial estudantil.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mockCredentialHistory.map((credential) => (
                        <div key={credential.id} className="p-4 rounded-lg border bg-white">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                              <div className="flex items-center mb-2">
                                <Badge 
                                  variant={credential.status === 'active' ? 'default' : 'outline'}
                                  className="mr-2"
                                >
                                  {credential.status === 'active' ? 'Ativa' : credential.status === 'expired' ? 'Expirada' : 'Cancelada'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  ID: #{credential.id}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Emitida em:</span> {formatDateTime(credential.generatedAt)}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Válida até:</span> {formatDate(credential.expiresAt)}
                              </p>
                            </div>
                            {credential.downloadUrl && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3 md:mt-0"
                                onClick={() => toast({
                                  title: "Download iniciado",
                                  description: "Seu arquivo está sendo baixado.",
                                })}
                              >
                                <Download className="mr-2 h-3.5 w-3.5" />
                                Baixar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita - Foto e Informações */}
            <div className="space-y-6">
              {/* Foto do Aluno */}
              <Card>
                <CardHeader>
                  <CardTitle>Sua Foto</CardTitle>
                  <CardDescription>
                    A foto que será usada na credencial
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="w-full max-w-[240px] aspect-[3/4] overflow-hidden rounded-lg border mb-4 relative">
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm">Enviando foto... {uploadProgress}%</p>
                      </div>
                    )}
                    <img 
                      src={photoPreview || "https://placehold.co/400x500/e2e8f0/475569?text=Foto+do+Aluno"} 
                      alt="Foto do Aluno"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Enviar Foto
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCameraCapture}
                    >
                      <Camera className="mr-2 h-3.5 w-3.5" />
                      Tirar Foto
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Informações */}
              <Card>
                <CardHeader>
                  <CardTitle>Regras e Informações</CardTitle>
                  <CardDescription>
                    Sobre a credencial estudantil
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <p className="text-gray-700">
                    A credencial estudantil é o documento oficial que comprova seu vínculo com a instituição. 
                    Com ela, você tem acesso a benefícios e descontos exclusivos.
                  </p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Requisitos para Emissão:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Foto atualizada (fundo branco, sem óculos escuros e sem adereços)</li>
                      <li>Documentação acadêmica completa e aprovada pela secretaria</li>
                      <li>Pagamento da primeira parcela do curso quitado</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Benefícios:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Acesso às dependências da instituição</li>
                      <li>Descontos em teatros, cinemas, shows e eventos culturais</li>
                      <li>Meia-entrada em eventos esportivos</li>
                      <li>Descontos especiais em estabelecimentos parceiros</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Validade e Renovação:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>A credencial é válida por 2 anos ou até a conclusão do curso</li>
                      <li>Renovação disponível em caso de perda, dano ou expiração</li>
                      <li>Para renovar, é necessário estar com matrícula ativa e situação financeira regularizada</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Câmera */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Capturar Foto</DialogTitle>
            <DialogDescription>
              Posicione seu rosto no centro da tela e clique em "Capturar"
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative aspect-video overflow-hidden bg-gray-100 rounded-md">
            <video 
              ref={videoRef} 
              autoPlay 
              className="absolute left-0 top-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={cancelCamera}
            >
              Cancelar
            </Button>
            <Button onClick={takePhoto}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}