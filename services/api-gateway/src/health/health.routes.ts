import { Router } from 'express';
import { createLogger } from '@relieflink/logger';
import { config } from '../config/index.js';
import { getServiceUrls } from '../proxy/proxy.service.js';
import { getCircuitStatus } from '../middleware/circuit-breaker.js';

const logger = createLogger({ service: 'api-gateway', level: config.logLevel });

interface ServiceHealth {
  status: 'ok' | 'down' | 'unknown';
  latency?: number;
}

async function checkServiceHealth(url: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    return {
      status: response.ok ? 'ok' : 'down',
      latency: Date.now() - start
    };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
}

export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const urls = getServiceUrls();

    const [auth, request, volunteer, notification, configService] = await Promise.all([
      checkServiceHealth(urls.auth),
      checkServiceHealth(urls.request),
      checkServiceHealth(urls.volunteer),
      checkServiceHealth(urls.notification),
      checkServiceHealth(urls.config)
    ]);

    const allHealthy = [auth, request, volunteer, notification].every(s => s.status === 'ok');

    res.status(allHealthy ? 200 : 503).json({
      service: 'api-gateway',
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        auth,
        request,
        volunteer,
        notification,
        config: configService
      }
    });
  });

  router.get('/health/live', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/health/ready', async (_req, res) => {
    const urls = getServiceUrls();
    const coreServices = [urls.auth, urls.request, urls.volunteer, urls.notification];

    const checks = await Promise.all(coreServices.map(url => checkServiceHealth(url)));
    const ready = checks.some(s => s.status === 'ok');

    res.status(ready ? 200 : 503).json({
      ready,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/health/circuits', (_req, res) => {
    res.json({
      circuits: getCircuitStatus(),
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
