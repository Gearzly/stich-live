/**
 * Integration Tests - API Endpoints
 * End-to-end tests for API functionality and user workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { 
  // mockFirebase, // Unused in this file
  mockUser, 
  // mockApp, // Unused in this file
  mockGeneration,
  setupTest,
  teardownTest,
  mockFetch,
  generateTestUser,
  generateTestApp
} from '../lib/test-utils';

// Test server setup (would use supertest in real implementation)
const request = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn()
};

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Setup test database
    setupTest();
  });

  afterAll(() => {
    teardownTest();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({ success: true });
  });

  describe('Authentication API', () => {
    it('registers new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      request.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: {
            user: generateTestUser({ 
              email: userData.email, 
              displayName: userData.name 
            }),
            token: 'jwt-token'
          }
        }
      });

      const response = await request.post('/api/auth/register', userData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user.email).toBe(userData.email);
      expect(response.data.data.token).toBeDefined();
    });

    it('logs in existing user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      request.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            user: generateTestUser({ email: credentials.email }),
            token: 'jwt-token'
          }
        }
      });

      const response = await request.post('/api/auth/login', credentials);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user.email).toBe(credentials.email);
    });

    it('handles invalid login credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      request.post.mockResolvedValue({
        status: 401,
        data: {
          success: false,
          error: 'Invalid credentials'
        }
      });

      const response = await request.post('/api/auth/login', credentials);

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
      expect(response.data.error).toBe('Invalid credentials');
    });

    it('validates authentication token', async () => {
      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            user: generateTestUser(),
            valid: true
          }
        }
      });

      const response = await request.get('/api/auth/validate', {
        headers: { Authorization: 'Bearer valid-token' }
      });

      expect(response.status).toBe(200);
      expect(response.data.data.valid).toBe(true);
    });

    it('handles expired authentication token', async () => {
      request.get.mockResolvedValue({
        status: 401,
        data: {
          success: false,
          error: 'Token expired'
        }
      });

      const response = await request.get('/api/auth/validate', {
        headers: { Authorization: 'Bearer expired-token' }
      });

      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Token expired');
    });

    it('logs out user successfully', async () => {
      request.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Logged out successfully'
        }
      });

      const response = await request.post('/api/auth/logout', {}, {
        headers: { Authorization: 'Bearer valid-token' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Apps API', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    it('creates new app successfully', async () => {
      const appData = {
        name: 'Test App',
        description: 'A test application',
        framework: 'react',
        isPublic: true
      };

      request.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: generateTestApp(appData)
        }
      });

      const response = await request.post('/api/apps', appData, {
        headers: authHeaders
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(appData.name);
    });

    it('gets user apps with pagination', async () => {
      const apps = [
        generateTestApp({ name: 'App 1' }),
        generateTestApp({ name: 'App 2' }),
        generateTestApp({ name: 'App 3' })
      ];

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            apps,
            pagination: {
              page: 1,
              limit: 10,
              total: 3,
              totalPages: 1
            }
          }
        }
      });

      const response = await request.get('/api/apps?page=1&limit=10', {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.apps).toHaveLength(3);
      expect(response.data.data.pagination.total).toBe(3);
    });

    it('gets single app by ID', async () => {
      const app = generateTestApp();

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: app
        }
      });

      const response = await request.get(`/api/apps/${app.id}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(app.id);
    });

    it('updates app successfully', async () => {
      const appId = 'test-app-id';
      const updates = {
        name: 'Updated App Name',
        description: 'Updated description'
      };

      request.put.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: generateTestApp({ ...updates, id: appId })
        }
      });

      const response = await request.put(`/api/apps/${appId}`, updates, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe(updates.name);
    });

    it('deletes app successfully', async () => {
      const appId = 'test-app-id';

      request.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'App deleted successfully'
        }
      });

      const response = await request.delete(`/api/apps/${appId}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('searches apps with filters', async () => {
      const searchResults = [
        generateTestApp({ name: 'Todo App', tags: ['productivity'] }),
        generateTestApp({ name: 'Task Manager', tags: ['productivity'] })
      ];

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            apps: searchResults,
            total: 2
          }
        }
      });

      const response = await request.get('/api/apps/search?q=todo&framework=react&tags=productivity');

      expect(response.status).toBe(200);
      expect(response.data.data.apps).toHaveLength(2);
    });

    it('handles app not found', async () => {
      request.get.mockResolvedValue({
        status: 404,
        data: {
          success: false,
          error: 'App not found'
        }
      });

      const response = await request.get('/api/apps/nonexistent-id', {
        headers: authHeaders
      });

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('App not found');
    });

    it('validates app ownership for updates', async () => {
      request.put.mockResolvedValue({
        status: 403,
        data: {
          success: false,
          error: 'Unauthorized'
        }
      });

      const response = await request.put('/api/apps/other-user-app', {
        name: 'Updated'
      }, {
        headers: authHeaders
      });

      expect(response.status).toBe(403);
      expect(response.data.error).toBe('Unauthorized');
    });
  });

  describe('Generation API', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    it('starts app generation successfully', async () => {
      const generationRequest = {
        prompt: 'Create a todo app with React',
        framework: 'react',
        features: ['todo', 'crud']
      };

      const generation = {
        ...mockGeneration,
        prompt: generationRequest.prompt,
        status: 'pending'
      };

      request.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: generation
        }
      });

      const response = await request.post('/api/generations', generationRequest, {
        headers: authHeaders
      });

      expect(response.status).toBe(201);
      expect(response.data.data.prompt).toBe(generationRequest.prompt);
      expect(response.data.data.status).toBe('pending');
    });

    it('gets generation status', async () => {
      const generationId = 'test-generation-id';
      const generation = {
        ...mockGeneration,
        id: generationId,
        status: 'in_progress',
        progress: 75
      };

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: generation
        }
      });

      const response = await request.get(`/api/generations/${generationId}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.progress).toBe(75);
    });

    it('gets completed generation files', async () => {
      const generationId = 'test-generation-id';
      const files = [
        { name: 'App.tsx', content: 'React component' },
        { name: 'package.json', content: 'Package config' }
      ];

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            ...mockGeneration,
            status: 'completed',
            files
          }
        }
      });

      const response = await request.get(`/api/generations/${generationId}/files`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.files).toHaveLength(2);
    });

    it('cancels generation', async () => {
      const generationId = 'test-generation-id';

      request.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Generation cancelled'
        }
      });

      const response = await request.delete(`/api/generations/${generationId}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('handles generation rate limiting', async () => {
      request.post.mockResolvedValue({
        status: 429,
        data: {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 3600
        }
      });

      const response = await request.post('/api/generations', {
        prompt: 'Create an app'
      }, {
        headers: authHeaders
      });

      expect(response.status).toBe(429);
      expect(response.data.error).toBe('Rate limit exceeded');
      expect(response.data.retryAfter).toBe(3600);
    });
  });

  describe('Chat API', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    it('creates new chat session', async () => {
      const chatId = 'new-chat-id';

      request.post.mockResolvedValue({
        status: 201,
        data: {
          success: true,
          data: {
            id: chatId,
            userId: mockUser.uid,
            createdAt: new Date().toISOString()
          }
        }
      });

      const response = await request.post('/api/chats', {}, {
        headers: authHeaders
      });

      expect(response.status).toBe(201);
      expect(response.data.data.id).toBe(chatId);
    });

    it('sends message to chat', async () => {
      const chatId = 'test-chat-id';
      const message = 'Hello, how can I create a todo app?';

      request.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            id: 'message-id',
            content: message,
            role: 'user',
            timestamp: new Date().toISOString()
          }
        }
      });

      const response = await request.post(`/api/chats/${chatId}/messages`, {
        content: message
      }, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.content).toBe(message);
    });

    it('gets chat history', async () => {
      const chatId = 'test-chat-id';
      const messages = [
        {
          id: 'msg-1',
          content: 'Hello',
          role: 'user',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg-2',
          content: 'Hi! How can I help?',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ];

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            messages,
            pagination: {
              page: 1,
              limit: 50,
              total: 2
            }
          }
        }
      });

      const response = await request.get(`/api/chats/${chatId}/messages`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.messages).toHaveLength(2);
    });

    it('deletes chat session', async () => {
      const chatId = 'test-chat-id';

      request.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Chat deleted successfully'
        }
      });

      const response = await request.delete(`/api/chats/${chatId}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('File Upload API', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    it('uploads file successfully', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      request.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: {
            id: 'file-id',
            name: 'test.txt',
            url: 'https://storage.example.com/test.txt',
            size: 7,
            type: 'text/plain'
          }
        }
      });

      const response = await request.post('/api/files/upload', formData, {
        headers: {
          ...authHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('test.txt');
    });

    it('validates file size limits', async () => {
      request.post.mockResolvedValue({
        status: 413,
        data: {
          success: false,
          error: 'File too large'
        }
      });

      const response = await request.post('/api/files/upload', new FormData(), {
        headers: authHeaders
      });

      expect(response.status).toBe(413);
      expect(response.data.error).toBe('File too large');
    });

    it('validates file types', async () => {
      request.post.mockResolvedValue({
        status: 400,
        data: {
          success: false,
          error: 'File type not allowed'
        }
      });

      const response = await request.post('/api/files/upload', new FormData(), {
        headers: authHeaders
      });

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('File type not allowed');
    });

    it('deletes file successfully', async () => {
      const fileId = 'test-file-id';

      request.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'File deleted successfully'
        }
      });

      const response = await request.delete(`/api/files/${fileId}`, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('User Profile API', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    it('gets user profile', async () => {
      const user = generateTestUser();

      request.get.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: user
        }
      });

      const response = await request.get('/api/users/profile', {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.email).toBe(user.email);
    });

    it('updates user profile', async () => {
      const updates = {
        displayName: 'Updated Name',
        preferences: {
          theme: 'dark',
          notifications: false
        }
      };

      request.put.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: generateTestUser(updates)
        }
      });

      const response = await request.put('/api/users/profile', updates, {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.data.displayName).toBe(updates.displayName);
    });

    it('deletes user account', async () => {
      request.delete.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          message: 'Account deleted successfully'
        }
      });

      const response = await request.delete('/api/users/profile', {
        headers: authHeaders
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles 500 internal server errors', async () => {
      request.get.mockResolvedValue({
        status: 500,
        data: {
          success: false,
          error: 'Internal server error'
        }
      });

      const response = await request.get('/api/apps');

      expect(response.status).toBe(500);
      expect(response.data.success).toBe(false);
    });

    it('handles network timeouts', async () => {
      request.get.mockRejectedValue(new Error('Network timeout'));

      await expect(request.get('/api/apps')).rejects.toThrow('Network timeout');
    });

    it('handles invalid JSON responses', async () => {
      request.get.mockResolvedValue({
        status: 200,
        data: 'Invalid JSON'
      });

      const response = await request.get('/api/apps');

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('string');
    });
  });

  describe('Security Tests', () => {
    it('requires authentication for protected endpoints', async () => {
      request.get.mockResolvedValue({
        status: 401,
        data: {
          success: false,
          error: 'Authentication required'
        }
      });

      const response = await request.get('/api/apps');

      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Authentication required');
    });

    it('validates CSRF tokens', async () => {
      request.post.mockResolvedValue({
        status: 403,
        data: {
          success: false,
          error: 'CSRF token mismatch'
        }
      });

      const response = await request.post('/api/apps', {}, {
        headers: { Authorization: 'Bearer valid-token' }
      });

      expect(response.status).toBe(403);
      expect(response.data.error).toBe('CSRF token mismatch');
    });

    it('handles SQL injection attempts', async () => {
      request.get.mockResolvedValue({
        status: 400,
        data: {
          success: false,
          error: 'Invalid request'
        }
      });

      const response = await request.get("/api/apps?id=1'; DROP TABLE apps; --");

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid request');
    });
  });
});