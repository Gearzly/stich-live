"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const AIGenerationService_1 = require("../../services/AIGenerationService");
const FirebaseRealtimeService_1 = require("../../services/FirebaseRealtimeService");
const response_1 = require("../../utils/response");
const env_1 = require("../../config/env");
class AIController {
    constructor() {
        this.aiService = new AIGenerationService_1.AIGenerationService();
        this.realtimeService = new FirebaseRealtimeService_1.FirebaseRealtimeService();
    }
    /**
     * Initiates code generation for an app with real-time updates
     */
    async generateCode(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            // Generate session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Start real-time generation (don't await - let it run in background)
            this.realtimeService.simulateGeneration(sessionId, user.uid).catch(error => {
                console.error('Real-time generation failed:', error);
            });
            // Return session info immediately
            return c.json((0, response_1.createSuccessResponse)({
                sessionId,
                userId: user.uid,
                status: 'initializing',
                message: 'Generation started. Check real-time updates.',
            }), 202);
        }
        catch (error) {
            return this.handleControllerError(c, error, 'generateCode');
        }
    }
    /**
     * Start real-time generation stream
     */
    async startRealtimeGeneration(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            // Generate session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Start the real-time generation
            this.realtimeService.simulateGeneration(sessionId, user.uid).catch(error => {
                console.error('Real-time generation failed:', error);
            });
            return c.json((0, response_1.createSuccessResponse)({
                sessionId,
                message: 'Real-time generation started',
            }), 202);
        }
        catch (error) {
            return this.handleControllerError(c, error, 'startRealtimeGeneration');
        }
    }
    /**
     * Retrieves a generation session by ID
     */
    async getGeneration(c) {
        try {
            const user = c.get('user');
            const generationId = c.req.param('id');
            if (!generationId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Generation ID is required'), 400);
            }
            // Try to get from real-time service first
            const realtimeStatus = await this.realtimeService.getGenerationStatus(generationId);
            if (realtimeStatus) {
                return c.json((0, response_1.createSuccessResponse)(realtimeStatus));
            }
            // Fallback to traditional service
            const session = await this.aiService.getGenerationById(generationId, user.uid);
            return c.json((0, response_1.createSuccessResponse)(session));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getGeneration');
        }
    }
    /**
     * Get available AI providers
     */
    async getProviders(c) {
        try {
            const providers = Object.entries(env_1.AI_PROVIDERS).map(([key, value]) => ({
                id: key,
                name: value,
                defaultModel: env_1.DEFAULT_MODELS[key],
                available: true, // You could check API key availability here
            }));
            return c.json((0, response_1.createSuccessResponse)(providers));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getProviders');
        }
    }
    /**
     * Health check endpoint
     */
    async health(c) {
        return c.json((0, response_1.createSuccessResponse)({
            service: 'ai',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            realtime: 'enabled',
        }));
    }
    /**
     * Handle controller errors with consistent formatting
     */
    handleControllerError(c, error, operation) {
        console.error(`Error in AIController.${operation}:`, error);
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', error.message), 404);
            }
            if (error.message.includes('Unauthorized')) {
                return c.json((0, response_1.createErrorResponse)('UNAUTHORIZED', error.message), 403);
            }
        }
        return c.json((0, response_1.createErrorResponse)('INTERNAL_ERROR', 'Internal server error'), 500);
    }
}
exports.AIController = AIController;
//# sourceMappingURL=controller.js.map