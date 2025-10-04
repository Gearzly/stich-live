import { Hono } from 'hono';
import { corsMiddleware } from '../middleware/hono-cors';

export const createAuthApp = () => {
  const app = new Hono();
  app.use('*', corsMiddleware);
  
  app.get('/health', (c) => {
    return c.json({ success: true, service: 'auth', status: 'healthy' });
  });
  
  return app;
};
