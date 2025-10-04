"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const response_1 = require("../../utils/response");
const firebase_functions_1 = require("firebase-functions");
// Get Firestore instance
const db = (0, firestore_1.getFirestore)();
// Validation schemas
const UpdateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    website: zod_1.z.string().url().optional(),
    location: zod_1.z.string().max(100).optional(),
    phone: zod_1.z.string().max(20).optional(),
    company: zod_1.z.string().max(100).optional(),
    jobTitle: zod_1.z.string().max(100).optional(),
    socialLinks: zod_1.z.object({
        github: zod_1.z.string().url().optional(),
        twitter: zod_1.z.string().url().optional(),
        linkedin: zod_1.z.string().url().optional(),
    }).optional(),
});
const UpdatePreferencesSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
    notifications: zod_1.z.object({
        email: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        security: zod_1.z.boolean().optional(),
        marketing: zod_1.z.boolean().optional(),
    }).optional(),
    privacy: zod_1.z.object({
        profileVisibility: zod_1.z.enum(['public', 'private', 'friends']).optional(),
        showEmail: zod_1.z.boolean().optional(),
        showActivity: zod_1.z.boolean().optional(),
    }).optional(),
});
const ApiKeysSchema = zod_1.z.object({
    openai: zod_1.z.string().optional(),
    anthropic: zod_1.z.string().optional(),
    google: zod_1.z.string().optional(),
    cerebras: zod_1.z.string().optional(),
});
/**
 * Authentication Controller
 * Handles all auth-related operations
 */
