"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsController = void 0;
const AppManagementService_1 = require("../../services/AppManagementService");
const response_1 = require("../../utils/response");
class AppsController {
    constructor() {
        this.appService = new AppManagementService_1.AppManagementService();
    }
    /**
     * Creates a new application
     */
    async createApp(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const app = await this.appService.createApp(user.uid, body);
            return c.json((0, response_1.createSuccessResponse)(app), 201);
        }
        catch (error) {
            return this.handleControllerError(c, error, 'createApp');
        }
    }
    /**
     * Retrieves user's applications with pagination
     */
    async getUserApps(c) {
        try {
            const user = c.get('user');
            const paginationData = {
                page: c.req.query('page'),
                limit: c.req.query('limit'),
                sortBy: c.req.query('sortBy'),
                sortOrder: c.req.query('sortOrder')
            };
            const result = await this.appService.getUserApps(user.uid, paginationData);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getUserApps');
        }
    }
    /**
     * Retrieves a specific application by ID
     */
    async getAppById(c) {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            if (!appId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'App ID is required'), 400);
            }
            const app = await this.appService.getAppById(appId, user.uid);
            return c.json((0, response_1.createSuccessResponse)(app));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getAppById');
        }
    }
    /**
     * Updates an existing application
     */
    async updateApp(c) {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const body = await c.req.json();
            if (!appId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'App ID is required'), 400);
            }
            const app = await this.appService.updateApp(appId, user.uid, body);
            return c.json((0, response_1.createSuccessResponse)(app));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'updateApp');
        }
    }
    /**
     * Deletes an application
     */
    async deleteApp(c) {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            if (!appId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'App ID is required'), 400);
            }
            await this.appService.deleteApp(appId, user.uid);
            return c.json((0, response_1.createSuccessResponse)({ message: 'App deleted successfully' }));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'deleteApp');
        }
    }
    /**
     * Updates application status
     */
    async updateAppStatus(c) {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const body = await c.req.json();
            if (!appId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'App ID is required'), 400);
            }
            if (!body.status) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Status is required'), 400);
            }
            await this.appService.updateAppStatus(appId, user.uid, body.status);
            return c.json((0, response_1.createSuccessResponse)({ message: 'App status updated successfully' }));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'updateAppStatus');
        }
    }
    /**
     * Updates application metadata
     */
    async updateAppMetadata(c) {
        try {
            const user = c.get('user');
            const appId = c.req.param('id');
            const body = await c.req.json();
            if (!appId) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'App ID is required'), 400);
            }
            await this.appService.updateAppMetadata(appId, user.uid, body);
            return c.json((0, response_1.createSuccessResponse)({ message: 'App metadata updated successfully' }));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'updateAppMetadata');
        }
    }
    /**
     * Retrieves public applications
     */
    async getPublicApps(c) {
        try {
            const paginationData = {
                page: c.req.query('page'),
                limit: c.req.query('limit'),
                sortBy: c.req.query('sortBy'),
                sortOrder: c.req.query('sortOrder')
            };
            const result = await this.appService.getPublicApps(paginationData);
            return c.json((0, response_1.createSuccessResponse)(result));
        }
        catch (error) {
            return this.handleControllerError(c, error, 'getPublicApps');
        }
    }
    /**
     * Standardized error handling for controller methods
     */
    handleControllerError(c, error, operation) {
        console.error(`AppsController.${operation}:`, error);
        if (error instanceof Error) {
            // Handle specific error types
            if (error.name === 'ValidationError') {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', error.message), 400);
            }
            if (error.name === 'NotFoundError') {
                return c.json((0, response_1.createErrorResponse)('NOT_FOUND', error.message), 404);
            }
            if (error.name === 'AuthorizationError') {
                return c.json((0, response_1.createErrorResponse)('AUTHORIZATION_ERROR', error.message), 403);
            }
            if (error.name === 'APIError') {
                const apiError = error;
                return c.json((0, response_1.createErrorResponse)(apiError.code, error.message), apiError.statusCode);
            }
        }
        return c.json((0, response_1.createErrorResponse)('INTERNAL_ERROR', 'Internal server error'), 500);
    }
}
exports.AppsController = AppsController;
//# sourceMappingURL=controller.js.map