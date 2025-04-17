/**
 * Módulo de logging para a aplicação
 * Fornece funções para logging de diferentes níveis
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logger para a aplicação
 */
const logger = {
  /**
   * Registra uma mensagem de debug
   * @param message Mensagem a ser registrada
   * @param data Dados adicionais (opcional)
   */
  debug: (message: string, data?: any) => {
    if (!isProduction) {
      console.log(`[DEBUG] ${message}`, data ? data : '');
    }
  },

  /**
   * Registra uma mensagem de informação
   * @param message Mensagem a ser registrada
   * @param data Dados adicionais (opcional)
   */
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? data : '');
  },

  /**
   * Registra uma mensagem de aviso
   * @param message Mensagem a ser registrada
   * @param data Dados adicionais (opcional)
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? data : '');
  },

  /**
   * Registra uma mensagem de erro
   * @param message Mensagem a ser registrada
   * @param error Erro ou dados adicionais (opcional)
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }
};

export default logger;