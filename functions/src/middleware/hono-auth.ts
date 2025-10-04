import { Context } from 'hono';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Hono middleware for Firebase Auth verification
 */
export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
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
      const decodedToken = await getAuth().verifyIdToken(token);
      
      // Add user to context
      c.set('user', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      } as AuthUser);
      
      await next();
    } catch (tokenError) {
      logger.error('Token verification failed:', tokenError);
      return c.json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }, 401);
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return c.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Authentication failed'
    }, 500);
  }
};

/**
 * Optional auth middleware - continues even if no auth
 */
export const optionalAuthMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const authHeader = c.req.header('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        
        c.set('user', {
          uid: decodedToken.uid,
          email: decodedToken.email,
          email_verified: decodedToken.email_verified,
          name: decodedToken.name,
          picture: decodedToken.picture,
        } as AuthUser);
      } catch (tokenError) {
        // Don't fail for optional auth
        logger.warn('Optional auth token verification failed:', tokenError);
      }
    }
    
    await next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    await next(); // Continue anyway for optional auth
  }
};