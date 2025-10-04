"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const hono_1 = require("hono");
const controller_1 = require("./controller");
const hono_auth_1 = require("../../middleware/hono-auth");
const ai = new hono_1.Hono();
exports.ai = ai;
const aiController = new controller_1.AIController();
// Apply authentication middleware to protected routes
ai.use('/generate', hono_auth_1.authMiddleware);
ai.use('/realtime/*', hono_auth_1.authMiddleware);
ai.use('/generation/*', hono_auth_1.authMiddleware);
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
//# sourceMappingURL=routes.js.map