class AuthController {
    /**
     * Verify Firebase ID token
     */
    static async verifyToken(c) {
        try {
            const body = await c.req.json();
            const { token } = body;
            if (!token) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Token is required'), 400);
            }
            const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
            return c.json((0, response_1.createSuccessResponse)({
                uid: decodedToken.uid,
                email: decodedToken.email,
                email_verified: decodedToken.email_verified,
                name: decodedToken.name,
                picture: decodedToken.picture,
            }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Token verification failed:', error);
            return c.json((0, response_1.createErrorResponse)('AUTH_ERROR', 'Invalid token'), 401);
        }
    }
    /**
     * Refresh user profile from Firebase Auth
     */
    static async refreshProfile(c) {
        try {
            const body = await c.req.json();
            const { uid } = body;
            if (!uid) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'User ID is required'), 400);
            }
            const userRecord = await (0, auth_1.getAuth)().getUser(uid);
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
            return c.json((0, response_1.createSuccessResponse)(userProfile));
        }
        catch (error) {
            firebase_functions_1.logger.error('Profile refresh failed:', error);
            return c.json((0, response_1.createErrorResponse)('PROFILE_ERROR', 'Failed to refresh profile'), 500);
        }
    }
    /**
     * Get current user profile
     */
    static async getProfile(c) {
        try {
            const user = c.get('user');
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
                return c.json((0, response_1.createSuccessResponse)(newProfile));
            }
            return c.json((0, response_1.createSuccessResponse)(userDoc.data()));
        }
        catch (error) {
            firebase_functions_1.logger.error('Get profile failed:', error);
            return c.json((0, response_1.createErrorResponse)('PROFILE_ERROR', 'Failed to get profile'), 500);
        }
    }
    /**
     * Update user profile
     */
    static async updateProfile(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = UpdateProfileSchema.parse(body);
            const updateData = {
                ...validatedData,
                updatedAt: new Date(),
            };
            await db.collection('users').doc(user.uid).update(updateData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Profile updated successfully' }));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Update profile failed:', error);
            return c.json((0, response_1.createErrorResponse)('PROFILE_ERROR', 'Failed to update profile'), 500);
        }
    }
    /**
     * Update user preferences
     */
    static async updatePreferences(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedData = UpdatePreferencesSchema.parse(body);
            const updateData = {
                preferences: validatedData,
                updatedAt: new Date(),
            };
            await db.collection('users').doc(user.uid).update(updateData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Preferences updated successfully' }));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Update preferences failed:', error);
            return c.json((0, response_1.createErrorResponse)('PREFERENCES_ERROR', 'Failed to update preferences'), 500);
        }
    }
    /**
     * Get user settings
     */
    static async getSettings(c) {
        try {
            const user = c.get('user');
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            if (!userData) {
                return c.json((0, response_1.createErrorResponse)('USER_ERROR', 'User not found'), 404);
            }
            // Return only settings-related data
            const settings = {
                preferences: userData.preferences || {},
                subscription: userData.subscription || 'free',
                apiKeys: userData.apiKeys ? Object.keys(userData.apiKeys) : [],
            };
            return c.json((0, response_1.createSuccessResponse)(settings));
        }
        catch (error) {
            firebase_functions_1.logger.error('Get settings failed:', error);
            return c.json((0, response_1.createErrorResponse)('SETTINGS_ERROR', 'Failed to get settings'), 500);
        }
    }
    /**
     * Update user settings
     */
    static async updateSettings(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const updateData = {
                ...body,
                updatedAt: new Date(),
            };
            await db.collection('users').doc(user.uid).update(updateData);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Settings updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Update settings failed:', error);
            return c.json((0, response_1.createErrorResponse)('SETTINGS_ERROR', 'Failed to update settings'), 500);
        }
    }
    /**
     * Delete user account
     */
    static async deleteAccount(c) {
        try {
            const user = c.get('user');
            // Delete from Firestore
            await db.collection('users').doc(user.uid).delete();
            // Delete from Firebase Auth
            await (0, auth_1.getAuth)().deleteUser(user.uid);
            return c.json((0, response_1.createSuccessResponse)({ message: 'Account deleted successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Delete account failed:', error);
            return c.json((0, response_1.createErrorResponse)('DELETE_ERROR', 'Failed to delete account'), 500);
        }
    }
    /**
     * Get user activity log
     */
    static async getActivity(c) {
        try {
            const user = c.get('user');
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
            return c.json((0, response_1.createSuccessResponse)(activity));
        }
        catch (error) {
            firebase_functions_1.logger.error('Get activity failed:', error);
            return c.json((0, response_1.createErrorResponse)('ACTIVITY_ERROR', 'Failed to get activity'), 500);
        }
    }
    /**
     * Update user avatar
     */
    static async updateAvatar(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const { photoURL } = body;
            if (!photoURL) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Photo URL is required'), 400);
            }
            await db.collection('users').doc(user.uid).update({
                photoURL,
                updatedAt: new Date(),
            });
            return c.json((0, response_1.createSuccessResponse)({ message: 'Avatar updated successfully' }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Update avatar failed:', error);
            return c.json((0, response_1.createErrorResponse)('AVATAR_ERROR', 'Failed to update avatar'), 500);
        }
    }
    /**
     * Get user's API keys for BYOK
     */
    static async getApiKeys(c) {
        try {
            const user = c.get('user');
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.apiKeys)) {
                return c.json((0, response_1.createSuccessResponse)({}));
            }
            // Return masked API keys (only show last 4 characters)
            const maskedKeys = {};
            Object.entries(userData.apiKeys).forEach(([provider, key]) => {
                if (typeof key === 'string' && key.length > 4) {
                    maskedKeys[provider] = `****${key.slice(-4)}`;
                }
            });
            return c.json((0, response_1.createSuccessResponse)(maskedKeys));
        }
        catch (error) {
            firebase_functions_1.logger.error('Get API keys failed:', error);
            return c.json((0, response_1.createErrorResponse)('API_KEYS_ERROR', 'Failed to get API keys'), 500);
        }
    }
    /**
     * Update user's API keys for BYOK
     */
    static async updateApiKeys(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validatedKeys = ApiKeysSchema.parse(body);
            await db.collection('users').doc(user.uid).update({
                apiKeys: validatedKeys,
                updatedAt: new Date(),
            });
            return c.json((0, response_1.createSuccessResponse)({ message: 'API keys updated successfully' }));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Validation failed', error.errors), 400);
            }
            firebase_functions_1.logger.error('Update API keys failed:', error);
            return c.json((0, response_1.createErrorResponse)('API_KEYS_ERROR', 'Failed to update API keys'), 500);
        }
    }
    /**
     * Validate API key
     */
    static async validateApiKey(c) {
        try {
            const body = await c.req.json();
            const { provider, apiKey } = body;
            if (!provider || !apiKey) {
                return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Provider and API key are required'), 400);
            }
            // Basic validation logic - in a real app, you'd test the key with the provider
            const isValid = apiKey.length > 10; // Simple validation
            return c.json((0, response_1.createSuccessResponse)({
                valid: isValid,
                provider,
                message: isValid ? 'API key is valid' : 'API key appears invalid'
            }));
        }
        catch (error) {
            firebase_functions_1.logger.error('Validate API key failed:', error);
            return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Failed to validate API key'), 500);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=controller.js.map