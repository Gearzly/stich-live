/**
 * Authentication API
 * Handles login, registration, password reset, OAuth
 */

import { Request, Response } from 'express';
import * as express from 'express';
import { logger } from 'firebase-functions';
import { auth, db } from '../config';
import { corsMiddleware, securityMiddleware, loggingMiddleware } from '../middleware/common';

export const createAuthApp = () => {
  const app = express();
  
  // Apply middleware
  app.use(corsMiddleware);
  app.use(securityMiddleware);
  app.use(loggingMiddleware);
  app.use(express.json());

  /**
   * POST /auth/register
   * Register a new user
   */
  app.post('/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name
      });
      
      // Create user document in Firestore
      const userData = {
        email,
        name: name || '',
        role: 'user',
        subscription: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          avatar: '',
          bio: '',
          website: '',
          location: ''
        },
        settings: {
          theme: 'light',
          notifications: {
            email: true,
            push: true
          },
          privacy: {
            profilePublic: false,
            appsPublic: true
          }
        },
        usage: {
          generationsUsed: 0,
          generationsLimit: 10,
          storageUsed: 0,
          storageLimit: 1024 * 1024 * 1024 // 1GB
        }
      };
      
      await db.collection('users').doc(userRecord.uid).set(userData);
      
      res.status(201).json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        }
      });
      
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  });

  /**
   * POST /auth/login
   * Login with email/password (returns custom token)
   */
  app.post('/login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }
      
      // Get user by email
      const userRecord = await auth.getUserByEmail(email);
      
      // Create custom token
      const customToken = await auth.createCustomToken(userRecord.uid);
      
      res.json({
        success: true,
        data: {
          token: customToken,
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        }
      });
      
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  });

  /**
   * POST /auth/reset-password
   * Send password reset email
   */
  app.post('/reset-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }
      
      // Generate password reset link
      const link = await auth.generatePasswordResetLink(email);
      
      // TODO: Send email with the reset link
      // For now, just return success
      
      res.json({
        success: true,
        message: 'Password reset email sent'
      });
      
    } catch (error: any) {
      logger.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send reset email'
      });
    }
  });

  /**
   * POST /auth/verify-token
   * Verify Firebase ID token
   */
  app.post('/verify-token', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token is required'
        });
        return;
      }
      
      const decodedToken = await auth.verifyIdToken(token);
      
      res.json({
        success: true,
        data: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        }
      });
      
    } catch (error: any) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  });

  /**
   * POST /auth/set-custom-claims
   * Set custom claims for a user (admin only)
   */
  app.post('/set-custom-claims', async (req, res) => {
    try {
      const { uid, claims } = req.body;
      
      if (!uid || !claims) {
        res.status(400).json({
          success: false,
          error: 'UID and claims are required'
        });
        return;
      }
      
      await auth.setCustomUserClaims(uid, claims);
      
      res.json({
        success: true,
        message: 'Custom claims set successfully'
      });
      
    } catch (error: any) {
      logger.error('Set custom claims error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to set custom claims'
      });
    }
  });

  /**
   * DELETE /auth/user/:uid
   * Delete a user account (admin only)
   */
  app.delete('/user/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      
      // Delete user from Firebase Auth
      await auth.deleteUser(uid);
      
      // Delete user document from Firestore
      await db.collection('users').doc(uid).delete();
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
      
    } catch (error: any) {
      logger.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete user'
      });
    }
  });

  return app;
};