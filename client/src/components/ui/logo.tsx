import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "light" | "dark";
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

/**
 * Componente de Logo reutilizável para o EdunexIA
 * Pode ser usado em diferentes tamanhos e variantes de cor
 */
export function Logo({
  className,
  variant = "default",
  size = "md",
  withText = true,
}: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  const colorClasses = {
    default: "text-primary",
    light: "text-white",
    dark: "text-blue-950",
  };

  return (
    <div className={cn("flex items-center", className)}>
      {/* SVG Logo */}
      <svg
        className={cn(sizeClasses[size], colorClasses[variant])}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Modernização do ícone EdunexIA baseado na referência Kajabi */}
        <path
          d="M40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <path
          d="M34 25H26V55H34V25Z"
          fill="currentColor"
        />
        <path
          d="M54 25H46V55H54V25Z"
          fill="currentColor"
        />
        <path
          d="M44 35H36V45H44V35Z"
          fill="currentColor"
        />
        <path
          d="M40 20C28.9543 20 20 28.9543 20 40C20 51.0457 28.9543 60 40 60C51.0457 60 60 51.0457 60 40C60 28.9543 51.0457 20 40 20ZM40 55C31.7157 55 25 48.2843 25 40C25 31.7157 31.7157 25 40 25C48.2843 25 55 31.7157 55 40C55 48.2843 48.2843 55 40 55Z"
          fill="currentColor"
          fillOpacity="0.7"
        />
      </svg>

      {/* Texto da Logo */}
      {withText && (
        <span className={cn("ml-2 font-bold", textSizeClasses[size], colorClasses[variant])}>
          EdunexIA
        </span>
      )}
    </div>
  );
}