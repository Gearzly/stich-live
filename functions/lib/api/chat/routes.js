"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const hono_1 = require("hono");
const controller_1 = require("./controller");
const hono_auth_1 = require("../../middleware/hono-auth");
const chatRoutes = new hono_1.Hono();
exports.chatRoutes = chatRoutes;
// Apply authentication middleware to all chat routes
chatRoutes.use('*', hono_auth_1.authMiddleware);
// Chat message routes
chatRoutes.post('/chat', controller_1.ChatController.sendMessage);
chatRoutes.get('/chat/:sessionId', controller_1.ChatController.getChatSession);
chatRoutes.post('/chat/:sessionId', controller_1.ChatController.saveChatSession);
chatRoutes.delete('/chat/:sessionId', controller_1.ChatController.deleteChatSession);
// Chat session management
chatRoutes.get('/chat', controller_1.ChatController.listChatSessions);
//# sourceMappingURL=routes.js.map