import { Hono } from 'hono';
import { ChatController } from './controller';
import { authMiddleware } from '../../middleware/hono-auth';

const chatRoutes = new Hono();

// Apply authentication middleware to all chat routes
chatRoutes.use('*', authMiddleware);

// Chat message routes
chatRoutes.post('/chat', ChatController.sendMessage);
chatRoutes.get('/chat/:sessionId', ChatController.getChatSession);
chatRoutes.post('/chat/:sessionId', ChatController.saveChatSession);
chatRoutes.delete('/chat/:sessionId', ChatController.deleteChatSession);

// Chat session management
chatRoutes.get('/chat', ChatController.listChatSessions);

export { chatRoutes };