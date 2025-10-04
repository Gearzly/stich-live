/**
 * Real-time Updates Service
 * Handles real-time communication for AI generation progress using Firebase Realtime Database
 */

import { getDatabase, ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import app from '@/lib/firebase';

export interface GenerationProgress {
  sessionId: string;
  userId: string;
  status: 'initializing' | 'analyzing' | 'generating' | 'reviewing' | 'completed' | 'error';
  progress: number; // 0-100
  currentStep: string;
  files?: Array<{
    name: string;
    path: string;
    content: string;
    language: string;
  }>;
  error?: string;
  timestamp: number;
}

export interface StreamMessage {
  type: 'progress' | 'file' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private database = getDatabase(app);
  private listeners = new Map<string, () => void>();

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Start a generation session with real-time updates
   */
  async startGenerationSession(sessionId: string, userId: string): Promise<void> {
    const sessionRef = ref(this.database, `generations/${sessionId}`);
    
    const initialProgress: GenerationProgress = {
      sessionId,
      userId,
      status: 'initializing',
      progress: 0,
      currentStep: 'Starting AI generation...',
      timestamp: Date.now(),
    };

    await set(sessionRef, {
      ...initialProgress,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Update generation progress
   */
  async updateProgress(
    sessionId: string, 
    status: GenerationProgress['status'],
    progress: number,
    currentStep: string,
    files?: GenerationProgress['files']
  ): Promise<void> {
    const sessionRef = ref(this.database, `generations/${sessionId}`);
    
    const update: Partial<GenerationProgress> = {
      status,
      progress,
      currentStep,
      timestamp: Date.now(),
    };

    if (files) {
      update.files = files;
    }

    await set(sessionRef, {
      ...update,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Mark generation as completed
   */
  async completeGeneration(sessionId: string, files: GenerationProgress['files']): Promise<void> {
    await this.updateProgress(sessionId, 'completed', 100, 'Generation completed successfully', files);
  }

  /**
   * Mark generation as error
   */
  async errorGeneration(sessionId: string, error: string): Promise<void> {
    const sessionRef = ref(this.database, `generations/${sessionId}`);
    
    await set(sessionRef, {
      status: 'error',
      progress: 0,
      currentStep: 'Generation failed',
      error,
      timestamp: Date.now(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Listen to generation progress updates
   */
  subscribeToGeneration(
    sessionId: string, 
    callback: (progress: GenerationProgress) => void
  ): () => void {
    const sessionRef = ref(this.database, `generations/${sessionId}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data as GenerationProgress);
      }
    });

    // Store the unsubscribe function
    this.listeners.set(sessionId, unsubscribe);

    // Return unsubscribe function
    return () => {
      off(sessionRef, 'value', unsubscribe);
      this.listeners.delete(sessionId);
    };
  }

  /**
   * Send real-time message to a session
   */
  async sendMessage(sessionId: string, message: StreamMessage): Promise<void> {
    const messageRef = ref(this.database, `messages/${sessionId}/${Date.now()}`);
    
    await set(messageRef, {
      ...message,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Listen to real-time messages for a session
   */
  subscribeToMessages(
    sessionId: string,
    callback: (message: StreamMessage) => void
  ): () => void {
    const messagesRef = ref(this.database, `messages/${sessionId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      if (messages) {
        // Get the latest message
        const messageKeys = Object.keys(messages).sort();
        const latestKey = messageKeys[messageKeys.length - 1];
        const latestMessage = messages[latestKey];
        
        if (latestMessage) {
          callback(latestMessage as StreamMessage);
        }
      }
    });

    const listenerId = `messages_${sessionId}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      off(messagesRef, 'value', unsubscribe);
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(sessionId: string): Promise<GenerationProgress | null> {
    return new Promise((resolve) => {
      const sessionRef = ref(this.database, `generations/${sessionId}`);
      
      onValue(sessionRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data as GenerationProgress | null);
      }, { onlyOnce: true });
    });
  }

  /**
   * Clean up old generation sessions
   */
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    // This would typically be done via Firebase Functions
    // For now, we'll just note that cleanup should be implemented server-side
    console.log(`Cleanup sessions older than ${cutoffTime}`);
  }

  /**
   * Disconnect all listeners
   */
  disconnectAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Stream AI generation with live file updates
   */
  async streamGeneration(
    sessionId: string,
    userId: string,
    onProgress: (progress: GenerationProgress) => void,
    onMessage: (message: StreamMessage) => void
  ): Promise<void> {
    // Start the session
    await this.startGenerationSession(sessionId, userId);

    // Subscribe to progress updates
    const unsubscribeProgress = this.subscribeToGeneration(sessionId, onProgress);
    
    // Subscribe to messages
    const unsubscribeMessages = this.subscribeToMessages(sessionId, onMessage);

    // Simulate AI generation process with real-time updates
    try {
      // Step 1: Analyzing
      await this.updateProgress(sessionId, 'analyzing', 10, 'Analyzing requirements...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'analyzing', message: 'Breaking down your requirements...' },
        timestamp: Date.now(),
      });

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Generating
      await this.updateProgress(sessionId, 'generating', 30, 'Generating code structure...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'generating', message: 'Creating project structure...' },
        timestamp: Date.now(),
      });

      // Simulate file generation
      const files = [
        {
          name: 'package.json',
          path: '/package.json',
          content: JSON.stringify({ name: 'generated-app', version: '1.0.0' }, null, 2),
          language: 'json',
        },
        {
          name: 'index.html',
          path: '/index.html',
          content: '<!DOCTYPE html><html><head><title>Generated App</title></head><body><h1>Hello World</h1></body></html>',
          language: 'html',
        },
      ];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = 30 + (i + 1) * 20;
        
        await this.updateProgress(
          sessionId, 
          'generating', 
          progress, 
          `Generating ${file.name}...`,
          files.slice(0, i + 1)
        );
        
        await this.sendMessage(sessionId, {
          type: 'file',
          data: file,
          timestamp: Date.now(),
        });

        // Simulate generation time
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Step 3: Reviewing
      await this.updateProgress(sessionId, 'reviewing', 80, 'Reviewing generated code...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'reviewing', message: 'Optimizing and reviewing code quality...' },
        timestamp: Date.now(),
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Complete
      await this.completeGeneration(sessionId, files);
      await this.sendMessage(sessionId, {
        type: 'complete',
        data: { files, message: 'Generation completed successfully!' },
        timestamp: Date.now(),
      });

    } catch (error) {
      await this.errorGeneration(sessionId, error instanceof Error ? error.message : 'Unknown error');
      await this.sendMessage(sessionId, {
        type: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now(),
      });
    } finally {
      // Cleanup listeners after completion
      setTimeout(() => {
        unsubscribeProgress();
        unsubscribeMessages();
      }, 10000); // Keep alive for 10 seconds after completion
    }
  }
}