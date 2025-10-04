/**
 * Test Setup Configuration
 * Global test setup, mocks, and environment configuration
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import { setupTestEnvironment } from '../lib/test-utils';

// Extend Vitest's expect with testing-library matchers
import { expect } from 'vitest';
expect.extend(matchers as any);

// Setup test environment
beforeAll(() => {
  setupTestEnvironment();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
});

// Global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '00000000-0000-0000-0000-000000000000'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch globally
global.fetch = vi.fn();

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
});

// Mock HTMLCanvasElement.getContext
(HTMLCanvasElement.prototype.getContext as any) = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => new Array(4)),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

// Mock FileReader
(global as any).FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  abort: vi.fn(),
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
  readyState: 0,
  result: null,
  error: null,
  onload: null,
  onerror: null,
  onabort: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  size: content ? content.reduce((acc: number, chunk: any) => acc + chunk.length, 0) : 0,
  type: options?.type || '',
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  text: vi.fn().mockResolvedValue(''),
  slice: vi.fn(),
  stream: vi.fn(),
}));

// Mock File
global.File = vi.fn().mockImplementation((bits, name, options) => ({
  ...new Blob(bits, options),
  name,
  lastModified: Date.now(),
  lastModifiedDate: new Date(),
  webkitRelativePath: '',
}));

// Mock FormData
global.FormData = vi.fn().mockImplementation(() => {
  const data = new Map();
  return {
    append: vi.fn((key, value) => data.set(key, value)),
    delete: vi.fn((key) => data.delete(key)),
    get: vi.fn((key) => data.get(key)),
    getAll: vi.fn((key) => [data.get(key)]),
    has: vi.fn((key) => data.has(key)),
    set: vi.fn((key, value) => data.set(key, value)),
    entries: vi.fn(() => data.entries()),
    keys: vi.fn(() => data.keys()),
    values: vi.fn(() => data.values()),
    forEach: vi.fn((callback) => data.forEach(callback)),
  };
});

// Mock Worker
(global as any).Worker = vi.fn().mockImplementation((_url: string) => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock WebSocket
(global as any).WebSocket = vi.fn().mockImplementation((url: string) => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  url,
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
  binaryType: 'blob',
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
}));

// Mock Notification API
(global as any).Notification = vi.fn().mockImplementation((title: string, options?: any) => ({
  title,
  body: options?.body || '',
  icon: options?.icon || '',
  tag: options?.tag || '',
  data: options?.data || null,
  close: vi.fn(),
  onclick: null,
  onerror: null,
  onclose: null,
  onshow: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(Notification, 'permission', {
  writable: true,
  value: 'default',
});

Object.defineProperty(Notification, 'requestPermission', {
  writable: true,
  value: vi.fn().mockResolvedValue('granted'),
});

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = vi.fn((callback: any) => setTimeout(callback, 16) as any);
global.cancelAnimationFrame = vi.fn(clearTimeout);

// Mock getComputedStyle
global.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn(() => ''),
  setProperty: vi.fn(),
  removeProperty: vi.fn(),
  cssText: '',
  length: 0,
  parentRule: null,
}));

// Mock ClipboardAPI
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue([]),
  },
});

// Mock Geolocation API
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn((success) => 
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    ),
    watchPosition: vi.fn(() => 1),
    clearWatch: vi.fn(),
  },
});

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn((message) => {
    // Allow React error boundary errors to be shown
    if (
      typeof message === 'string' &&
      (message.includes('Error boundaries') ||
       message.includes('componentDidCatch') ||
       message.includes('React will try to recreate'))
    ) {
      originalError(message);
    }
  });

  console.warn = vi.fn((message) => {
    // Allow React warnings that we want to see
    if (
      typeof message === 'string' &&
      (message.includes('React Hook') ||
       message.includes('Warning:'))
    ) {
      originalWarn(message);
    }
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Add custom test utilities to global scope
declare global {
  interface Window {
    testUtils: {
      mockUser: any;
      mockFirebase: any;
      mockApiResponse: (response: any) => void;
    };
  }
}

// Make test utilities globally available
window.testUtils = {
  mockUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  mockFirebase: {},
  mockApiResponse: (response: any) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    });
  },
};

// Export test utilities for direct imports
export { setupTestEnvironment } from '../lib/test-utils';
export * from '../lib/test-utils';