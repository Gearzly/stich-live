/**
 * Rate Limiting Middleware and Utilities
 * Implements various rate limiting strategies for API endpoints and user actions
 */

import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Rate limit configuration types
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
  standardHeaders?: boolean; // Add standard rate limit headers
  legacyHeaders?: boolean; // Add legacy headers
  onLimitReached?: (req: Request, res: Response) => void; // Callback when limit reached
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface UserRateLimit {
  userId: string;
  endpoint: string;
  count: number;
  windowStart: number;
  lastRequest: number;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = await this.get(key);
    
    if (!existing) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      await this.set(key, newEntry);
      return newEntry;
    }
    
    existing.count++;
    await this.set(key, existing);
    return existing;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Firestore-based rate limiting for persistence
class FirestoreRateLimitStore {
  private db = getFirestore();
  private collection = 'rate_limits';

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const doc = await this.db.collection(this.collection).doc(key).get();
      if (!doc.exists) return null;
      
      const data = doc.data() as RateLimitEntry;
      if (Date.now() > data.resetTime) {
        await this.db.collection(this.collection).doc(key).delete();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting rate limit from Firestore:', error);
      return null;
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const docRef = this.db.collection(this.collection).doc(key);
    
    try {
      const result = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        if (!doc.exists || now > (doc.data()?.resetTime || 0)) {
          const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + windowMs,
            firstRequest: now
          };
          transaction.set(docRef, newEntry);
          return newEntry;
        }
        
        const existing = doc.data() as RateLimitEntry;
        existing.count++;
        transaction.update(docRef, { count: existing.count });
        return existing;
      });
      
      return result;
    } catch (error) {
      console.error('Error incrementing rate limit in Firestore:', error);
      throw error;
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private store: MemoryStore | FirestoreRateLimitStore;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig, useFirestore = false) {
    this.store = useFirestore ? new FirestoreRateLimitStore() : new MemoryStore();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later.',
      standardHeaders: config.standardHeaders !== false,
      legacyHeaders: config.legacyHeaders || false,
      onLimitReached: config.onLimitReached || (() => {})
    };
  }

  // Express middleware
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator(req);
        const entry = await this.store.increment(key, this.config.windowMs);
        
        // Add headers
        if (this.config.standardHeaders) {
          res.set({
            'RateLimit-Limit': this.config.maxRequests.toString(),
            'RateLimit-Remaining': Math.max(0, this.config.maxRequests - entry.count).toString(),
            'RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
          });
        }
        
        if (this.config.legacyHeaders) {
          res.set({
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - entry.count).toString(),
            'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
          });
        }
        
        // Check if limit exceeded
        if (entry.count > this.config.maxRequests) {
          this.config.onLimitReached(req, res);
          
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: this.config.message,
            retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
          });
          return;
        }
        
        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || 'unknown';
  }

  // Check rate limit without incrementing
  async check(key: string): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const entry = await this.store.get(key);
    if (!entry) {
      return {
        allowed: true,
        resetTime: Date.now() + this.config.windowMs,
        remaining: this.config.maxRequests
      };
    }
    
    return {
      allowed: entry.count < this.config.maxRequests,
      resetTime: entry.resetTime,
      remaining: Math.max(0, this.config.maxRequests - entry.count)
    };
  }
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.'
  }),

  // Authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => {
      const email = req.body?.email || req.ip;
      return `auth:${email}`;
    },
    message: 'Too many authentication attempts, please try again later.'
  }),

  // Password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req) => {
      const email = req.body?.email || req.ip;
      return `password_reset:${email}`;
    },
    message: 'Too many password reset attempts, please try again later.'
  }),

  // App generation (expensive operation)
  appGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req) => {
      return `app_generation:${req.user?.uid || req.ip}`;
    },
    message: 'Too many app generation requests, please try again later.'
  }),

  // File uploads
  fileUpload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyGenerator: (req) => {
      return `file_upload:${req.user?.uid || req.ip}`;
    },
    message: 'Too many file upload requests, please try again later.'
  }),

  // Chat/AI interactions
  chat: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    keyGenerator: (req) => {
      return `chat:${req.user?.uid || req.ip}`;
    },
    message: 'Too many chat requests, please try again later.'
  }),

  // Admin operations
  admin: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    keyGenerator: (req) => {
      return `admin:${req.user?.uid || req.ip}`;
    },
    message: 'Admin rate limit exceeded.'
  })
};

// User-specific rate limiting with authentication
export const createUserRateLimiter = (config: RateLimitConfig) => {
  const limiter = new RateLimiter({
    ...config,
    keyGenerator: (req) => {
      const userId = req.user?.uid;
      if (!userId) {
        throw new Error('Authentication required for user rate limiting');
      }
      return `user:${userId}:${req.route?.path || req.path}`;
    }
  });

  return limiter.middleware();
};

// IP-based rate limiting
export const createIPRateLimiter = (config: RateLimitConfig) => {
  const limiter = new RateLimiter({
    ...config,
    keyGenerator: (req) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `ip:${ip}:${req.route?.path || req.path}`;
    }
  });

  return limiter.middleware();
};

// Combined rate limiting (both user and IP)
export const createCombinedRateLimiter = (
  userConfig: RateLimitConfig,
  ipConfig: RateLimitConfig
) => {
  const userLimiter = new RateLimiter(userConfig);
  const ipLimiter = new RateLimiter(ipConfig);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check IP-based rate limit first
    const ipKey = `ip:${req.ip}:${req.route?.path || req.path}`;
    const ipEntry = await ipLimiter.store.increment(ipKey, ipConfig.windowMs);

    if (ipEntry.count > ipConfig.maxRequests) {
      res.status(429).json({
        error: 'IP rate limit exceeded',
        message: 'Too many requests from this IP address'
      });
      return;
    }

    // Check user-based rate limit if authenticated
    if (req.user?.uid) {
      const userKey = `user:${req.user.uid}:${req.route?.path || req.path}`;
      const userEntry = await userLimiter.store.increment(userKey, userConfig.windowMs);

      if (userEntry.count > userConfig.maxRequests) {
        res.status(429).json({
          error: 'User rate limit exceeded',
          message: 'Too many requests for this user'
        });
        return;
      }
    }

    next();
  };
};

// Rate limiting for WebSocket connections
export class WebSocketRateLimiter {
  private connections = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.connections.entries()) {
        if (now > entry.resetTime) {
          this.connections.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  check(clientId: string): boolean {
    const now = Date.now();
    const entry = this.connections.get(clientId);

    if (!entry || now > entry.resetTime) {
      this.connections.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }
}

// Middleware to add rate limiting headers
export const addRateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-RateLimit-Policy': 'Standard rate limiting applied',
    'X-RateLimit-Window': '900', // 15 minutes
    'X-RateLimit-Scope': 'per-user'
  });
  next();
};

// Custom rate limiting for specific endpoints
export const customRateLimit = (endpoint: string, limits: RateLimitConfig) => {
  const limiter = new RateLimiter({
    ...limits,
    keyGenerator: (req) => {
      const userId = req.user?.uid || req.ip;
      return `${endpoint}:${userId}`;
    }
  });

  return limiter.middleware();
};

export default {
  RateLimiter,
  rateLimiters,
  createUserRateLimiter,
  createIPRateLimiter,
  createCombinedRateLimiter,
  WebSocketRateLimiter,
  addRateLimitHeaders,
  customRateLimit
};