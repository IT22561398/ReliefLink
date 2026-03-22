import { Logger } from 'winston';
import { runWithContext, generateRequestId, RequestContext } from './context';

// Inline Express types to avoid external dependency
interface Request {
  method: string;
  path: string;
  query: unknown;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { userId: string };
}

interface Response {
  statusCode: number;
  setHeader(name: string, value: string): void;
  on(event: string, callback: () => void): void;
}

type NextFunction = (error?: unknown) => void;

/**
 * Express request logging middleware
 */
export function createRequestLogger(logger: Logger) {
  return function requestLoggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
    const startTime = Date.now();

    // Set request ID header for downstream services
    res.setHeader('x-request-id', requestId);

    // Extract user ID from auth header if present (for logging context)
    const userId = req.user?.userId;

    const context: RequestContext = {
      requestId,
      userId,
      traceId: req.headers['x-trace-id'] as string,
      spanId: req.headers['x-span-id'] as string
    };

    // Log request
    logger.http('Incoming request', {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

      logger.log(logLevel, 'Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });

    // Run the rest of the request with context
    runWithContext(context, () => next());
  };
}

/**
 * Express error logging middleware
 */
export function createErrorLogger(logger: Logger) {
  return function errorLoggerMiddleware(
    error: Error,
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path
    });
    next(error);
  };
}
