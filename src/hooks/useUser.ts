import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserService, 
  type UserProfile, 
  type UpdateUserProfileData,
  type UpdatePreferencesData 
} from '@/services/UserService';

// Custom hook for user profile management
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userService = new UserService();

  // Load user profile
  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let userProfile = await userService.getUserProfile();
      
      // Create profile if it doesn't exist
      if (!userProfile) {
        userProfile = await userService.createUserProfile(user);
      }
      
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: UpdateUserProfileData) => {
    try {
      setError(null);
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      await userService.updateUserProfile(user.uid, data);
      await loadProfile(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  // Update preferences
  const updatePreferences = async (data: UpdatePreferencesData) => {
    try {
      setError(null);
      await userService.updatePreferences(data);
      await loadProfile(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    try {
      setError(null);
      await userService.sendEmailVerification();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      await userService.changePassword({ currentPassword, newPassword });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      throw err;
    }
  };

  // Delete account
  const deleteAccount = async (password: string) => {
    try {
      setError(null);
      await userService.deleteUserAccount(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    }
  };

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    sendEmailVerification,
    changePassword,
    deleteAccount,
    reload: loadProfile,
  };
}

// Custom hook for user search
export function useUserSearch() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userService = new UserService();

  const searchUsers = async (searchTerm: string, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await userService.searchUsers(searchTerm, limit);
      setUsers(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getPublicProfiles = async (limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await userService.getPublicProfiles(limit);
      setUsers(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load public profiles');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setUsers([]);
    setError(null);
  };

  return {
    users,
    loading,
    error,
    searchUsers,
    getPublicProfiles,
    clearResults,
  };
}