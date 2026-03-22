import { Request, Response, NextFunction } from 'express';

interface ApiKeyConfig {
  header?: string;
  keys: string[];
}

/**
 * API Key authentication middleware factory
 * For internal service-to-service communication
 */
export function createApiKeyMiddleware(config: ApiKeyConfig) {
  const header = config.header || 'x-api-key';

  return function apiKeyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const apiKey = req.headers[header] as string | undefined;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required'
        }
      });
      return;
    }

    if (!config.keys.includes(apiKey)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Optional API key middleware - proceeds even without key
 */
export function createOptionalApiKeyMiddleware(config: ApiKeyConfig) {
  const header = config.header || 'x-api-key';

  return function optionalApiKeyMiddleware(
    req: Request & { isInternalRequest?: boolean },
    _res: Response,
    next: NextFunction
  ): void {
    const apiKey = req.headers[header] as string | undefined;

    if (apiKey && config.keys.includes(apiKey)) {
      req.isInternalRequest = true;
    }

    next();
  };
}
