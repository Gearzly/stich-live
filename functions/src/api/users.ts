/**
 * User Management API
 * Handles user profiles, preferences, and account management
 */

import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { authMiddleware, AuthUser } from '../middleware/hono-auth';
import { corsMiddleware } from '../middleware/hono-cors';
import { UserManagementService } from '../services/UserManagementService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { z } from 'zod';

// Extended Hono context for user data
interface UserContext {
  Variables: {
    user: AuthUser;
  };
}

// Validation schemas
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  photoURL: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  location: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private']).optional(),
    showEmail: z.boolean().optional(),
  }).optional(),
});

export const createUsersApp = () => {
  const app = new Hono<UserContext>();
  const userService = new UserManagementService();
  
  // Apply middleware
  app.use('*', corsMiddleware);

  /**
   * Health check endpoint
   */
  app.get('/health', (c) => {
    return c.json({ 
      success: true, 
      service: 'users', 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /profile
   * Get current user profile
   */
  app.get('/profile', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const userProfile = await userService.getUserById(user.uid);
      
      if (!userProfile) {
        return c.json(createErrorResponse('NOT_FOUND', 'User profile not found'), 404);
      }

      return c.json(createSuccessResponse(userProfile));
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      return c.json(createErrorResponse('PROFILE_ERROR', 'Failed to get user profile'), 500);
    }
  });

  /**
   * PUT /profile
   * Update current user profile
   */
  app.put('/profile', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const validatedData = UpdateProfileSchema.parse(body);
      
      const updatedUser = await userService.updateUser(user.uid, validatedData);
      
      return c.json(createSuccessResponse(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to update user profile:', error);
      return c.json(createErrorResponse('UPDATE_ERROR', 'Failed to update user profile'), 500);
    }
  });

  /**
   * GET /preferences
   * Get user preferences
   */
  app.get('/preferences', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const userProfile = await userService.getUserById(user.uid);
      
      if (!userProfile) {
        return c.json(createErrorResponse('NOT_FOUND', 'User profile not found'), 404);
      }
      
      return c.json(createSuccessResponse(userProfile.preferences || {}));
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return c.json(createErrorResponse('PREFERENCES_ERROR', 'Failed to get user preferences'), 500);
    }
  });

  /**
   * PUT /preferences
   * Update user preferences
   */
  app.put('/preferences', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const validatedData = UpdatePreferencesSchema.parse(body);
      
      await userService.updatePreferences(user.uid, validatedData);
      
      return c.json(createSuccessResponse({ message: 'Preferences updated successfully' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Failed to update user preferences:', error);
      return c.json(createErrorResponse('UPDATE_ERROR', 'Failed to update user preferences'), 500);
    }
  });

  /**
   * GET /api-keys
   * Get user's API keys
   */
  app.get('/api-keys', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const apiKeys = await userService.getApiKeys(user.uid);
      
      return c.json(createSuccessResponse({ apiKeys }));
    } catch (error) {
      logger.error('Failed to get API keys:', error);
      return c.json(createErrorResponse('API_KEYS_ERROR', 'Failed to get API keys'), 500);
    }
  });

  /**
   * POST /api-keys
   * Create or update API keys
   */
  app.post('/api-keys', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const { provider, apiKey } = body;
      
      if (!provider || !apiKey) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Provider and API key are required'), 400);
      }
      
      await userService.updateApiKeys(user.uid, { [provider]: apiKey });
      
      return c.json(createSuccessResponse({ message: 'API key updated successfully' }));
    } catch (error) {
      logger.error('Failed to update API key:', error);
      return c.json(createErrorResponse('API_KEY_ERROR', 'Failed to update API key'), 500);
    }
  });

  /**
   * DELETE /api-keys/:provider
   * Delete specific API key
   */
  app.delete('/api-keys/:provider', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const provider = c.req.param('provider');
      
      await userService.updateApiKeys(user.uid, { [provider]: null });
      
      return c.json(createSuccessResponse({ message: 'API key deleted successfully' }));
    } catch (error) {
      logger.error('Failed to delete API key:', error);
      return c.json(createErrorResponse('DELETE_ERROR', 'Failed to delete API key'), 500);
    }
  });

  /**
   * GET /stats
   * Get user statistics
   */
  app.get('/stats', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const stats = await userService.getUserStats(user.uid);
      
      return c.json(createSuccessResponse(stats));
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      return c.json(createErrorResponse('STATS_ERROR', 'Failed to get user statistics'), 500);
    }
  });

  /**
   * DELETE /account
   * Delete user account
   */
  app.delete('/account', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      
      await userService.deleteUser(user.uid);
      
      return c.json(createSuccessResponse({ message: 'Account deleted successfully' }));
    } catch (error) {
      logger.error('Failed to delete user account:', error);
      return c.json(createErrorResponse('DELETE_ERROR', 'Failed to delete user account'), 500);
    }
  });

  return app;
};