import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";
import NavbarMain from "@/components/layout/navbar-main";
import FooterMain from "@/components/layout/footer-main";

export default function CadastroSucessoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarMain />
      <main className="flex-1 container mx-auto py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Cadastro Realizado com Sucesso!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Parabéns! Seu período de teste gratuito de 14 dias foi iniciado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 text-center">
                <p>
                  Um e-mail de confirmação foi enviado para você com as instruções de acesso.
                </p>
                <p>
                  Você já pode acessar a plataforma utilizando as credenciais que você cadastrou.
                </p>
              </div>

              <div className="space-y-4 pt-4 pb-2">
                <div className="border rounded-md p-4 bg-blue-50">
                  <h3 className="font-medium text-blue-700 mb-2">O que acontece agora?</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Você tem acesso completo ao sistema por 14 dias.</li>
                    <li>Durante este período, você poderá explorar todas as funcionalidades disponíveis.</li>
                    <li>Não é necessário cartão de crédito para o período de teste.</li>
                    <li>Antes do término do período, você receberá um lembrete para escolher um plano.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/admin">
                    Acessar o Sistema
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/planos">
                    Ver Nossos Planos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <FooterMain />
    </div>
  );
}