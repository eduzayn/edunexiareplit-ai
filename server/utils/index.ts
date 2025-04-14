/**
 * Gera um código único com o formato PREFIX-YEAR-SEQUENTIAL (exemplo: CERT-2025-001234)
 * @param prefix Prefixo do código (ex: "CERT" para certificados)
 * @param isUnique Função de validação para verificar se o código gerado é único
 * @returns Um código único no formato especificado
 */
export async function generateUniqueCode(
  prefix: string, 
  isUnique: (code: string) => Promise<boolean>
): Promise<string> {
  const currentYear = new Date().getFullYear();
  let isCodeUnique = false;
  let generatedCode = '';
  let attempts = 0;
  
  while (!isCodeUnique && attempts < 10) {
    // Gerar número sequencial aleatório entre 1 e 999999
    const sequential = Math.floor(Math.random() * 999999) + 1;
    // Formatar com zeros à esquerda
    const sequentialFormatted = sequential.toString().padStart(6, '0');
    // Montar o código
    generatedCode = `${prefix}-${currentYear}-${sequentialFormatted}`;
    
    // Verificar se o código é único
    isCodeUnique = await isUnique(generatedCode);
    attempts++;
  }
  
  if (!isCodeUnique) {
    throw new Error('Não foi possível gerar um código único após várias tentativas');
  }
  
  return generatedCode;
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata um valor monetário para o formato brasileiro (R$ 1.234,56)
 * @param value Valor a ser formatado
 * @returns String no formato R$ 1.234,56
 */
export function formatCurrencyBR(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata um número CPF para o formato brasileiro (XXX.XXX.XXX-XX)
 * @param cpf Número CPF (apenas dígitos)
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  // Remover caracteres não numéricos
  const cpfDigits = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cpfDigits.length !== 11) {
    return cpf; // Retorna original se não for válido
  }
  
  // Formatar no padrão XXX.XXX.XXX-XX
  return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um número CNPJ para o formato brasileiro (XX.XXX.XXX/XXXX-XX)
 * @param cnpj Número CNPJ (apenas dígitos)
 * @returns CNPJ formatado
 */
export function formatCNPJ(cnpj: string): string {
  // Remover caracteres não numéricos
  const cnpjDigits = cnpj.replace(/\D/g, '');
  
  // Verificar se tem 14 dígitos
  if (cnpjDigits.length !== 14) {
    return cnpj; // Retorna original se não for válido
  }
  
  // Formatar no padrão XX.XXX.XXX/XXXX-XX
  return cnpjDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}