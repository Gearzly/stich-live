"use strict";
/**
 * Standardized API Response Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = void 0;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
/**
 * Create a standardized success response
 */
function createSuccessResponse(data, message) {
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
function createErrorResponse(code, message, data) {
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
function createPaginatedResponse(data, pagination, message) {
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
exports.ERROR_CODES = {
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
};
//# sourceMappingURL=response.js.map