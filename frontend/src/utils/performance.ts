/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Measure page load performance
   */
  measurePageLoad() {
    if (!this.enabled || typeof window === 'undefined' || !window.performance) {
      return;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics: PerformanceMetric[] = [
      {
        name: 'DNS Lookup',
        value: navigation.domainLookupEnd - navigation.domainLookupStart,
        unit: 'ms',
        timestamp: Date.now(),
      },
      {
        name: 'TCP Connection',
        value: navigation.connectEnd - navigation.connectStart,
        unit: 'ms',
        timestamp: Date.now(),
      },
      {
        name: 'TTFB (Time to First Byte)',
        value: navigation.responseStart - navigation.requestStart,
        unit: 'ms',
        timestamp: Date.now(),
      },
      {
        name: 'Download Time',
        value: navigation.responseEnd - navigation.responseStart,
        unit: 'ms',
        timestamp: Date.now(),
      },
      {
        name: 'DOM Processing',
        value: navigation.domComplete - navigation.domInteractive,
        unit: 'ms',
        timestamp: Date.now(),
      },
      {
        name: 'Page Load Time',
        value: navigation.loadEventEnd - navigation.fetchStart,
        unit: 'ms',
        timestamp: Date.now(),
      },
    ];

    this.metrics.push(...metrics);
    this.logMetrics(metrics);
  }

  /**
   * Measure component render time
   */
  measureComponent(componentName: string, renderFn: () => void) {
    if (!this.enabled) {
      renderFn();
      return;
    }

    const start = performance.now();
    renderFn();
    const end = performance.now();
    const duration = end - start;

    const metric: PerformanceMetric = {
      name: `Component: ${componentName}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Warn if component takes too long to render
    if (duration > 100) {
      console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Measure API call performance
   */
  measureApiCall(endpoint: string, duration: number) {
    const metric: PerformanceMetric = {
      name: `API: ${endpoint}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Warn if API call is slow
    if (duration > 2000) {
      console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name.includes(name));
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Log metrics to console
   */
  private logMetrics(metrics: PerformanceMetric[]) {
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Performance Metrics');
      metrics.forEach((metric) => {
        console.log(`${metric.name}: ${metric.value.toFixed(2)}${metric.unit}`);
      });
      console.groupEnd();
    }
  }

  /**
   * Send metrics to backend
   */
  async sendMetrics() {
    if (!this.enabled || this.metrics.length === 0) return;

    try {
      // Only send in production
      if (process.env.NODE_ENV === 'production') {
        // Uncomment when backend endpoint is ready
        // await fetch('/api/performance', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ metrics: this.metrics }),
        // });
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Measure page load on initialization
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    performanceMonitor.measurePageLoad();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.measurePageLoad();
    });
  }
}

export default performanceMonitor;







