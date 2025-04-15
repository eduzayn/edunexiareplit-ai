import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function CadastroSucessoPage() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header onLogin={() => navigate("/portal-selection")} />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cadastro realizado com sucesso!
          </h1>
          
          <div className="mb-8 text-lg text-gray-600 space-y-4">
            <p>
              Parabéns! Seu cadastro foi realizado e seu período de teste foi iniciado.
            </p>
            <p>
              Enviamos um email de confirmação para o endereço informado. Por favor, verifique sua caixa de entrada (e também a pasta de spam) e siga as instruções para ativar sua conta.
            </p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-10">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Próximos passos</h3>
            <ol className="text-left text-blue-700 space-y-3">
              <li className="flex">
                <span className="font-bold mr-2">1.</span>
                <span>Ative sua conta através do link enviado ao seu email.</span>
              </li>
              <li className="flex">
                <span className="font-bold mr-2">2.</span>
                <span>Acesse o Portal Administrativo com as credenciais criadas.</span>
              </li>
              <li className="flex">
                <span className="font-bold mr-2">3.</span>
                <span>Configure sua instituição e comece a explorar todas as funcionalidades disponíveis no seu plano.</span>
              </li>
              <li className="flex">
                <span className="font-bold mr-2">4.</span>
                <span>Entre em contato com nossa equipe de suporte caso precise de ajuda durante o período de teste.</span>
              </li>
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/portal-selection")}>
              Acessar Portal Administrativo
            </Button>
            
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para a página inicial
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}