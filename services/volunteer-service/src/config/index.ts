import { z } from 'zod';
import { loadEnv, getEnv, getEnvNumber, getEnvRequired } from '@relieflink/config';

loadEnv('../../.env');

export const config = {
  port: getEnvNumber('PORT', 3003),
  env: getEnv('NODE_ENV', 'development'),
  jwt: { secret: getEnvRequired('JWT_SECRET') },
  database: { url: getEnvRequired('VOLUNTEER_DATABASE_URL') },
  redis: { url: getEnv('REDIS_URL', 'redis://localhost:6379') },
  services: {
    authUrl: getEnv('AUTH_SERVICE_URL', 'http://localhost:3001'),
    requestUrl: getEnv('REQUEST_SERVICE_URL', 'http://localhost:3002'),
    notificationUrl: getEnv('NOTIFICATION_SERVICE_URL', 'http://localhost:3004')
  },
  logLevel: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'
};
