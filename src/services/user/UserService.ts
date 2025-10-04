import { 
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  where,
  orderBy
} from 'firebase/firestore';
import { BaseService } from '../core/BaseService';

// User data types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  // Newly added optional extended profile fields
  phone?: string;
  company?: string;
  jobTitle?: string;
  subscription?: 'free' | 'pro' | 'enterprise';
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
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
      showLocation: boolean;
    };
  };
}

export interface UpdateUserProfileData {
  displayName?: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subscription?: 'free' | 'pro' | 'enterprise';
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface UpdatePreferencesData {
  theme?: 'light' | 'dark' | 'system';
  notifications?: Partial<UserProfile['preferences']['notifications']>;
  privacy?: Partial<UserProfile['preferences']['privacy']>;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// User Management Service
export class UserService extends BaseService {
  private readonly COLLECTION_NAME = 'users';

  // Create user profile in Firestore
  async createUserProfile(user: FirebaseUser): Promise<UserProfile> {
    try {
      const userProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        email: user.email!,
        displayName: user.displayName || '',
        ...(user.photoURL && { photoURL: user.photoURL }),
        bio: '',
        website: '',
        location: '',
        phone: '',
        company: '',
        jobTitle: '',
        subscription: 'free',
        socialLinks: {
          github: '',
          twitter: '',
          linkedin: ''
        },
        isEmailVerified: user.emailVerified,
        lastLoginAt: new Date(),
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
            showLocation: false,
          },
        },
      };

      // Use setDoc with user ID to maintain consistency with Firebase Auth
      const userDoc = doc(this.db, this.COLLECTION_NAME, user.uid);
      const profileData = this.addAuditFields(userProfile);
      
      await setDoc(userDoc, profileData);

      return {
        id: user.uid,
        ...profileData,
        createdAt: this.timestampToDate(profileData.createdAt),
        updatedAt: this.timestampToDate(profileData.updatedAt),
      } as UserProfile;
    } catch (error) {
      this.handleError(error, 'createUserProfile');
    }
  }

  // Get user profile
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    try {
      const id = userId || this.getCurrentUserId();
      return await this.getDocument<UserProfile>(this.COLLECTION_NAME, id);
    } catch (error) {
      this.handleError(error, 'getUserProfile');
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<UserProfile> {
    try {
      // Update Firebase Auth profile if display name or photo URL changed
      const user = this.auth.currentUser;
      if (user && user.uid === userId && (data.displayName !== undefined || data.photoURL !== undefined)) {
        const updateData: { displayName?: string; photoURL?: string } = {};
        if (data.displayName !== undefined) updateData.displayName = data.displayName;
        if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
        
        await updateProfile(user, updateData);
      }

      // Update Firestore profile
      await this.updateDocument(this.COLLECTION_NAME, userId, data);
      
      // Return updated profile
      const updatedProfile = await this.getUserProfile(userId);
      if (!updatedProfile) {
        throw new Error('Failed to retrieve updated profile');
      }
      
      return updatedProfile;
    } catch (error) {
      this.handleError(error, 'updateUserProfile');
    }
  }

  // Update user preferences
  async updatePreferences(data: UpdatePreferencesData): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const currentProfile = await this.getUserProfile(userId);
      
      if (!currentProfile) {
        throw new Error('User profile not found');
      }

      const updatedPreferences = {
        ...currentProfile.preferences,
        ...data,
        notifications: {
          ...currentProfile.preferences.notifications,
          ...data.notifications,
        },
        privacy: {
          ...currentProfile.preferences.privacy,
          ...data.privacy,
        },
      };

      await this.updateDocument(this.COLLECTION_NAME, userId, {
        preferences: updatedPreferences,
      });
    } catch (error) {
      this.handleError(error, 'updatePreferences');
    }
  }

  // Update last login time
  async updateLastLogin(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      await this.updateDocument(this.COLLECTION_NAME, userId, {
        lastLoginAt: new Date(),
      });
    } catch (error) {
      this.handleError(error, 'updateLastLogin');
    }
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, data.newPassword);
    } catch (error) {
      this.handleError(error, 'changePassword');
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await sendEmailVerification(user);
    } catch (error) {
      this.handleError(error, 'sendEmailVerification');
    }
  }

  // Delete user account
  async deleteUserAccount(password: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      const userId = user.uid;

      // Delete user profile from Firestore
      await this.deleteDocument(this.COLLECTION_NAME, userId);

      // Delete Firebase Auth user
      await deleteUser(user);
    } catch (error) {
      this.handleError(error, 'deleteUserAccount');
    }
  }

  // Search users (for admin or public profiles)
  async searchUsers(searchTerm: string, limit = 10): Promise<UserProfile[]> {
    try {
      // Search by display name or email
      const results = await this.queryDocuments<UserProfile>(
        this.COLLECTION_NAME,
        [
          where('preferences.privacy.profileVisibility', '==', 'public'),
          orderBy('displayName'),
          // Note: Firestore doesn't support full-text search
          // In production, consider using Algolia or similar
        ]
      );

      // Client-side filtering for search term
      return results.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit);
    } catch (error) {
      this.handleError(error, 'searchUsers');
    }
  }

  // Get public user profiles
  async getPublicProfiles(_limitCount = 20): Promise<UserProfile[]> {
    try {
      return await this.queryDocuments<UserProfile>(
        this.COLLECTION_NAME,
        [
          where('preferences.privacy.profileVisibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          // limit(limitCount) // Uncomment when using with pagination
        ]
      );
    } catch (error) {
      return this.handleError(error, 'getPublicProfiles') as never;
    }
  }

  // Check if user profile exists
  async userProfileExists(userId?: string): Promise<boolean> {
    try {
      const id = userId || this.getCurrentUserId();
      const profile = await this.getUserProfile(id);
      return profile !== null;
    } catch (error) {
      return false;
    }
  }

  // Create or update user profile
  async createOrUpdateUser(userData: {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    subscription?: 'free' | 'pro' | 'enterprise';
    phone?: string;
    company?: string;
    jobTitle?: string;
    socialLinks?: {
      github?: string;
      twitter?: string;
      linkedin?: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }): Promise<UserProfile> {
    try {
      const profile: UserProfile = {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        ...(userData.photoURL ? { photoURL: userData.photoURL } : {}),
        bio: '',
        website: '',
        location: '',
        phone: userData.phone || '',
        company: userData.company || '',
        jobTitle: userData.jobTitle || '',
        subscription: userData.subscription || 'free',
        socialLinks: userData.socialLinks || { github: '', twitter: '', linkedin: '' },
        isEmailVerified: false,
        lastLoginAt: new Date(),
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        preferences: {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            security: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showLocation: false
          }
        }
      };

      await setDoc(doc(this.db, 'users', userData.id), profile);
      return profile;
    } catch (error) {
      this.handleError(error, 'create/update user');
    }
  }

  // Delete user and their data
  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete user profile from Firestore
      await this.deleteDocument('users', userId);
    } catch (error) {
      this.handleError(error, 'delete user');
    }
  }
}