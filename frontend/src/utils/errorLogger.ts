/**
 * Error Logging Service
 * Centralized error logging for the application
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLog {
  message: string;
  error?: Error;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userId?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private enabled = true;

  /**
   * Enable or disable error logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Log an error
   */
  log(
    message: string,
    error?: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ) {
    if (!this.enabled) return;

    const errorLog: ErrorLog = {
      message,
      error,
      severity,
      context,
      userId: this.getUserId(),
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Add to in-memory logs
    this.logs.push(errorLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console logging based on severity
    this.consoleLog(errorLog);

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(errorLog);
    }
  }

  /**
   * Log a low severity error
   */
  logLow(message: string, error?: Error, context?: Record<string, any>) {
    this.log(message, error, ErrorSeverity.LOW, context);
  }

  /**
   * Log a medium severity error
   */
  logMedium(message: string, error?: Error, context?: Record<string, any>) {
    this.log(message, error, ErrorSeverity.MEDIUM, context);
  }

  /**
   * Log a high severity error
   */
  logHigh(message: string, error?: Error, context?: Record<string, any>) {
    this.log(message, error, ErrorSeverity.HIGH, context);
  }

  /**
   * Log a critical error
   */
  logCritical(message: string, error?: Error, context?: Record<string, any>) {
    this.log(message, error, ErrorSeverity.CRITICAL, context);
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Console logging with appropriate level
   */
  private consoleLog(log: ErrorLog) {
    const logMessage = `[${log.severity.toUpperCase()}] ${log.message}`;
    const logData = {
      error: log.error,
      context: log.context,
      timestamp: log.timestamp,
      url: log.url,
    };

    switch (log.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, logData);
        break;
      case ErrorSeverity.LOW:
        console.info(logMessage, logData);
        break;
    }
  }

  /**
   * Send error to external logging service
   * TODO: Integrate with Sentry, LogRocket, or similar service
   */
  private async sendToService(log: ErrorLog) {
    try {
      // Example: Send to your backend API
      // await fetch('/api/logs/error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(log),
      // });

      // Example: Send to Sentry
      // if (window.Sentry) {
      //   window.Sentry.captureException(log.error || new Error(log.message), {
      //     level: log.severity,
      //     extra: log.context,
      //   });
      // }

      // For now, just log to console in production
      // In the future, integrate with actual error tracking service
    } catch (error) {
      console.error('Failed to send error log to service:', error);
    }
  }

  /**
   * Get current user ID from auth store
   */
  private getUserId(): string | undefined {
    try {
      // Import dynamically to avoid circular dependencies
      const { useAuthStore } = require('../store/authStore');
      const user = useAuthStore.getState().user;
      return user?.id;
    } catch {
      return undefined;
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Global error handler
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logHigh(
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: 'unhandledrejection' }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorLogger.logHigh(
      'Global error',
      event.error || new Error(event.message),
      {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}

export default errorLogger;





