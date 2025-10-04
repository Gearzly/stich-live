/**
 * Common Middleware
 * Shared middleware functions for all API routes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from 'firebase-functions';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { config } from '../config';

/**
 * Common Middleware
 * Shared middleware functions for all API routes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from 'firebase-functions';
import { config } from '../config';

/**
 * CORS middleware configuration
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const origin = req.headers.origin;
  const allowedOrigins = config.cors.origin;
  
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

/**
 * Security headers middleware
 */
export const securityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * Simple rate limiting middleware
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const max = config.rateLimit.max;
  
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

/**
 * Strict rate limiting for AI generation endpoints
 */
export const aiRateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

/**
 * Request logging middleware
 */
export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log request
  logger.info(`${method} ${url}`, {
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    logger.info(`${method} ${url} ${statusCode}`, {
      duration,
      statusCode,
      ip,
      timestamp: new Date().toISOString()
    });
  });
  
  next();
};

/**
 * Request validation middleware
 */
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', error);
  
  // Don't leak error details in production
  const isDev = config.analytics.enableDetailedLogging;
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isDev && { details: error.message, stack: error.stack })
  });
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Health check middleware
 */
export const healthCheck = (
  req: Request,
  res: Response
): void => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * API version middleware
 */
export const apiVersion = (version: string = 'v1') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('API-Version', version);
    next();
  };
};

/**
 * Response time middleware
 */
export const responseTime = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Helper function to parse size strings
const parseSize = (size: string): number => {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

export default {
  corsMiddleware,
  securityMiddleware,
  compressionMiddleware,
  rateLimitMiddleware,
  aiRateLimitMiddleware,
  loggingMiddleware,
  validateContentType,
  errorHandler,
  notFoundHandler,
  healthCheck,
  requestSizeLimit,
  apiVersion,
  responseTime
};