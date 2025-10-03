import { getFirestore } from 'firebase-admin/firestore';
import { createLogger } from '../utils/logger';
import { z } from 'zod';
/**
 * Custom error types following development rules
 */
export class ValidationError extends Error {
    field;
    code;
    constructor(message, field, code = 'VALIDATION_ERROR') {
        super(message);
        this.field = field;
        this.code = code;
        this.name = 'ValidationError';
    }
}
export class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`);
        this.name = 'NotFoundError';
    }
}
export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
    }
}
export class APIError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'APIError';
    }
}
/**
 * BaseService following development rules - all services MUST extend this
 * Provides standardized patterns for logging, database access, error handling, and validation
 */
export class BaseService {
    logger;
    db;
    constructor() {
        this.logger = createLogger(this.constructor.name);
        this.db = getFirestore();
    }
    /**
     * Standardized error handling following development rules
     */
    handleError(error, context) {
        this.logger.error(`${context}: ${error.message}`, error);
        if (error instanceof ValidationError) {
            throw new APIError(400, error.message, 'VALIDATION_ERROR', { field: error.field });
        }
        if (error instanceof NotFoundError) {
            throw new APIError(404, error.message, 'NOT_FOUND');
        }
        if (error instanceof AuthenticationError) {
            throw new APIError(401, error.message, 'AUTHENTICATION_ERROR');
        }
        if (error instanceof AuthorizationError) {
            throw new APIError(403, error.message, 'AUTHORIZATION_ERROR');
        }
        // Default to internal server error
        throw new APIError(500, 'Internal server error', 'INTERNAL_ERROR');
    }
    /**
     * Standardized input validation using Zod schemas
     */
    validateInput(data, schema) {
        try {
            return schema.parse(data);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const firstError = error.errors[0];
                if (firstError) {
                    throw new ValidationError(`${firstError.path.join('.')}: ${firstError.message}`, firstError.path.join('.'));
                }
                throw new ValidationError('Validation failed', 'unknown');
            }
            throw error;
        }
    }
    /**
     * Standardized success response format
     */
    createSuccessResponse(data, meta) {
        return {
            success: true,
            data,
            meta: {
                ...meta,
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * Standardized error response format
     */
    createErrorResponse(code, message, details) {
        return {
            success: false,
            error: { code, message, details },
            meta: {
                timestamp: new Date().toISOString()
            }
        };
    }
}
//# sourceMappingURL=BaseService.js.map