import { Context } from 'hono';
import { AppManagementService } from '../../services/AppManagementService';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { AuthUser } from '../../middleware/auth';

export class AppsController {
  private appService: AppManagementService;

  constructor() {
    this.appService = new AppManagementService();
  }

  /**
   * Creates a new application
   */
  async createApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();

      const app = await this.appService.createApp(user.uid, body);

      return c.json(createSuccessResponse(app), 201);
    } catch (error) {
      return this.handleControllerError(c, error, 'createApp');
    }
  }

  /**
   * Retrieves user's applications with pagination
   */
  async getUserApps(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      const paginationData = {
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        sortBy: c.req.query('sortBy'),
        sortOrder: c.req.query('sortOrder')
      };

      const result = await this.appService.getUserApps(user.uid, paginationData);

      return c.json(createSuccessResponse(result));
    } catch (error) {
      return this.handleControllerError(c, error, 'getUserApps');
    }
  }

  /**
   * Retrieves a specific application by ID
   */
  async getAppById(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      const app = await this.appService.getAppById(appId, user.uid);

      return c.json(createSuccessResponse(app));
    } catch (error) {
      return this.handleControllerError(c, error, 'getAppById');
    }
  }

  /**
   * Updates an existing application
   */
  async updateApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');
      const body = await c.req.json();

      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      const app = await this.appService.updateApp(appId, user.uid, body);

      return c.json(createSuccessResponse(app));
    } catch (error) {
      return this.handleControllerError(c, error, 'updateApp');
    }
  }

  /**
   * Deletes an application
   */
  async deleteApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      await this.appService.deleteApp(appId, user.uid);

      return c.json(createSuccessResponse({ message: 'App deleted successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'deleteApp');
    }
  }

  /**
   * Updates application status
   */
  async updateAppStatus(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');
      const body = await c.req.json();

      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      if (!body.status) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Status is required'), 400);
      }

      await this.appService.updateAppStatus(appId, user.uid, body.status);

      return c.json(createSuccessResponse({ message: 'App status updated successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'updateAppStatus');
    }
  }

  /**
   * Updates application metadata
   */
  async updateAppMetadata(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');
      const body = await c.req.json();

      if (!appId) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'App ID is required'), 400);
      }

      await this.appService.updateAppMetadata(appId, user.uid, body);

      return c.json(createSuccessResponse({ message: 'App metadata updated successfully' }));
    } catch (error) {
      return this.handleControllerError(c, error, 'updateAppMetadata');
    }
  }

  /**
   * Retrieves public applications
   */
  async getPublicApps(c: Context): Promise<Response> {
    try {
      const paginationData = {
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        sortBy: c.req.query('sortBy'),
        sortOrder: c.req.query('sortOrder')
      };

      const result = await this.appService.getPublicApps(paginationData);

      return c.json(createSuccessResponse(result));
    } catch (error) {
      return this.handleControllerError(c, error, 'getPublicApps');
    }
  }

  /**
   * Standardized error handling for controller methods
   */
  private handleControllerError(c: Context, error: unknown, operation: string): Response {
    console.error(`AppsController.${operation}:`, error);

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