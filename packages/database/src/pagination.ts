import { PaginationParams, PaginatedResponse } from '@relieflink/types';

/**
 * Database health check result
 */
export interface DatabaseHealthCheck {
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}

/**
 * Pagination options for database queries
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Parse pagination params to database options
 */
export function parsePagination(params: PaginationParams): PaginationOptions {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}

/**
 * Parse sort params for Prisma orderBy
 */
export function parseSort(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  allowedFields: string[] = []
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sortBy) return undefined;

  // Validate field is allowed
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return undefined;
  }

  return { [sortBy]: sortOrder || 'desc' };
}

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(
  queryFn: () => Promise<unknown>
): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();

  try {
    await queryFn();
    return {
      status: 'ok',
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
