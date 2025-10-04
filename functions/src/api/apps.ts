/**
 * Applications API
 * Handles CRUD operations for generated applications
 */

import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { authMiddleware, AuthUser } from '../middleware/hono-auth';
import { corsMiddleware } from '../middleware/hono-cors';
import { AppManagementService, CreateApplicationData } from '../services/AppManagementService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { z } from 'zod';

// Extended Hono context for user data
interface AppContext {
  Variables: {
    user: AuthUser;
  };
}

// Validation schemas
const CreateAppSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  category: z.string().min(1),
  framework: z.enum(['react', 'vue', 'svelte', 'vanilla', 'node', 'python', 'other']),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  generationSettings: z.object({
    aiProvider: z.enum(['openai', 'anthropic', 'google', 'cerebras']),
    model: z.string(),
    prompt: z.string().min(1),
    additionalInstructions: z.string().optional(),
  }),
});

export const createAppsApp = () => {
  const app = new Hono<AppContext>();
  const appService = new AppManagementService();
  
  // Apply middleware
  app.use('*', corsMiddleware);

  /**
   * Health check endpoint
   */
  app.get('/health', (c) => {
    return c.json({
      success: true,
      service: 'apps',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /public
   * Get all public applications (no authentication required)
   */
  app.get('/public', async (c) => {
    try {
      const query = c.req.query();
      
      const filters: any = {
        framework: query.framework,
        category: query.category,
        search: query.search,
        tags: query.tags ? query.tags.split(',') : undefined,
      };

      // Validate and set sortBy
      const validSortBy = ['createdAt', 'views', 'likes', 'name'];
      if (query.sortBy && validSortBy.includes(query.sortBy)) {
        filters.sortBy = query.sortBy as 'createdAt' | 'views' | 'likes' | 'name';
      } else {
        filters.sortBy = 'createdAt';
      }

      // Validate and set sortOrder
      const validSortOrder = ['asc', 'desc'];
      if (query.sortOrder && validSortOrder.includes(query.sortOrder)) {
        filters.sortOrder = query.sortOrder as 'asc' | 'desc';
      } else {
        filters.sortOrder = 'desc';
      }

      const limit = parseInt(query.limit || '20');
      const offset = parseInt(query.offset || '0');
      
      const result = await appService.getPublicApplications(filters, limit, offset);
      
      return c.json(createSuccessResponse(result));
    } catch (error) {
      logger.error('Failed to get public applications:', error);
      return c.json(createErrorResponse('APPS_ERROR', 'Failed to get public applications'), 500);
    }
  });

  /**
   * GET /favorites
   * Get user's favorite applications
   */
  app.get('/favorites', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const query = c.req.query();
      
      const limit = parseInt(query.limit || '20');
      const offset = parseInt(query.offset || '0');
      
      const result = await appService.getUserFavorites(user.uid, limit, offset);
      
      return c.json(createSuccessResponse(result));
    } catch (error) {
      logger.error('Failed to get favorite applications:', error);
      return c.json(createErrorResponse('APPS_ERROR', 'Failed to get favorite applications'), 500);
    }
  });

  /**
   * POST /:id/favorite
   * Toggle favorite status for an application
   */
  app.post('/:id/favorite', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      
      const result = await appService.toggleFavorite(appId, user.uid);
      
      return c.json(createSuccessResponse(result));
    } catch (error) {
      logger.error('Failed to toggle favorite:', error);
      return c.json(createErrorResponse('FAVORITE_ERROR', 'Failed to toggle favorite'), 500);
    }
  });

  /**
   * POST /:id/star
   * Toggle star/like status for an application
   */
  app.post('/:id/star', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      
      const result = await appService.toggleStar(appId, user.uid);
      
      return c.json(createSuccessResponse(result));
    } catch (error) {
      logger.error('Failed to toggle star:', error);
      return c.json(createErrorResponse('STAR_ERROR', 'Failed to toggle star'), 500);
    }
  });

  /**
   * POST /:id/fork
   * Fork/copy an application to user's account
   */
  app.post('/:id/fork', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      const body = await c.req.json();
      
      const forkData = {
        name: body.name || undefined,
        description: body.description || undefined,
        isPublic: body.isPublic || false,
      };
      
      const forkedApp = await appService.forkApplication(appId, user.uid, forkData);
      
      return c.json(createSuccessResponse(forkedApp), 201);
    } catch (error) {
      logger.error('Failed to fork application:', error);
      return c.json(createErrorResponse('FORK_ERROR', 'Failed to fork application'), 500);
    }
  });

  /**
   * PUT /:id/visibility
   * Update application visibility settings
   */
  app.put('/:id/visibility', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      const body = await c.req.json();
      
      const visibilityData = {
        isPublic: body.isPublic,
      };
      
      await appService.updateAppVisibility(appId, user.uid, visibilityData);
      
      return c.json(createSuccessResponse({ message: 'Visibility updated successfully' }));
    } catch (error) {
      logger.error('Failed to update visibility:', error);
      return c.json(createErrorResponse('VISIBILITY_ERROR', 'Failed to update visibility'), 500);
    }
  });

  /**
   * GET /
   * Get all applications for the authenticated user
   */
  app.get('/', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const query = c.req.query();
      
      const filters = {
        status: query.status,
        framework: query.framework,
        category: query.category,
        isPublic: query.isPublic === 'true',
        isFavorite: query.isFavorite === 'true',
        search: query.search,
        tags: query.tags ? query.tags.split(',') : undefined,
      };

      const limit = parseInt(query.limit || '20');
      const offset = parseInt(query.offset || '0');
      
      const result = await appService.getUserApplications(user.uid, filters, limit, offset);
      
      return c.json(createSuccessResponse(result));
    } catch (error) {
      logger.error('Failed to get user applications:', error);
      return c.json(createErrorResponse('APPS_ERROR', 'Failed to get applications'), 500);
    }
  });

  /**
   * POST /
   * Create a new application
   */
  app.post('/', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const validatedData = CreateAppSchema.parse(body);
      
      // Cast validated data to service interface
      const app = await appService.createApplication(user.uid, validatedData as CreateApplicationData);
      
      return c.json(createSuccessResponse(app), 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to create application:', error);
      return c.json(createErrorResponse('CREATE_ERROR', 'Failed to create application'), 500);
    }
  });

  /**
   * GET /:id
   * Get a specific application by ID
   */
  app.get('/:id', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      
      const app = await appService.getApplicationById(appId, user.uid);
      
      if (!app) {
        return c.json(createErrorResponse('NOT_FOUND', 'Application not found'), 404);
      }
      
      return c.json(createSuccessResponse(app));
    } catch (error) {
      logger.error('Failed to get application:', error);
      return c.json(createErrorResponse('APPS_ERROR', 'Failed to get application'), 500);
    }
  });

  /**
   * PUT /:id
   * Update a specific application
   */
  app.put('/:id', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      const body = await c.req.json();
      
      await appService.updateApplication(appId, user.uid, body);
      
      return c.json(createSuccessResponse({ message: 'Application updated successfully' }));
    } catch (error) {
      logger.error('Failed to update application:', error);
      return c.json(createErrorResponse('UPDATE_ERROR', 'Failed to update application'), 500);
    }
  });

  /**
   * DELETE /:id
   * Delete a specific application
   */
  app.delete('/:id', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const appId = c.req.param('id');
      
      await appService.deleteApplication(appId, user.uid);
      
      return c.json(createSuccessResponse({ message: 'Application deleted successfully' }));
    } catch (error) {
      logger.error('Failed to delete application:', error);
      return c.json(createErrorResponse('DELETE_ERROR', 'Failed to delete application'), 500);
    }
  });

  return app;
};