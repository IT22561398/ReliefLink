import winston from 'winston';
import { getRequestContext } from './context';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export interface LoggerConfig {
  service: string;
  level?: LogLevel;
  pretty?: boolean;
}

/**
 * Custom format that includes request context
 */
const contextFormat = winston.format((info) => {
  const context = getRequestContext();
  if (context) {
    info.requestId = context.requestId;
    if (context.userId) info.userId = context.userId;
    if (context.traceId) info.traceId = context.traceId;
  }
  return info;
});

/**
 * JSON format for production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  contextFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Pretty format for development
 */
const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  contextFormat(),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} [${service}]${reqId}: ${message}${metaStr}`;
  })
);

/**
 * Create a Winston logger instance
 */
export function createLogger(config: LoggerConfig): winston.Logger {
  const { service, level = 'info', pretty = process.env.NODE_ENV !== 'production' } = config;

  return winston.createLogger({
    level,
    defaultMeta: { service },
    format: pretty ? prettyFormat : jsonFormat,
    transports: [
      new winston.transports.Console()
    ]
  });
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(
  parent: winston.Logger,
  meta: Record<string, unknown>
): winston.Logger {
  return parent.child(meta);
}
