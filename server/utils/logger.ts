/**
 * Módulo de logging simples para a aplicação
 */

/**
 * Níveis de log suportados
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Função para registrar mensagens de log
 * @param level Nível de log
 * @param message Mensagem principal do log
 * @param meta Dados adicionais para o log
 */
function log(level: LogLevel, message: string, meta?: any): void {
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...(meta ? { meta } : {})
  };
  
  // No ambiente de desenvolvimento, mostra mensagens formatadas para melhor legibilidade
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      debug: '\x1b[34m', // azul
      info: '\x1b[32m',  // verde
      warn: '\x1b[33m',  // amarelo
      error: '\x1b[31m', // vermelho
      reset: '\x1b[0m'   // reset
    };
    
    console.log(
      `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`, 
      meta ? meta : ''
    );
  } else {
    // Em produção, usa formato JSON para fácil agregação
    console.log(JSON.stringify(logObject));
  }
}

/**
 * Logger para a aplicação
 */
export const logger = {
  debug: (message: string, meta?: any) => log('debug', message, meta),
  info: (message: string, meta?: any) => log('info', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  error: (message: string, meta?: any) => log('error', message, meta)
};

export default logger;