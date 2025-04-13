import { useState, useEffect } from "react";

// Hook personalizado para detectar se o dispositivo é móvel
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Adicionar event listener para redimensionamento de tela
    window.addEventListener("resize", handleResize);
    
    // Limpar o event listener ao desmontar o componente
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}