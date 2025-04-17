import React from "react";
import { Button } from "./button";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Componentes de apoio para a paginação (usado em outras páginas)
export function PaginationContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

export function PaginationItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("", className)} {...props} />;
}

export function PaginationLink({
  className,
  isActive,
  ...props
}: React.ComponentProps<typeof Button> & { isActive?: boolean }) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="icon"
      className={cn("h-8 w-8", className)}
      {...props}
    />
  );
}

export function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Ir para a página anterior"
      size="icon"
      className={cn("gap-1", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Ir para a próxima página"
      size="icon"
      className={cn("gap-1", className)}
      {...props}
    >
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn("flex h-8 w-8 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">Mais páginas</span>
    </span>
  );
}

// Interface para o componente principal de paginação
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Componente principal de paginação
export function Pagination(props: PaginationProps & React.HTMLAttributes<HTMLDivElement>) {
  const { currentPage, totalPages, onPageChange, className, children, ...rest } = props as PaginationProps & { 
    children?: React.ReactNode, 
    className?: string 
  };
  
  // Se tiver children, significa que é usado no formato composto
  if (children) {
    return <nav className={cn("mx-auto flex w-full justify-center", className)} {...rest}>{children}</nav>;
  }
  // Não renderize a paginação se houver apenas uma página
  if (totalPages <= 1) return null;

  // Função para gerar os números de página a serem exibidos
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Sempre mostrar a primeira página
    pageNumbers.push(1);
    
    // Mostrar os números em torno da página atual
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 2 && currentPage > 3) {
        // Adicionar reticências se houver uma lacuna entre a primeira página e os números em torno da página atual
        pageNumbers.push(-1); // -1 representa reticências
      } else if (i === totalPages - 1 && currentPage < totalPages - 2) {
        // Adicionar reticências se houver uma lacuna entre os números em torno da página atual e a última página
        pageNumbers.push(-2); // -2 representa reticências
      } else {
        pageNumbers.push(i);
      }
    }
    
    // Sempre mostrar a última página se houver mais de uma página
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    // Remover duplicatas
    return Array.from(new Set(pageNumbers));
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn("flex items-center justify-center gap-1 mt-4", className)}>
      {/* Botão Anterior */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-8 w-8"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      {/* Números das páginas */}
      {pageNumbers.map((pageNumber, index) => {
        if (pageNumber === -1 || pageNumber === -2) {
          // Renderizar reticências
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 cursor-default"
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          );
        }
        
        // Renderizar número de página
        return (
          <Button
            key={pageNumber}
            variant={pageNumber === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(pageNumber)}
            className="h-8 w-8"
            aria-label={`Página ${pageNumber}`}
            aria-current={pageNumber === currentPage ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      {/* Botão Próximo */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
        aria-label="Próxima página"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}