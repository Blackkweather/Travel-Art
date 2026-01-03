/**
 * Retry utility for failed API requests
 * Implements exponential backoff strategy
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error: any, retryableStatusCodes: number[]): boolean => {
  // Network errors (no response)
  if (!error.response) {
    return true;
  }

  // Check status code
  const status = error.response?.status;
  return status ? retryableStatusCodes.includes(status) : false;
};

/**
 * Calculate delay for next retry attempt
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt >= opts.maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, opts.retryableStatusCodes)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Call onRetry callback
      opts.onRetry(attempt, error);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Retry decorator for async functions
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) => {
    return retry(() => fn(...args), options);
  }) as T;
}






