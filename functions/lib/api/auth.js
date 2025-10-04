"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthApp = void 0;
const hono_1 = require("hono");
const routes_1 = require("./auth/routes");
const hono_cors_1 = require("../middleware/hono-cors");
const createAuthApp = () => {
    const app = new hono_1.Hono();
    app.use('*', hono_cors_1.corsMiddleware);
    // Mount auth routes
    app.route('/', routes_1.authRoutes);
    return app;
};
exports.createAuthApp = createAuthApp;
//# sourceMappingURL=auth.js.map