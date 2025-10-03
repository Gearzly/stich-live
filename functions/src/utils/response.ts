/**
 * Response utility functions for standardized API responses
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, meta?: any): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(code: string, message: string, details?: any): APIResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Creates a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T[], 
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
): APIResponse<{ data: T[]; pagination: typeof pagination }> {
  return createSuccessResponse({ data, pagination });
}