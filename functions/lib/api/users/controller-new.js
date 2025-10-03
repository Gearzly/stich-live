import { UserManagementService } from '../../services/UserManagementService';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
export class UsersController {
    userService;
    constructor() {
        this.userService = new UserManagementService();
    }
    /**
     * Creates a new user (admin only)
     */
    async createUser(c) {
        try {
            const user = c.get('user');
            // Check admin permissions
            if (user.role !== 'admin') {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Insufficient permissions'), 403);
            }
            const body = await c.req.json();
            const newUser = await this.userService.createUser(body);
            return c.json(createSuccessResponse(newUser), 201);
        }
        catch (error) {
            return this.handleControllerError(c, error, 'createUser');
        }
    }
    /**
     * Retrieves all users with pagination (admin only)
     */
    async getUsers(c) {
        try {
            const user = c.get('user');
            // Check admin permissions
            if (user.role !== 'admin') {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Insufficient permissions'), 403);
            }
            const page = parseInt(c.req.query('page') || '1');
            const limit = parseInt(c.req.query('limit') || '10');
            const result = await this.userService.getUsers(page, limit, user.role);
            return c.json(createSuccessResponse(result));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getUsers');
        }
    }
    /**
     * Retrieves current user's profile
     */
    async getCurrentUser(c) {
        try {
            const user = c.get('user');
            const userProfile = await this.userService.findUserById(user.uid);
            return c.json(createSuccessResponse(userProfile));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getCurrentUser');
        }
    }
    /**
     * Retrieves a specific user by ID (admin only or own profile)
     */
    async getUserById(c) {
        try {
            const user = c.get('user');
            const userId = c.req.param('id');
            if (!userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            // Allow users to access their own profile or admins to access any profile
            if (user.uid !== userId && user.role !== 'admin') {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Insufficient permissions'), 403);
            }
            const userProfile = await this.userService.findUserById(userId);
            return c.json(createSuccessResponse(userProfile));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getUserById');
        }
    }
    /**
     * Updates a user's profile
     */
    async updateUser(c) {
        try {
            const user = c.get('user');
            const userId = c.req.param('id');
            const body = await c.req.json();
            if (!userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            // Allow users to update their own profile or admins to update any profile
            if (user.uid !== userId && user.role !== 'admin') {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Insufficient permissions'), 403);
            }
            const updatedUser = await this.userService.updateUser(userId, body, user.uid, user.role);
            return c.json(createSuccessResponse(updatedUser));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'updateUser');
        }
    }
    /**
     * Deletes a user (admin only)
     */
    async deleteUser(c) {
        try {
            const user = c.get('user');
            const userId = c.req.param('id');
            if (!userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            // Check admin permissions
            if (user.role !== 'admin') {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Insufficient permissions'), 403);
            }
            // Prevent self-deletion
            if (user.uid === userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'Cannot delete your own account'), 400);
            }
            await this.userService.deleteUser(userId, user.uid, user.role);
            return c.json(createSuccessResponse({ message: 'User deleted successfully' }));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'deleteUser');
        }
    }
    /**
     * Updates user preferences
     */
    async updateUserPreferences(c) {
        try {
            const user = c.get('user');
            const userId = c.req.param('id');
            const body = await c.req.json();
            if (!userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            // Only allow users to update their own preferences
            if (user.uid !== userId) {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Can only update your own preferences'), 403);
            }
            const preferences = await this.userService.updateUserPreferences(userId, body, user.uid);
            return c.json(createSuccessResponse(preferences));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'updateUserPreferences');
        }
    }
    /**
     * Retrieves user preferences
     */
    async getUserPreferences(c) {
        try {
            const user = c.get('user');
            const userId = c.req.param('id');
            if (!userId) {
                return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            // Only allow users to view their own preferences
            if (user.uid !== userId) {
                return c.json(createErrorResponse('AUTHORIZATION_ERROR', 'Can only view your own preferences'), 403);
            }
            const preferences = await this.userService.getUserPreferences(userId, user.uid);
            return c.json(createSuccessResponse(preferences));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getUserPreferences');
        }
    }
    /**
     * Standardized error handling for controller methods
     */
    handleControllerError(c, error, operation) {
        console.error(`UsersController.${operation}:`, error);
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
                const apiError = error;
                return c.json(createErrorResponse(apiError.code, error.message), apiError.statusCode);
            }
        }
        return c.json(createErrorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
    }
}
//# sourceMappingURL=controller-new.js.map