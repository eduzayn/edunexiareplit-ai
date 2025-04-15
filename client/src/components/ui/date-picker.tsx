/**
 * Componente DatePicker - Seletor de data baseado no react-day-picker
 */

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
}

export function DatePicker({
  date,
  onChange,
  disabled = false,
  placeholder = "Selecione uma data",
  className,
  disablePastDates = false,
  disableFutureDates = false,
}: DatePickerProps) {
  // Função de formatação de data
  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Determinação de datas mínima e máxima baseado nas props
  const today = new Date();
  const minDate = disablePastDates ? today : undefined;
  const maxDate = disableFutureDates ? today : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          locale={ptBR}
          fromDate={minDate}
          toDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}