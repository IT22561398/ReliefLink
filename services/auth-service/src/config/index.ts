import { z } from 'zod';
import { loadEnv, getEnv, getEnvNumber, getEnvRequired } from '@relieflink/config';

// Load environment variables
loadEnv('../../.env');

const configSchema = z.object({
  port: z.number().int().positive(),
  env: z.enum(['development', 'staging', 'production', 'test']),
  jwt: z.object({
    secret: z.string().min(16),
    expiresIn: z.string(),
    refreshExpiresIn: z.string()
  }),
  database: z.object({
    url: z.string().url()
  }),
  redis: z.object({
    url: z.string()
  }),
  services: z.object({
    volunteerUrl: z.string().url()
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error'])
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = {
    port: getEnvNumber('PORT', 3001),
    env: getEnv('NODE_ENV', 'development') as Config['env'],
    jwt: {
      secret: getEnvRequired('JWT_SECRET'),
      expiresIn: getEnv('JWT_EXPIRES_IN', '1d'),
      refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d')
    },
    database: {
      url: getEnvRequired('AUTH_DATABASE_URL')
    },
    redis: {
      url: getEnv('REDIS_URL', 'redis://localhost:6379')
    },
    services: {
      volunteerUrl: getEnv('VOLUNTEER_SERVICE_URL', 'http://localhost:3003')
    },
    logLevel: getEnv('LOG_LEVEL', 'info') as Config['logLevel']
  };

  return configSchema.parse(config);
}

export const config = loadConfig();
