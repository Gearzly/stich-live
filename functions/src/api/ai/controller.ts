import { Context } from 'hono';
import { AIGenerationService } from '../../services/AIGenerationService';
import { FirebaseRealtimeService } from '../../services/FirebaseRealtimeService';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { AuthUser } from '../../middleware/hono-auth';
import { AI_PROVIDERS, DEFAULT_MODELS } from '../../config/env';

export class AIController {
  private aiService: AIGenerationService;
  private realtimeService: FirebaseRealtimeService;

  constructor() {
    this.aiService = new AIGenerationService();
    this.realtimeService = new FirebaseRealtimeService();
  }

  /**
   * Initiates code generation for an app with real-time updates
   */
  async generateCode(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();

      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start real-time generation (don't await - let it run in background)
      this.realtimeService.simulateGeneration(sessionId, user.uid).catch(error => {
        console.error('Real-time generation failed:', error);
      });

      // Return session info immediately
      return c.json(createSuccessResponse({
        sessionId,
        userId: user.uid,
        status: 'initializing',
        message: 'Generation started. Check real-time updates.',
      }), 202);
    } catch (error) {
      return this.handleControllerError(c, error, 'generateCode');
    }
  }

  /**
   * Start real-time generation stream
   */
  async startRealtimeGeneration(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();

      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start the real-time generation
      this.realtimeService.simulateGeneration(sessionId, user.uid).catch(error => {
        console.error('Real-time generation failed:', error);
      });

      return c.json(createSuccessResponse({
        sessionId,
        message: 'Real-time generation started',
      }), 202);
    } catch (error) {
      return this.handleControllerError(c, error, 'startRealtimeGeneration');
    }
  }

  /**
   * Retrieves a generation session by ID
   */
  async getGeneration(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const generationId = c.req.param('id');

      if (!generationId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Generation ID is required'), 400);
      }

      // Try to get from real-time service first
      const realtimeStatus = await this.realtimeService.getGenerationStatus(generationId);
      if (realtimeStatus) {
        return c.json(createSuccessResponse(realtimeStatus));
      }

      // Fallback to traditional service
      const session = await this.aiService.getGenerationById(generationId, user.uid);
      return c.json(createSuccessResponse(session));
    } catch (error) {
      return this.handleControllerError(c, error, 'getGeneration');
    }
  }

  /**
   * Get available AI providers
   */
  async getProviders(c: Context): Promise<Response> {
    try {
      const providers = Object.entries(AI_PROVIDERS).map(([key, value]) => ({
        id: key,
        name: value,
        defaultModel: DEFAULT_MODELS[key as keyof typeof DEFAULT_MODELS],
        available: true, // You could check API key availability here
      }));

      return c.json(createSuccessResponse(providers));
    } catch (error) {
      return this.handleControllerError(c, error, 'getProviders');
    }
  }

  /**
   * Health check endpoint
   */
  async health(c: Context): Promise<Response> {
    return c.json(createSuccessResponse({
      service: 'ai',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      realtime: 'enabled',
    }));
  }

  /**
   * Handle controller errors with consistent formatting
   */
  private handleControllerError(c: Context, error: unknown, operation: string): Response {
    console.error(`Error in AIController.${operation}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return c.json(createErrorResponse('NOT_FOUND', error.message), 404);
      }
      if (error.message.includes('Unauthorized')) {
        return c.json(createErrorResponse('UNAUTHORIZED', error.message), 403);
      }
    }

    return c.json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
  }
}
