type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  meta?: Record<string, any>;
}

class Logger {
  private service: string;
  private isProduction: boolean;

  constructor(service: string = 'ekopulse-backend') {
    this.service = service;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...(meta && { meta })
    };

    if (!this.isProduction) {
      // In development, use console with colors
      const coloredMessage = this.getColoredMessage(level, message);
      console.log(`[${logEntry.timestamp}] ${coloredMessage}`, meta ? meta : '');
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    const colors = {
      info: '\x1b[36m%s\x1b[0m', // Cyan
      warn: '\x1b[33m%s\x1b[0m', // Yellow
      error: '\x1b[31m%s\x1b[0m', // Red
      debug: '\x1b[90m%s\x1b[0m', // Gray
    };

    const levelColors = {
      info: '\x1b[36m[INFO]\x1b[0m',
      warn: '\x1b[33m[WARN]\x1b[0m',
      error: '\x1b[31m[ERROR]\x1b[0m',
      debug: '\x1b[90m[DEBUG]\x1b[0m',
    };

    return `${levelColors[level]} ${message}`;
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (!this.isProduction) {
      this.log('debug', message, meta);
    }
  }
}

// Create and export default logger instance
const logger = new Logger();

export default logger;
