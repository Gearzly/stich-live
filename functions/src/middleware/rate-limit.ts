import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { db } from '../config/firebase';
import { config } from '../config/env';

interface RateLimitData {
  count: number;
  resetTime: number;
}

export const rateLimiter = createMiddleware(async (c, next) => {
  // Skip rate limiting in development mode
  if (config.NODE_ENV === 'development') {
    await next();
    return;
  }

  const clientId = getClientId(c);
  const now = Date.now();
  const windowStart = now - config.RATE_LIMIT_WINDOW_MS;

  try {
    const rateLimitRef = db.collection('rate_limits').doc(clientId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      let rateLimitData: RateLimitData = {
        count: 0,
        resetTime: now + config.RATE_LIMIT_WINDOW_MS,
      };

      if (doc.exists) {
        const existingData = doc.data() as RateLimitData;
        
        // Reset if window has expired
        if (existingData.resetTime <= now) {
          rateLimitData = {
            count: 1,
            resetTime: now + config.RATE_LIMIT_WINDOW_MS,
          };
        } else {
          // Check if limit exceeded
          if (existingData.count >= config.RATE_LIMIT_MAX_REQUESTS) {
            const resetIn = Math.ceil((existingData.resetTime - now) / 1000);
            throw new HTTPException(429, {
              message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
            });
          }
          
          rateLimitData = {
            count: existingData.count + 1,
            resetTime: existingData.resetTime,
          };
        }
      } else {
        rateLimitData.count = 1;
      }

      transaction.set(rateLimitRef, rateLimitData);
      
      // Set rate limit headers
      c.header('X-RateLimit-Limit', config.RATE_LIMIT_MAX_REQUESTS.toString());
      c.header('X-RateLimit-Remaining', (config.RATE_LIMIT_MAX_REQUESTS - rateLimitData.count).toString());
      c.header('X-RateLimit-Reset', Math.ceil(rateLimitData.resetTime / 1000).toString());
    });

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    console.error('Rate limiting error:', error);
    // Continue on rate limiting errors to avoid blocking legitimate requests
    await next();
  }
});

function getClientId(c: any): string {
  // Use authenticated user ID if available
  const user = c.get('user');
  if (user?.uid) {
    return `user:${user.uid}`;
  }

  // Fall back to IP address
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

export const rateLimitMiddleware = rateLimiter;