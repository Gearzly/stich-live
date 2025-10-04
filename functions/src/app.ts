import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { corsMiddleware } from './middleware/hono-cors';
import { createAppsApp } from './api/apps';
import { createUsersApp } from './api/users';
import { createFilesApp } from './api/files';
import { createAnalyticsApp } from './api/analytics';

export const createMainApp = () => {
  const app = new Hono();
  
  app.use('*', corsMiddleware);

  app.get('/health', (c) => {
    return c.json({
      success: true,
      service: 'stich-backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.get('/', (c) => {
    return c.json({
      success: true,
      message: 'Stich Production API',
      version: '1.0.0',
      endpoints: {
        apps: '/apps', 
        users: '/users',
        files: '/files',
        analytics: '/analytics'
      }
    });
  });

  app.route('/apps', createAppsApp());
  app.route('/users', createUsersApp());
  app.route('/files', createFilesApp());
  app.route('/analytics', createAnalyticsApp());

  app.notFound((c) => {
    return c.json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Endpoint not found'
    }, 404);
  });

  app.onError((err, c) => {
    logger.error('Error:', err);
    return c.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Server error'
    }, 500);
  });

  return app;
};