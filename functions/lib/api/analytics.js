"use strict";
/**
 * Analytics API
 * Handles usage tracking, metrics, and analytics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsApp = void 0;
const express_1 = __importDefault(require("express"));
const createAnalyticsApp = () => {
    const app = (0, express_1.default)();
    app.get('/health', (req, res) => {
        res.json({ success: true, service: 'analytics', status: 'healthy' });
    });
    return app;
};
exports.createAnalyticsApp = createAnalyticsApp;
//# sourceMappingURL=analytics.js.map