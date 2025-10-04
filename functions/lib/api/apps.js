"use strict";
/**
 * Applications API
 * Handles CRUD operations for generated applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppsApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const hono_auth_1 = require("../middleware/hono-auth");
const hono_cors_1 = require("../middleware/hono-cors");
const AppManagementService_1 = require("../services/AppManagementService");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
// Validation schemas
const CreateAppSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(1000),
    category: zod_1.z.string().min(1),
    framework: zod_1.z.enum(['react', 'vue', 'svelte', 'vanilla', 'node', 'python', 'other']),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isPublic: zod_1.z.boolean().optional(),
    generationSettings: zod_1.z.object({
        aiProvider: zod_1.z.enum(['openai', 'anthropic', 'google', 'cerebras']),
        model: zod_1.z.string(),
        prompt: zod_1.z.string().min(1),
        additionalInstructions: zod_1.z.string().optional(),
    }),
});
const createAppsApp = () => {
    const app = new hono_1.Hono();
    const appService = new AppManagementService_1.AppManagementService();
    // Apply middleware
    app.use('*', hono_cors_1.corsMiddleware);
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
            const filters = {
                framework: query.framework,
                category: query.category,
                search: query.search,
                tags: query.tags ? query.tags.split(',') : undefined,
            };
            // Validate and set sortBy
            const validSortBy = ['createdAt', 'views', 'likes', 'name'];
            if (query.sortBy && validSortBy.includes(query.sortBy)) {
                filters.sortBy = query.sortBy;
            }
            else {
                filters.sortBy = 'createdAt';
            }
            // Validate and set sortOrder
            const validSortOrder = ['asc', 'desc'];
            if (query.sortOrder && validSortOrder.includes(query.sortOrder)) {
                filters.sortOrder = query.sortOrder;
            }
            else {
                filters.sortOrder = 'desc';
            }
            const limit = parseInt(query.limit || '20');
            const offset = parseInt(query.offset || '0');
            const result = await appService.getPublicApplications(filters, limit, offset);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get public applications:', error);
            return c.json((0, response_1.createErrorResponse)('APPS_ERROR', 'Failed to get public applications'), 500);
        }
    });
    /**
     * GET /favorites
     * Get user's favorite applications
     */
    app.get('/favorites', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const query = c.req.query();
            const limit = parseInt(query.limit || '20');
            const offset = parseInt(query.offset || '0');
            const result = await appService.getUserFavorites(user.uid, limit, offset);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get favorite applications:', error);
            return c.json((0, response_1.createErrorResponse)('APPS_ERROR', 'Failed to get favorite applications'), 500);
        }
    });
    /**
     * POST /:id/favorite
     * Toggle favorite status for an application
     */
    app.post('/:id/favorite', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const result = await appService.toggleFavorite(appId, user.uid);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to toggle favorite:', error);
            return c.json((0, response_1.createErrorResponse)('FAVORITE_ERROR', 'Failed to toggle favorite'), 500);
        }
    });
    /**
     * POST /:id/star
     * Toggle star/like status for an application
     */
    app.post('/:id/star', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const result = await appService.toggleStar(appId, user.uid);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to toggle star:', error);
            return c.json((0, response_1.createErrorResponse)('STAR_ERROR', 'Failed to toggle star'), 500);
        }
    });
    /**
     * POST /:id/fork
     * Fork/copy an application to user's account
     */
    app.post('/:id/fork', hono_auth_1.authMiddleware, async (c) => {
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
            return c.json((0, response_1.createSuccessResponse)(forkedApp), 201);
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to fork application:', error);
            return c.json((0, response_1.createErrorResponse)('FORK_ERROR', 'Failed to fork application'), 500);
        }
    });
    /**
     * PUT /:id/visibility
     * Update application visibility settings
     */
    app.put('/:id/visibility', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const body = await c.req.json();
            const visibilityData = {
                isPublic: body.isPublic,
            };
            await appService.updateAppVisibility(appId, user.uid, visibilityData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Visibility updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to update visibility:', error);
            return c.json((0, response_1.createErrorResponse)('VISIBILITY_ERROR', 'Failed to update visibility'), 500);
        }
    });
    /**
     * GET /
     * Get all applications for the authenticated user
     */
    app.get('/', hono_auth_1.authMiddleware, async (c) => {
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
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get user applications:', error);
            return c.json((0, response_1.createErrorResponse)('APPS_ERROR', 'Failed to get applications'), 500);
        }
    });
    /**
     * POST /
     * Create a new application
     */
    app.post('/', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = CreateAppSchema.parse(body);
            // Cast validated data to service interface
            const app = await appService.createApplication(user.uid, validatedData);
            return c.json((0, response_1.createSuccessResponse)(app), 201);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Failed to create application:', error);
            return c.json((0, response_1.createErrorResponse)('CREATE_ERROR', 'Failed to create application'), 500);
        }
    });
    /**
     * GET /:id
     * Get a specific application by ID
     */
    app.get('/:id', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const app = await appService.getApplicationById(appId, user.uid);
            if (!app) {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', 'Application not found'), 404);
            }
            return c.json((0, response_1.createSuccessResponse)(app));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to get application:', error);
            return c.json((0, response_1.createErrorResponse)('APPS_ERROR', 'Failed to get application'), 500);
        }
    });
    /**
     * PUT /:id
     * Update a specific application
     */
    app.put('/:id', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const body = await c.req.json();
            await appService.updateApplication(appId, user.uid, body);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Application updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to update application:', error);
            return c.json((0, response_1.createErrorResponse)('UPDATE_ERROR', 'Failed to update application'), 500);
        }
    });
    /**
     * DELETE /:id
     * Delete a specific application
     */
    app.delete('/:id', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            await appService.deleteApplication(appId, user.uid);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Application deleted successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Failed to delete application:', error);
            return c.json((0, response_1.createErrorResponse)('DELETE_ERROR', 'Failed to delete application'), 500);
        }
    });
    return app;
};
exports.createAppsApp = createAppsApp;
//# sourceMappingURL=apps.js.map