/**
 * Formata um valor para exibição como moeda (BRL)
 * @param value Valor a ser formatado
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number | string): string {
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date Data a ser formatada
 * @returns String formatada como data
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formata um percentual para exibição
 * @param value Valor a ser formatado
 * @returns String formatada como percentual
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Formata o status de uma cobrança para exibição
 * @param status Status da cobrança
 * @returns String formatada com descrição do status
 */
export function formatChargeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Pendente',
    RECEIVED: 'Pago',
    CONFIRMED: 'Confirmado',
    OVERDUE: 'Vencido',
    REFUNDED: 'Reembolsado',
    RECEIVED_IN_CASH: 'Recebido em dinheiro',
    REFUND_REQUESTED: 'Reembolso solicitado',
    CHARGEBACK_REQUESTED: 'Estorno solicitado',
    CHARGEBACK_DISPUTE: 'Em disputa de estorno',
    AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão de estorno',
    DUNNING_REQUESTED: 'Recuperação solicitada',
    DUNNING_RECEIVED: 'Recuperado',
    AWAITING_RISK_ANALYSIS: 'Aguardando análise de risco',
  };

  return statusMap[status] || status;
}

/**
 * Formata um número de CPF para exibição (###.###.###-##)
 * @param cpf CPF a ser formatado
 * @returns String formatada como CPF
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  
  // Remove qualquer caractere não numérico
  const numericCPF = cpf.replace(/\D/g, '');
  
  // Verifica se o CPF tem 11 dígitos após a limpeza
  if (numericCPF.length !== 11) {
    return cpf; // Retorna o valor original se não tiver 11 dígitos
  }
  
  // Formata como ###.###.###-##
  return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um número de telefone para exibição ((##) #####-####)
 * @param phone Telefone a ser formatado
 * @returns String formatada como telefone
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove qualquer caractere não numérico
  const numericPhone = phone.replace(/\D/g, '');
  
  // Verifica o tamanho do telefone após a limpeza (11 dígitos para celular com DDD, 10 para fixo com DDD)
  if (numericPhone.length === 11) {
    // Formato para celular: (XX) XXXXX-XXXX
    return numericPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numericPhone.length === 10) {
    // Formato para telefone fixo: (XX) XXXX-XXXX
    return numericPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  // Se não se encaixar nos padrões acima, retorna o formato original
  return phone;
}

export default {
  formatCurrency,
  formatDate,
  formatPercent,
  formatChargeStatus,
  formatCPF,
  formatPhone
};