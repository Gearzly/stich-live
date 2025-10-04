/**
 * Firebase Functions Entry Point
 * Stich AI Web Application Generator Backend
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 100,
  memory: '512MiB',
  timeoutSeconds: 540,
});

// Import route handlers
import { createAuthApp } from './api/auth';
import { createAIApp } from './api/ai';
import { createAppsApp } from './api/apps';
import { createUsersApp } from './api/users';
import { createFilesApp } from './api/files';
import { createAnalyticsApp } from './api/analytics';
import { createRealtimeApp } from './api/realtime';
import { createGitHubApp } from './api/github';
import { createMainApp } from './app';
import { honoToFirebase } from './utils/firebase-adapter';

// ==========================================
// HTTP Functions (REST API)
// ==========================================

/**
 * Main API entry point
 * Handles all API routes through a single function
 */
export const api = onRequest({
  cors: true,
  maxInstances: 50,
  memory: '1GiB',
  timeoutSeconds: 540,
}, honoToFirebase(createMainApp()));

/**
 * Authentication API
 * Handles login, registration, password reset, OAuth
 */
export const auth = onRequest({
  cors: true,
  maxInstances: 50,
}, honoToFirebase(createAuthApp()));

/**
 * AI Generation API
 * Handles AI model interactions and code generation
 */
export const ai = onRequest({
  cors: true,
  maxInstances: 20,
  memory: '1GiB',
  timeoutSeconds: 540,
}, honoToFirebase(createAIApp()));

/**
 * Applications API
 * Handles CRUD operations for generated applications
 */
export const apps = onRequest({
  cors: true,
  maxInstances: 30,
}, honoToFirebase(createAppsApp() as any));

/**
 * Users API
 * Handles user profiles, preferences, and account management
 */
export const users = onRequest({
  cors: true,
  maxInstances: 30,
}, honoToFirebase(createUsersApp() as any));

/**
 * Files API
 * Handles file uploads, downloads, and storage operations
 */
export const files = onRequest({
  cors: true,
  maxInstances: 20,
  memory: '1GiB',
}, honoToFirebase(createFilesApp() as any));

/**
 * Analytics API
 * Handles usage tracking, metrics, and analytics
 */
export const analytics = onRequest({
  cors: true,
  maxInstances: 10,
}, honoToFirebase(createAnalyticsApp() as any));

/**
 * Realtime API
 * Handles real-time collaboration and editing
 */
export const realtime = onRequest({
  cors: true,
  maxInstances: 30,
  memory: '1GiB',
}, honoToFirebase(createRealtimeApp() as any));

/**
 * GitHub API
 * Handles GitHub OAuth integration and repository operations
 */
export const github = onRequest({
  cors: true,
  maxInstances: 20,
  memory: '512MiB',
}, honoToFirebase(createGitHubApp() as any));

// ==========================================
// Callable Functions (Direct Client Calls)
// ==========================================

// Import and export callable functions
export { 
  generateApp, 
  deployApp, 
  getGenerationStatus, 
  cancelGeneration 
} from './callable';

// ==========================================
// Scheduled Functions (Cron Jobs)
// ==========================================

export {
  dailyAnalytics,
  cleanupOldGenerations,
  updateSearchIndex,
  generateUsageReports
} from './scheduled';

// ==========================================
// Storage Triggers (File Events)
// ==========================================

export {
  onFileUploaded,
  onFileDeleted
} from './storage';

// ==========================================
// Firestore Triggers (Database Events)
// ==========================================

export {
  onGenerationCreated,
  onGenerationUpdated,
  onAppCreated,
  onAppUpdated,
  onAppDeleted,
  onUserCreated
} from './triggers';

// ==========================================
// Health Check Function
// ==========================================

/**
 * Health Check Endpoint
 * Simple health check for monitoring
 */
export const health = onRequest({
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
