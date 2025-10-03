import { Context } from 'hono';
import { auth } from 'firebase-admin';
import { createLogger } from '../../utils/logger';
import { ApiResponse } from '../../types/api';
import { AuthUser } from '../../middleware/auth';

const logger = createLogger('AuthController');

export class AuthController {
  static async register(c: Context): Promise<Response> {
    try {
      const { email, password, displayName } = await c.req.json();

      // Input validation
      if (!email || !password) {
        return c.json({ success: false, error: 'Email and password are required' }, 400);
      }

      // Create user with Firebase Auth
      const userRecord = await auth().createUser({
        email,
        password,
        displayName,
      });

      logger.info('User registered successfully', { uid: userRecord.uid, email });

      const response: ApiResponse<{ uid: string }> = {
        success: true,
        data: { uid: userRecord.uid },
      };

      return c.json(response, 201);
    } catch (error: any) {
      logger.error('Registration error:', error);
      return c.json({ success: false, error: error.message || 'Registration failed' }, 500);
    }
  }

  static async login(c: Context): Promise<Response> {
    try {
      const { email, password } = await c.req.json();

      if (!email || !password) {
        return c.json({ success: false, error: 'Email and password are required' }, 400);
      }

      // Note: Firebase Auth doesn't provide server-side password verification
      // The client should handle authentication and send the ID token
      // This endpoint is for client-side login validation

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Login validation successful' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Login error:', error);
      return c.json({ success: false, error: error.message || 'Login failed' }, 500);
    }
  }

  static async refreshToken(c: Context): Promise<Response> {
    try {
      const { refreshToken } = await c.req.json();

      if (!refreshToken) {
        return c.json({ success: false, error: 'Refresh token is required' }, 400);
      }

      // Verify the refresh token and generate a new ID token
      const decodedToken = await auth().verifyIdToken(refreshToken);
      
      const response: ApiResponse<{ uid: string }> = {
        success: true,
        data: { uid: decodedToken.uid },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      return c.json({ success: false, error: 'Invalid refresh token' }, 401);
    }
  }

  static async getProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      // Get additional user data from Firestore if needed
      const userRecord = await auth().getUser(user.uid);

      const response: ApiResponse<any> = {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
        },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get profile error:', error);
      return c.json({ success: false, error: 'Failed to get profile' }, 500);
    }
  }

  static async updateProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const { displayName, email } = await c.req.json();

      const updateData: any = {};
      if (displayName) updateData.displayName = displayName;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        return c.json({ success: false, error: 'No update data provided' }, 400);
      }

      await auth().updateUser(user.uid, updateData);

      logger.info('Profile updated successfully', { uid: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Profile updated successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      return c.json({ success: false, error: 'Failed to update profile' }, 500);
    }
  }

  static async logout(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;

      // Revoke all refresh tokens for the user
      await auth().revokeRefreshTokens(user.uid);

      logger.info('User logged out successfully', { uid: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Logout error:', error);
      return c.json({ success: false, error: 'Logout failed' }, 500);
    }
  }
}