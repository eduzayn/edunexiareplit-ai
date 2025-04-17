import React, { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Componente de redirecionamento para a página correta de cursos
 * Esta é uma solução temporária para redirecionar de /admin/courses para /admin/academico/courses
 */
export default function CoursesRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirecionar para a localização correta da página de cursos
    navigate("/admin/academico/courses");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  );
}