/**
 * File Management API
 * Handles file uploads, downloads, and storage operations
 */

import express from 'express';

export const createFilesApp = () => {
  const app = express();
  
  app.get('/health', (req, res) => {
    res.json({ success: true, service: 'files', status: 'healthy' });
  });
  
  return app;
};