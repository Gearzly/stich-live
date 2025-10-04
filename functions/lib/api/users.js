"use strict";
/**
 * User Management API
 * Handles user profiles, preferences, and account management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsersApp = void 0;
const express_1 = __importDefault(require("express"));
const createUsersApp = () => {
    const app = (0, express_1.default)();
    // Placeholder for Users API
    app.get('/health', (req, res) => {
        res.json({ success: true, service: 'users', status: 'healthy' });
    });
    return app;
};
exports.createUsersApp = createUsersApp;
//# sourceMappingURL=users.js.map