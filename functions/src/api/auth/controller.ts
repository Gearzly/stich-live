import { Context } from 'hono';
import { z } from 'zod';
import { auth } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { BaseService, ValidationError, AuthenticationError, NotFoundError } from '../../services/BaseService';
import { AuthUser } from '../../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';

// Input validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name too long').optional()
});

const oauthRegisterSchema = z.object({
  provider: z.enum(['google', 'github']),
  idToken: z.string().min(1, 'ID token is required'),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required')
});

const setCustomClaimsSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  claims: z.record(z.any()).refine(
    (claims) => Object.keys(claims).length <= 1000,
    'Too many custom claims'
  )
});

const updateRoleSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  role: z.enum(['user', 'admin'])
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional()
});

/**
 * AuthenticationService following development rules
 * Extends BaseService for standardized patterns
 */
export class AuthenticationService extends BaseService {
  protected db = getFirestore();

  /**
   * Register a new user with Firebase Auth
   */
  async register(userData: unknown): Promise<{ uid: string }> {
    try {
      const validatedData = this.validateInput(userData, registerSchema);

      const createUserData: any = {
        email: validatedData.email,
        password: validatedData.password
      };

      if (validatedData.displayName) {
        createUserData.displayName = validatedData.displayName;
      }

      const userRecord = await auth().createUser(createUserData);

      // Set default custom claims
      await auth().setCustomUserClaims(userRecord.uid, { 
        role: 'user',
        emailVerified: false 
      });

      // Create user document in Firestore
      const userDocData: {
        email?: string;
        displayName?: string;
        photoURL?: string;
        provider: string;
      } = {
        email: validatedData.email,
        provider: 'email'
      };
      
      if (validatedData.displayName) {
        userDocData.displayName = validatedData.displayName;
      }
      
      await this.createUserDocument(userRecord.uid, userDocData);

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
   * Register user via OAuth provider (Google/GitHub)
   */
  async registerWithOAuth(oauthData: unknown): Promise<{ uid: string; isNewUser: boolean }> {
    try {
      const validatedData = this.validateInput(oauthData, oauthRegisterSchema);

      // Verify the OAuth ID token
      const decodedToken = await auth().verifyIdToken(validatedData.idToken);
      
      let userRecord;
      let isNewUser = false;

      try {
        // Check if user already exists
        userRecord = await auth().getUser(decodedToken.uid);
      } catch (error) {
        // User doesn't exist, create new user
        const createUserData: any = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: true,
          displayName: validatedData.displayName || decodedToken.name,
          photoURL: validatedData.photoURL || decodedToken.picture,
        };

        userRecord = await auth().createUser(createUserData);
        isNewUser = true;

        // Set default custom claims for new users
        await auth().setCustomUserClaims(userRecord.uid, { 
          role: 'user',
          provider: validatedData.provider,
          emailVerified: true 
        });

        // Create user document in Firestore
        const oauthUserDocData: {
          email?: string;
          displayName?: string;
          photoURL?: string;
          provider: string;
        } = {
          provider: validatedData.provider
        };
        
        if (decodedToken.email) {
          oauthUserDocData.email = decodedToken.email;
        }
        
        if (createUserData.displayName) {
          oauthUserDocData.displayName = createUserData.displayName;
        }
        
        if (createUserData.photoURL) {
          oauthUserDocData.photoURL = createUserData.photoURL;
        }
        
        await this.createUserDocument(userRecord.uid, oauthUserDocData);

        this.logger.info('New OAuth user registered', { 
          uid: userRecord.uid, 
          email: decodedToken.email,
          provider: validatedData.provider
        });
      }

      return { uid: userRecord.uid, isNewUser };
    } catch (error) {
      this.handleError(error as Error, 'registerWithOAuth');
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
      
      if (!userRecord) {
        throw new NotFoundError('User', uid);
      }

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        customClaims: userRecord.customClaims,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'getProfile');
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
   * Update user profile in Firebase Auth
   */
  async updateProfile(uid: string, updateData: unknown): Promise<{ message: string }> {
    try {
      if (!uid) {
        throw new ValidationError('User ID is required', 'uid');
      }

      const validatedData = this.validateInput(updateData, updateProfileSchema);

      const updateFields: any = {};
      if (validatedData.displayName) updateFields.displayName = validatedData.displayName;
      if (validatedData.email) updateFields.email = validatedData.email;

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

  /**
   * Update user role (admin only)
   */
  async updateUserRole(roleData: unknown): Promise<{ message: string }> {
    try {
      const validatedData = this.validateInput(roleData, updateRoleSchema);

      // Get current custom claims
      const userRecord = await auth().getUser(validatedData.uid);
      const currentClaims = userRecord.customClaims || {};

      // Update role in custom claims
      const updatedClaims = {
        ...currentClaims,
        role: validatedData.role,
        admin: validatedData.role === 'admin'
      };

      await auth().setCustomUserClaims(validatedData.uid, updatedClaims);

      this.logger.info('User role updated', { 
        uid: validatedData.uid, 
        newRole: validatedData.role 
      });

      return { message: `User role updated to ${validatedData.role}` };
    } catch (error) {
      this.handleError(error as Error, 'updateUserRole');
    }
  }

  /**
   * Set custom claims for a user
   */
  async setCustomClaims(uid: string, claims: unknown): Promise<{ message: string }> {
    try {
      const validatedData = this.validateInput({ uid, claims }, setCustomClaimsSchema);

      await auth().setCustomUserClaims(validatedData.uid, validatedData.claims);

      this.logger.info('Custom claims set successfully', { 
        uid: validatedData.uid, 
        claims: Object.keys(validatedData.claims) 
      });

      return { message: 'Custom claims updated successfully' };
    } catch (error) {
      this.handleError(error as Error, 'setCustomClaims');
    }
  }

  /**
   * Create user document in Firestore
   */
  private async createUserDocument(uid: string, userData: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    provider: string;
  }): Promise<void> {
    const userDoc = {
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: 'user',
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'en'
      },
      usage: {
        appsCreated: 0,
        generationsUsed: 0,
        storageUsed: 0
      },
      metadata: {
        emailVerified: userData.provider !== 'email',
        provider: userData.provider,
        firstLoginAt: new Date()
      }
    };

    await this.db.collection('users').doc(uid).set(userDoc);
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
      
      return c.json(createSuccessResponse(result), 201);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'register');
    }
  }

