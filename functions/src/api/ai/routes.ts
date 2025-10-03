import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AIController } from './controller';

export const aiRoutes = new Hono();

// Create controller instance following dependency injection pattern
const aiController = new AIController();

// All AI routes require authentication
aiRoutes.use('*', authMiddleware);

// AI generation endpoints
aiRoutes.post('/generate', (c) => aiController.generateCode(c));
aiRoutes.get('/generations/user', (c) => aiController.getUserGenerations(c));
aiRoutes.get('/generations/:id', (c) => aiController.getGeneration(c));
aiRoutes.delete('/generations/:id', (c) => aiController.deleteGeneration(c));
aiRoutes.post('/generations/:id/cancel', (c) => aiController.cancelGeneration(c));

// App-specific generations
aiRoutes.get('/apps/:appId/generations', (c) => aiController.getAppGenerations(c));

// Generation status and monitoring
aiRoutes.put('/generations/:id/status', (c) => aiController.updateGenerationStatus(c));

// User AI statistics
aiRoutes.get('/stats', (c) => aiController.getUserAIStats(c));