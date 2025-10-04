"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGenerationService = void 0;
const BaseService_1 = require("./BaseService");
const env_1 = require("../config/env");
const openai_1 = __importDefault(require("openai"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * AI Generation Service
 * Handles code generation using multiple AI providers
 */
class AIGenerationService extends BaseService_1.BaseService {
    constructor() {
        super();
        // Initialize AI providers
        this.openai = new openai_1.default({ apiKey: env_1.env.openai.apiKey });
        this.anthropic = new sdk_1.default({ apiKey: env_1.env.anthropic.apiKey });
    }
    /**
     * Generate code for an application
     */
    async generateCode(userId, request) {
        try {
            // Create generation session
            const sessionId = this.generateId();
            const session = {
                id: sessionId,
                userId,
                request,
                status: 'pending',
                files: [],
                metadata: {
                    provider: request.provider,
                    model: request.model || env_1.DEFAULT_MODELS[request.provider],
                },
                createdAt: this.now(),
                updatedAt: this.now(),
            };
            // Save session to Firestore
            await this.db.collection('generations').doc(sessionId).set(session);
            // Start generation process
            this.processGeneration(session).catch(error => {
                this.logger.error('Background generation failed:', error);
                this.updateSessionStatus(sessionId, 'failed', { error: error.message });
            });
            return session;
        }
        catch (error) {
            this.handleError(error, 'generateCode');
        }
    }
    /**
     * Get generation session by ID
     */
    async getGenerationById(sessionId, userId) {
        try {
            const doc = await this.db.collection('generations').doc(sessionId).get();
            if (!doc.exists) {
                throw new Error('Generation session not found');
            }
            const session = doc.data();
            if (session.userId !== userId) {
                throw new Error('Unauthorized access to generation session');
            }
            return session;
        }
        catch (error) {
            this.handleError(error, 'getGenerationById');
        }
    }
    /**
     * Process generation in background
     */
    async processGeneration(session) {
        var _a;
        try {
            // Update status to generating
            await this.updateSessionStatus(session.id, 'generating');
            // Generate prompt
            const prompt = this.buildGenerationPrompt(session.request);
            // Call AI provider
            const startTime = Date.now();
            const response = await this.callAIProvider(session.request.provider, prompt, session.request);
            const processingTime = Date.now() - startTime;
            if (response.success && response.files) {
                // Update session with generated files
                await this.updateSessionFiles(session.id, response.files, {
                    tokensUsed: (_a = response.metadata) === null || _a === void 0 ? void 0 : _a.tokensUsed,
                    processingTime,
                    provider: session.request.provider,
                    model: session.request.model || env_1.DEFAULT_MODELS[session.request.provider],
                });
                await this.updateSessionStatus(session.id, 'completed');
            }
            else {
                await this.updateSessionStatus(session.id, 'failed', { error: response.error });
            }
        }
        catch (error) {
            await this.updateSessionStatus(session.id, 'failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Build generation prompt based on request
     */
    buildGenerationPrompt(request) {
        var _a, _b;
        const systemPrompt = `You are an expert full-stack developer specializing in modern web applications.

Generate a complete, production-ready application based on the user's requirements.

Guidelines:
- Use modern best practices and clean code principles
- Include proper TypeScript types and interfaces
- Add comprehensive error handling and validation
- Create responsive, accessible UI components
- Include proper file structure and organization
- Add comments and documentation where helpful
- Ensure code is secure and follows security best practices

Return a JSON response with this structure:
{
  "files": [
    {
      "name": "filename.ext",
      "path": "relative/path/to/file",
      "content": "file content here",
      "language": "typescript|javascript|css|html|json",
      "type": "component|page|config|style|data|test"
    }
  ]
}`;
        let userPrompt = `Create a ${request.appType || 'web application'} with the following requirements:

Description: ${request.prompt}`;
        if (request.framework) {
            userPrompt += `\nFramework: ${request.framework}`;
        }
        if ((_a = request.features) === null || _a === void 0 ? void 0 : _a.length) {
            userPrompt += `\nRequired features: ${request.features.join(', ')}`;
        }
        if (request.customization) {
            userPrompt += `\nCustomization preferences:`;
            if (request.customization.theme) {
                userPrompt += `\n- Theme: ${request.customization.theme}`;
            }
            if (request.customization.layout) {
                userPrompt += `\n- Layout: ${request.customization.layout}`;
            }
            if ((_b = request.customization.components) === null || _b === void 0 ? void 0 : _b.length) {
                userPrompt += `\n- Components: ${request.customization.components.join(', ')}`;
            }
        }
        return {
            systemPrompt,
            userPrompt,
        };
    }
    /**
     * Call the appropriate AI provider
     */
    async callAIProvider(provider, prompt, request) {
        switch (provider) {
            case 'openai':
                return this.callOpenAI(prompt, request);
            case 'anthropic':
                return this.callAnthropic(prompt, request);
            case 'google':
                return this.callGoogle(prompt, request);
            case 'cerebras':
                return this.callCerebras(prompt, request);
            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    }
    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt, request) {
        var _a, _b, _c;
        try {
            const response = await this.openai.chat.completions.create({
                model: request.model || env_1.DEFAULT_MODELS.openai,
                messages: [
                    { role: 'system', content: prompt.systemPrompt },
                    { role: 'user', content: prompt.userPrompt }
                ],
                temperature: request.temperature || 0.7,
                max_tokens: request.maxTokens || 4000,
            });
            const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }
            // Parse JSON response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from OpenAI');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                files: parsed.files || [],
                metadata: {
                    tokensUsed: ((_c = response.usage) === null || _c === void 0 ? void 0 : _c.total_tokens) || 0,
                    processingTime: 0,
                    model: response.model,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Call Anthropic API
     */
    async callAnthropic(prompt, request) {
        try {
            const response = await this.anthropic.messages.create({
                model: request.model || env_1.DEFAULT_MODELS.anthropic,
                max_tokens: request.maxTokens || 4000,
                temperature: request.temperature || 0.7,
                messages: [
                    { role: 'user', content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}` }
                ],
            });
            const content = response.content[0];
            if (content.type !== 'text') {
                throw new Error('Invalid response type from Anthropic');
            }
            // Parse JSON response
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid JSON response from Anthropic');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                files: parsed.files || [],
                metadata: {
                    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
                    processingTime: 0,
                    model: response.model,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Call Google AI API (placeholder)
     */
    async callGoogle(prompt, request) {
        // TODO: Implement Google AI integration
        return {
            success: false,
            error: 'Google AI integration not yet implemented',
        };
    }
    /**
     * Call Cerebras API (placeholder)
     */
    async callCerebras(prompt, request) {
        // TODO: Implement Cerebras integration
        return {
            success: false,
            error: 'Cerebras integration not yet implemented',
        };
    }
    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, status, additionalData) {
        const updateData = {
            status,
            updatedAt: this.now(),
        };
        if (status === 'completed') {
            updateData.completedAt = this.now();
        }
        if (additionalData) {
            Object.assign(updateData, additionalData);
        }
        await this.db.collection('generations').doc(sessionId).update(updateData);
    }
    /**
     * Update session with generated files
     */
    async updateSessionFiles(sessionId, files, metadata) {
        await this.db.collection('generations').doc(sessionId).update({
            files,
            metadata,
            updatedAt: this.now(),
        });
    }
    /**
     * Stream generation progress (for WebSocket integration)
     */
    async *streamGeneration(sessionId, userId) {
        // TODO: Implement real-time streaming
        // This would integrate with WebSocket service for live updates
        const session = await this.getGenerationById(sessionId, userId);
        // For now, just yield the current session status
        yield {
            type: 'status',
            data: { status: session.status },
            timestamp: Date.now(),
        };
        if (session.status === 'completed') {
            yield {
                type: 'completed',
                data: { files: session.files },
                timestamp: Date.now(),
            };
        }
    }
    /**
     * List user's generation sessions with pagination
     */
    async listUserGenerations(userId, options) {
        try {
            let query = this.db.collection('generations')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc');
            if (options === null || options === void 0 ? void 0 : options.status) {
                query = query.where('status', '==', options.status);
            }
            if (options === null || options === void 0 ? void 0 : options.limit) {
                query = query.limit(options.limit);
            }
            if (options === null || options === void 0 ? void 0 : options.offset) {
                query = query.offset(options.offset);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            this.handleError(error, 'listUserGenerations');
        }
    }
    /**
     * Delete generation session
     */
    async deleteGeneration(sessionId, userId) {
        try {
            const session = await this.getGenerationById(sessionId, userId);
            if (session.userId !== userId) {
                throw new Error('Unauthorized access to generation session');
            }
            await this.db.collection('generations').doc(sessionId).delete();
        }
        catch (error) {
            this.handleError(error, 'deleteGeneration');
        }
    }
    /**
     * Test AI provider connectivity
     */
    async testProvider(provider) {
        try {
            const startTime = Date.now();
            const testPrompt = {
                systemPrompt: 'You are a helpful assistant.',
                userPrompt: 'Say "Hello, world!" and return it as JSON: {"message": "Hello, world!"}',
            };
            const response = await this.callAIProvider(provider, testPrompt, {
                prompt: 'test',
                provider,
                temperature: 0.1,
                maxTokens: 50,
            });
            const latency = Date.now() - startTime;
            return {
                success: response.success,
                latency,
                error: response.error,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.AIGenerationService = AIGenerationService;
//# sourceMappingURL=AIGenerationService.js.map