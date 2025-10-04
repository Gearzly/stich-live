"use strict";
/**
 * Common Middleware
 * Shared middleware functions for all API routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTime = exports.apiVersion = exports.requestSizeLimit = exports.healthCheck = exports.notFoundHandler = exports.errorHandler = exports.validateContentType = exports.loggingMiddleware = exports.aiRateLimitMiddleware = exports.rateLimitMiddleware = exports.securityMiddleware = exports.corsMiddleware = void 0;
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("../config");
/**
 * CORS middleware configuration
 */
const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = config_1.config.cors.origin;
    if (allowedOrigins.includes(origin || '')) {
        res.setHeader('Access-Control-Allow-Origin', origin || '');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key,X-Requested-With,Accept,Origin');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
/**
 * Security headers middleware
 */
const securityMiddleware = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.securityMiddleware = securityMiddleware;
/**
 * Simple rate limiting middleware
 */
const requestCounts = new Map();
const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = config_1.config.rateLimit.windowMs;
    const max = config_1.config.rateLimit.max;
    const current = requestCounts.get(ip);
    if (!current || now > current.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
        next();
        return;
    }
    if (current.count >= max) {
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later'
        });
        return;
    }
    current.count++;
    next();
};
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Strict rate limiting for AI generation endpoints
 */
const aiRateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `ai_${ip}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const max = 10; // 10 requests per hour
    const current = requestCounts.get(key);
    if (!current || now > current.resetTime) {
        requestCounts.set(key, { count: 1, resetTime: now + windowMs });
        next();
        return;
    }
    if (current.count >= max) {
        res.status(429).json({
            success: false,
            error: 'AI generation rate limit exceeded. Please try again later.'
        });
        return;
    }
    current.count++;
    next();
};
exports.aiRateLimitMiddleware = aiRateLimitMiddleware;
/**
 * Request logging middleware
 */
const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('User-Agent') || 'Unknown';
    // Log request
    firebase_functions_1.logger.info(`${method} ${url}`, {
        ip,
        userAgent,
        timestamp: new Date().toISOString()
    });
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        firebase_functions_1.logger.info(`${method} ${url} ${statusCode}`, {
            duration,
            statusCode,
            ip,
            timestamp: new Date().toISOString()
        });
    });
    next();
};
exports.loggingMiddleware = loggingMiddleware;
/**
 * Request validation middleware
 */
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            res.status(400).json({
                success: false,
                error: 'Content-Type must be application/json'
            });
            return;
        }
    }
    next();
};
exports.validateContentType = validateContentType;
/**
 * Error handling middleware
 */
const errorHandler = (error, req, res, next) => {
    firebase_functions_1.logger.error('Unhandled error:', error);
    // Don't leak error details in production
    const isDev = config_1.config.analytics.enableDetailedLogging;
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        ...(isDev && { details: error.message, stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Health check middleware
 */
const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
};
exports.healthCheck = healthCheck;
/**
 * Request size limiting middleware
 */
const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxBytes = parseSize(maxSize);
        if (contentLength > maxBytes) {
            res.status(413).json({
                success: false,
                error: `Request size exceeds limit of ${maxSize}`
            });
            return;
        }
        next();
    };
};
exports.requestSizeLimit = requestSizeLimit;
/**
 * API version middleware
 */
const apiVersion = (version = 'v1') => {
    return (req, res, next) => {
        res.setHeader('API-Version', version);
        next();
    };
};
exports.apiVersion = apiVersion;
/**
 * Response time middleware
 */
const responseTime = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        res.setHeader('X-Response-Time', `${duration}ms`);
    });
    next();
};
exports.responseTime = responseTime;
// Helper function to parse size strings
const parseSize = (size) => {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
    };
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match)
        return 0;
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(value * units[unit]);
};
exports.default = {
    corsMiddleware: exports.corsMiddleware,
    securityMiddleware: exports.securityMiddleware,
    rateLimitMiddleware: exports.rateLimitMiddleware,
    aiRateLimitMiddleware: exports.aiRateLimitMiddleware,
    loggingMiddleware: exports.loggingMiddleware,
    validateContentType: exports.validateContentType,
    errorHandler: exports.errorHandler,
    notFoundHandler: exports.notFoundHandler,
    healthCheck: exports.healthCheck,
    requestSizeLimit: exports.requestSizeLimit,
    apiVersion: exports.apiVersion,
    responseTime: exports.responseTime
};
//# sourceMappingURL=common.js.map