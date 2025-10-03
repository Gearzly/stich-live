import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AIController } from './controller';

export const aiRoutes = new Hono();

// All AI routes require authentication
aiRoutes.use('*', authMiddleware);

// AI generation endpoints
aiRoutes.post('/generate', AIController.generateCode);
aiRoutes.get('/sessions', AIController.getGenerationSessions);
aiRoutes.get('/sessions/:id', AIController.getGenerationSession);
aiRoutes.delete('/sessions/:id', AIController.deleteGenerationSession);

// AI provider management
aiRoutes.get('/providers', AIController.getAvailableProviders);
aiRoutes.post('/providers/test', AIController.testProvider);

// Generation status and monitoring
aiRoutes.get('/sessions/:id/status', AIController.getSessionStatus);
aiRoutes.post('/sessions/:id/cancel', AIController.cancelGeneration);