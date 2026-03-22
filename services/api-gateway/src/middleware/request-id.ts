import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const existingId = req.headers['x-request-id'];
    const requestId = typeof existingId === 'string' ? existingId : randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  };
}
