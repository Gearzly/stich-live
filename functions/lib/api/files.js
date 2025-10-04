"use strict";
/**
 * File Management API
 * Handles file uploads, downloads, and storage operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilesApp = void 0;
const express_1 = __importDefault(require("express"));
const createFilesApp = () => {
    const app = (0, express_1.default)();
    app.get('/health', (req, res) => {
        res.json({ success: true, service: 'files', status: 'healthy' });
    });
    return app;
};
exports.createFilesApp = createFilesApp;
//# sourceMappingURL=files.js.map