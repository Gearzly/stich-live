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
export declare function createSuccessResponse<T>(data: T, meta?: any): APIResponse<T>;
/**
 * Creates a standardized error response
 */
export declare function createErrorResponse(code: string, message: string, details?: any): APIResponse;
/**
 * Creates a paginated success response
 */
export declare function createPaginatedResponse<T>(data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}): APIResponse<{
    data: T[];
    pagination: typeof pagination;
}>;
//# sourceMappingURL=response.d.ts.map