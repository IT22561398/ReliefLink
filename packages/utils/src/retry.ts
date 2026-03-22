/**
 * Retry configuration
 */
export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000
};

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (config.shouldRetry && !config.shouldRetry(error)) {
        throw error;
      }

      // Last attempt, don't retry
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(error, attempt);
      }

      // Wait before retrying
      const delay = calculateBackoff(attempt, config.baseDelayMs, config.maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delayMs);
  }) as T;
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limitMs: number
): T {
  let lastRun = 0;

  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastRun >= limitMs) {
      lastRun = now;
      fn(...args);
    }
  }) as T;
}
