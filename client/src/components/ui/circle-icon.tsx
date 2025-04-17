import React from "react";
import { cn } from "@/lib/utils";

// Componente de círculo azul para submódulos no sidebar
export function CircleIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-2 h-2 rounded-full bg-blue-300", className)} />
  );
}