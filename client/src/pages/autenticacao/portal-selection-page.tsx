import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SchoolIcon, HandshakeIcon, MapPinIcon, ShieldIcon, ArrowLeftIcon } from "@/components/ui/icons";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

export default function PortalSelectionPage() {
  const [, navigate] = useLocation();
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);

  const portals = [
    {
      id: "student",
      title: "Portal do Aluno",
      description: "Acesse aulas, materiais e sua área do estudante",
      icon: <SchoolIcon className="h-6 w-6" />,
      color: "bg-green-100 text-[#12B76A] hover:border-[#12B76A]",
      colorHover: "group-hover:border-[#12B76A]",
    },
    {
      id: "partner",
      title: "Portal do Parceiro",
      description: "Acesse seu painel de afiliado e comissões",
      icon: <HandshakeIcon className="h-6 w-6" />,
      color: "bg-purple-100 text-[#7C4DFC] hover:border-[#7C4DFC]",
      colorHover: "group-hover:border-[#7C4DFC]",
    },
    {
      id: "polo",
      title: "Portal do Polo",
      description: "Acesse a gestão de unidades e matrículas",
      icon: <MapPinIcon className="h-6 w-6" />,
      color: "bg-orange-100 text-[#F79009] hover:border-[#F79009]",
      colorHover: "group-hover:border-[#F79009]",
    },
    {
      id: "admin",
      title: "Portal Administrativo",
      description: "Acesse as configurações e gestão completa",
      icon: <ShieldIcon className="h-6 w-6" />,
      color: "bg-blue-100 text-[#3451B2] hover:border-[#3451B2]",
      colorHover: "group-hover:border-[#3451B2]",
    },
  ];

  const handlePortalSelect = (portalId: string) => {
    setSelectedPortal(portalId);
    
    // Aplicar um delay mais longo para garantir uma transição suave
    setTimeout(() => {
      // Direcionar para a rota específica do portal selecionado
      console.log("Redirecionando para portal:", portalId);
      
      // Limpar qualquer estado anterior que possa estar em cache
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      
      if (portalId === "admin") {
        navigate("/admin");
      } else if (portalId === "polo") {
        navigate("/polo");
      } else {
        navigate(`/auth?portal=${portalId}`);
      }
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: "easeOut",
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Selecione o portal de acesso</h2>
          <Link to="/">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Escolha o portal que deseja acessar de acordo com o seu perfil na plataforma.
          </p>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {portals.map((portal) => (
              <motion.div key={portal.id} variants={itemVariants}>
                <Card 
                  className={`group border cursor-pointer transition-all hover:shadow-md ${
                    selectedPortal === portal.id ? "border-2 border-primary ring-2 ring-primary/20" : "border-gray-200"
                  }`}
                  onClick={() => handlePortalSelect(portal.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-full ${portal.color} flex items-center justify-center flex-shrink-0 mr-4`}>
                        {portal.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{portal.title}</h3>
                        <p className="text-sm text-gray-600">{portal.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}