import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { createApp } from './app';

// Initialize Firebase Admin SDK
initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '1GiB',
  timeoutSeconds: 60,
});

// Create the Express/Hono app
const app = createApp();

// Export the main API function
export const api = onRequest(
  {
    cors: true,
    maxInstances: 10,
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      // Convert Firebase Functions request to Hono Request
      const url = `https://${req.get('host') || 'localhost'}${req.url}`;
      const headers = new Headers();
      
      // Copy headers from Express request
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          headers.set(key, value.join(', '));
        }
      });

      // Create Request object
      const requestInit: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        requestInit.body = JSON.stringify(req.body);
      }

      const request = new Request(url, requestInit);

      // Get response from Hono app
      const response = await app.fetch(request);
      
      // Convert Hono Response to Express response
      res.status(response.status);
      
      // Set response headers
      response.headers.forEach((value, key) => {
        res.set(key, value);
      });

      // Send response body
      const body = await response.text();
      res.send(body);
      
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Health check function
export const health = onRequest(
  {
    cors: true,
    maxInstances: 1,
    memory: '256MiB',
    timeoutSeconds: 10,
  },
  (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  }
);