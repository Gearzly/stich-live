/**
 * Firebase Functions Entry Point
 * Stich AI Web Application Generator Backend
 */

import { onRequest, onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
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
import { createAppsApp } from './api/apps';
import { createUsersApp } from './api/users';
import { createAIApp } from './api/ai';
import { createFilesApp } from './api/files';
import { createAnalyticsApp } from './api/analytics';

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
export const auth = onRequest({
  cors: true,
  maxInstances: 50,
}, createAuthApp());

/**
 * Applications API
 * Handles CRUD operations for generated applications
 */
export const apps = onRequest({
  cors: true,
  maxInstances: 50,
}, createAppsApp());

/**
 * Users API
 * Handles user profile, settings, subscription management
 */
export const users = onRequest({
  cors: true,
  maxInstances: 50,
}, createUsersApp());

/**
 * AI Generation API
 * Handles AI model interactions and code generation
 */
export const ai = onRequest({
  cors: true,
  maxInstances: 20,
  memory: '1GiB',
  timeoutSeconds: 540,
}, createAIApp());

/**
 * File Management API
 * Handles file operations, uploads, downloads
 */
export const files = onRequest({
  cors: true,
  maxInstances: 30,
  memory: '1GiB',
}, createFilesApp());

/**
 * Analytics API
 * Handles usage analytics, monitoring, metrics
 */
export const analytics = onRequest({
  cors: true,
  maxInstances: 30,
}, createAnalyticsApp());

// ==========================================
// Callable Functions (Direct Client Calls)
// ==========================================

/**
 * Generate Application (Callable)
 * Main AI generation function for creating applications
 */
// export const generateApp = onCall({
//   maxInstances: 10,
//   memory: '2GiB',
//   timeoutSeconds: 540,
// }, generateApplication);

/**
 * Deploy Application (Callable)
 * Handles application deployment to hosting
 */
// export const deployApp = onCall({
//   maxInstances: 10,
//   memory: '1GiB',
//   timeoutSeconds: 300,
// }, deployApplication);

/**
 * Process File Upload (Callable)
 * Handles file processing and validation
 */
// export const processFile = onCall({
//   maxInstances: 20,
//   memory: '1GiB',
// }, processFileUpload);

// ==========================================
// Firestore Triggers
// ==========================================

/**
 * Application Creation Trigger
 * Runs when a new application is created
 */
// export const onAppCreated = onDocumentCreated(
//   'applications/{applicationId}',
//   onApplicationCreated
// );

/**
 * Application Update Trigger
 * Runs when an application is updated
 */
// export const onAppUpdated = onDocumentUpdated(
//   'applications/{applicationId}',
//   onApplicationUpdated
// );

/**
 * User Creation Trigger
 * Runs when a new user is created
 */
// export const onUserCreated = onDocumentCreated(
//   'users/{userId}',
//   onUserCreated
// );

/**
 * User Update Trigger
 * Runs when a user is updated
 */
// export const onUserUpdated = onDocumentUpdated(
//   'users/{userId}',
//   onUserUpdated
// );

/**
 * Generation Update Trigger
 * Runs when a generation process is updated
 */
// export const onGenerationUpdated = onDocumentUpdated(
//   'generations/{generationId}',
//   onGenerationUpdated
// );

// ==========================================
// Scheduled Functions
// ==========================================

import { onSchedule } from 'firebase-functions/v2/scheduler';

/**
 * Cleanup Old Generations
 * Runs daily to clean up old generation data
 */
export const cleanupGenerations = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'UTC',
}, async () => {
  const { cleanupOldGenerations } = await import('./services/cleanup/generations');
  return cleanupOldGenerations();
});

/**
 * Update Analytics
 * Runs hourly to update analytics data
 */
export const updateAnalytics = onSchedule({
  schedule: 'every hour',
  timeZone: 'UTC',
}, async () => {
  const { updateHourlyAnalytics } = await import('./services/analytics/aggregation');
  return updateHourlyAnalytics();
});

/**
 * Health Check
 * Runs every 5 minutes to monitor system health
 */
export const healthCheck = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'UTC',
}, async () => {
  const { performHealthCheck } = await import('./services/monitoring/health');
  return performHealthCheck();
});

// ==========================================
// Storage Triggers
// ==========================================

import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage';

/**
 * File Upload Trigger
 * Runs when a file is uploaded to Storage
 */
export const onFileUploaded = onObjectFinalized(async (event) => {
  const { processUploadedFile } = await import('./services/storage/processing');
  return processUploadedFile(event);
});

/**
 * File Deletion Trigger
 * Runs when a file is deleted from Storage
 */
export const onFileDeleted = onObjectDeleted(async (event) => {
  const { cleanupFileReferences } = await import('./services/storage/cleanup');
  return cleanupFileReferences(event);
});

// ==========================================
// Pub/Sub Functions
// ==========================================

import { onMessagePublished } from 'firebase-functions/v2/pubsub';

/**
 * Generation Queue Processor
 * Processes AI generation requests from the queue
 */
export const processGenerationQueue = onMessagePublished({
  topic: 'generation-queue',
  maxInstances: 5,
  memory: '2GiB',
  timeoutSeconds: 540,
}, async (event) => {
  const { processGenerationMessage } = await import('./services/queue/generation');
  return processGenerationMessage(event);
});

/**
 * Deployment Queue Processor
 * Processes application deployment requests
 */
export const processDeploymentQueue = onMessagePublished({
  topic: 'deployment-queue',
  maxInstances: 3,
  memory: '1GiB',
  timeoutSeconds: 300,
}, async (event) => {
  const { processDeploymentMessage } = await import('./services/queue/deployment');
  return processDeploymentMessage(event);
});

// ==========================================
// Remote Config Functions
// ==========================================

import { onConfigUpdated } from 'firebase-functions/v2/remoteconfig';

/**
 * Remote Config Update Trigger
 * Runs when Remote Config is updated
 */
export const onRemoteConfigUpdated = onConfigUpdated(async () => {
  const { syncRemoteConfig } = await import('./services/config/sync');
  return syncRemoteConfig();
});

// Export types for client use
export type { 
  GenerateAppRequest, 
  GenerateAppResponse 
} from './types/ai';

export type { 
  DeployAppRequest, 
  DeployAppResponse 
} from './types/deployment';

export type { 
  ProcessFileRequest, 
  ProcessFileResponse 
} from './types/files';
