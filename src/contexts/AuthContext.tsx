import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserService, UserProfile } from '../services/user/UserService';

// AuthUser now optionally carries UserProfile directly
export interface AuthUser extends FirebaseUser { profile?: UserProfile }

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasProfile: boolean;
  userProfile: UserProfile | null;
  
  // Authentication methods
  signInWithEmail: (credentials: LoginCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Profile methods
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const userService = new UserService();

  // Load user profile
  const loadUserProfile = async (uid: string) => {
    try {
      const profile = await userService.getUserProfile(uid);
      setUserProfile(profile);
      if (user && profile) setUser({ ...user, profile });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = firebaseUser;
        setUser(authUser);
        
        // Load user profile
        await loadUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile if it doesn't exist
      if (result.user) {
        await userService.createOrUpdateUser({
          id: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || '',
          ...(result.user.photoURL && { photoURL: result.user.photoURL }),
          subscription: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Update Firebase profile
      if (result.user) {
        await updateProfile(result.user, {
          displayName: credentials.displayName
        });

        // Create user profile in Firestore
        await userService.createOrUpdateUser({
          id: result.user.uid,
          email: credentials.email,
          displayName: credentials.displayName,
          subscription: 'free',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      await updatePassword(user, newPassword);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      // Delete user profile from Firestore
      await userService.deleteUser(user.uid);
      
      // Delete Firebase user
      await deleteUser(user);
      
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      const updatedProfile = await userService.updateUserProfile(user.uid, profileData);
      setUserProfile(updatedProfile);
      setUser({ ...user, profile: updatedProfile });
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail: signUpWithEmail,
    signOut: handleSignOut,
    resetPassword,
    updatePassword: handleUpdatePassword,
    deleteAccount,
    updateUserProfile,
    refreshProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
