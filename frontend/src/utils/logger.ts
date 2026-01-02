/**
 * Centralized logging utility
 * Replaces console.log statements throughout the application
 */

import { errorLogger, ErrorSeverity } from './errorLogger';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private enabled: boolean = true;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, ...args: any[]) {
    if (!this.enabled || !this.isDevelopment) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]) {
    if (!this.enabled) return;
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, error?: Error, context?: Record<string, any>) {
    if (!this.enabled) return;
    
    if (error) {
      errorLogger.logLow(message, error, context);
    } else {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    if (!this.enabled) return;
    
    if (error) {
      errorLogger.logHigh(message, error, context);
    } else {
      console.error(`[ERROR] ${message}`, context || '');
      errorLogger.logMedium(message, undefined, context);
    }
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, ...args: any[]) {
    switch (level) {
      case 'debug':
        this.debug(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message);
        break;
      case 'error':
        this.error(message);
        break;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;




