import { useState, useEffect, useCallback } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserService, type UserProfile } from '@/services/UserService';

export interface AuthUser extends User {
  profile?: UserProfile;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

// Custom hook for authentication
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  const userService = new UserService();

  // Update auth state
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (user: User): Promise<UserProfile | null> => {
    try {
      const profile = await userService.getUserProfile(user.uid);
      return profile;
    } catch (err) {
      console.warn('Failed to load user profile:', err);
      return null;
    }
  }, [userService]);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const profile = await loadUserProfile(user);
        const authUser: AuthUser = profile 
          ? { ...user, profile } 
          : { ...user };
        
        updateAuthState({
          user: authUser,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        // User is signed out
        updateAuthState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile, updateAuthState]);

  // Email/password login
  const loginWithEmail = async (credentials: LoginCredentials) => {
    try {
      updateAuthState({ error: null });
      
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      const profile = await loadUserProfile(result.user);
      const authUser: AuthUser = { ...result.user, profile: profile || undefined };
      
      updateAuthState({
        user: authUser,
        isAuthenticated: true,
      });
      
      return authUser;
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Email/password registration
  const registerWithEmail = async (data: RegisterData) => {
    try {
      updateAuthState({ error: null });
      
      const result = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Update display name
      await updateProfile(result.user, {
        displayName: data.displayName,
      });
      
      // Create user profile
      const profile = await userService.createUserProfile(result.user);
      const authUser: AuthUser = { ...result.user, profile: profile || undefined };
      
      updateAuthState({
        user: authUser,
        isAuthenticated: true,
      });
      
      return authUser;
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Google sign-in
  const loginWithGoogle = async () => {
    try {
      updateAuthState({ error: null });
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      
      // Create or get user profile
      let profile: UserProfile | null;
      try {
        profile = await userService.getUserProfile(result.user.uid);
      } catch {
        profile = await userService.createUserProfile(result.user);
      }
      
      const authUser: AuthUser = { ...result.user, profile: profile || undefined };
      
      updateAuthState({
        user: authUser,
        isAuthenticated: true,
      });
      
      return authUser;
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'Google sign-in failed';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by your browser';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // GitHub sign-in
  const loginWithGitHub = async () => {
    try {
      updateAuthState({ error: null });
      
      const provider = new GithubAuthProvider();
      provider.addScope('user:email');
      
      const result = await signInWithPopup(auth, provider);
      
      // Create or get user profile  
      let profile: UserProfile | null;
      try {
        profile = await userService.getUserProfile(result.user.uid);
      } catch {
        profile = await userService.createUserProfile(result.user);
      }
      
      const authUser: AuthUser = { ...result.user, profile: profile || undefined };
      
      updateAuthState({
        user: authUser,
        isAuthenticated: true,
      });
      
      return authUser;
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'GitHub sign-in failed';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by your browser';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email using a different sign-in method';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      updateAuthState({ error: null });
      await signOut(auth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Send password reset email
  const sendPasswordReset = async (email: string) => {
    try {
      updateAuthState({ error: null });
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Change password
  const changePassword = async (newPassword: string) => {
    try {
      updateAuthState({ error: null });
      
      if (!authState.user) {
        throw new Error('No user signed in');
      }
      
      await updatePassword(authState.user, newPassword);
    } catch (err) {
      const error = err as AuthError;
      let errorMessage = 'Failed to change password';
      
      switch (error.code) {
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please sign in again to change your password';
          break;
        default:
          errorMessage = error.message;
      }
      
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      updateAuthState({ error: null });
      
      if (!authState.user) {
        throw new Error('No user signed in');
      }
      
      const updatedProfile = await userService.updateUserProfile(authState.user.uid, updates);
      
      // Update local state
      updateAuthState({
        user: {
          ...authState.user,
          profile: updatedProfile,
        },
      });
      
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      updateAuthState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Clear error
  const clearError = () => {
    updateAuthState({ error: null });
  };

  return {
    // State
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,
    
    // Actions
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGitHub,
    logout,
    sendPasswordReset,
    changePassword,
    updateUserProfile,
    clearError,
  };
}