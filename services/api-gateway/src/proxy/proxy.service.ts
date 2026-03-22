import { Request, Response } from 'express';
import { createLogger } from '@relieflink/logger';
import { config } from '../config/index.js';
import { isCircuitOpen, recordSuccess, recordFailure } from '../middleware/circuit-breaker.js';

const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

type ServiceKey = keyof typeof config.services;

interface RouteConfig {
  patterns: string[];
  service: ServiceKey;
}

const routeConfigs: RouteConfig[] = [
  { patterns: ['/api/v1/auth', '/api/v1/users'], service: 'auth' },
  { patterns: ['/api/v1/requests'], service: 'request' },
  { patterns: ['/api/v1/volunteers', '/api/v1/resources', '/api/v1/assignments'], service: 'volunteer' },
  { patterns: ['/api/v1/notifications', '/api/v1/status-events'], service: 'notification' },
  { patterns: ['/api/v1/config'], service: 'config' }
];

let serviceUrls = { ...config.services };

export function getServiceUrls(): typeof serviceUrls {
  return { ...serviceUrls };
}

export async function refreshServiceUrls(): Promise<void> {
  if (!config.services.config) return;

  try {
    const response = await fetch(`${config.services.config}/api/v1/config/internal`, {
      headers: config.configToken ? { 'x-config-token': config.configToken } : {},
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return;

    const payload = await response.json() as {
      serviceUrls: {
        authServiceUrl: string;
        requestServiceUrl: string;
        volunteerServiceUrl: string;
        notificationServiceUrl: string;
      };
    };

    serviceUrls = {
      ...serviceUrls,
      auth: payload.serviceUrls.authServiceUrl,
      request: payload.serviceUrls.requestServiceUrl,
      volunteer: payload.serviceUrls.volunteerServiceUrl,
      notification: payload.serviceUrls.notificationServiceUrl
    };

    logger.debug('Service URLs refreshed from config server');
  } catch (error) {
    logger.debug('Config server unavailable, using environment config');
  }
}

function resolveService(pathname: string): { service: ServiceKey; url: string } | null {
  for (const config of routeConfigs) {
    for (const pattern of config.patterns) {
      if (pathname.startsWith(pattern)) {
        return { service: config.service, url: serviceUrls[config.service] };
      }
    }
  }
  return null;
}

function buildForwardHeaders(req: Request): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;

    const lowerKey = key.toLowerCase();
    if (lowerKey === 'host' || lowerKey === 'content-length') continue;

    if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    } else {
      headers.set(key, value);
    }
  }

  if (req.requestId) {
    headers.set('X-Request-Id', req.requestId);
  }

  const clientIp = req.ip || req.socket.remoteAddress;
  if (clientIp) {
    headers.set('X-Forwarded-For', clientIp);
  }

  return headers;
}

function buildRequestBody(req: Request): string | undefined {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return undefined;
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return undefined;
  }

  return JSON.stringify(req.body);
}

export async function proxyRequest(req: Request, res: Response): Promise<void> {
  const target = resolveService(req.path);
  const startTime = Date.now();

  if (!target) {
    res.status(404).json({
      success: false,
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found in API gateway' }
    });
    return;
  }

  if (isCircuitOpen(target.service)) {
    logger.warn('Circuit breaker open', { service: target.service, path: req.path });
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: `Service ${target.service} is temporarily unavailable`
      }
    });
    return;
  }

  const targetUrl = new URL(req.originalUrl, target.url);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: buildForwardHeaders(req),
      body: buildRequestBody(req),
      signal: AbortSignal.timeout(30000)
    });

    recordSuccess(target.service);

    const duration = Date.now() - startTime;
    logger.debug('Request proxied', {
      service: target.service,
      method: req.method,
      path: req.path,
      status: response.status,
      duration
    });

    res.status(response.status);

    for (const [key, value] of response.headers.entries()) {
      if (!['transfer-encoding', 'content-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    const body = await response.text();
    res.send(body);
  } catch (error) {
    recordFailure(target.service);

    const duration = Date.now() - startTime;
    logger.error('Proxy request failed', {
      service: target.service,
      method: req.method,
      path: req.path,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof Error && error.name === 'TimeoutError') {
      res.status(504).json({
        success: false,
        error: { code: 'GATEWAY_TIMEOUT', message: 'Upstream service timeout' }
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: { code: 'BAD_GATEWAY', message: 'Failed to reach upstream service' }
    });
  }
}
