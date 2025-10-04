"use strict";
/**
 * Firebase Functions Entry Point
 * Stich AI Web Application Generator Backend
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = exports.onUserCreated = exports.onAppDeleted = exports.onAppUpdated = exports.onAppCreated = exports.onGenerationUpdated = exports.onGenerationCreated = exports.onFileDeleted = exports.onFileUploaded = exports.generateUsageReports = exports.updateSearchIndex = exports.cleanupOldGenerations = exports.dailyAnalytics = exports.cancelGeneration = exports.getGenerationStatus = exports.deployApp = exports.generateApp = exports.github = exports.realtime = exports.analytics = exports.files = exports.users = exports.apps = exports.ai = exports.auth = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Set global options for all functions
(0, v2_1.setGlobalOptions)({
    region: 'us-central1',
    maxInstances: 100,
    memory: '512MiB',
    timeoutSeconds: 540,
});
// Import route handlers
const auth_1 = require("./api/auth");
const ai_1 = require("./api/ai");
const apps_1 = require("./api/apps");
const users_1 = require("./api/users");
const files_1 = require("./api/files");
const analytics_1 = require("./api/analytics");
const realtime_1 = require("./api/realtime");
const github_1 = require("./api/github");
const app_1 = require("./app");
const firebase_adapter_1 = require("./utils/firebase-adapter");
// ==========================================
// HTTP Functions (REST API)
// ==========================================
/**
 * Main API entry point
 * Handles all API routes through a single function
 */
exports.api = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 50,
    memory: '1GiB',
    timeoutSeconds: 540,
}, (0, firebase_adapter_1.honoToFirebase)((0, app_1.createMainApp)()));
/**
 * Authentication API
 * Handles login, registration, password reset, OAuth
 */
exports.auth = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 50,
}, (0, firebase_adapter_1.honoToFirebase)((0, auth_1.createAuthApp)()));
/**
 * AI Generation API
 * Handles AI model interactions and code generation
 */
exports.ai = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 20,
    memory: '1GiB',
    timeoutSeconds: 540,
}, (0, firebase_adapter_1.honoToFirebase)((0, ai_1.createAIApp)()));
/**
 * Applications API
 * Handles CRUD operations for generated applications
 */
exports.apps = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 30,
}, (0, firebase_adapter_1.honoToFirebase)((0, apps_1.createAppsApp)()));
/**
 * Users API
 * Handles user profiles, preferences, and account management
 */
exports.users = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 30,
}, (0, firebase_adapter_1.honoToFirebase)((0, users_1.createUsersApp)()));
/**
 * Files API
 * Handles file uploads, downloads, and storage operations
 */
exports.files = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 20,
    memory: '1GiB',
}, (0, firebase_adapter_1.honoToFirebase)((0, files_1.createFilesApp)()));
/**
 * Analytics API
 * Handles usage tracking, metrics, and analytics
 */
exports.analytics = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
}, (0, firebase_adapter_1.honoToFirebase)((0, analytics_1.createAnalyticsApp)()));
/**
 * Realtime API
 * Handles real-time collaboration and editing
 */
exports.realtime = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 30,
    memory: '1GiB',
}, (0, firebase_adapter_1.honoToFirebase)((0, realtime_1.createRealtimeApp)()));
/**
 * GitHub API
 * Handles GitHub OAuth integration and repository operations
 */
exports.github = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 20,
    memory: '512MiB',
}, (0, firebase_adapter_1.honoToFirebase)((0, github_1.createGitHubApp)()));
// ==========================================
// Callable Functions (Direct Client Calls)
// ==========================================
// Import and export callable functions
var callable_1 = require("./callable");
Object.defineProperty(exports, "generateApp", { enumerable: true, get: function () { return callable_1.generateApp; } });
Object.defineProperty(exports, "deployApp", { enumerable: true, get: function () { return callable_1.deployApp; } });
Object.defineProperty(exports, "getGenerationStatus", { enumerable: true, get: function () { return callable_1.getGenerationStatus; } });
Object.defineProperty(exports, "cancelGeneration", { enumerable: true, get: function () { return callable_1.cancelGeneration; } });
// ==========================================
// Scheduled Functions (Cron Jobs)
// ==========================================
var scheduled_1 = require("./scheduled");
Object.defineProperty(exports, "dailyAnalytics", { enumerable: true, get: function () { return scheduled_1.dailyAnalytics; } });
Object.defineProperty(exports, "cleanupOldGenerations", { enumerable: true, get: function () { return scheduled_1.cleanupOldGenerations; } });
Object.defineProperty(exports, "updateSearchIndex", { enumerable: true, get: function () { return scheduled_1.updateSearchIndex; } });
Object.defineProperty(exports, "generateUsageReports", { enumerable: true, get: function () { return scheduled_1.generateUsageReports; } });
// ==========================================
// Storage Triggers (File Events)
// ==========================================
var storage_1 = require("./storage");
Object.defineProperty(exports, "onFileUploaded", { enumerable: true, get: function () { return storage_1.onFileUploaded; } });
Object.defineProperty(exports, "onFileDeleted", { enumerable: true, get: function () { return storage_1.onFileDeleted; } });
// ==========================================
// Firestore Triggers (Database Events)
// ==========================================
var triggers_1 = require("./triggers");
Object.defineProperty(exports, "onGenerationCreated", { enumerable: true, get: function () { return triggers_1.onGenerationCreated; } });
Object.defineProperty(exports, "onGenerationUpdated", { enumerable: true, get: function () { return triggers_1.onGenerationUpdated; } });
Object.defineProperty(exports, "onAppCreated", { enumerable: true, get: function () { return triggers_1.onAppCreated; } });
Object.defineProperty(exports, "onAppUpdated", { enumerable: true, get: function () { return triggers_1.onAppUpdated; } });
Object.defineProperty(exports, "onAppDeleted", { enumerable: true, get: function () { return triggers_1.onAppDeleted; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return triggers_1.onUserCreated; } });
// ==========================================
// Health Check Function
// ==========================================
/**
 * Health Check Endpoint
 * Simple health check for monitoring
 */
exports.health = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
}, async (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            firestore: 'available',
            storage: 'available',
            auth: 'available'
        }
    });
});
//# sourceMappingURL=index.js.map