"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const FirebaseRealtimeService_1 = require("../../services/FirebaseRealtimeService");
const zod_1 = require("zod");
const ChatMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(10000),
    sessionId: zod_1.z.string(),
    agentMode: zod_1.z.enum(['deterministic', 'smart']).default('deterministic'),
});
class ChatController {
    /**
     * Handle chat message and stream AI response
     */
    static async sendMessage(c) {
        try {
            const body = await c.req.json();
            const validatedBody = ChatMessageSchema.parse(body);
            // Get user from context (set by auth middleware)
            const user = c.get('user');
            if (!(user === null || user === void 0 ? void 0 : user.uid)) {
                return c.json({ success: false, error: 'Authentication required' }, 401);
            }
            // Set up SSE headers for streaming
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            const encoder = new TextEncoder();
            // Send initial connection confirmation
            await writer.write(encoder.encode('data: {"type":"connected"}\n\n'));
            const realtimeService = new FirebaseRealtimeService_1.FirebaseRealtimeService();
            // Start AI generation with real-time updates in background
            (async () => {
                try {
                    await realtimeService.simulateGeneration(validatedBody.sessionId, user.uid);
                    await writer.write(encoder.encode('data: [DONE]\n\n'));
                }
                catch (error) {
                    console.error('Generation error:', error);
                    await writer.write(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        message: error instanceof Error ? error.message : 'Generation failed'
                    })}\n\n`));
                }
                finally {
                    await writer.close();
                }
            })();
            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Cache-Control',
                },
            });
        }
        catch (error) {
            console.error('Chat error:', error);
            if (error instanceof zod_1.z.ZodError) {
                return c.json({
                    success: false,
                    error: 'Invalid request data',
                    details: error.errors
                }, 400);
            }
            return c.json({
                success: false,
                error: 'Internal server error'
            }, 500);
        }
    }
    /**
     * Get chat session
     */
    static async getChatSession(c) {
        try {
            const sessionId = c.req.param('sessionId');
            const user = c.get('user');
            if (!(user === null || user === void 0 ? void 0 : user.uid)) {
                return c.json({ success: false, error: 'Authentication required' }, 401);
            }
            if (!sessionId) {
                return c.json({ success: false, error: 'Session ID required' }, 400);
            }
            // TODO: Implement chat session retrieval from Firestore
            const mockSession = {
                id: sessionId,
                title: 'Chat Session',
                messages: [],
                files: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                agentMode: 'deterministic'
            };
            return c.json({ success: true, data: mockSession });
        }
        catch (error) {
            console.error('Error in getChatSession:', error);
            return c.json({ success: false, error: 'Internal server error' }, 500);
        }
    }
    /**
     * Save chat session
     */
    static async saveChatSession(c) {
        try {
            const user = c.get('user');
            if (!(user === null || user === void 0 ? void 0 : user.uid)) {
                return c.json({ success: false, error: 'Authentication required' }, 401);
            }
            const sessionData = await c.req.json();
            // TODO: Implement chat session saving to Firestore
            console.log('Saving chat session:', sessionData);
            return c.json({ success: true, message: 'Chat session saved' });
        }
        catch (error) {
            console.error('Error in saveChatSession:', error);
            return c.json({ success: false, error: 'Internal server error' }, 500);
        }
    }
    /**
     * List user's chat sessions
     */
    static async listChatSessions(c) {
        try {
            const user = c.get('user');
            if (!(user === null || user === void 0 ? void 0 : user.uid)) {
                return c.json({ success: false, error: 'Authentication required' }, 401);
            }
            // TODO: Implement chat session listing from Firestore
            const mockSessions = [
                {
                    id: 'session1',
                    title: 'React Todo App',
                    lastMessage: 'Create a React todo app with TypeScript',
                    updatedAt: new Date(),
                    messageCount: 5
                },
                {
                    id: 'session2',
                    title: 'REST API Design',
                    lastMessage: 'Build a REST API with authentication',
                    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
                    messageCount: 3
                }
            ];
            return c.json({ success: true, data: mockSessions });
        }
        catch (error) {
            console.error('Error in listChatSessions:', error);
            return c.json({ success: false, error: 'Internal server error' }, 500);
        }
    }
    /**
     * Delete chat session
     */
    static async deleteChatSession(c) {
        try {
            const sessionId = c.req.param('sessionId');
            const user = c.get('user');
            if (!(user === null || user === void 0 ? void 0 : user.uid)) {
                return c.json({ success: false, error: 'Authentication required' }, 401);
            }
            if (!sessionId) {
                return c.json({ success: false, error: 'Session ID required' }, 400);
            }
            // TODO: Implement chat session deletion from Firestore
            console.log('Deleting chat session:', sessionId);
            return c.json({ success: true, message: 'Chat session deleted' });
        }
        catch (error) {
            console.error('Error in deleteChatSession:', error);
            return c.json({ success: false, error: 'Internal server error' }, 500);
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=controller.js.map