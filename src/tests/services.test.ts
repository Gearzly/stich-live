/**
 * Unit Tests - Core Services
 * Tests for business logic, API services, and data handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  mockFirebase, 
  mockUser, 
  mockApp, 
  mockGeneration,
  mockApiResponses,
  setupTest,
  teardownTest,
  mockFetch
} from '../lib/test-utils';

// Mock Firebase services
vi.mock('../lib/firebase', () => ({
  auth: mockFirebase.auth,
  firestore: mockFirebase.firestore,
  storage: mockFirebase.storage,
  functions: mockFirebase.functions
}));

describe('Core Services', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('UserService', () => {
    let UserService: any;

    beforeEach(async () => {
      // Dynamic import to ensure mocks are applied
      const module = await import('../services/user-service');
      UserService = module.UserService;
    });

    it('creates user profile successfully', async () => {
      mockFirebase.firestore.addDoc.mockResolvedValue({ id: 'new-user-id' });
      
      const userService = new UserService();
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        preferences: {
          theme: 'light',
          notifications: true
        }
      };

      const result = await userService.createUser(userData);

      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('users');
      expect(mockFirebase.firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...userData,
          createdAt: expect.anything(),
          updatedAt: expect.anything()
        })
      );
      expect(result.id).toBe('new-user-id');
    });

    it('updates user profile successfully', async () => {
      mockFirebase.firestore.updateDoc.mockResolvedValue();
      
      const userService = new UserService();
      const updates = {
        name: 'Updated Name',
        preferences: {
          theme: 'dark'
        }
      };

      await userService.updateUser('user-id', updates);

      expect(mockFirebase.firestore.doc).toHaveBeenCalledWith('users', 'user-id');
      expect(mockFirebase.firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything()
        })
      );
    });

    it('gets user profile successfully', async () => {
      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUser,
        id: 'user-id'
      });
      
      const userService = new UserService();
      const result = await userService.getUser('user-id');

      expect(mockFirebase.firestore.doc).toHaveBeenCalledWith('users', 'user-id');
      expect(result).toEqual({
        id: 'user-id',
        ...mockUser
      });
    });

    it('handles user not found', async () => {
      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      const userService = new UserService();
      const result = await userService.getUser('nonexistent-id');

      expect(result).toBeNull();
    });

    it('deletes user successfully', async () => {
      mockFirebase.firestore.deleteDoc.mockResolvedValue();
      mockFirebase.auth.deleteUser.mockResolvedValue();
      
      const userService = new UserService();
      await userService.deleteUser('user-id');

      expect(mockFirebase.firestore.doc).toHaveBeenCalledWith('users', 'user-id');
      expect(mockFirebase.firestore.deleteDoc).toHaveBeenCalled();
    });

    it('validates user data', async () => {
      const userService = new UserService();
      
      await expect(userService.createUser({
        name: '', // Invalid: empty name
        email: 'invalid-email' // Invalid: malformed email
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('AppService', () => {
    let AppService: any;

    beforeEach(async () => {
      const module = await import('../services/app-service');
      AppService = module.AppService;
    });

    it('creates app successfully', async () => {
      mockFirebase.firestore.addDoc.mockResolvedValue({ id: 'new-app-id' });
      
      const appService = new AppService();
      const appData = {
        name: 'Test App',
        description: 'A test application',
        userId: 'user-id',
        framework: 'react',
        isPublic: true
      };

      const result = await appService.createApp(appData);

      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('apps');
      expect(mockFirebase.firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...appData,
          status: 'draft',
          createdAt: expect.anything(),
          updatedAt: expect.anything()
        })
      );
      expect(result.id).toBe('new-app-id');
    });

    it('gets user apps successfully', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'app-1',
            data: () => ({ ...mockApp, id: 'app-1' })
          },
          {
            id: 'app-2',
            data: () => ({ ...mockApp, id: 'app-2' })
          }
        ]
      });
      
      const appService = new AppService();
      const result = await appService.getUserApps('user-id');

      expect(mockFirebase.firestore.query).toHaveBeenCalled();
      expect(mockFirebase.firestore.where).toHaveBeenCalledWith('userId', '==', 'user-id');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('app-1');
    });

    it('gets public apps successfully', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'public-app-1',
            data: () => ({ ...mockApp, isPublic: true })
          }
        ]
      });
      
      const appService = new AppService();
      const result = await appService.getPublicApps();

      expect(mockFirebase.firestore.where).toHaveBeenCalledWith('isPublic', '==', true);
      expect(result).toHaveLength(1);
    });

    it('updates app successfully', async () => {
      mockFirebase.firestore.updateDoc.mockResolvedValue();
      
      const appService = new AppService();
      const updates = {
        name: 'Updated App Name',
        description: 'Updated description'
      };

      await appService.updateApp('app-id', updates);

      expect(mockFirebase.firestore.doc).toHaveBeenCalledWith('apps', 'app-id');
      expect(mockFirebase.firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything()
        })
      );
    });

    it('deletes app successfully', async () => {
      mockFirebase.firestore.deleteDoc.mockResolvedValue();
      
      const appService = new AppService();
      await appService.deleteApp('app-id');

      expect(mockFirebase.firestore.doc).toHaveBeenCalledWith('apps', 'app-id');
      expect(mockFirebase.firestore.deleteDoc).toHaveBeenCalled();
    });

    it('validates app ownership before update', async () => {
      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockApp, userId: 'other-user-id' })
      });
      
      const appService = new AppService();
      
      await expect(
        appService.updateApp('app-id', { name: 'Updated' }, 'user-id')
      ).rejects.toThrow('Unauthorized');
    });

    it('searches apps by name and tags', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'search-result-1',
            data: () => ({ 
              ...mockApp, 
              name: 'Todo App', 
              tags: ['productivity', 'todo'] 
            })
          }
        ]
      });
      
      const appService = new AppService();
      const result = await appService.searchApps('todo');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Todo App');
    });
  });

  describe('GenerationService', () => {
    let GenerationService: any;

    beforeEach(async () => {
      const module = await import('../services/generation-service');
      GenerationService = module.GenerationService;
    });

    it('starts generation successfully', async () => {
      mockFirebase.firestore.addDoc.mockResolvedValue({ id: 'generation-id' });
      mockFetch(mockApiResponses.success);
      
      const generationService = new GenerationService();
      const request = {
        prompt: 'Create a todo app',
        userId: 'user-id',
        framework: 'react'
      };

      const result = await generationService.startGeneration(request);

      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('generations');
      expect(result.id).toBe('generation-id');
      expect(result.status).toBe('pending');
    });

    it('updates generation progress', async () => {
      mockFirebase.firestore.updateDoc.mockResolvedValue();
      
      const generationService = new GenerationService();
      await generationService.updateProgress('generation-id', 50, 'Generating components...');

      expect(mockFirebase.firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          progress: 50,
          status: 'in_progress',
          currentStep: 'Generating components...',
          updatedAt: expect.anything()
        })
      );
    });

    it('completes generation successfully', async () => {
      mockFirebase.firestore.updateDoc.mockResolvedValue();
      
      const generationService = new GenerationService();
      const files = [
        { name: 'App.tsx', content: 'React component code' }
      ];

      await generationService.completeGeneration('generation-id', files);

      expect(mockFirebase.firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'completed',
          progress: 100,
          files,
          completedAt: expect.anything()
        })
      );
    });

    it('handles generation failure', async () => {
      mockFirebase.firestore.updateDoc.mockResolvedValue();
      
      const generationService = new GenerationService();
      const error = 'AI service unavailable';

      await generationService.failGeneration('generation-id', error);

      expect(mockFirebase.firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'failed',
          error,
          failedAt: expect.anything()
        })
      );
    });

    it('gets generation status', async () => {
      mockFirebase.firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockGeneration,
        id: 'generation-id'
      });
      
      const generationService = new GenerationService();
      const result = await generationService.getGeneration('generation-id');

      expect(result).toEqual({
        id: 'generation-id',
        ...mockGeneration
      });
    });

    it('lists user generations', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'gen-1',
            data: () => ({ ...mockGeneration, id: 'gen-1' })
          },
          {
            id: 'gen-2',
            data: () => ({ ...mockGeneration, id: 'gen-2' })
          }
        ]
      });
      
      const generationService = new GenerationService();
      const result = await generationService.getUserGenerations('user-id');

      expect(mockFirebase.firestore.where).toHaveBeenCalledWith('userId', '==', 'user-id');
      expect(result).toHaveLength(2);
    });

    it('validates generation request', async () => {
      const generationService = new GenerationService();
      
      await expect(generationService.startGeneration({
        prompt: '', // Invalid: empty prompt
        userId: 'user-id'
      })).rejects.toThrow('Prompt is required');
    });
  });

  describe('FileService', () => {
    let FileService: any;

    beforeEach(async () => {
      const module = await import('../services/file-service');
      FileService = module.FileService;
    });

    it('uploads file successfully', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      mockFirebase.storage.uploadBytes.mockResolvedValue({
        ref: { fullPath: 'uploads/test.txt' }
      });
      mockFirebase.storage.getDownloadURL.mockResolvedValue('https://example.com/test.txt');
      
      const fileService = new FileService();
      const result = await fileService.uploadFile(mockFile, 'user-id');

      expect(mockFirebase.storage.ref).toHaveBeenCalled();
      expect(mockFirebase.storage.uploadBytes).toHaveBeenCalledWith(
        expect.anything(),
        mockFile
      );
      expect(result.url).toBe('https://example.com/test.txt');
    });

    it('validates file size', async () => {
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.txt'); // 10MB
      
      const fileService = new FileService();
      
      await expect(fileService.uploadFile(largeFile, 'user-id')).rejects.toThrow(
        'File size exceeds maximum allowed size'
      );
    });

    it('validates file type', async () => {
      const invalidFile = new File(['content'], 'malware.exe', { type: 'application/exe' });
      
      const fileService = new FileService();
      
      await expect(fileService.uploadFile(invalidFile, 'user-id')).rejects.toThrow(
        'File type not allowed'
      );
    });

    it('deletes file successfully', async () => {
      mockFirebase.storage.deleteObject.mockResolvedValue();
      
      const fileService = new FileService();
      await fileService.deleteFile('uploads/test.txt');

      expect(mockFirebase.storage.ref).toHaveBeenCalledWith('uploads/test.txt');
      expect(mockFirebase.storage.deleteObject).toHaveBeenCalled();
    });

    it('lists user files', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'file-1',
            data: () => ({
              name: 'file1.txt',
              url: 'https://example.com/file1.txt',
              userId: 'user-id'
            })
          }
        ]
      });
      
      const fileService = new FileService();
      const result = await fileService.getUserFiles('user-id');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('file1.txt');
    });
  });

  describe('ChatService', () => {
    let ChatService: any;

    beforeEach(async () => {
      const module = await import('../services/chat-service');
      ChatService = module.ChatService;
    });

    it('creates chat session successfully', async () => {
      mockFirebase.firestore.addDoc.mockResolvedValue({ id: 'chat-id' });
      
      const chatService = new ChatService();
      const result = await chatService.createChat('user-id');

      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('chats');
      expect(result.id).toBe('chat-id');
    });

    it('sends message successfully', async () => {
      mockFirebase.firestore.addDoc.mockResolvedValue({ id: 'message-id' });
      mockFetch({
        success: true,
        data: { response: 'AI response' }
      });
      
      const chatService = new ChatService();
      const result = await chatService.sendMessage('chat-id', 'Hello', 'user');

      expect(mockFirebase.firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat-id',
          content: 'Hello',
          role: 'user'
        })
      );
    });

    it('gets chat history', async () => {
      mockFirebase.firestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'msg-1',
            data: () => ({
              content: 'Hello',
              role: 'user',
              timestamp: new Date()
            })
          }
        ]
      });
      
      const chatService = new ChatService();
      const result = await chatService.getChatHistory('chat-id');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Hello');
    });

    it('deletes chat successfully', async () => {
      mockFirebase.firestore.deleteDoc.mockResolvedValue();
      
      const chatService = new ChatService();
      await chatService.deleteChat('chat-id');

      expect(mockFirebase.firestore.deleteDoc).toHaveBeenCalled();
    });

    it('handles rate limiting', async () => {
      mockFetch({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      }, { status: 429 });
      
      const chatService = new ChatService();
      
      await expect(
        chatService.sendMessage('chat-id', 'Hello', 'user')
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('ValidationService', () => {
    let ValidationService: any;

    beforeEach(async () => {
      const module = await import('../lib/validation');
      ValidationService = module.default;
    });

    it('validates email format', () => {
      const validation = new ValidationService();
      
      expect(validation.validateEmail('test@example.com')).toBe(true);
      expect(validation.validateEmail('invalid-email')).toBe(false);
      expect(validation.validateEmail('')).toBe(false);
    });

    it('validates password strength', () => {
      const validation = new ValidationService();
      
      expect(validation.validatePassword('password123')).toBe(true);
      expect(validation.validatePassword('weak')).toBe(false);
      expect(validation.validatePassword('')).toBe(false);
    });

    it('sanitizes user input', () => {
      const validation = new ValidationService();
      
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = validation.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('validates app data', () => {
      const validation = new ValidationService();
      
      const validApp = {
        name: 'Test App',
        description: 'A test app',
        framework: 'react'
      };
      
      const invalidApp = {
        name: '', // Invalid: empty name
        description: 'A'.repeat(1001), // Invalid: too long
        framework: 'invalid' // Invalid: unsupported framework
      };
      
      expect(validation.validateAppData(validApp)).toBe(true);
      expect(validation.validateAppData(invalidApp)).toBe(false);
    });
  });
});