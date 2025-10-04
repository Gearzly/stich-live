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
import { honoToFirebase } from './utils/firebase-adapter';

// ==========================================
// HTTP Functions (REST API)
// ==========================================

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
