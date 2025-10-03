import { useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserService, type UserProfile } from '../services/user/UserService';

export interface AuthUser extends FirebaseUser {
  profile?: UserProfile;
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

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const userService = new UserService();

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile
          const profile = await userService.getUserProfile(firebaseUser.uid);
          
          // Create AuthUser with conditional profile assignment
          const authUser: AuthUser = {
            ...firebaseUser,
            ...(profile && { profile })
          };
          
          setAuthState({
            user: authUser,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuthState({
            user: { ...firebaseUser },
            loading: false,
            error: 'Failed to load user profile',
          });
        }
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login with email and password
  const signInWithEmail = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      // Fetch user profile
      const profile = await userService.getUserProfile(result.user.uid);
      
      // Create AuthUser with conditional profile assignment
      const authUser: AuthUser = {
        ...result.user,
        ...(profile && { profile })
      };
      
      setAuthState({
        user: authUser,
        loading: false,
        error: null,
      });
      
      return authUser;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  // Register with email and password
  const register = async (data: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // Update Firebase user profile
      await updateProfile(result.user, {
        displayName: data.displayName,
      });
      
      // Create user profile in Firestore
      const profile = await userService.createUserProfile(result.user);
      
      // Create AuthUser with conditional profile assignment
      const authUser: AuthUser = {
        ...result.user,
        ...(profile && { profile })
      };
      
      setAuthState({
        user: authUser,
        loading: false,
        error: null,
      });
      
      return authUser;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, create if not
      let profile = await userService.getUserProfile(result.user.uid);
      if (!profile) {
        profile = await userService.createUserProfile(result.user);
      }
      
      // Create AuthUser with conditional profile assignment
      const authUser: AuthUser = {
        ...result.user,
        ...(profile && { profile })
      };
      
      setAuthState({
        user: authUser,
        loading: false,
        error: null,
      });
      
      return authUser;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Google sign-in failed',
      }));
      throw error;
    }
  };

  // Sign in with GitHub
  const signInWithGitHub = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, create if not
      let profile = await userService.getUserProfile(result.user.uid);
      if (!profile) {
        profile = await userService.createUserProfile(result.user);
      }
      
      // Create AuthUser with conditional profile assignment
      const authUser: AuthUser = {
        ...result.user,
        ...(profile && { profile })
      };
      
      setAuthState({
        user: authUser,
        loading: false,
        error: null,
      });
      
      return authUser;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'GitHub sign-in failed',
      }));
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        error: error.message || 'Sign out failed',
      }));
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  };

  // Update password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!authState.user) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        authState.user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(authState.user, credential);

      // Update password
      await updatePassword(authState.user, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Password update failed');
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    try {
      if (!authState.user) return;

      const profile = await userService.getUserProfile(authState.user.uid);
      
      // Update auth state with new profile
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          ...(profile && { profile })
        } : null,
      }));
      
      return profile;
    } catch (error: any) {
      console.error('Error refreshing profile:', error);
      throw error;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!authState.user;

  // Check if user has completed profile
  const hasProfile = !!authState.user?.profile;

  return {
    // State
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated,
    hasProfile,

    // Actions
    signInWithEmail,
    register,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    resetPassword,
    changePassword,
    refreshProfile,

    // Utilities
    clearError: () => setAuthState(prev => ({ ...prev, error: null })),
  };
}
