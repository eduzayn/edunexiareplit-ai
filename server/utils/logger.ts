/**
 * Utilitário de logging simples para o sistema
 */

// Interface para as funções de log
export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
  debug: (message: string) => void;
}

// Implementação simples do logger
export const logger: Logger = {
  info: (message: string) => {
    console.log(`[INFO] ${message}`);
  },
  error: (message: string) => {
    console.error(`[ERROR] ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[WARN] ${message}`);
  },
  debug: (message: string) => {
    console.debug(`[DEBUG] ${message}`);
  }
};

export default logger;