  async registerWithOAuth(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.registerWithOAuth(body);
      
      return c.json(createSuccessResponse(result), 201);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'registerWithOAuth');
    }
  }

  async getProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const result = await this.authService.getProfile(user.uid);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'getProfile');
    }
  }

  async login(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.validateLogin(body);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'login');
    }
  }

  async refreshToken(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.refreshToken(body);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'refreshToken');
    }
  }

  async updateProfile(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const body = await c.req.json();
      const result = await this.authService.updateProfile(user.uid, body);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'updateProfile');
    }
  }

  async logout(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const result = await this.authService.logout(user.uid);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'logout');
    }
  }

  // Admin-only endpoints
  async setCustomClaims(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.setCustomClaims(body.uid, body.claims);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'setCustomClaims');
    }
  }

  async updateUserRole(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const result = await this.authService.updateUserRole(body);

      return c.json(createSuccessResponse(result), 200);
    } catch (error: any) {
      return this.handleControllerError(c, error, 'updateUserRole');
    }
  }

  private handleControllerError(c: Context, error: any, operation: string): Response {
    console.error(`Error in ${operation}:`, error);

    if (error instanceof ValidationError) {
      return c.json(createErrorResponse(error.message, 'VALIDATION_ERROR'), 400);
    }

    if (error instanceof AuthenticationError) {
      return c.json(createErrorResponse(error.message, 'AUTHENTICATION_ERROR'), 401);
    }

    if (error instanceof NotFoundError) {
      return c.json(createErrorResponse(error.message, 'NOT_FOUND'), 404);
    }

    return c.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), 500);
  }
}