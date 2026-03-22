import { z } from 'zod';

/**
 * Base service configuration schema
 */
export const baseServiceConfigSchema = z.object({
  port: z.number().int().positive(),
  host: z.string().default('0.0.0.0'),
  env: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

/**
 * Database configuration schema
 */
export const databaseConfigSchema = z.object({
  url: z.string().url(),
  maxConnections: z.number().int().positive().default(10),
  connectionTimeout: z.number().int().positive().default(30000)
});

/**
 * Redis configuration schema
 */
export const redisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().int().positive().default(6379),
  password: z.string().optional(),
  db: z.number().int().min(0).default(0),
  keyPrefix: z.string().optional()
});

/**
 * JWT configuration schema
 */
export const jwtConfigSchema = z.object({
  secret: z.string().min(32),
  expiresIn: z.string().default('1d'),
  refreshExpiresIn: z.string().default('7d'),
  issuer: z.string().optional(),
  audience: z.string().optional()
});

/**
 * CORS configuration schema
 */
export const corsConfigSchema = z.object({
  origin: z.union([z.string(), z.array(z.string())]).default('*'),
  credentials: z.boolean().default(true),
  methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
});

/**
 * Rate limit configuration schema
 */
export const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes
  max: z.number().int().positive().default(100)
});

/**
 * Service URLs configuration schema
 */
export const serviceUrlsSchema = z.object({
  authService: z.string().url(),
  requestService: z.string().url(),
  volunteerService: z.string().url(),
  notificationService: z.string().url(),
  configService: z.string().url().optional()
});

// Type exports
export type BaseServiceConfig = z.infer<typeof baseServiceConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type RedisConfig = z.infer<typeof redisConfigSchema>;
export type JwtConfig = z.infer<typeof jwtConfigSchema>;
export type CorsConfig = z.infer<typeof corsConfigSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;
export type ServiceUrlsConfig = z.infer<typeof serviceUrlsSchema>;
