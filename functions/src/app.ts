import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { createMiddleware } from 'hono/factory';

// Import route handlers
import { authRoutes } from './api/auth/routes';
import { usersRoutes } from './api/users/routes';
import { appsRoutes } from './api/apps/routes';
import { aiRoutes } from './api/ai/routes';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { rateLimitMiddleware } from './middleware/rate-limit';

// Import config
import { corsConfig } from './config/cors';

export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use('*', secureHeaders());
  app.use('*', cors(corsConfig));

  // Rate limiting
  app.use('/api/*', rateLimitMiddleware);

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  app.route('/api/auth', authRoutes);
  app.route('/api/users', usersRoutes);
  app.route('/api/apps', appsRoutes);
  app.route('/api/ai', aiRoutes);

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: c.req.path,
      },
      404
    );
  });

  // Error handler (must be last)
  app.onError(errorHandler);

  return app;
}