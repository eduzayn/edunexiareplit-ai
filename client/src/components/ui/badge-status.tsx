import { cn } from "@/lib/utils";
import React from "react";

/**
 * Tipos de status disponíveis
 */
export type StatusType = "success" | "warning" | "error" | "info" | "pending" | "default";

/**
 * Props do componente BadgeStatus
 */
export interface BadgeStatusProps {
  status: StatusType;
  label: string;
  className?: string;
}

/**
 * Componente que exibe um badge visual para representar status
 * Útil para indicar visualmente estados diferentes em listagens
 */
export function BadgeStatus({ status, label, className }: BadgeStatusProps) {
  // Configurações de cores para cada tipo de status
  const statusConfig = {
    success: {
      bg: "bg-green-100",
      text: "text-green-800",
      ring: "ring-green-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-green-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
    warning: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      ring: "ring-yellow-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-yellow-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-800",
      ring: "ring-red-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-red-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      ring: "ring-blue-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-blue-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
    pending: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      ring: "ring-purple-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-purple-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
    default: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      ring: "ring-gray-600/20",
      icon: (
        <svg className="h-1.5 w-1.5 fill-gray-500" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx={3} cy={3} r={3} />
        </svg>
      ),
    },
  };

  const { bg, text, ring, icon } = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        bg,
        text,
        ring,
        className
      )}
    >
      {icon}
      <span className="ml-1.5">{label}</span>
    </span>
  );
}