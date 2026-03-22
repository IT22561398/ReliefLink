import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request context for correlation IDs
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
}

/**
 * Async local storage for request context
 */
export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Run function with request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
