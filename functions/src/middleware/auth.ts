import { createMiddleware } from 'hono/factory';
import { auth } from '../config/firebase';
import { HTTPException } from 'hono/http-exception';

export interface AuthUser {
  uid: string;
  email: string | undefined;
  emailVerified: boolean;
  role?: string;
  customClaims?: Record<string, any>;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Authorization header missing or invalid',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decodedToken = await auth.verifyIdToken(token);
    
    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken,
    };

    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new HTTPException(401, {
      message: 'Invalid or expired token',
    });
  }
});

// Optional auth middleware - doesn't throw if no token provided
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      const user: AuthUser = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false,
        customClaims: decodedToken,
      };

      c.set('user', user);
    } catch (error) {
      console.error('Optional token verification failed:', error);
      // Don't throw, just continue without user
    }
  }
  
  await next();
});

// Admin middleware - requires admin custom claim
export const adminMiddleware = createMiddleware(async (c, next) => {
  const user = c.get('user');
  
  if (!user) {
    throw new HTTPException(401, {
      message: 'Authentication required',
    });
  }

  const isAdmin = user.customClaims?.admin === true;
  
  if (!isAdmin) {
    throw new HTTPException(403, {
      message: 'Admin access required',
    });
  }

  await next();
});