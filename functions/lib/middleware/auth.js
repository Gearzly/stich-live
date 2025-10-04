"use strict";
/**
 * Authentication Middleware
 * Handles JWT tokens, Firebase Auth, and user verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByUser = exports.verifyApiKey = exports.checkResourceOwnership = exports.requirePremium = exports.requireAdmin = exports.optionalAuth = exports.verifyToken = void 0;
const config_1 = require("../config");
const firebase_functions_1 = require("firebase-functions");
/**
 * Middleware to verify Firebase ID tokens
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided'
            });
            return;
        }
        const token = authHeader.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: Invalid token format'
            });
            return;
        }
        // Verify the Firebase ID token
        const decodedToken = await config_1.auth.verifyIdToken(token);
        req.user = decodedToken;
        req.userId = decodedToken.uid;
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Token verification failed:', error);
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid token'
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            if (token) {
                try {
                    const decodedToken = await config_1.auth.verifyIdToken(token);
                    req.user = decodedToken;
                    req.userId = decodedToken.uid;
                }
                catch (error) {
                    // Token is invalid, but that's okay for optional auth
                    firebase_functions_1.logger.warn('Invalid token in optional auth:', error);
                }
            }
        }
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Optional auth middleware error:', error);
        next(); // Continue anyway
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Admin-only middleware
 * Requires admin role in custom claims
 */
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: Authentication required'
            });
            return;
        }
        const customClaims = req.user.customClaims || {};
        if (!customClaims.admin) {
            res.status(403).json({
                success: false,
                error: 'Forbidden: Admin access required'
            });
            return;
        }
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Admin check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.requireAdmin = requireAdmin;
/**
 * Premium user middleware
 * Requires premium subscription
 */
const requirePremium = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: Authentication required'
            });
            return;
        }
        const customClaims = req.user.customClaims || {};
        if (!customClaims.premium && !customClaims.admin) {
            res.status(403).json({
                success: false,
                error: 'Forbidden: Premium subscription required'
            });
            return;
        }
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Premium check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.requirePremium = requirePremium;
/**
 * Resource ownership middleware
 * Checks if user owns the requested resource
 */
const checkResourceOwnership = (resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized: Authentication required'
                });
                return;
            }
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.uid;
            // This would typically check the database to verify ownership
            // For now, we'll implement a basic check
            // In practice, you'd query Firestore to verify the resource belongs to the user
            // Skip ownership check for admins
            const customClaims = req.user.customClaims || {};
            if (customClaims.admin) {
                next();
                return;
            }
            // TODO: Implement actual ownership check against database
            // For now, assume ownership is valid
            next();
        }
        catch (error) {
            firebase_functions_1.logger.error('Resource ownership check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.checkResourceOwnership = checkResourceOwnership;
/**
 * API key authentication middleware
 * Alternative authentication method using API keys
 */
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: API key required'
            });
            return;
        }
        // TODO: Implement API key validation against database
        // This would query the apiKeys collection to validate the key
        // and get associated user information
        // For now, we'll use a placeholder implementation
        firebase_functions_1.logger.info('API key authentication requested');
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('API key verification failed:', error);
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid API key'
        });
    }
};
exports.verifyApiKey = verifyApiKey;
/**
 * Rate limiting middleware for authenticated users
 * Different limits based on user tier
 */
const rateLimitByUser = async (req, res, next) => {
    try {
        if (!req.user) {
            next();
            return;
        }
        const customClaims = req.user.customClaims || {};
        const userId = req.user.uid;
        // Get user tier and apply appropriate rate limits
        const tier = customClaims.premium ? 'premium' : 'free';
        // TODO: Implement actual rate limiting logic
        // This would track requests per user and enforce limits
        firebase_functions_1.logger.info(`Rate limiting check for user ${userId} (${tier} tier)`);
        next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Rate limiting failed:', error);
        next(); // Don't block on rate limiting errors
    }
};
exports.rateLimitByUser = rateLimitByUser;
exports.default = {
    verifyToken: exports.verifyToken,
    optionalAuth: exports.optionalAuth,
    requireAdmin: exports.requireAdmin,
    requirePremium: exports.requirePremium,
    checkResourceOwnership: exports.checkResourceOwnership,
    verifyApiKey: exports.verifyApiKey,
    rateLimitByUser: exports.rateLimitByUser
};
//# sourceMappingURL=auth.js.map