/**
 * Formatters para exibição de valores monetários e datas no padrão brasileiro
 */

/**
 * Formata um valor numérico como moeda brasileira (Real - R$)
 * 
 * @param value - Valor a ser formatado
 * @returns String formatada no padrão de moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY)
 * 
 * @param date - Data a ser formatada
 * @returns String formatada no padrão de data brasileira
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata uma data no padrão brasileiro incluindo hora (DD/MM/YYYY HH:MM)
 * 
 * @param date - Data a ser formatada
 * @returns String formatada no padrão de data e hora brasileira
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formata um número de CPF ou CNPJ
 * 
 * @param value - Valor a ser formatado (somente dígitos)
 * @returns String formatada no padrão de CPF (123.456.789-00) ou CNPJ (12.345.678/0001-90)
 */
export function formatDocument(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 11) {
    // CPF: 123.456.789-00
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
  } else {
    // CNPJ: 12.345.678/0001-90
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5');
  }
}

/**
 * Formata um número de telefone brasileiro
 * 
 * @param value - Valor a ser formatado (somente dígitos)
 * @returns String formatada no padrão de telefone brasileiro ((11) 98765-4321)
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 10) {
    // Telefone fixo: (11) 3456-7890
    return digits.replace(/(\d{2})(\d{4})(\d{4})/g, '($1) $2-$3');
  } else {
    // Celular: (11) 98765-4321
    return digits.replace(/(\d{2})(\d{5})(\d{4})/g, '($1) $2-$3');
  }
}

/**
 * Formata um CEP
 * 
 * @param value - Valor a ser formatado (somente dígitos)
 * @returns String formatada no padrão de CEP (12345-678)
 */
export function formatCep(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, '');
  
  // CEP: 12345-678
  return digits.replace(/(\d{5})(\d{3})/g, '$1-$2');
}