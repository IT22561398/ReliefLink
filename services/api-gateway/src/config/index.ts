import { loadEnv, getEnv, getEnvNumber } from '@relieflink/config';

loadEnv('../../.env');

export const config = {
  port: getEnvNumber('API_GATEWAY_PORT', 3005),
  env: getEnv('NODE_ENV', 'development'),
  logLevel: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',

  services: {
    auth: getEnv('AUTH_SERVICE_URL', 'http://localhost:3001'),
    request: getEnv('REQUEST_SERVICE_URL', 'http://localhost:3002'),
    volunteer: getEnv('VOLUNTEER_SERVICE_URL', 'http://localhost:3003'),
    notification: getEnv('NOTIFICATION_SERVICE_URL', 'http://localhost:3004'),
    config: getEnv('CONFIG_SERVICE_URL', 'http://localhost:3006')
  },

  configToken: getEnv('CONFIG_SERVICE_TOKEN', ''),

  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100)
  },

  circuitBreaker: {
    failureThreshold: getEnvNumber('CIRCUIT_BREAKER_THRESHOLD', 5),
    resetTimeout: getEnvNumber('CIRCUIT_BREAKER_RESET_MS', 30000)
  },

  cors: {
    origin: getEnv('CORS_ORIGIN', '*'),
    credentials: getEnv('CORS_CREDENTIALS', 'true') === 'true'
  }
};
