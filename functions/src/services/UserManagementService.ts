import { BaseService } from './BaseService';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

// User data types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  apiKeys?: Record<string, string>; // Added apiKeys to interface
  isEmailVerified: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      security: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'friends';
      showEmail: boolean;
      showActivity: boolean;
    };
  };
}

export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
  subscription?: 'free' | 'pro' | 'enterprise';
}

export interface UpdateUserData {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    security?: boolean;
    marketing?: boolean;
  };
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showActivity?: boolean;
  };
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  cerebras?: string;
}

/**
 * User Management Service
 * Handles user profile operations, preferences, and account management
 */
export class UserManagementService extends BaseService {
  private auth = getAuth();

  constructor() {
    super();
  }

  /**
   * Create a new user profile
   */
  async createUser(uid: string, userData: CreateUserData): Promise<UserProfile> {
    try {
      const userProfile: UserProfile = {
        id: uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL || null,
        subscription: userData.subscription || 'free',
        isEmailVerified: false,
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
        lastLoginAt: new Date(),
      };

      await this.db.collection('users').doc(uid).set(userProfile);
      
      this.logger.info('User profile created', { uid, email: userData.email });
      return userProfile;
    } catch (error) {
      this.logger.error('Failed to create user profile', { uid, error });
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserById(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      this.logger.error('Failed to get user by ID', { uid, error });
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as UserProfile;
    } catch (error) {
      this.logger.error('Failed to get user by email', { email, error });
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUser(uid: string, updateData: UpdateUserData): Promise<void> {
    try {
      const updatePayload = {
        ...updateData,
        updatedAt: new Date(),
      };

      await this.db.collection('users').doc(uid).update(updatePayload);
      
      this.logger.info('User profile updated', { uid });
    } catch (error) {
      this.logger.error('Failed to update user profile', { uid, error });
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(uid: string, preferences: UserPreferences): Promise<void> {
    try {
      const currentUser = await this.getUserById(uid);
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Merge with existing preferences
      const updatedPreferences = {
        ...currentUser.preferences,
        ...preferences,
        notifications: {
          ...currentUser.preferences.notifications,
          ...(preferences.notifications || {}),
        },
        privacy: {
          ...currentUser.preferences.privacy,
          ...(preferences.privacy || {}),
        }
      };

      await this.db.collection('users').doc(uid).update({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      });
      
      this.logger.info('User preferences updated', { uid });
    } catch (error) {
      this.logger.error('Failed to update user preferences', { uid, error });
      throw new Error('Failed to update user preferences');
    }
  }

  /**
   * Update user subscription
   */
  async updateSubscription(uid: string, subscription: 'free' | 'pro' | 'enterprise'): Promise<void> {
    try {
      await this.db.collection('users').doc(uid).update({
        subscription,
        updatedAt: new Date(),
      });
      
      this.logger.info('User subscription updated', { uid, subscription });
    } catch (error) {
      this.logger.error('Failed to update user subscription', { uid, error });
      throw new Error('Failed to update user subscription');
    }
  }

  /**
   * Update user's API keys for BYOK
   */
  async updateApiKeys(uid: string, apiKeys: ApiKeys): Promise<void> {
    try {
      // Encrypt API keys before storing (in production, use proper encryption)
      const encryptedKeys: Record<string, string> = {};
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key) {
          // In production, use proper encryption like Firebase KMS
          encryptedKeys[provider] = this.encryptApiKey(key);
        }
      });

      await this.db.collection('users').doc(uid).update({
        apiKeys: encryptedKeys,
        updatedAt: new Date(),
      });
      
      this.logger.info('User API keys updated', { uid, providers: Object.keys(apiKeys) });
    } catch (error) {
      this.logger.error('Failed to update user API keys', { uid, error });
      throw new Error('Failed to update API keys');
    }
  }

  /**
   * Get user's API keys (decrypted)
   */
  async getApiKeys(uid: string): Promise<ApiKeys> {
    try {
      const user = await this.getUserById(uid);
      if (!user || !user.apiKeys) {
        return {};
      }

      // Decrypt API keys
      const decryptedKeys: ApiKeys = {};
      Object.entries(user.apiKeys).forEach(([provider, encryptedKey]) => {
        if (encryptedKey && typeof encryptedKey === 'string') {
          decryptedKeys[provider as keyof ApiKeys] = this.decryptApiKey(encryptedKey);
        }
      });

      return decryptedKeys;
    } catch (error) {
      this.logger.error('Failed to get user API keys', { uid, error });
      throw new Error('Failed to get API keys');
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.db.collection('users').doc(uid).update({
        lastLoginAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to update last login', { uid, error });
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      // Delete from Firestore
      await this.db.collection('users').doc(uid).delete();
      
      // Delete related data (apps, generations, etc.)
      await this.deleteUserRelatedData(uid);
      
      // Delete from Firebase Auth
      await this.auth.deleteUser(uid);
      
      this.logger.info('User account deleted', { uid });
    } catch (error) {
      this.logger.error('Failed to delete user account', { uid, error });
      throw new Error('Failed to delete user account');
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(uid: string): Promise<{
    totalApps: number;
    totalGenerations: number;
    subscription: string;
    memberSince: Date;
  }> {
    try {
      const user = await this.getUserById(uid);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's app count
      const appsSnapshot = await this.db.collection('applications')
        .where('createdBy', '==', uid)
        .get();

      // Get user's generation count
      const generationsSnapshot = await this.db.collection('generations')
        .where('userId', '==', uid)
        .get();

      return {
        totalApps: appsSnapshot.size,
        totalGenerations: generationsSnapshot.size,
        subscription: user.subscription,
        memberSince: user.createdAt,
      };
    } catch (error) {
      this.logger.error('Failed to get user stats', { uid, error });
      throw new Error('Failed to get user stats');
    }
  }

  /**
   * Search users (admin only)
   */
  async searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<UserProfile[]> {
    try {
      // Simple search by display name or email
      const snapshot = await this.db.collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(limit)
        .offset(offset)
        .get();

      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      this.logger.error('Failed to search users', { query, error });
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get all users (admin only, paginated)
   */
  async getAllUsers(limit: number = 20, offset: number = 0): Promise<{
    users: UserProfile[];
    total: number;
  }> {
    try {
      const snapshot = await this.db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const users = snapshot.docs.map(doc => doc.data() as UserProfile);

      // Get total count (this is expensive, consider caching)
      const totalSnapshot = await this.db.collection('users').get();
      const total = totalSnapshot.size;

      return { users, total };
    } catch (error) {
      this.logger.error('Failed to get all users', { error });
      throw new Error('Failed to get users');
    }
  }

  /**
   * Delete user related data
   */
  private async deleteUserRelatedData(uid: string): Promise<void> {
    try {
      // Delete user's applications
      const appsSnapshot = await this.db.collection('applications')
        .where('createdBy', '==', uid)
        .get();
      
      const appDeletePromises = appsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(appDeletePromises);

      // Delete user's generations
      const generationsSnapshot = await this.db.collection('generations')
        .where('userId', '==', uid)
        .get();
      
      const genDeletePromises = generationsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(genDeletePromises);

      this.logger.info('User related data deleted', { uid });
    } catch (error) {
      this.logger.error('Failed to delete user related data', { uid, error });
    }
  }

  /**
   * Simple encryption for API keys (use proper encryption in production)
   */
  private encryptApiKey(key: string): string {
    // In production, use Firebase KMS or similar
    return Buffer.from(key).toString('base64');
  }

  /**
   * Simple decryption for API keys (use proper decryption in production)
   */
  private decryptApiKey(encryptedKey: string): string {
    // In production, use Firebase KMS or similar
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  }
}
