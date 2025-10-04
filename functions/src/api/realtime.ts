/**
 * Real-time Collaboration API
 * Handles real-time editing and communication for code generation
 */

import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { authMiddleware, AuthUser } from '../middleware/hono-auth';
import { corsMiddleware } from '../middleware/hono-cors';
import { RealtimeService } from '../services/RealtimeService';
import type { UpdateFileData } from '../services/RealtimeService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { z } from 'zod';

// Extended Hono context for user data
interface RealtimeContext {
  Variables: {
    user: AuthUser;
  };
}

// Validation schemas
const JoinSessionSchema = z.object({
  appId: z.string().min(1),
  mode: z.enum(['edit', 'view']),
});

const UpdateFileSchema = z.object({
  fileId: z.string().min(1),
  content: z.string(),
  path: z.string().min(1),
  language: z.string().min(1),
  cursorPosition: z.object({
    line: z.number(),
    column: z.number(),
  }).optional(),
});

const SendMessageSchema = z.object({
  message: z.string().min(1),
  type: z.enum(['chat', 'system', 'notification']),
});

export const createRealtimeApp = () => {
  const app = new Hono<RealtimeContext>();
  const realtimeService = new RealtimeService();
  
  // Apply middleware
  app.use('*', corsMiddleware);

  /**
   * Health check endpoint
   */
  app.get('/health', (c) => {
    return c.json({
      success: true,
      service: 'realtime',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /sessions
   * Create or join a real-time editing session
   */
  app.post('/sessions', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const validatedData = JoinSessionSchema.parse(body);
      
      const session = await realtimeService.joinSession(
        user.uid,
        validatedData.appId,
        validatedData.mode
      );
      
      return c.json(createSuccessResponse(session), 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to join session:', error);
      return c.json(createErrorResponse('SESSION_ERROR', 'Failed to join session'), 500);
    }
  });

  /**
   * GET /sessions/:sessionId
   * Get session details and current state
   */
  app.get('/sessions/:sessionId', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      
      const session = await realtimeService.getSession(sessionId, user.uid);
      
      if (!session) {
        return c.json(createErrorResponse('NOT_FOUND', 'Session not found'), 404);
      }
      
      return c.json(createSuccessResponse(session));
    } catch (error) {
      logger.error('Failed to get session:', error);
      return c.json(createErrorResponse('SESSION_ERROR', 'Failed to get session'), 500);
    }
  });

  /**
   * POST /sessions/:sessionId/files
   * Update file content in real-time
   */
  app.post('/sessions/:sessionId/files', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      const body = await c.req.json();
      
      const validatedData = UpdateFileSchema.parse(body);
      
      await realtimeService.updateFile(
        sessionId,
        user.uid,
        validatedData as UpdateFileData
      );
      
      return c.json(createSuccessResponse({ message: 'File updated successfully' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to update file:', error);
      return c.json(createErrorResponse('UPDATE_ERROR', 'Failed to update file'), 500);
    }
  });

  /**
   * POST /sessions/:sessionId/messages
   * Send message in real-time chat
   */
  app.post('/sessions/:sessionId/messages', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      const body = await c.req.json();
      
      const validatedData = SendMessageSchema.parse(body);
      
      const message = await realtimeService.sendMessage(
        sessionId,
        user.uid,
        validatedData.message,
        validatedData.type
      );
      
      return c.json(createSuccessResponse(message), 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to send message:', error);
      return c.json(createErrorResponse('MESSAGE_ERROR', 'Failed to send message'), 500);
    }
  });

  /**
   * GET /sessions/:sessionId/messages
   * Get chat messages for session
   */
  app.get('/sessions/:sessionId/messages', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      const query = c.req.query();
      
      const limit = parseInt(query.limit || '50');
      const offset = parseInt(query.offset || '0');
      
      const messages = await realtimeService.getMessages(sessionId, user.uid, limit, offset);
      
      return c.json(createSuccessResponse(messages));
    } catch (error) {
      logger.error('Failed to get messages:', error);
      return c.json(createErrorResponse('MESSAGES_ERROR', 'Failed to get messages'), 500);
    }
  });

  /**
   * POST /sessions/:sessionId/cursors
   * Update user cursor position
   */
  app.post('/sessions/:sessionId/cursors', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      const body = await c.req.json();
      
      await realtimeService.updateCursor(
        sessionId,
        user.uid,
        body.fileId,
        body.position
      );
      
      return c.json(createSuccessResponse({ message: 'Cursor updated successfully' }));
    } catch (error) {
      logger.error('Failed to update cursor:', error);
      return c.json(createErrorResponse('CURSOR_ERROR', 'Failed to update cursor'), 500);
    }
  });

  /**
   * DELETE /sessions/:sessionId
   * Leave a real-time session
   */
  app.delete('/sessions/:sessionId', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const sessionId = c.req.param('sessionId');
      
      await realtimeService.leaveSession(sessionId, user.uid);
      
      return c.json(createSuccessResponse({ message: 'Left session successfully' }));
    } catch (error) {
      logger.error('Failed to leave session:', error);
      return c.json(createErrorResponse('SESSION_ERROR', 'Failed to leave session'), 500);
    }
  });

  return app;
};