/**
 * Funções utilitárias para formatação de dados
 */

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value Valor numérico a ser formatado
 * @param options Opções de formatação
 * @returns String formatada
 */
export const formatCurrency = (
  value: number,
  options: {
    decimals?: number;
    showSymbol?: boolean;
    showZero?: boolean;
  } = {}
): string => {
  // Configurações padrão
  const config = {
    decimals: 2,
    showSymbol: true,
    showZero: true,
    ...options,
  };

  // Se o valor for zero e não quiser mostrar zero, retorna traço
  if (value === 0 && !config.showZero) {
    return '—';
  }

  // Formata o valor
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(value);

  // Remove o símbolo se necessário
  if (!config.showSymbol) {
    return formattedValue.replace(/R\$\s?/g, '');
  }

  return formattedValue;
};

/**
 * Formata um valor de porcentagem
 * @param value Valor da porcentagem (ex: 0.05 para 5%)
 * @param options Opções de formatação
 * @returns String formatada
 */
export const formatPercent = (
  value: number,
  options: {
    decimals?: number;
    showSymbol?: boolean;
    showZero?: boolean;
  } = {}
): string => {
  // Configurações padrão
  const config = {
    decimals: 2,
    showSymbol: true,
    showZero: true,
    ...options,
  };

  // Se o valor for zero e não quiser mostrar zero, retorna traço
  if (value === 0 && !config.showZero) {
    return '—';
  }

  // Converte para porcentagem (multiplica por 100)
  const percentValue = value * 100;

  // Formata o valor
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(percentValue);

  // Adiciona o símbolo se necessário
  if (config.showSymbol) {
    return `${formattedValue}%`;
  }

  return formattedValue;
};

/**
 * Formata uma data para o formato brasileiro (dd/mm/yyyy)
 * @param dateInput Data a ser formatada
 * @returns String formatada
 */
export const formatDate = (dateInput: Date | string | undefined | null): string => {
  if (!dateInput) return '—';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Verifica se a data é válida
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata um valor booleano para "Sim" ou "Não"
 * @param value Valor booleano
 * @returns String formatada
 */
export const formatBoolean = (value: boolean | undefined | null): string => {
  if (value === undefined || value === null) return '—';
  return value ? 'Sim' : 'Não';
};

/**
 * Formata um CPF (adiciona pontos e traço)
 * @param cpf CPF a ser formatado
 * @returns String formatada
 */
export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '—';
  
  // Remove caracteres não numéricos
  const digits = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (digits.length !== 11) return cpf;
  
  // Formata com pontos e traço
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um CNPJ (adiciona pontos, barra e traço)
 * @param cnpj CNPJ a ser formatado
 * @returns String formatada
 */
export const formatCNPJ = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '—';
  
  // Remove caracteres não numéricos
  const digits = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (digits.length !== 14) return cnpj;
  
  // Formata com pontos, barra e traço
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata um número de telefone
 * @param phone Telefone a ser formatado
 * @returns String formatada
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    // Celular com DDD
    return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  } else if (digits.length === 10) {
    // Telefone fixo com DDD
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 9) {
    // Celular sem DDD
    return digits.replace(/(\d{1})(\d{4})(\d{4})/, '$1 $2-$3');
  } else if (digits.length === 8) {
    // Telefone fixo sem DDD
    return digits.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  return phone;
};

/**
 * Formata o status de uma cobrança Asaas
 * @param status Status da cobrança
 * @returns String formatada
 */
export const formatAsaasStatus = (status: string | null | undefined): string => {
  if (!status) return '—';
  
  const statusMap: Record<string, string> = {
    PENDING: 'Pendente',
    RECEIVED: 'Recebida',
    CONFIRMED: 'Confirmada',
    OVERDUE: 'Vencida',
    REFUNDED: 'Estornada',
    RECEIVED_IN_CASH: 'Recebida em dinheiro',
    REFUND_REQUESTED: 'Estorno solicitado',
    CHARGEBACK_REQUESTED: 'Chargeback solicitado',
    CHARGEBACK_DISPUTE: 'Em disputa de chargeback',
    AWAITING_CHARGEBACK_REVERSAL: 'Aguardando reversão de chargeback',
    DUNNING_REQUESTED: 'Em processo de recuperação',
    DUNNING_RECEIVED: 'Recuperada',
    AWAITING_RISK_ANALYSIS: 'Em análise de risco',
  };
  
  return statusMap[status] || status;
};

/**
 * Formata o tipo de cobrança Asaas
 * @param billingType Tipo de cobrança
 * @returns String formatada
 */
export const formatAsaasBillingType = (billingType: string | null | undefined): string => {
  if (!billingType) return '—';
  
  const typeMap: Record<string, string> = {
    BOLETO: 'Boleto',
    CREDIT_CARD: 'Cartão de crédito',
    PIX: 'Pix',
    UNDEFINED: 'Não definido',
  };
  
  return typeMap[billingType] || billingType;
};