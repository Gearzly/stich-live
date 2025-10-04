/**
 * AI Generation API
 * Handles AI model interactions and code generation using Hono
 */

import { Hono } from 'hono';
import { ai as aiRoutes } from './ai/routes';

export const createAIApp = () => {
  const app = new Hono();
  
  // Mount AI routes
  app.route('/', aiRoutes);
  
  return app;
};