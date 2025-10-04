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
exports.ai = exports.auth = void 0;
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
const firebase_adapter_1 = require("./utils/firebase-adapter");
// Import callable functions
// import { generateApplication } from './services/ai/generation';
// import { deployApplication } from './services/deployment/deploy';
// import { processFileUpload } from './services/storage/files';
// Import Firestore triggers
// import { onApplicationCreated, onApplicationUpdated } from './triggers/applications';
// import { onUserCreated, onUserUpdated } from './triggers/users';
// import { onGenerationUpdated } from './triggers/generations';
// ==========================================
// HTTP Functions (REST API)
// ==========================================
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
 * Generation Queue Processor
 * Processes AI generation requests from the queue
 */
// export const processGenerationQueue = onMessagePublished({
//   topic: 'generation-queue',
//   maxInstances: 5,
//   memory: '2GiB',
//   timeoutSeconds: 540,
// }, async (event) => {
//   const { processGenerationMessage } = await import('./services/queue/generation');
//   return processGenerationMessage(event);
// });
/**
 * Deployment Queue Processor
 * Processes application deployment requests
 */
// export const processDeploymentQueue = onMessagePublished({
//   topic: 'deployment-queue',
//   maxInstances: 3,
//   memory: '1GiB',
//   timeoutSeconds: 300,
// }, async (event) => {
//   const { processDeploymentMessage } = await import('./services/queue/deployment');
//   return processDeploymentMessage(event);
// });
// ==========================================
// Remote Config Functions
// ==========================================
// import { onConfigUpdated } from 'firebase-functions/v2/remoteconfig';
/**
 * Remote Config Update Trigger
 * Runs when Remote Config is updated
 */
// export const onRemoteConfigUpdated = onConfigUpdated(async () => {
//   const { syncRemoteConfig } = await import('./services/config/sync');
//   return syncRemoteConfig();
// });
// Export types for client use
// export type { 
//   GenerateAppRequest, 
//   GenerateAppResponse 
// } from './types/ai';
// export type { 
//   DeployAppRequest, 
//   DeployAppResponse 
// } from './types/deployment';
// export type { 
//   ProcessFileRequest, 
//   ProcessFileResponse 
// } from './types/files';
//# sourceMappingURL=index.js.map