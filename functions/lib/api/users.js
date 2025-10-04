"use strict";
/**
 * User Management API
 * Handles user profiles, preferences, and account management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsersApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const hono_auth_1 = require("../middleware/hono-auth");
const hono_cors_1 = require("../middleware/hono-cors");
const UserManagementService_1 = require("../services/UserManagementService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
// Validation schemas
const UpdateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    email: zod_1.z.string().email().optional(),
    photoURL: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().max(500).optional(),
    website: zod_1.z.string().url().optional(),
    location: zod_1.z.string().max(100).optional(),
    company: zod_1.z.string().max(100).optional(),
    theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
});
const UpdatePreferencesSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
    language: zod_1.z.string().optional(),
    notifications: zod_1.z.object({
        email: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        marketing: zod_1.z.boolean().optional(),
    }).optional(),
    privacy: zod_1.z.object({
        profileVisibility: zod_1.z.enum(['public', 'private']).optional(),
        showEmail: zod_1.z.boolean().optional(),
    }).optional(),
});
const createUsersApp = () => {
    const app = new hono_1.Hono();
    const userService = new UserManagementService_1.UserManagementService();
    // Apply middleware
    app.use('*', hono_cors_1.corsMiddleware);
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
    app.get('/profile', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const userProfile = await userService.getUserById(user.uid);
            if (!userProfile) {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', 'User profile not found'), 404);
            }
            return c.json((0, response_1.createSuccessResponse)(userProfile));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get user profile:', error);
            return c.json((0, response_1.createErrorResponse)('PROFILE_ERROR', 'Failed to get user profile'), 500);
        }
    });
    /**
     * PUT /profile
     * Update current user profile
     */
    app.put('/profile', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = UpdateProfileSchema.parse(body);
            const updatedUser = await userService.updateUser(user.uid, validatedData);
            return c.json((0, response_1.createSuccessResponse)(updatedUser));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to update user profile:', error);
            return c.json((0, response_1.createErrorResponse)('UPDATE_ERROR', 'Failed to update user profile'), 500);
        }
    });
    /**
     * GET /preferences
     * Get user preferences
     */
    app.get('/preferences', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const userProfile = await userService.getUserById(user.uid);
            if (!userProfile) {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', 'User profile not found'), 404);
            }
            return c.json((0, response_1.createSuccessResponse)(userProfile.preferences || {}));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get user preferences:', error);
            return c.json((0, response_1.createErrorResponse)('PREFERENCES_ERROR', 'Failed to get user preferences'), 500);
        }
    });
    /**
     * PUT /preferences
     * Update user preferences
     */
    app.put('/preferences', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = UpdatePreferencesSchema.parse(body);
            await userService.updatePreferences(user.uid, validatedData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Preferences updated successfully' }));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to update user preferences:', error);
            return c.json((0, response_1.createErrorResponse)('UPDATE_ERROR', 'Failed to update user preferences'), 500);
        }
    });
    /**
     * GET /api-keys
     * Get user's API keys
     */
    app.get('/api-keys', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const apiKeys = await userService.getApiKeys(user.uid);
            return c.json((0, response_1.createSuccessResponse)({ apiKeys }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get API keys:', error);
            return c.json((0, response_1.createErrorResponse)('API_KEYS_ERROR', 'Failed to get API keys'), 500);
        }
    });
    /**
     * POST /api-keys
     * Create or update API keys
     */
    app.post('/api-keys', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const { provider, apiKey } = body;
            if (!provider || !apiKey) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Provider and API key are required'), 400);
            }
            await userService.updateApiKeys(user.uid, { [provider]: apiKey });
            return c.json((0, response_1.createSuccessResponse)({ message: 'API key updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to update API key:', error);
            return c.json((0, response_1.createErrorResponse)('API_KEY_ERROR', 'Failed to update API key'), 500);
        }
    });
    /**
     * DELETE /api-keys/:provider
     * Delete specific API key
     */
    app.delete('/api-keys/:provider', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const provider = c.req.param('provider');
            await userService.updateApiKeys(user.uid, { [provider]: null });
            return c.json((0, response_1.createSuccessResponse)({ message: 'API key deleted successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to delete API key:', error);
            return c.json((0, response_1.createErrorResponse)('DELETE_ERROR', 'Failed to delete API key'), 500);
        }
    });
    /**
     * GET /stats
     * Get user statistics
     */
    app.get('/stats', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const stats = await userService.getUserStats(user.uid);
            return c.json((0, response_1.createSuccessResponse)(stats));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get user stats:', error);
            return c.json((0, response_1.createErrorResponse)('STATS_ERROR', 'Failed to get user statistics'), 500);
        }
    });
    /**
     * DELETE /account
     * Delete user account
     */
    app.delete('/account', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            await userService.deleteUser(user.uid);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Account deleted successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to delete user account:', error);
            return c.json((0, response_1.createErrorResponse)('DELETE_ERROR', 'Failed to delete user account'), 500);
        }
    });
    return app;
};
exports.createUsersApp = createUsersApp;
//# sourceMappingURL=users.js.map