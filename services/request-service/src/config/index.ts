import { z } from 'zod';
import { loadEnv, getEnv, getEnvNumber, getEnvRequired } from '@relieflink/config';

loadEnv('../../.env');

const configSchema = z.object({
  port: z.number().int().positive(),
  env: z.enum(['development', 'staging', 'production', 'test']),
  jwt: z.object({
    secret: z.string().min(16)
  }),
  database: z.object({
    url: z.string()
  }),
  redis: z.object({
    url: z.string()
  }),
  services: z.object({
    notificationUrl: z.string()
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error'])
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = {
    port: getEnvNumber('PORT', 3002),
    env: getEnv('NODE_ENV', 'development') as Config['env'],
    jwt: {
      secret: getEnvRequired('JWT_SECRET')
    },
    database: {
      url: getEnvRequired('REQUEST_DATABASE_URL')
    },
    redis: {
      url: getEnv('REDIS_URL', 'redis://localhost:6379')
    },
    services: {
      notificationUrl: getEnv('NOTIFICATION_SERVICE_URL', 'http://localhost:3004')
    },
    logLevel: getEnv('LOG_LEVEL', 'info') as Config['logLevel']
  };

  return configSchema.parse(config);
}

export const config = loadConfig();
