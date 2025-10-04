"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const hono_cors_1 = require("./middleware/hono-cors");
const apps_1 = require("./api/apps");
const users_1 = require("./api/users");
const files_1 = require("./api/files");
const analytics_1 = require("./api/analytics");
const createMainApp = () => {
    const app = new hono_1.Hono();
    app.use('*', hono_cors_1.corsMiddleware);
    app.get('/health', (c) => {
        return c.json({
            success: true,
            service: 'stich-backend',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });
    app.get('/', (c) => {
        return c.json({
            success: true,
            message: 'Stich Production API',
            version: '1.0.0',
            endpoints: {
                apps: '/apps',
                users: '/users',
                files: '/files',
                analytics: '/analytics'
            }
        });
    });
    app.route('/apps', (0, apps_1.createAppsApp)());
    app.route('/users', (0, users_1.createUsersApp)());
    app.route('/files', (0, files_1.createFilesApp)());
    app.route('/analytics', (0, analytics_1.createAnalyticsApp)());
    app.notFound((c) => {
        return c.json({
            success: false,
            error: 'NOT_FOUND',
            message: 'Endpoint not found'
        }, 404);
    });
    app.onError((err, c) => {
        firebase_functions_1.logger.error('Error:', err);
        return c.json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Server error'
        }, 500);
    });
    return app;
};
exports.createMainApp = createMainApp;
//# sourceMappingURL=app.js.map