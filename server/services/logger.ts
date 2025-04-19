/**
 * Serviço de logging estruturado para o sistema
 * Fornece funções para gravar logs com diferentes níveis de severidade e contexto
 */

// Tipos de log
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Interface para o objeto de log estruturado
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  service?: string;
  data?: any;
  error?: any;
}

/**
 * Serviço de Logger para logs estruturados
 */
class Logger {
  /**
   * Registra uma mensagem de log com o nível especificado
   */
  private log(level: LogLevel, message: string, context?: string, data?: any, error?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      data
    };

    if (error) {
      // Se for um erro do Axios, extrair detalhes relevantes
      if (error.isAxiosError) {
        logEntry.error = {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        };
      } else {
        // Erro padrão
        logEntry.error = {
          message: error.message,
          stack: error.stack
        };
      }
    }

    // Em produção, poderia enviar para um serviço externo
    this.printLog(logEntry);
  }

  /**
   * Exibe o log no console com formatação apropriada
   */
  private printLog(logEntry: LogEntry): void {
    const contextStr = logEntry.context ? `[${logEntry.context}]` : '';
    const serviceStr = logEntry.service ? `[${logEntry.service}]` : '';
    
    let consoleMethod: 'log' | 'info' | 'warn' | 'error' = 'log';
    
    switch (logEntry.level) {
      case 'debug':
        consoleMethod = 'log';
        break;
      case 'info':
        consoleMethod = 'info';
        break;
      case 'warn':
        consoleMethod = 'warn';
        break;
      case 'error':
        consoleMethod = 'error';
        break;
    }

    // Formatar a mensagem com contexto
    const formattedMessage = `${logEntry.timestamp} [${logEntry.level.toUpperCase()}] ${contextStr} ${serviceStr} ${logEntry.message}`;
    
    // Log base com a mensagem
    console[consoleMethod](formattedMessage);
    
    // Log de dados adicionais se existirem
    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      console[consoleMethod]('Data:', logEntry.data);
    }
    
    // Log de erro se existir
    if (logEntry.error) {
      console[consoleMethod]('Error details:', logEntry.error);
    }
  }

  /**
   * Registra uma mensagem de debug
   */
  debug(message: string, context?: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Registra uma mensagem informativa
   */
  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  /**
   * Registra um aviso
   */
  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  /**
   * Registra um erro
   */
  error(message: string, context?: string, error?: any, data?: any): void {
    this.log('error', message, context, data, error);
  }

  /**
   * Gera um logger específico para um serviço
   */
  forService(serviceName: string): ServiceLogger {
    return new ServiceLogger(this, serviceName);
  }
}

/**
 * Logger específico para um serviço
 */
class ServiceLogger {
  private logger: Logger;
  private serviceName: string;

  constructor(logger: Logger, serviceName: string) {
    this.logger = logger;
    this.serviceName = serviceName;
  }

  /**
   * Registra uma mensagem de debug para este serviço
   */
  debug(message: string, data?: any): void {
    this.logger.debug(message, this.serviceName, data);
  }

  /**
   * Registra uma mensagem informativa para este serviço
   */
  info(message: string, data?: any): void {
    this.logger.info(message, this.serviceName, data);
  }

  /**
   * Registra um aviso para este serviço
   */
  warn(message: string, data?: any): void {
    this.logger.warn(message, this.serviceName, data);
  }

  /**
   * Registra um erro para este serviço
   */
  error(message: string, error?: any, data?: any): void {
    this.logger.error(message, this.serviceName, error, data);
  }
}

// Exporta uma instância única do logger
export const logger = new Logger();