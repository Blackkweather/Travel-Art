/**
 * Debug utilities for tracking API calls and data flow
 */

interface ApiLog {
  timestamp: string;
  endpoint: string;
  method: string;
  status?: number;
  duration: number;
  error?: string;
  dataSize?: number;
}

const logs: ApiLog[] = [];

export const debugApi = {
  // Log API calls
  log: (endpoint: string, method: string, status?: number, duration: number = 0, error?: string, dataSize?: number) => {
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      status,
      duration,
      error,
      dataSize
    };
    logs.push(log);
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.shift();
    }

    console.log(`[API Debug] ${method} ${endpoint} - ${status || 'pending'} (${duration}ms)`, error || '');
  },

  // Get all logs
  getLogs: () => logs,

  // Clear logs
  clear: () => {
    logs.length = 0;
  },

  // Export logs as JSON
  export: () => {
    return JSON.stringify(logs, null, 2);
  },

  // Print summary
  summary: () => {
    console.table(logs);
  },

  // Check API health
  checkHealth: async () => {
    try {
      const response = await fetch('http://localhost:4000/api/health');
      const data = await response.json();
      console.log('Backend Health Check:', data);
      return data;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return { status: 'error', error: String(error) };
    }
  }
};

// Make it globally accessible in browser console
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_API__ = debugApi;
}

export default debugApi;
