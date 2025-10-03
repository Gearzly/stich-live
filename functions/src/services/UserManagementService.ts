import { z } from 'zod';
import { BaseService, ValidationError, NotFoundError, AuthorizationError } from './BaseService';
import { User, UserPreferences } from '../types/api';

// Validation schemas following development rules
const createUserSchema = z.object({
  email: z.string().email('Invalid email format').transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(255, 'Display name too long').optional(),
  role: z.enum(['user', 'admin']).optional().default('user')
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().transform(val => val.toLowerCase().trim()).optional(),
  role: z.enum(['user', 'admin']).optional()
});

// User preferences schema (reserved for future implementation)
// const userPreferencesSchema = z.object({
//   theme: z.enum(['light', 'dark', 'system']).default('system'),
//   notifications: z.boolean().default(true),
//   language: z.string().min(2).max(5).default('en')
// });

// Transform and validation for user preferences (reserved for future use)
// const _userPreferencesTransformed = userPreferencesSchema.transform((data) => ({
//   theme: data.theme,
//   notifications: data.notifications,
//   language: data.language
// }));

/**
 * UserManagementService handles all user-related operations following development rules
 * Extends BaseService for standardized patterns
 */
export class UserManagementService extends BaseService {
  /**
   * Create a new user account with proper validation and error handling
   */
  async createUser(userData: unknown): Promise<User> {
    try {
      // Validate input using centralized validation
      const validatedData = this.validateInput(userData, createUserSchema);
      
      // Check if user already exists
      const existingUser = await this.findUserByEmail(validatedData.email);
      if (existingUser) {
        throw new ValidationError('Email already exists', 'email', 'EMAIL_EXISTS');
      }

      // Create user document
      const now = new Date();
      const userDoc = {
        email: validatedData.email,
        displayName: validatedData.displayName,
        role: validatedData.role,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        preferences: {
          theme: 'system',
          notifications: true,
          language: 'en'
        }
      };

      const docRef = await this.db.collection('users').add(userDoc);
      
      this.logger.info('User created successfully', { 
        userId: docRef.id, 
        email: validatedData.email 
      });

      return { id: docRef.id, ...userDoc } as User;
    } catch (error) {
      this.handleError(error as Error, 'createUser');
    }
  }

  /**
   * Find user by ID with proper error handling
   */
  async findUserById(userId: string): Promise<User> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required', 'userId');
      }

      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new NotFoundError('User', userId);
      }

      const userData = userDoc.data();
      return { id: userDoc.id, ...userData } as User;
    } catch (error) {
      this.handleError(error as Error, 'findUserById');
    }
  }

  /**
   * Find user by email (internal method)
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as User;
    } catch (error) {
      this.logger.error('Error finding user by email', error);
      return null;
    }
  }

  /**
   * Update user profile with validation
   */
  async updateUser(userId: string, updateData: unknown, requestingUserId: string, requestingUserRole?: string): Promise<User> {
    try {
      // Validate input
      const validatedData = this.validateInput(updateData, updateUserSchema);
      
      // Authorization check - users can only update their own data, admins can update any
      if (userId !== requestingUserId && requestingUserRole !== 'admin') {
        throw new AuthorizationError('Cannot update other users');
      }

      // Check if user exists
      const existingUser = await this.findUserById(userId);
      
      // If email is being changed, check for conflicts
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await this.findUserByEmail(validatedData.email);
        if (emailExists) {
          throw new ValidationError('Email already exists', 'email', 'EMAIL_EXISTS');
        }
      }

      // Update user
      const updateFields = {
        ...validatedData,
        updatedAt: new Date()
      };

      await this.db.collection('users').doc(userId).update(updateFields);

      this.logger.info('User updated successfully', { 
        userId, 
        updatedBy: requestingUserId,
        fields: Object.keys(validatedData)
      });

      // Return updated user
      return await this.findUserById(userId);
    } catch (error) {
      this.handleError(error as Error, 'updateUser');
    }
  }

  /**
   * Delete user with proper authorization
   */
  async deleteUser(userId: string, requestingUserId: string, requestingUserRole?: string): Promise<void> {
    try {
      // Authorization check
      if (userId !== requestingUserId && requestingUserRole !== 'admin') {
        throw new AuthorizationError('Cannot delete other users');
      }

      // Check if user exists
      await this.findUserById(userId);

      // Soft delete - update deletedAt timestamp
      await this.db.collection('users').doc(userId).update({
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.info('User deleted successfully', { 
        userId, 
        deletedBy: requestingUserId 
      });
    } catch (error) {
      this.handleError(error as Error, 'deleteUser');
    }
  }

  /**
   * Get user preferences with validation
   */
  async getUserPreferences(userId: string, requestingUserId: string): Promise<UserPreferences> {
    try {
      // Authorization check - users can only access their own preferences
      if (userId !== requestingUserId) {
        throw new AuthorizationError('Cannot access other users preferences');
      }

      const user = await this.findUserById(userId);
      
      return user.preferences || {
        theme: 'system',
        notifications: true,
        language: 'en'
      };
    } catch (error) {
      this.handleError(error as Error, 'getUserPreferences');
    }
  }

  /**
   * Update user preferences with validation
   */
  async updateUserPreferences(userId: string, preferencesData: unknown, requestingUserId: string): Promise<UserPreferences> {
    try {
      // Authorization check
      if (userId !== requestingUserId) {
        throw new AuthorizationError('Cannot update other users preferences');
      }

      // Validate preferences with defaults
      const rawPreferences = typeof preferencesData === 'object' && preferencesData !== null 
        ? preferencesData as any
        : {};
      
      const completePreferences: UserPreferences = {
        theme: rawPreferences.theme || 'system',
        notifications: rawPreferences.notifications !== undefined ? rawPreferences.notifications : true,
        language: rawPreferences.language || 'en'
      };

      // Validate enum values
      if (!['light', 'dark', 'system'].includes(completePreferences.theme)) {
        throw new ValidationError('Invalid theme value', 'theme');
      }
      
      // Update preferences
      await this.db.collection('users').doc(userId).update({
        preferences: completePreferences,
        updatedAt: new Date()
      });

      this.logger.info('User preferences updated', { userId });
      
      return completePreferences;
    } catch (error) {
      this.handleError(error as Error, 'updateUserPreferences');
    }
  }

  /**
   * Get paginated list of users (admin only)
   */
  async getUsers(
    page: number = 1, 
    limit: number = 10, 
    requestingUserRole?: string
  ): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    try {
      // Authorization check - only admins can list all users
      if (requestingUserRole !== 'admin') {
        throw new AuthorizationError('Admin access required');
      }

      const offset = (page - 1) * limit;
      
      // Get users with pagination
      const usersSnapshot = await this.db.collection('users')
        .where('deletedAt', '==', null)
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      // Get total count
      const countSnapshot = await this.db.collection('users')
        .where('deletedAt', '==', null)
        .count()
        .get();

      const users: User[] = [];
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages
      };
    } catch (error) {
      this.handleError(error as Error, 'getUsers');
    }
  }
}