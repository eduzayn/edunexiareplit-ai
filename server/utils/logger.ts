/**
 * Implementação simples de logger para o sistema
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Define o nível mínimo de log (pode ser configurado por env vars)
const MIN_LOG_LEVEL = process.env.LOG_LEVEL 
  ? parseInt(process.env.LOG_LEVEL) 
  : LogLevel.DEBUG;

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      crimson: '\x1b[38m'
  },
  bg: {
      black: '\x1b[40m',
      red: '\x1b[41m',
      green: '\x1b[42m',
      yellow: '\x1b[43m',
      blue: '\x1b[44m',
      magenta: '\x1b[45m',
      cyan: '\x1b[46m',
      white: '\x1b[47m',
      crimson: '\x1b[48m'
  }
};

/**
 * Implementação de logger para o sistema
 */
class Logger {
  
  /**
   * Loga mensagem de debug
   * @param message Mensagem de log
   * @param context Contexto opcional
   */
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Loga mensagem informativa
   * @param message Mensagem de log
   * @param context Contexto opcional
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Loga mensagem de aviso/atenção
   * @param message Mensagem de log
   * @param context Contexto opcional
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Loga mensagem de erro
   * @param message Mensagem de log
   * @param context Contexto opcional
   */
  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Método principal de log
   * @param level Nível de log
   * @param message Mensagem
   * @param context Contexto adicional
   */
  private log(level: LogLevel, message: string, context?: any): void {
    // Verifica se o nível de log está habilitado
    if (level < MIN_LOG_LEVEL) {
      return;
    }
    
    // Data e hora formatada
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Define o prefixo e cor de acordo com o nível
    let levelText: string;
    let color: string;
    
    switch (level) {
      case LogLevel.DEBUG:
        levelText = 'DEBUG';
        color = colors.fg.cyan;
        break;
      case LogLevel.INFO:
        levelText = 'INFO ';
        color = colors.fg.green;
        break;
      case LogLevel.WARN:
        levelText = 'WARN ';
        color = colors.fg.yellow;
        break;
      case LogLevel.ERROR:
        levelText = 'ERROR';
        color = colors.fg.red;
        break;
      default:
        levelText = 'LOG  ';
        color = colors.reset;
    }
    
    // Formata a mensagem base
    const baseMessage = `${timestamp} [${levelText}] ${message}`;
    
    // Log no console com cor
    if (context) {
      // Se tiver contexto, mostra contexto
      if (level === LogLevel.ERROR) {
        console.error(`${color}${baseMessage}${colors.reset}`, context);
      } else {
        console.log(`${color}${baseMessage}${colors.reset}`, context);
      }
    } else {
      // Sem contexto
      if (level === LogLevel.ERROR) {
        console.error(`${color}${baseMessage}${colors.reset}`);
      } else {
        console.log(`${color}${baseMessage}${colors.reset}`);
      }
    }
  }
}

// Exporta uma instância única do logger
export default new Logger();