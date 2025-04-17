/**
 * Página de redirecionamento - Módulo de Pagamentos está obsoleto.
 * Esta página redireciona para o módulo de cobranças com integração Asaas.
 */
import React, { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangleIcon,
  InvoiceIcon,
  ChevronRightIcon
} from "@/components/ui/icons";

export default function PaymentsPage() {
  const [, navigate] = useLocation();

  // Redirecionar automaticamente após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/admin/finance/charges");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Módulo de Pagamentos Obsoleto</h1>
            <p className="text-gray-500">
              Este módulo foi descontinuado em favor da integração com o Asaas.
            </p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Módulo Descontinuado</AlertTitle>
          <AlertDescription>
            O módulo de pagamentos manual foi substituído pela robusta integração com o gateway de pagamentos Asaas.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Redirecionando para o Módulo de Cobranças</CardTitle>
            <CardDescription>
              Você será redirecionado automaticamente para o módulo de cobranças em 5 segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              O módulo de cobranças oferece funcionalidades completas para gerenciamento de pagamentos através da 
              integração com o gateway Asaas, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Geração automática de links de pagamento</li>
              <li>Suporte a múltiplos métodos de pagamento (Cartão, Boleto, PIX)</li>
              <li>Notificações automáticas de pagamentos</li>
              <li>Atualização em tempo real do status de pagamentos</li>
              <li>Relatórios financeiros detalhados</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate("/admin/finance/charges")}
            >
              <InvoiceIcon className="mr-2 h-4 w-4" />
              Ir para o Módulo de Cobranças
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}