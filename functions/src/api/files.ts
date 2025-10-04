import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { authMiddleware, AuthUser } from '../middleware/hono-auth';
import { corsMiddleware } from '../middleware/hono-cors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

interface FileContext {
  Variables: {
    user: AuthUser;
  };
}

export const createFilesApp = () => {
  const app = new Hono<FileContext>();
  
  app.use('*', corsMiddleware);

  app.get('/health', (c) => {
    return c.json({
      success: true,
      service: 'files',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      
      return c.json(createSuccessResponse({
        message: 'Files API working',
        user: user.uid
      }));
    } catch (error) {
      logger.error('Files API error:', error);
      return c.json(createErrorResponse('FILES_ERROR', 'Failed to get files'), 500);
    }
  });

  return app;
};