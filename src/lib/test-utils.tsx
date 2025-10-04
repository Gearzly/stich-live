/**
 * Test Utilities and Setup
 * Common testing utilities, mocks, and configuration for the test suite
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { jest } from '@jest/globals'; // Not needed in Vitest environment
import { BrowserRouter } from 'react-router-dom';
import { vi, expect } from 'vitest';
import React from 'react';

// Mock Firebase modules
export const mockFirebase = {
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    updateProfile: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    EmailAuthProvider: {
      credential: vi.fn()
    },
    GoogleAuthProvider: vi.fn(),
    deleteUser: vi.fn()
  },
  firestore: {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date() })),
      fromDate: vi.fn((date) => ({ toDate: () => date }))
    }
  },
  storage: {
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    deleteObject: vi.fn()
  },
  functions: {
    httpsCallable: vi.fn()
  }
};

// Mock user data
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  delete: vi.fn().mockResolvedValue(undefined)
};

// Mock app data
export const mockApp = {
  id: 'test-app-id',
  name: 'Test App',
  description: 'A test application',
  userId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublic: true,
  tags: ['test', 'demo'],
  previewUrl: 'https://example.com/preview',
  sourceCode: 'console.log("Hello World");',
  framework: 'react',
  status: 'completed',
  analytics: {
    views: 100,
    likes: 10,
    shares: 5
  }
};

// Mock generation data
export const mockGeneration = {
  id: 'test-generation-id',
  userId: 'test-user-id',
  prompt: 'Create a todo app',
  status: 'completed',
  progress: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  files: [
    {
      name: 'App.tsx',
      content: 'export default function App() { return <div>Hello</div>; }',
      type: 'component'
    }
  ],
  metadata: {
    framework: 'react',
    features: ['todo', 'list'],
    complexity: 'medium'
  }
};

// Mock chat data
export const mockChatMessage = {
  id: 'test-message-id',
  chatId: 'test-chat-id',
  content: 'Hello, how can I help you?',
  role: 'assistant',
  timestamp: new Date(),
  metadata: {
    model: 'gpt-4',
    tokens: 100
  }
};

// React Testing Library wrapper with providers
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <div data-testid="test-wrapper">
        {children}
      </div>
    </BrowserRouter>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: any = {}
) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
};

// Mock API responses
export const mockApiResponses = {
  success: {
    success: true,
    data: mockApp,
    message: 'Operation successful'
  },
  error: {
    success: false,
    error: 'Something went wrong',
    code: 'INTERNAL_ERROR'
  },
  validationError: {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: {
      field: 'email',
      message: 'Invalid email format'
    }
  },
  authError: {
    success: false,
    error: 'Authentication required',
    code: 'AUTH_ERROR'
  }
};

// Mock fetch function
export const mockFetch = (response: any, options: { ok?: boolean; status?: number } = {}) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: options.ok !== false,
    status: options.status || 200,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response))
  });
};

// Mock WebSocket
export const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
  CONNECTING: WebSocket.CONNECTING,
  OPEN: WebSocket.OPEN,
  CLOSING: WebSocket.CLOSING,
  CLOSED: WebSocket.CLOSED
};

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Test data generators
export const generateTestUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides
});

export const generateTestApp = (overrides: Partial<typeof mockApp> = {}) => ({
  ...mockApp,
  id: `app-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides
});

export const generateTestGeneration = (overrides: Partial<typeof mockGeneration> = {}) => ({
  ...mockGeneration,
  id: `gen-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides
});

// Common test assertions
export const expectElementToBeVisible = (testId: string) => {
  expect(screen.getByTestId(testId)).toBeInTheDocument();
};

export const expectElementToHaveText = (testId: string, text: string) => {
  expect(screen.getByTestId(testId)).toHaveTextContent(text);
};

export const expectElementToBeDisabled = (testId: string) => {
  expect(screen.getByTestId(testId)).toBeDisabled();
};

export const expectElementToBeEnabled = (testId: string) => {
  expect(screen.getByTestId(testId)).not.toBeDisabled();
};

// Async test helpers
export const waitForElement = async (testId: string, timeout = 5000) => {
  return await waitFor(
    () => screen.getByTestId(testId),
    { timeout }
  );
};

export const waitForElementToDisappear = async (testId: string, timeout = 5000) => {
  return await waitFor(
    () => expect(screen.queryByTestId(testId)).not.toBeInTheDocument(),
    { timeout }
  );
};

// Event simulation helpers
export const clickButton = (testId: string) => {
  fireEvent.click(screen.getByTestId(testId));
};

export const typeInInput = (testId: string, value: string) => {
  fireEvent.change(screen.getByTestId(testId), {
    target: { value }
  });
};

export const submitForm = (testId: string) => {
  fireEvent.submit(screen.getByTestId(testId));
};

// Mock timers helpers
export const setupMockTimers = () => {
  vi.useFakeTimers();
};

export const teardownMockTimers = () => {
  vi.useRealTimers();
};

export const advanceTimers = (ms: number) => {
  vi.advanceTimersByTime(ms);
};

// Mock navigation
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

// Setup and teardown helpers
export const setupTest = () => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Setup localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
  
  // Setup sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
  });
  
  // Setup WebSocket mock with proper typing
  (global as any).WebSocket = vi.fn().mockImplementation(() => mockWebSocket);
  
  // Setup fetch mock
  mockFetch(mockApiResponses.success);
};

export const teardownTest = () => {
  vi.clearAllMocks();
  vi.clearAllTimers();
};

// Custom matchers for better assertions
export const customMatchers = {
  toBeVisibleToUser: (element: HTMLElement) => {
    const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
    return {
      pass: isVisible,
      message: () => `Expected element to be visible to user`
    };
  },
  toHaveFormValues: (form: HTMLFormElement, values: Record<string, any>) => {
    const formData = new FormData(form);
    const formValues = Object.fromEntries(formData.entries());
    const matches = Object.entries(values).every(([key, value]) => 
      formValues[key] === value
    );
    return {
      pass: matches,
      message: () => `Expected form to have values ${JSON.stringify(values)}`
    };
  }
};

// Test environment setup
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
  process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
  process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
  
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
  
  // Mock window methods
  global.window.scrollTo = vi.fn();
  global.window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

// Performance testing helpers
export const measureRenderTime = async (component: React.ReactElement) => {
  const start = performance.now();
  renderWithProviders(component);
  await waitFor(() => screen.getByTestId('test-wrapper'));
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkAccessibility = async (component: React.ReactElement) => {
  const { container } = renderWithProviders(component);
  // Would use @axe-core/react in a real implementation
  return container;
};

export default {
  mockFirebase,
  mockUser,
  mockApp,
  mockGeneration,
  mockChatMessage,
  TestWrapper,
  renderWithProviders,
  mockApiResponses,
  mockFetch,
  mockWebSocket,
  mockLocalStorage,
  mockSessionStorage,
  generateTestUser,
  generateTestApp,
  generateTestGeneration,
  expectElementToBeVisible,
  expectElementToHaveText,
  expectElementToBeDisabled,
  expectElementToBeEnabled,
  waitForElement,
  waitForElementToDisappear,
  clickButton,
  typeInInput,
  submitForm,
  setupMockTimers,
  teardownMockTimers,
  advanceTimers,
  mockNavigate,
  mockLocation,
  setupTest,
  teardownTest,
  customMatchers,
  setupTestEnvironment,
  measureRenderTime,
  checkAccessibility
};