/**
 * Component Tests - Authentication Components
 * Comprehensive tests for login, registration, and authentication flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { 
  renderWithProviders, 
  mockFirebase, 
  mockUser, 
  mockApiResponses,
  setupTest,
  teardownTest,
  clickButton,
  typeInInput,
  expectElementToBeVisible,
  expectElementToHaveText,
  waitForElement,
  mockFetch
} from '../lib/test-utils';
import Login from '../routes/Login';
import Register from '../routes/Register';

// Mock Firebase Auth
vi.mock('../lib/firebase', () => ({
  auth: mockFirebase.auth,
  signInWithEmailAndPassword: mockFirebase.auth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockFirebase.auth.createUserWithEmailAndPassword,
  signInWithPopup: mockFirebase.auth.signInWithPopup,
  signOut: mockFirebase.auth.signOut,
  GoogleAuthProvider: mockFirebase.auth.GoogleAuthProvider
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/login', search: '', hash: '', state: null })
  };
});

describe('Authentication Components', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Login Component', () => {
    it('renders login form correctly', () => {
      renderWithProviders(<Login />);
      
      expectElementToBeVisible('login-form');
      expectElementToBeVisible('email-input');
      expectElementToBeVisible('password-input');
      expectElementToBeVisible('login-button');
      expectElementToBeVisible('google-login-button');
      expectElementToHaveText('login-title', 'Welcome Back');
    });

    it('validates email field', async () => {
      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'invalid-email');
      clickButton('login-button');
      
      await waitForElement('email-error');
      expectElementToHaveText('email-error', 'Please enter a valid email address');
    });

    it('validates password field', async () => {
      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', '123'); // Too short
      clickButton('login-button');
      
      await waitForElement('password-error');
      expectElementToHaveText('password-error', 'Password must be at least 6 characters');
    });

    it('handles successful email/password login', async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      await waitFor(() => {
        expect(mockFirebase.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('handles login failure', async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'User not found'
      });

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'wrongpassword');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      await waitForElement('login-error');
      expectElementToHaveText('login-error', 'Invalid email or password');
    });

    it('handles Google OAuth login', async () => {
      mockFirebase.auth.signInWithPopup.mockResolvedValue({
        user: mockUser
      });

      renderWithProviders(<Login />);
      
      await act(async () => {
        clickButton('google-login-button');
      });
      
      await waitFor(() => {
        expect(mockFirebase.auth.signInWithPopup).toHaveBeenCalled();
      });
    });

    it('shows loading state during login', async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      expectElementToBeVisible('login-loading');
      expectElementToHaveText('login-button', 'Signing in...');
    });

    it('handles password reset request', async () => {
      mockFirebase.auth.sendPasswordResetEmail.mockResolvedValue();

      renderWithProviders(<Login />);
      
      clickButton('forgot-password-link');
      
      await waitForElement('reset-password-modal');
      
      typeInInput('reset-email-input', 'test@example.com');
      clickButton('send-reset-button');
      
      await waitFor(() => {
        expect(mockFirebase.auth.sendPasswordResetEmail).toHaveBeenCalledWith(
          'test@example.com'
        );
      });
      
      await waitForElement('reset-success-message');
    });

    it('persists user session on successful login', async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'user_session',
          expect.stringContaining(mockUser.uid)
        );
      });
    });
  });

  describe('Register Component', () => {
    it('renders registration form correctly', () => {
      renderWithProviders(<Register />);
      
      expectElementToBeVisible('register-form');
      expectElementToBeVisible('name-input');
      expectElementToBeVisible('email-input');
      expectElementToBeVisible('password-input');
      expectElementToBeVisible('confirm-password-input');
      expectElementToBeVisible('register-button');
      expectElementToHaveText('register-title', 'Create Account');
    });

    it('validates all required fields', async () => {
      renderWithProviders(<Register />);
      
      clickButton('register-button');
      
      await waitForElement('name-error');
      await waitForElement('email-error');
      await waitForElement('password-error');
      
      expectElementToHaveText('name-error', 'Name is required');
      expectElementToHaveText('email-error', 'Email is required');
      expectElementToHaveText('password-error', 'Password is required');
    });

    it('validates password confirmation', async () => {
      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'different');
      
      clickButton('register-button');
      
      await waitForElement('confirm-password-error');
      expectElementToHaveText('confirm-password-error', 'Passwords do not match');
    });

    it('validates password strength', async () => {
      renderWithProviders(<Register />);
      
      typeInInput('password-input', 'weak');
      
      await waitForElement('password-strength');
      expectElementToHaveText('password-strength', 'Weak');
      
      typeInInput('password-input', 'StrongPassword123!');
      
      await waitFor(() => {
        expectElementToHaveText('password-strength', 'Strong');
      });
    });

    it('handles successful registration', async () => {
      mockFirebase.auth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });
      mockFirebase.auth.updateProfile.mockResolvedValue();

      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      await waitFor(() => {
        expect(mockFirebase.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
      
      await waitFor(() => {
        expect(mockFirebase.auth.updateProfile).toHaveBeenCalledWith(
          mockUser,
          { displayName: 'Test User' }
        );
      });
    });

    it('handles registration failure', async () => {
      mockFirebase.auth.createUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Email already in use'
      });

      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'existing@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      await waitForElement('register-error');
      expectElementToHaveText('register-error', 'Email address is already in use');
    });

    it('accepts terms and conditions', async () => {
      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      
      clickButton('register-button');
      
      await waitForElement('terms-error');
      expectElementToHaveText('terms-error', 'You must accept the terms and conditions');
      
      clickButton('terms-checkbox');
      clickButton('register-button');
      
      await waitFor(() => {
        expect(screen.queryByTestId('terms-error')).not.toBeInTheDocument();
      });
    });

    it('shows loading state during registration', async () => {
      mockFirebase.auth.createUserWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      clickButton('terms-checkbox');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      expectElementToBeVisible('register-loading');
      expectElementToHaveText('register-button', 'Creating account...');
    });

    it('creates user profile after registration', async () => {
      mockFirebase.auth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });
      mockFetch(mockApiResponses.success);

      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      clickButton('terms-checkbox');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/users/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com'
          })
        });
      });
    });
  });

  describe('Authentication Integration', () => {
    it('redirects to dashboard after successful login', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      mockFirebase.auth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('redirects to login after successful registration', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      mockFirebase.auth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      renderWithProviders(<Register />);
      
      typeInInput('name-input', 'Test User');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      clickButton('terms-checkbox');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles logout correctly', async () => {
      mockFirebase.auth.signOut.mockResolvedValue();
      
      // Simulate logged in state
      mockFirebase.auth.currentUser = mockUser;
      
      renderWithProviders(<Login />);
      
      await act(async () => {
        // Simulate logout action
        await mockFirebase.auth.signOut();
      });
      
      expect(mockFirebase.auth.signOut).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_session');
    });

    it('persists authentication state across sessions', () => {
      const mockOnAuthStateChanged = vi.fn();
      mockFirebase.auth.onAuthStateChanged = mockOnAuthStateChanged;
      
      renderWithProviders(<Login />);
      
      expect(mockOnAuthStateChanged).toHaveBeenCalled();
      
      // Simulate auth state change
      const callback = mockOnAuthStateChanged.mock.calls[0][0];
      callback(mockUser);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user_session',
        expect.stringContaining(mockUser.uid)
      );
    });
  });

  describe('Security Features', () => {
    it('implements rate limiting for login attempts', async () => {
      mockFirebase.auth.signInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/too-many-requests',
        message: 'Too many requests'
      });

      renderWithProviders(<Login />);
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        typeInInput('email-input', 'test@example.com');
        typeInInput('password-input', 'wrongpassword');
        
        await act(async () => {
          clickButton('login-button');
        });
      }
      
      await waitForElement('rate-limit-error');
      expectElementToHaveText('rate-limit-error', 'Too many login attempts. Please try again later.');
    });

    it('sanitizes user input', async () => {
      renderWithProviders(<Register />);
      
      typeInInput('name-input', '<script>alert("xss")</script>');
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      typeInInput('confirm-password-input', 'password123');
      clickButton('terms-checkbox');
      
      await act(async () => {
        clickButton('register-button');
      });
      
      // Verify that the script tag is sanitized
      expect(screen.queryByText('<script>alert("xss")</script>')).not.toBeInTheDocument();
    });

    it('validates CSRF tokens', async () => {
      mockFetch({
        success: false,
        error: 'CSRF token mismatch',
        code: 'CSRF_ERROR'
      }, { status: 403 });

      renderWithProviders(<Login />);
      
      typeInInput('email-input', 'test@example.com');
      typeInInput('password-input', 'password123');
      
      await act(async () => {
        clickButton('login-button');
      });
      
      await waitForElement('csrf-error');
      expectElementToHaveText('csrf-error', 'Security validation failed. Please refresh and try again.');
    });
  });
});