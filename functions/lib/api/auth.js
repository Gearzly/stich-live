"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthApp = void 0;
const hono_1 = require("hono");
const hono_cors_1 = require("../middleware/hono-cors");
const createAuthApp = () => {
    const app = new hono_1.Hono();
    app.use('*', hono_cors_1.corsMiddleware);
    app.get('/health', (c) => {
        return c.json({ success: true, service: 'auth', status: 'healthy' });
    });
    return app;
};
exports.createAuthApp = createAuthApp;
//# sourceMappingURL=auth.js.map