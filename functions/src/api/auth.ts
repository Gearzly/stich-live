import { Hono } from 'hono';
import { authRoutes } from './auth/routes';
import { corsMiddleware } from '../middleware/hono-cors';

export const createAuthApp = () => {
  const app = new Hono();
  app.use('*', corsMiddleware);
  
  // Mount auth routes
  app.route('/', authRoutes);
  
  return app;
};
