import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

/**
 * Componente de spinner para indicar carregamento
 */
export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = 'md',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    white: 'text-white'
  };

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default Spinner;