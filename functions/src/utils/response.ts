/**
 * Standardized API Response Utilities
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): APIResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: Date.now(),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(code: string, message: string, data?: any): APIResponse {
  return {
    success: false,
    error: message,
    code,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): PaginatedResponse<T[]> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return {
    success: true,
    data,
    message,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    timestamp: Date.now(),
  };
}

/**
 * Common error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  GENERATION_FAILED: 'GENERATION_FAILED',
} as const;
