import dotenv from 'dotenv';
import { z, ZodSchema, ZodError } from 'zod';
import path from 'path';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Load environment variables from .env files
 */
export function loadEnv(envPath?: string): void {
  const envFile = envPath || path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envFile });
}

/**
 * Get required environment variable
 */
export function getEnvRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get environment variable as number
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment variable as boolean
 */
export function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV || 'development';
  const validEnvs: Environment[] = ['development', 'staging', 'production', 'test'];
  return validEnvs.includes(env as Environment) ? (env as Environment) : 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvironment() === 'test';
}

/**
 * Parse and validate configuration with Zod schema
 */
export function parseConfig<T>(schema: ZodSchema<T>, envVars: Record<string, unknown>): T {
  try {
    return schema.parse(envVars);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Configuration validation failed:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Create a configuration loader function
 */
export function createConfigLoader<T>(schema: ZodSchema<T>, envMapping: (env: NodeJS.ProcessEnv) => Record<string, unknown>) {
  return function loadConfig(): T {
    return parseConfig(schema, envMapping(process.env));
  };
}
