"use strict";
/**
 * Real-time Collaboration API
 * Handles real-time editing and communication for code generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRealtimeApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const hono_auth_1 = require("../middleware/hono-auth");
const hono_cors_1 = require("../middleware/hono-cors");
const RealtimeService_1 = require("../services/RealtimeService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
// Validation schemas
const JoinSessionSchema = zod_1.z.object({
    appId: zod_1.z.string().min(1),
    mode: zod_1.z.enum(['edit', 'view']),
});
const UpdateFileSchema = zod_1.z.object({
    fileId: zod_1.z.string().min(1),
    content: zod_1.z.string(),
    path: zod_1.z.string().min(1),
    language: zod_1.z.string().min(1),
    cursorPosition: zod_1.z.object({
        line: zod_1.z.number(),
        column: zod_1.z.number(),
    }).optional(),
});
const SendMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    type: zod_1.z.enum(['chat', 'system', 'notification']),
});
const createRealtimeApp = () => {
    const app = new hono_1.Hono();
    const realtimeService = new RealtimeService_1.RealtimeService();
    // Apply middleware
    app.use('*', hono_cors_1.corsMiddleware);
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
    app.post('/sessions', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = JoinSessionSchema.parse(body);
            const session = await realtimeService.joinSession(user.uid, validatedData.appId, validatedData.mode);
            return c.json((0, response_1.createSuccessResponse)(session), 201);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to join session:', error);
            return c.json((0, response_1.createErrorResponse)('SESSION_ERROR', 'Failed to join session'), 500);
        }
    });
    /**
     * GET /sessions/:sessionId
     * Get session details and current state
     */
    app.get('/sessions/:sessionId', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            const session = await realtimeService.getSession(sessionId, user.uid);
            if (!session) {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', 'Session not found'), 404);
            }
            return c.json((0, response_1.createSuccessResponse)(session));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get session:', error);
            return c.json((0, response_1.createErrorResponse)('SESSION_ERROR', 'Failed to get session'), 500);
        }
    });
    /**
     * POST /sessions/:sessionId/files
     * Update file content in real-time
     */
    app.post('/sessions/:sessionId/files', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            const body = await c.req.json();
            const validatedData = UpdateFileSchema.parse(body);
            await realtimeService.updateFile(sessionId, user.uid, validatedData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'File updated successfully' }));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to update file:', error);
            return c.json((0, response_1.createErrorResponse)('UPDATE_ERROR', 'Failed to update file'), 500);
        }
    });
    /**
     * POST /sessions/:sessionId/messages
     * Send message in real-time chat
     */
    app.post('/sessions/:sessionId/messages', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            const body = await c.req.json();
            const validatedData = SendMessageSchema.parse(body);
            const message = await realtimeService.sendMessage(sessionId, user.uid, validatedData.message, validatedData.type);
            return c.json((0, response_1.createSuccessResponse)(message), 201);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to send message:', error);
            return c.json((0, response_1.createErrorResponse)('MESSAGE_ERROR', 'Failed to send message'), 500);
        }
    });
    /**
     * GET /sessions/:sessionId/messages
     * Get chat messages for session
     */
    app.get('/sessions/:sessionId/messages', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            const query = c.req.query();
            const limit = parseInt(query.limit || '50');
            const offset = parseInt(query.offset || '0');
            const messages = await realtimeService.getMessages(sessionId, user.uid, limit, offset);
            return c.json((0, response_1.createSuccessResponse)(messages));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get messages:', error);
            return c.json((0, response_1.createErrorResponse)('MESSAGES_ERROR', 'Failed to get messages'), 500);
        }
    });
    /**
     * POST /sessions/:sessionId/cursors
     * Update user cursor position
     */
    app.post('/sessions/:sessionId/cursors', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            const body = await c.req.json();
            await realtimeService.updateCursor(sessionId, user.uid, body.fileId, body.position);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Cursor updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to update cursor:', error);
            return c.json((0, response_1.createErrorResponse)('CURSOR_ERROR', 'Failed to update cursor'), 500);
        }
    });
    /**
     * DELETE /sessions/:sessionId
     * Leave a real-time session
     */
    app.delete('/sessions/:sessionId', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const sessionId = c.req.param('sessionId');
            await realtimeService.leaveSession(sessionId, user.uid);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Left session successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to leave session:', error);
            return c.json((0, response_1.createErrorResponse)('SESSION_ERROR', 'Failed to leave session'), 500);
        }
    });
    return app;
};
exports.createRealtimeApp = createRealtimeApp;
//# sourceMappingURL=realtime.js.map