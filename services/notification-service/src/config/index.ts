import { loadEnv, getEnv, getEnvNumber, getEnvRequired } from '@relieflink/config';

loadEnv('../../.env');

export const config = {
  port: getEnvNumber('PORT', 3004),
  env: getEnv('NODE_ENV', 'development'),
  database: { url: getEnvRequired('NOTIFICATION_DATABASE_URL') },
  redis: { url: getEnv('REDIS_URL', 'redis://localhost:6379') },
  logLevel: getEnv('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'
};
