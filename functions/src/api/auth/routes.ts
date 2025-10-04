import { Hono } from 'hono';
import { AuthController } from './controller';
import { authMiddleware } from '../../middleware/hono-auth';
import { corsMiddleware } from '../../middleware/hono-cors';

/**
 * Authentication Routes
 * Handles login, registration, profile management, and OAuth
 */
export const authRoutes = new Hono();

// Apply CORS middleware
authRoutes.use('*', corsMiddleware);

// ==========================================
// Public Routes (No authentication required)
// ==========================================

/**
 * Health check endpoint
 */
authRoutes.get('/health', (c) => {
  return c.json({ 
    success: true, 
    service: 'auth', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Verify Firebase ID token (for testing)
 */
authRoutes.post('/verify-token', AuthController.verifyToken);

/**
 * Refresh user profile data
 */
authRoutes.post('/refresh-profile', AuthController.refreshProfile);

// ==========================================
// Protected Routes (Authentication required)
// ==========================================

/**
 * Get current user profile
 */
authRoutes.get('/profile', authMiddleware, AuthController.getProfile);

/**
 * Update user profile
 */
authRoutes.put('/profile', authMiddleware, AuthController.updateProfile);

/**
 * Update user preferences
 */
authRoutes.put('/preferences', authMiddleware, AuthController.updatePreferences);

/**
 * Get user settings
 */
authRoutes.get('/settings', authMiddleware, AuthController.getSettings);

/**
 * Update user settings
 */
authRoutes.put('/settings', authMiddleware, AuthController.updateSettings);

/**
 * Delete user account
 */
authRoutes.delete('/account', authMiddleware, AuthController.deleteAccount);

/**
 * Get user activity log
 */
authRoutes.get('/activity', authMiddleware, AuthController.getActivity);

/**
 * Update user avatar/photo
 */
authRoutes.post('/avatar', authMiddleware, AuthController.updateAvatar);

/**
 * Get user's API keys for BYOK
 */
authRoutes.get('/api-keys', authMiddleware, AuthController.getApiKeys);

/**
 * Update user's API keys for BYOK
 */
authRoutes.put('/api-keys', authMiddleware, AuthController.updateApiKeys);

/**
 * Validate API key
 */
authRoutes.post('/validate-api-key', authMiddleware, AuthController.validateApiKey);
