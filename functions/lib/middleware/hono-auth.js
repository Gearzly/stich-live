"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const auth_1 = require("firebase-admin/auth");
const firebase_functions_1 = require("firebase-functions");
/**
 * Hono middleware for Firebase Auth verification
 */
const authMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Authorization header missing or invalid'
            }, 401);
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        try {
            const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
            // Add user to context
            c.set('user', {
                uid: decodedToken.uid,
                email: decodedToken.email,
                email_verified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture,
            });
            await next();
        }
        catch (tokenError) {
            firebase_functions_1.logger.error('Token verification failed:', tokenError);
            return c.json({
                success: false,
                error: 'UNAUTHORIZED',
                message: 'Invalid or expired token'
            }, 401);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('Auth middleware error:', error);
        return c.json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Authentication failed'
        }, 500);
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Optional auth middleware - continues even if no auth
 */
const optionalAuthMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
                c.set('user', {
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    email_verified: decodedToken.email_verified,
                    name: decodedToken.name,
                    picture: decodedToken.picture,
                });
            }
            catch (tokenError) {
                // Don't fail for optional auth
                firebase_functions_1.logger.warn('Optional auth token verification failed:', tokenError);
            }
        }
        await next();
    }
    catch (error) {
        firebase_functions_1.logger.error('Optional auth middleware error:', error);
        await next(); // Continue anyway for optional auth
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=hono-auth.js.map