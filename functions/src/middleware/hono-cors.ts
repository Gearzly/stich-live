/**
 * CORS Middleware for Hono
 * Handles Cross-Origin Resource Sharing configuration
 */

import { Context, Next } from 'hono';

export const corsMiddleware = async (c: Context, next: Next) => {
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400');
    return new Response('', { status: 204 });
  }

  // Set CORS headers for actual requests
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  await next();
};