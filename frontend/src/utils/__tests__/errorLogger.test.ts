import { describe, it, expect, beforeEach, vi } from 'vitest';
import errorLogger, { ErrorSeverity } from '../errorLogger';

describe('ErrorLogger', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
    errorLogger.setEnabled(true);
  });

  it('logs errors with correct severity', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    errorLogger.log('Test error', new Error('Test'), ErrorSeverity.HIGH);
    
    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test error');
    expect(logs[0].severity).toBe(ErrorSeverity.HIGH);
    
    consoleSpy.mockRestore();
  });

  it('logs with different severity levels', () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    errorLogger.logLow('Low error');
    errorLogger.logMedium('Medium error');
    errorLogger.logHigh('High error');
    errorLogger.logCritical('Critical error');
    
    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(4);
    expect(logs[0].severity).toBe(ErrorSeverity.LOW);
    expect(logs[1].severity).toBe(ErrorSeverity.MEDIUM);
    expect(logs[2].severity).toBe(ErrorSeverity.HIGH);
    expect(logs[3].severity).toBe(ErrorSeverity.CRITICAL);
    
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('includes context in logs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    errorLogger.logMedium('Test error', undefined, { userId: '123', action: 'test' });
    
    const logs = errorLogger.getLogs();
    expect(logs[0].context).toEqual({ userId: '123', action: 'test' });
    
    consoleSpy.mockRestore();
  });

  it('limits log history to maxLogs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Log more than maxLogs (100)
    for (let i = 0; i < 150; i++) {
      errorLogger.logMedium(`Error ${i}`);
    }
    
    const logs = errorLogger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(100);
    
    consoleSpy.mockRestore();
  });

  it('can be disabled', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    errorLogger.setEnabled(false);
    errorLogger.logMedium('Should not log');
    
    const logs = errorLogger.getLogs();
    expect(logs).toHaveLength(0);
    
    errorLogger.setEnabled(true);
    consoleSpy.mockRestore();
  });

  it('filters logs by severity', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    errorLogger.logLow('Low 1');
    errorLogger.logMedium('Medium 1');
    errorLogger.logHigh('High 1');
    errorLogger.logMedium('Medium 2');
    
    const mediumLogs = errorLogger.getLogsBySeverity(ErrorSeverity.MEDIUM);
    expect(mediumLogs).toHaveLength(2);
    expect(mediumLogs.every(log => log.severity === ErrorSeverity.MEDIUM)).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('gets recent logs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    for (let i = 0; i < 20; i++) {
      errorLogger.logMedium(`Error ${i}`);
    }
    
    const recentLogs = errorLogger.getRecentLogs(5);
    expect(recentLogs).toHaveLength(5);
    expect(recentLogs[recentLogs.length - 1].message).toBe('Error 19');
    
    consoleSpy.mockRestore();
  });

  it('clears logs', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    errorLogger.logMedium('Test');
    expect(errorLogger.getLogs()).toHaveLength(1);
    
    errorLogger.clearLogs();
    expect(errorLogger.getLogs()).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });
});







