import { Context } from 'hono';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';
import { AuthUser } from '../../middleware/hono-auth';
import { logger } from 'firebase-functions';

// Get Firestore instance
const db = getFirestore();

// Validation schemas
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  socialLinks: z.object({
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
});

const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    security: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showActivity: z.boolean().optional(),
  }).optional(),
});

const ApiKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  cerebras: z.string().optional(),
});

/**
 * Authentication Controller
 * Handles all auth-related operations
 */
export class AuthController {
  
  /**
   * Verify Firebase ID token
   */
  static async verifyToken(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const { token } = body;

      if (!token) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Token is required'), 400);
      }

      const decodedToken = await getAuth().verifyIdToken(token);
      
      return c.json(createSuccessResponse({
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      }));
    } catch (error) {
      logger.error('Token verification failed:', error);
      return c.json(createErrorResponse('AUTH_ERROR', 'Invalid token'), 401);
    }
  }

  /**
   * Refresh user profile from Firebase Auth
   */
  static async refreshProfile(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const { uid } = body;

      if (!uid) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'), 400);
      }

      const userRecord = await getAuth().getUser(uid);
      const userProfile = {
        id: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || null,
        isEmailVerified: userRecord.emailVerified,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      };

      // Save/update in Firestore using Admin SDK
      await db.collection('users').doc(uid).set(userProfile, { merge: true });

      return c.json(createSuccessResponse(userProfile));
    } catch (error) {
      logger.error('Profile refresh failed:', error);
      return c.json(createErrorResponse('PROFILE_ERROR', 'Failed to refresh profile'), 500);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.name || '',
          photoURL: user.picture || null,
          isEmailVerified: user.email_verified || false,
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              security: true,
              marketing: false,
            },
            privacy: {
              profileVisibility: 'public',
              showEmail: false,
              showActivity: true,
            }
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await db.collection('users').doc(user.uid).set(newProfile);
        return c.json(createSuccessResponse(newProfile));
      }

      return c.json(createSuccessResponse(userDoc.data()));
    } catch (error) {
      logger.error('Get profile failed:', error);
      return c.json(createErrorResponse('PROFILE_ERROR', 'Failed to get profile'), 500);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      
      const validatedData = UpdateProfileSchema.parse(body);
      
      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
      };

      await db.collection('users').doc(user.uid).update(updateData);

      return c.json(createSuccessResponse({ message: 'Profile updated successfully' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Update profile failed:', error);
      return c.json(createErrorResponse('PROFILE_ERROR', 'Failed to update profile'), 500);
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      
      const validatedData = UpdatePreferencesSchema.parse(body);
      
      const updateData = {
        preferences: validatedData,
        updatedAt: new Date(),
      };

      await db.collection('users').doc(user.uid).update(updateData);

      return c.json(createSuccessResponse({ message: 'Preferences updated successfully' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Update preferences failed:', error);
      return c.json(createErrorResponse('PREFERENCES_ERROR', 'Failed to update preferences'), 500);
    }
  }

  /**
   * Get user settings
   */
  static async getSettings(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData) {
        return c.json(createErrorResponse('USER_ERROR', 'User not found'), 404);
      }

      // Return only settings-related data
      const settings = {
        preferences: userData.preferences || {},
        subscription: userData.subscription || 'free',
        apiKeys: userData.apiKeys ? Object.keys(userData.apiKeys) : [],
      };

      return c.json(createSuccessResponse(settings));
    } catch (error) {
      logger.error('Get settings failed:', error);
      return c.json(createErrorResponse('SETTINGS_ERROR', 'Failed to get settings'), 500);
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      
      const updateData = {
        ...body,
        updatedAt: new Date(),
      };

      await db.collection('users').doc(user.uid).update(updateData);

      return c.json(createSuccessResponse({ message: 'Settings updated successfully' }));
    } catch (error) {
      logger.error('Update settings failed:', error);
      return c.json(createErrorResponse('SETTINGS_ERROR', 'Failed to update settings'), 500);
    }
  }

  /**
   * Delete user account
   */
  static async deleteAccount(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      // Delete from Firestore
      await db.collection('users').doc(user.uid).delete();
      
      // Delete from Firebase Auth
      await getAuth().deleteUser(user.uid);

      return c.json(createSuccessResponse({ message: 'Account deleted successfully' }));
    } catch (error) {
      logger.error('Delete account failed:', error);
      return c.json(createErrorResponse('DELETE_ERROR', 'Failed to delete account'), 500);
    }
  }

  /**
   * Get user activity log
   */
  static async getActivity(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      // This would typically fetch from a separate activity collection
      // For now, return basic activity data
      const activity = [
        {
          id: '1',
          type: 'login',
          timestamp: new Date(),
          metadata: { ip: c.req.header('cf-connecting-ip') || 'unknown' }
        }
      ];

      return c.json(createSuccessResponse(activity));
    } catch (error) {
      logger.error('Get activity failed:', error);
      return c.json(createErrorResponse('ACTIVITY_ERROR', 'Failed to get activity'), 500);
    }
  }

  /**
   * Update user avatar
   */
  static async updateAvatar(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      const { photoURL } = body;

      if (!photoURL) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Photo URL is required'), 400);
      }

      await db.collection('users').doc(user.uid).update({
        photoURL,
        updatedAt: new Date(),
      });

      return c.json(createSuccessResponse({ message: 'Avatar updated successfully' }));
    } catch (error) {
      logger.error('Update avatar failed:', error);
      return c.json(createErrorResponse('AVATAR_ERROR', 'Failed to update avatar'), 500);
    }
  }

  /**
   * Get user's API keys for BYOK
   */
  static async getApiKeys(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      if (!userData?.apiKeys) {
        return c.json(createSuccessResponse({}));
      }

      // Return masked API keys (only show last 4 characters)
      const maskedKeys: Record<string, string> = {};
      Object.entries(userData.apiKeys).forEach(([provider, key]) => {
        if (typeof key === 'string' && key.length > 4) {
          maskedKeys[provider] = `****${key.slice(-4)}`;
        }
      });

      return c.json(createSuccessResponse(maskedKeys));
    } catch (error) {
      logger.error('Get API keys failed:', error);
      return c.json(createErrorResponse('API_KEYS_ERROR', 'Failed to get API keys'), 500);
    }
  }

  /**
   * Update user's API keys for BYOK
   */
  static async updateApiKeys(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      
      const validatedKeys = ApiKeysSchema.parse(body);
      
      await db.collection('users').doc(user.uid).update({
        apiKeys: validatedKeys,
        updatedAt: new Date(),
      });

      return c.json(createSuccessResponse({ message: 'API keys updated successfully' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
      }
      logger.error('Update API keys failed:', error);
      return c.json(createErrorResponse('API_KEYS_ERROR', 'Failed to update API keys'), 500);
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const { provider, apiKey } = body;

      if (!provider || !apiKey) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Provider and API key are required'), 400);
      }

      // Basic validation logic - in a real app, you'd test the key with the provider
      const isValid = apiKey.length > 10; // Simple validation

      return c.json(createSuccessResponse({ 
        valid: isValid,
        provider,
        message: isValid ? 'API key is valid' : 'API key appears invalid'
      }));
    } catch (error) {
      logger.error('Validate API key failed:', error);
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Failed to validate API key'), 500);
    }
  }
}
