import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Icons
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";

// Tipos
interface SimplifiedEnrollment {
  id: number;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  courseId: number;
  courseName?: string;
  poloId?: number;
  poloName?: string;
  status: "pending" | "waiting_payment" | "payment_confirmed" | "completed" | "cancelled";
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  externalReference: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
}

// Formatadores e helpers
const formatCPF = (cpf: string) => {
  if (!cpf) return "";
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
};

const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    waiting_payment: "Aguardando Pagamento",
    payment_confirmed: "Pagamento Confirmado",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  return statusMap[status] || status;
};

const getStatusBadgeProps = (status: string): BadgeProps => {
  const statusProps: Record<string, BadgeProps> = {
    pending: { variant: "outline" },
    waiting_payment: { variant: "secondary" },
    payment_confirmed: { variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80" },
    completed: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100/80" },
    cancelled: { variant: "destructive" },
  };
  return statusProps[status] || { variant: "outline" };
};

export default function PoloSimplifiedEnrollmentDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const enrollmentId = parseInt(id, 10);

  // Carregar dados da matrícula
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/simplified-enrollments/${enrollmentId}`],
    enabled: !isNaN(enrollmentId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Garantindo o tipo usando um casting condicional seguro
  const enrollment = data?.data ? (data.data as SimplifiedEnrollment) : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircleIcon className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Carregando dados da matrícula...</span>
      </div>
    );
  }

  if (error || !enrollment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="mr-4"
            onClick={() => navigate("/polo/simplified-enrollment")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Matrícula Não Encontrada</h2>
            <p className="text-muted-foreground">
              Não foi possível encontrar a matrícula solicitada
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {(error as any)?.message || "Não foi possível carregar os dados da matrícula"}
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => navigate("/polo/simplified-enrollment")}
        >
          Voltar para lista de matrículas
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/polo/simplified-enrollment");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Detalhes da Matrícula</h2>
          <p className="text-muted-foreground">
            Visualize os detalhes da matrícula simplificada #{enrollment.id}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Informações da Matrícula</CardTitle>
              <Badge {...getStatusBadgeProps(enrollment.status)}>
                {getStatusDisplayName(enrollment.status)}
              </Badge>
            </div>
            <CardDescription>
              Detalhes da matrícula realizada em{" "}
              {format(new Date(enrollment.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Dados do Aluno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{enrollment.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{formatCPF(enrollment.studentCpf)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{enrollment.studentEmail}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Dados do Curso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Curso</p>
                  <p className="font-medium">{enrollment.courseName || `Curso ID: ${enrollment.courseId}`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Polo</p>
                  <p className="font-medium">{enrollment.poloName || "Não informado"}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Dados do Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Referência Externa</p>
                  <p className="font-medium">{enrollment.externalReference}</p>
                </div>
                {enrollment.paymentLinkId && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID do Link de Pagamento</p>
                    <p className="font-medium">{enrollment.paymentLinkId}</p>
                  </div>
                )}
                {enrollment.paymentLinkUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Link de Pagamento</p>
                    <div className="flex items-center">
                      <a
                        href={enrollment.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {enrollment.paymentLinkUrl.substring(0, 50)}...
                        <ExternalLinkIcon className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status e Progresso</CardTitle>
            <CardDescription>Acompanhamento do processo de matrícula</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className={`rounded-full p-1 ${enrollment.status !== "cancelled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Solicitação Recebida</h4>
                  <p className="text-sm text-muted-foreground">
                    Dados do aluno registrados no sistema
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className={`rounded-full p-1 ${["waiting_payment", "payment_confirmed", "completed"].includes(enrollment.status) ? "bg-green-100 text-green-700" : enrollment.status === "cancelled" ? "bg-gray-100 text-gray-400" : "bg-amber-100 text-amber-700"}`}>
                  {["waiting_payment", "payment_confirmed", "completed"].includes(enrollment.status) ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : enrollment.status === "cancelled" ? (
                    <XCircleIcon className="h-5 w-5" />
                  ) : (
                    <LoaderCircleIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Link de Pagamento</h4>
                  <p className="text-sm text-muted-foreground">
                    {["waiting_payment", "payment_confirmed", "completed"].includes(enrollment.status)
                      ? "Link de pagamento gerado e enviado"
                      : enrollment.status === "cancelled"
                      ? "Processo cancelado"
                      : "Aguardando geração do link"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className={`rounded-full p-1 ${["payment_confirmed", "completed"].includes(enrollment.status) ? "bg-green-100 text-green-700" : enrollment.status === "cancelled" ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-400"}`}>
                  {["payment_confirmed", "completed"].includes(enrollment.status) ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : enrollment.status === "cancelled" ? (
                    <XCircleIcon className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Pagamento Confirmado</h4>
                  <p className="text-sm text-muted-foreground">
                    {["payment_confirmed", "completed"].includes(enrollment.status)
                      ? "Pagamento processado com sucesso"
                      : enrollment.status === "cancelled"
                      ? "Processo cancelado"
                      : "Aguardando confirmação de pagamento"}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className={`rounded-full p-1 ${enrollment.status === "completed" ? "bg-green-100 text-green-700" : enrollment.status === "cancelled" ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-400"}`}>
                  {enrollment.status === "completed" ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : enrollment.status === "cancelled" ? (
                    <XCircleIcon className="h-5 w-5" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">Matrícula Concluída</h4>
                  <p className="text-sm text-muted-foreground">
                    {enrollment.status === "completed"
                      ? "Aluno matriculado com sucesso"
                      : enrollment.status === "cancelled"
                      ? "Processo cancelado"
                      : "Aguardando finalização da matrícula"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleBack}
            >
              Voltar para Lista
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {enrollment.paymentLinkUrl && enrollment.status === "waiting_payment" && (
        <Card>
          <CardHeader>
            <CardTitle>Compartilhar Link de Pagamento</CardTitle>
            <CardDescription>
              Envie o link de pagamento para o aluno pelos canais disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-gray-50">
              <p className="text-sm mb-2">Link de pagamento:</p>
              <div className="flex items-center justify-between gap-2 bg-white border p-2 rounded">
                <p className="text-blue-600 truncate">{enrollment.paymentLinkUrl}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(enrollment.paymentLinkUrl || "");
                    toast({
                      title: "Link copiado",
                      description: "O link de pagamento foi copiado para a área de transferência.",
                    });
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.open(enrollment.paymentLinkUrl, "_blank");
              }}
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Abrir Link
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                const whatsappMsg = `Olá ${enrollment.studentName}, segue o link para pagamento da sua matrícula: ${enrollment.paymentLinkUrl}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;
                window.open(whatsappUrl, "_blank");
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2"
              >
                <path d="M3 3l1.664 5.993a9 9 0 0 0 1.722 3.172l.012.013a9 9 0 0 0 3.208 2.488L21 21" />
                <path d="M10 21h-.959a10 10 0 0 1 -7.5-2.54 1.58 1.58 0 0 1 -.073-2.188l1.7-1.7a1.72 1.72 0 0 1 2.43 0l.779.779a1.65 1.65 0 0 0 2.223.088l3.133-2.608a1.66 1.66 0 0 0 .251-2.343l-.375-.375a1.72 1.72 0 0 1 0-2.43l1.7-1.7a1.58 1.58 0 0 1 2.188.073a10 10 0 0 1 2.54 7.5v1" />
              </svg>
              Enviar WhatsApp
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                const subject = `Link de pagamento - Matrícula ${enrollment.id}`;
                const body = `Olá ${enrollment.studentName},\n\nSegue o link para pagamento da sua matrícula:\n${enrollment.paymentLinkUrl}\n\nAtenciosamente,\nEquipe do Polo`;
                const mailtoUrl = `mailto:${enrollment.studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.open(mailtoUrl, "_blank");
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Enviar Email
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}