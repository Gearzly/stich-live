/**
 * Response utility functions for standardized API responses
 */
/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data, meta) {
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
export function createErrorResponse(code, message, details) {
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
export function createPaginatedResponse(data, pagination) {
    return createSuccessResponse({ data, pagination });
}
//# sourceMappingURL=response.js.map