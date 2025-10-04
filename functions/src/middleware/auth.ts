/**
 * Authentication Middleware
 * Handles JWT tokens, Firebase Auth, and user verification
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from '../config';
import { logger } from 'firebase-functions';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
  userId?: string;
}

/**
 * Middleware to verify Firebase ID tokens
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (token) {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          req.user = decodedToken;
          req.userId = decodedToken.uid;
        } catch (error) {
          // Token is invalid, but that's okay for optional auth
          logger.warn('Invalid token in optional auth:', error);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue anyway
  }
};

/**
 * Admin-only middleware
 * Requires admin role in custom claims
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
  } catch (error) {
    logger.error('Admin check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Premium user middleware
 * Requires premium subscription
 */
export const requirePremium = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
  } catch (error) {
    logger.error('Premium check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Resource ownership middleware
 * Checks if user owns the requested resource
 */
export const checkResourceOwnership = (resourceIdParam: string = 'id') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      
    } catch (error) {
      logger.error('Resource ownership check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * API key authentication middleware
 * Alternative authentication method using API keys
 */
export const verifyApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
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
    logger.info('API key authentication requested');
    
    next();
  } catch (error) {
    logger.error('API key verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key'
    });
  }
};

/**
 * Rate limiting middleware for authenticated users
 * Different limits based on user tier
 */
export const rateLimitByUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    
    logger.info(`Rate limiting check for user ${userId} (${tier} tier)`);
    
    next();
  } catch (error) {
    logger.error('Rate limiting failed:', error);
    next(); // Don't block on rate limiting errors
  }
};

export default {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requirePremium,
  checkResourceOwnership,
  verifyApiKey,
  rateLimitByUser
};
