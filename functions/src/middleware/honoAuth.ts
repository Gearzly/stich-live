import { Context, Next } from 'hono';
import { auth } from '../config';
import { logger } from 'firebase-functions';

/**
 * Hono authentication middleware
 * Verifies Firebase ID tokens and adds user to context
 */
export const honoAuthMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Unauthorized: No token provided'
      }, 401);
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return c.json({
        success: false,
        error: 'Unauthorized: Invalid token format'
      }, 401);
    }
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    c.set('user', decodedToken);
    c.set('userId', decodedToken.uid);
    
    await next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return c.json({
      success: false,
      error: 'Unauthorized: Invalid token'
    }, 401);
  }
};

/**
 * Optional Hono authentication middleware
 * Adds user info if token is present but doesn't require it
 */
export const honoOptionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (token) {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          c.set('user', decodedToken);
          c.set('userId', decodedToken.uid);
        } catch (error) {
          // Token is invalid, but that's okay for optional auth
          logger.warn('Invalid token in optional auth:', error);
        }
      }
    }
    
    await next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    await next(); // Continue anyway
  }
};

/**
 * Admin-only Hono middleware
 * Requires admin role in custom claims
 */
export const honoRequireAdmin = async (c: Context, next: Next) => {
  try {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Unauthorized: No user context'
      }, 401);
    }
    
    const customClaims = user.customClaims || {};
    
    if (!customClaims.admin) {
      return c.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, 403);
    }
    
    await next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
};

export default honoAuthMiddleware;