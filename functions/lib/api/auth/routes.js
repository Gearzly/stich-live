"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const hono_1 = require("hono");
const controller_1 = require("./controller");
const hono_auth_1 = require("../../middleware/hono-auth");
const hono_cors_1 = require("../../middleware/hono-cors");
/**
 * Authentication Routes
 * Handles login, registration, profile management, and OAuth
 */
exports.authRoutes = new hono_1.Hono();
// Apply CORS middleware
exports.authRoutes.use('*', hono_cors_1.corsMiddleware);
// ==========================================
// Public Routes (No authentication required)
// ==========================================
/**
 * Health check endpoint
 */
exports.authRoutes.get('/health', (c) => {
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
exports.authRoutes.post('/verify-token', controller_1.AuthController.verifyToken);
/**
 * Refresh user profile data
 */
exports.authRoutes.post('/refresh-profile', controller_1.AuthController.refreshProfile);
// ==========================================
// Protected Routes (Authentication required)
// ==========================================
/**
 * Get current user profile
 */
exports.authRoutes.get('/profile', hono_auth_1.authMiddleware, controller_1.AuthController.getProfile);
/**
 * Update user profile
 */
exports.authRoutes.put('/profile', hono_auth_1.authMiddleware, controller_1.AuthController.updateProfile);
/**
 * Update user preferences
 */
exports.authRoutes.put('/preferences', hono_auth_1.authMiddleware, controller_1.AuthController.updatePreferences);
/**
 * Get user settings
 */
exports.authRoutes.get('/settings', hono_auth_1.authMiddleware, controller_1.AuthController.getSettings);
/**
 * Update user settings
 */
exports.authRoutes.put('/settings', hono_auth_1.authMiddleware, controller_1.AuthController.updateSettings);
/**
 * Delete user account
 */
exports.authRoutes.delete('/account', hono_auth_1.authMiddleware, controller_1.AuthController.deleteAccount);
/**
 * Get user activity log
 */
exports.authRoutes.get('/activity', hono_auth_1.authMiddleware, controller_1.AuthController.getActivity);
/**
 * Update user avatar/photo
 */
exports.authRoutes.post('/avatar', hono_auth_1.authMiddleware, controller_1.AuthController.updateAvatar);
/**
 * Get user's API keys for BYOK
 */
exports.authRoutes.get('/api-keys', hono_auth_1.authMiddleware, controller_1.AuthController.getApiKeys);
/**
 * Update user's API keys for BYOK
 */
exports.authRoutes.put('/api-keys', hono_auth_1.authMiddleware, controller_1.AuthController.updateApiKeys);
/**
 * Validate API key
 */
exports.authRoutes.post('/validate-api-key', hono_auth_1.authMiddleware, controller_1.AuthController.validateApiKey);
//# sourceMappingURL=routes.js.map