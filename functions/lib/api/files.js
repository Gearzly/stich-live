"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilesApp = void 0;
const hono_1 = require("hono");
const firebase_functions_1 = require("firebase-functions");
const hono_auth_1 = require("../middleware/hono-auth");
const hono_cors_1 = require("../middleware/hono-cors");
const response_1 = require("../utils/response");
const createFilesApp = () => {
    const app = new hono_1.Hono();
    app.use('*', hono_cors_1.corsMiddleware);
    app.get('/health', (c) => {
        return c.json({
            success: true,
            service: 'files',
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });
    app.get('/', hono_auth_1.authMiddleware, async (c) => {
        try {
            const user = c.get('user');
            return c.json((0, response_1.createSuccessResponse)({
                message: 'Files API working',
                user: user.uid
            }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Files API error:', error);
            return c.json((0, response_1.createErrorResponse)('FILES_ERROR', 'Failed to get files'), 500);
        }
    });
    return app;
};
exports.createFilesApp = createFilesApp;
//# sourceMappingURL=files.js.map