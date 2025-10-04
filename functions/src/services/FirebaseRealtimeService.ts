/**
 * Firebase Real-time Service for Backend
 * Handles real-time updates using Firebase Realtime Database from Functions
 */

import { getDatabase } from 'firebase-admin/database';
import { BaseService } from './BaseService';

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

export class FirebaseRealtimeService extends BaseService {
  private database = getDatabase();

  /**
   * Initialize a generation session
   */
  async initializeSession(sessionId: string, userId: string): Promise<void> {
    const sessionRef = this.database.ref(`generations/${sessionId}`);
    
    const initialProgress: GenerationProgress = {
      sessionId,
      userId,
      status: 'initializing',
      progress: 0,
      currentStep: 'Starting AI generation...',
      timestamp: Date.now(),
    };

    await sessionRef.set({
      ...initialProgress,
      createdAt: new Date().toISOString(),
    });

    this.logger.info(`Initialized generation session: ${sessionId}`);
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
    const sessionRef = this.database.ref(`generations/${sessionId}`);
    
    const update: Partial<GenerationProgress> = {
      status,
      progress,
      currentStep,
      timestamp: Date.now(),
    };

    if (files) {
      update.files = files;
    }

    await sessionRef.update({
      ...update,
      updatedAt: new Date().toISOString(),
    });

    this.logger.info(`Updated progress for session ${sessionId}: ${progress}% - ${currentStep}`);
  }

  /**
   * Send a real-time message
   */
  async sendMessage(sessionId: string, message: StreamMessage): Promise<void> {
    const messageRef = this.database.ref(`messages/${sessionId}`).push();
    
    await messageRef.set({
      ...message,
      createdAt: new Date().toISOString(),
    });

    this.logger.info(`Sent message for session ${sessionId}: ${message.type}`);
  }

  /**
   * Mark generation as completed
   */
  async completeGeneration(sessionId: string, files: GenerationProgress['files']): Promise<void> {
    await this.updateProgress(sessionId, 'completed', 100, 'Generation completed successfully', files);
    
    await this.sendMessage(sessionId, {
      type: 'complete',
      data: { files, message: 'Generation completed successfully!' },
      timestamp: Date.now(),
    });

    this.logger.info(`Completed generation session: ${sessionId}`);
  }

  /**
   * Mark generation as error
   */
  async errorGeneration(sessionId: string, error: string): Promise<void> {
    const sessionRef = this.database.ref(`generations/${sessionId}`);
    
    await sessionRef.update({
      status: 'error',
      progress: 0,
      currentStep: 'Generation failed',
      error,
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
    });

    await this.sendMessage(sessionId, {
      type: 'error',
      data: { error },
      timestamp: Date.now(),
    });

    this.logger.error(`Generation failed for session ${sessionId}: ${error}`);
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(sessionId: string): Promise<GenerationProgress | null> {
    const sessionRef = this.database.ref(`generations/${sessionId}`);
    const snapshot = await sessionRef.once('value');
    
    return snapshot.val() as GenerationProgress | null;
  }

  /**
   * Simulate AI generation with real-time updates
   */
  async simulateGeneration(sessionId: string, userId: string): Promise<void> {
    try {
      // Initialize session
      await this.initializeSession(sessionId, userId);

      // Step 1: Analyzing (10%)
      await this.updateProgress(sessionId, 'analyzing', 10, 'Analyzing requirements...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'analyzing', message: 'Breaking down your requirements...' },
        timestamp: Date.now(),
      });

      // Simulate processing time
      await this.delay(2000);

      // Step 2: Generating structure (30%)
      await this.updateProgress(sessionId, 'generating', 30, 'Generating project structure...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'generating', message: 'Creating project architecture...' },
        timestamp: Date.now(),
      });

      await this.delay(1500);

      // Step 3: Generate files
      const files = [
        {
          name: 'package.json',
          path: '/package.json',
          content: JSON.stringify({
            name: 'ai-generated-app',
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.43',
              '@types/react-dom': '^18.2.17',
              '@vitejs/plugin-react': '^4.2.1',
              vite: '^5.0.8'
            }
          }, null, 2),
          language: 'json',
        },
        {
          name: 'index.html',
          path: '/index.html',
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
          language: 'html',
        },
        {
          name: 'App.jsx',
          path: '/src/App.jsx',
          content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 AI Generated App</h1>
      <p>This application was generated by AI!</p>
      
      <div style={{ margin: '2rem 0' }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#005f99'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007acc'}
        >
          Count: {count}
        </button>
      </div>
      
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Click the button to test React state management!
      </p>
    </div>
  )
}

export default App`,
          language: 'javascript',
        },
        {
          name: 'main.jsx',
          path: '/src/main.jsx',
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
          language: 'javascript',
        },
      ];

      // Generate files one by one with progress updates
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = 30 + (i + 1) * 15;
        
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

        await this.delay(1000);
      }

      // Step 4: Reviewing (80%)
      await this.updateProgress(sessionId, 'reviewing', 80, 'Reviewing and optimizing code...');
      await this.sendMessage(sessionId, {
        type: 'progress',
        data: { step: 'reviewing', message: 'Optimizing code quality and performance...' },
        timestamp: Date.now(),
      });

      await this.delay(2000);

      // Step 5: Complete
      await this.completeGeneration(sessionId, files);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorGeneration(sessionId, errorMessage);
      throw error;
    }
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old generation sessions (should be called periodically)
   */
  async cleanupOldSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    const generationsRef = this.database.ref('generations');
    
    const snapshot = await generationsRef.once('value');
    const generations = snapshot.val();
    
    if (!generations) return;

    const deletions: Promise<void>[] = [];
    
    Object.keys(generations).forEach(sessionId => {
      const session = generations[sessionId];
      if (session.timestamp < cutoffTime) {
        deletions.push(
          this.database.ref(`generations/${sessionId}`).remove(),
          this.database.ref(`messages/${sessionId}`).remove()
        );
      }
    });

    await Promise.all(deletions);
    this.logger.info(`Cleaned up ${deletions.length / 2} old generation sessions`);
  }
}