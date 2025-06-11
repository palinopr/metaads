// Safe logger that doesn't use file system in production

export class SafeLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    // In production, just console log
    if (!this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(`[${timestamp}] ${message}`, data);
          break;
        case 'warn':
          console.warn(`[${timestamp}] ${message}`, data);
          break;
        default:
          console.log(`[${timestamp}] ${message}`, data);
      }
      return;
    }

    // In development, you could write to files if needed
    // But for now, just console log
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new SafeLogger();