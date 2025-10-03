import { Context } from 'hono';
import { z } from 'zod';
import { auth } from 'firebase-admin';
import { BaseService, ValidationError, AuthenticationError } from '../../services/BaseService';
import { ApiResponse } from '../../types/api';
import { AuthUser } from '../../middleware/auth';

// Input validation schemas following development rules
const registerSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name too long').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * AuthenticationService following development rules
 * Extends BaseService for standardized patterns
 */
export class AuthenticationService extends BaseService {
  /**
   * Register a new user with Firebase Auth
   */
  async register(userData: unknown): Promise<{ uid: string }> {
    try {
      const validatedData = this.validateInput(userData, registerSchema);

      // Create user with Firebase Auth
      const createUserData: any = {
        email: validatedData.email,
        password: validatedData.password,
      };

      if (validatedData.displayName) {
        createUserData.displayName = validatedData.displayName;
      }

      const userRecord = await auth().createUser(createUserData);

      this.logger.info('User registered successfully', { 
        uid: userRecord.uid, 
        email: validatedData.email 
      });

      return { uid: userRecord.uid };
    } catch (error) {
      if (error instanceof Error && error.message.includes('email-already-exists')) {
        throw new ValidationError('Email already exists', 'email', 'EMAIL_EXISTS');
      }
      this.handleError(error as Error, 'register');
    }
  }

  /**
   * Validate login credentials (Firebase handles actual authentication client-side)
   */
  async validateLogin(loginData: unknown): Promise<{ message: string }> {
    try {
      const validatedData = this.validateInput(loginData, loginSchema);

      // Note: Firebase Auth doesn't provide server-side password verification
      // The client should handle authentication and send the ID token
      // This endpoint validates the login format

      this.logger.info('Login validation successful', { 
        email: validatedData.email 
      });

      return { message: 'Login validation successful' };
    } catch (error) {
      this.handleError(error as Error, 'validateLogin');
    }
  }

  /**
   * Refresh an ID token
   */
  async refreshToken(tokenData: unknown): Promise<{ uid: string }> {
    try {
      const validatedData = this.validateInput(tokenData, refreshTokenSchema);

      // Verify the refresh token and generate a new ID token
      const decodedToken = await auth().verifyIdToken(validatedData.refreshToken);
      
      this.logger.info('Token refreshed successfully', { 
        uid: decodedToken.uid 
      });

      return { uid: decodedToken.uid };
    } catch (error) {
      if (error instanceof Error && error.message.includes('invalid')) {
        throw new AuthenticationError('Invalid refresh token');
      }
      this.handleError(error as Error, 'refreshToken');
    }
  }

  /**
   * Get user profile from Firebase Auth
   */
  async getProfile(uid: string): Promise<any> {
    try {
      if (!uid) {
        throw new ValidationError('User ID is required', 'uid');
      }

      const userRecord = await auth().getUser(uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('user-not-found')) {
        throw new ValidationError('User not found', 'uid', 'USER_NOT_FOUND');
      }
      this.handleError(error as Error, 'getProfile');
    }
  }

  /**
   * Update user profile in Firebase Auth
   */
  async updateProfile(uid: string, updateData: { displayName?: string; email?: string }): Promise<{ message: string }> {
    try {
      if (!uid) {
        throw new ValidationError('User ID is required', 'uid');
      }

      const updateFields: any = {};
      if (updateData.displayName) updateFields.displayName = updateData.displayName;
      if (updateData.email) updateFields.email = updateData.email;

      if (Object.keys(updateFields).length === 0) {
        throw new ValidationError('No update data provided', 'updateData');
      }

      await auth().updateUser(uid, updateFields);

      this.logger.info('Profile updated successfully', { uid });

      return { message: 'Profile updated successfully' };
    } catch (error) {
      this.handleError(error as Error, 'updateProfile');
    }
  }

  /**
   * Logout user by revoking refresh tokens
   */
  async logout(uid: string): Promise<{ message: string }> {
    try {
      if (!uid) {
        throw new ValidationError('User ID is required', 'uid');
      }

      // Revoke all refresh tokens for the user
      await auth().revokeRefreshTokens(uid);

      this.logger.info('User logged out successfully', { uid });

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.handleError(error as Error, 'logout');
    }
  }
}

/**
 * AuthController following development rules
 * Uses dependency injection pattern with AuthenticationService
 */
export class AuthController {
  private authService: AuthenticationService;

  constructor() {
    this.authService = new AuthenticationService();
  }

  async register(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.register(body);
      
      const response: ApiResponse<{ uid: string }> = {
        success: true,
        data: result,
      };

      return c.json(response, 201);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  async login(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.validateLogin(body);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: result,
      };

      return c.json(response);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  async refreshToken(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.refreshToken(body);

      const response: ApiResponse<{ uid: string }> = {
        success: true,
        data: result,
      };

      return c.json(response);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  async getProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const result = await this.authService.getProfile(user.uid);

      const response: ApiResponse<any> = {
        success: true,
        data: result,
      };

      return c.json(response);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  async updateProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      const result = await this.authService.updateProfile(user.uid, body);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: result,
      };

      return c.json(response);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  async logout(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const result = await this.authService.logout(user.uid);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: result,
      };

      return c.json(response);
    } catch (error: any) {
      return this.handleControllerError(c, error);
    }
  }

  private handleControllerError(c: Context, error: any): Response {
    if (error.name === 'APIError') {
      return c.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }, error.statusCode);
    }

    // Unknown error - log and return generic error
    console.error('Unexpected controller error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    }, 500);
  }
}