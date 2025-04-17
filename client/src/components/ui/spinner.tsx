import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props para o componente Spinner
 */
export interface SpinnerProps {
  /** Tamanho do spinner (small, medium, large) */
  size?: 'sm' | 'md' | 'lg';
  /** Cor do spinner */
  color?: 'primary' | 'white';
  /** Texto alternativo para acessibilidade */
  label?: string;
  /** Classe adicional de estilo */
  className?: string;
}

/**
 * Componente de spinner de carregamento
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label = 'Carregando...',
  className = '',
}) => {
  // Configurar as classes de tamanho
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // Configurar as classes de cor
  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white',
  };

  return (
    <div role="status" className="inline-flex items-center justify-center">
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;