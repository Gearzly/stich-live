import { Firestore } from 'firebase-admin/firestore';
import { createLogger } from '../utils/logger';
import { z } from 'zod';
/**
 * Custom error types following development rules
 */
export declare class ValidationError extends Error {
    field: string;
    code: string;
    constructor(message: string, field: string, code?: string);
}
export declare class NotFoundError extends Error {
    constructor(resource: string, id: string);
}
export declare class AuthenticationError extends Error {
    constructor(message?: string);
}
export declare class AuthorizationError extends Error {
    constructor(message?: string);
}
export declare class APIError extends Error {
    statusCode: number;
    code: string;
    details?: any | undefined;
    constructor(statusCode: number, message: string, code: string, details?: any | undefined);
}
/**
 * BaseService following development rules - all services MUST extend this
 * Provides standardized patterns for logging, database access, error handling, and validation
 */
export declare abstract class BaseService {
    protected logger: ReturnType<typeof createLogger>;
    protected db: Firestore;
    constructor();
    /**
     * Standardized error handling following development rules
     */
    protected handleError(error: Error, context: string): never;
    /**
     * Standardized input validation using Zod schemas
     */
    protected validateInput<T>(data: unknown, schema: z.ZodSchema<T>): T;
    /**
     * Standardized success response format
     */
    protected createSuccessResponse<T>(data: T, meta?: any): {
        success: boolean;
        data: T;
        meta: any;
    };
    /**
     * Standardized error response format
     */
    protected createErrorResponse(code: string, message: string, details?: any): {
        success: boolean;
        error: {
            code: string;
            message: string;
            details: any;
        };
        meta: {
            timestamp: string;
        };
    };
}
//# sourceMappingURL=BaseService.d.ts.map