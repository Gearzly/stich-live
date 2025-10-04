"use strict";
/**
 * AI Generation API
 * Handles AI model interactions and code generation using Hono
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAIApp = void 0;
const hono_1 = require("hono");
const routes_1 = require("./ai/routes");
const routes_2 = require("./chat/routes");
const createAIApp = () => {
    const app = new hono_1.Hono();
    // Mount AI routes
    app.route('/', routes_1.ai);
    // Mount chat routes
    app.route('/', routes_2.chatRoutes);
    return app;
};
exports.createAIApp = createAIApp;
//# sourceMappingURL=ai.js.map