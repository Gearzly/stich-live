/**
 * Firebase Functions Adapter for Hono
 * Converts Hono app to Firebase Functions compatible handler
 */

import { Hono } from 'hono';
import type { Request, Response } from 'firebase-functions';

export const honoToFirebase = (app: Hono) => {
  return async (req: Request, res: Response) => {
    try {
      // Convert Firebase Functions Request to Fetch API Request
      const url = new URL(req.originalUrl || req.url, `${req.protocol}://${req.get('host')}`);
      
      const fetchRequest = new global.Request(url.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : null,
      });

      // Execute Hono app
      const response = await app.fetch(fetchRequest);
      
      // Convert Response back to Firebase Functions format
      res.status(response.status);
      
      // Set headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // Set body
      const body = await response.text();
      res.send(body);
      
    } catch (error) {
      console.error('Firebase Functions adapter error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};