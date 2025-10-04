import { Hono } from 'hono';
import { AIController } from './controller';
import { authMiddleware } from '../../middleware/hono-auth';

const ai = new Hono();
const aiController = new AIController();

// Apply authentication middleware to protected routes
ai.use('/generate', authMiddleware);
ai.use('/realtime/*', authMiddleware);
ai.use('/generation/*', authMiddleware);

/**
 * POST /generate - Generate code for an application
 */
ai.post('/generate', (c) => aiController.generateCode(c));

/**
 * POST /realtime/start - Start real-time generation with live updates
 */
ai.post('/realtime/start', (c) => aiController.startRealtimeGeneration(c));

/**
 * GET /generation/:id - Get generation session by ID
 */
ai.get('/generation/:id', (c) => aiController.getGeneration(c));

/**
 * GET /providers - Get available AI providers
 */
ai.get('/providers', (c) => aiController.getProviders(c));

/**
 * GET /health - Health check endpoint
 */
ai.get('/health', (c) => aiController.health(c));

export { ai };