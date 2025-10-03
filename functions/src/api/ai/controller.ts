import { Context } from 'hono';
import { AIGenerationService } from '../../services/AIGenerationService';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { AuthUser } from '../../middleware/auth';

export class AIController {
  private aiService: AIGenerationService;

  constructor() {
    this.aiService = new AIGenerationService();
  }

  /**
   * Initiates code generation for an app
   */
  async generateCode(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();

      const session = await this.aiService.generateCode(user.uid, body);

      return c.json(createSuccessResponse(session), 201);
    } catch (error) {
      return this.handleControllerError(c, error, 'generateCode');
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

      const session = await this.aiService.getGenerationById(generationId, user.uid);

      return c.json(createSuccessResponse(session));
    } catch (error) {
      return this.handleControllerError(c, error, 'getGeneration');
    }
  }

  /**
   * Updates generation session status
   */
  async updateGenerationStatus(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const generationId = c.req.param('id');
      const body = await c.req.json();

      if (!generationId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Generation ID is required'), 400);
      }

      await this.aiService.updateGenerationStatus(generationId, user.uid, body);

      return c.json(createSuccessResponse({ message: 'Generation status updated successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'updateGenerationStatus');
    }
  }

  /**
   * Retrieves user's generation history
   */
  async getUserGenerations(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      const paginationData = {
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        sortBy: c.req.query('sortBy'),
        sortOrder: c.req.query('sortOrder')
      };

      const result = await this.aiService.getUserGenerations(user.uid, paginationData);

      return c.json(createSuccessResponse(result));
    } catch (error) {
      return this.handleControllerError(c, error, 'getUserGenerations');
    }
  }

  /**
   * Retrieves generation history for a specific app
   */
  async getAppGenerations(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('appId');
      
      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      const paginationData = {
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        sortBy: c.req.query('sortBy'),
        sortOrder: c.req.query('sortOrder')
      };

      const result = await this.aiService.getAppGenerations(appId, user.uid, paginationData);

      return c.json(createSuccessResponse(result));
    } catch (error) {
      return this.handleControllerError(c, error, 'getAppGenerations');
    }
  }

  /**
   * Cancels a running generation session
   */
  async cancelGeneration(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const generationId = c.req.param('id');

      if (!generationId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Generation ID is required'), 400);
      }

      await this.aiService.cancelGeneration(generationId, user.uid);

      return c.json(createSuccessResponse({ message: 'Generation cancelled successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'cancelGeneration');
    }
  }

  /**
   * Deletes a generation session
   */
  async deleteGeneration(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const generationId = c.req.param('id');

      if (!generationId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Generation ID is required'), 400);
      }

      await this.aiService.deleteGeneration(generationId, user.uid);

      return c.json(createSuccessResponse({ message: 'Generation deleted successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'deleteGeneration');
    }
  }

  /**
   * Retrieves AI usage statistics for the user
   */
  async getUserAIStats(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;

      const stats = await this.aiService.getUserAIStats(user.uid);

      return c.json(createSuccessResponse(stats));
    } catch (error) {
      return this.handleControllerError(c, error, 'getUserAIStats');
    }
  }

  /**
   * Standardized error handling for controller methods
   */
  private handleControllerError(c: Context, error: unknown, operation: string): Response {
    console.error(`AIController.${operation}:`, error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return c.json(createErrorResponse('VALIDATION_ERROR', error.message), 400);
      }
      if (error.name === 'NotFoundError') {
        return c.json(createErrorResponse('NOT_FOUND', error.message), 404);
      }
      if (error.name === 'AuthorizationError') {
        return c.json(createErrorResponse('AUTHORIZATION_ERROR', error.message), 403);
      }
      if (error.name === 'APIError') {
        const apiError = error as any;
        return c.json(createErrorResponse(apiError.code, error.message), apiError.statusCode);
      }
    }

    return c.json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
  }
}