import { Context } from 'hono';
import { getFirestore } from 'firebase-admin/firestore';
import { createLogger } from '../../utils/logger';
import { ApiResponse, GenerationSession, GenerateCodeRequest, AIProvider, PaginatedResponse } from '../../types/api';
import { AuthUser } from '../../middleware/auth';

const logger = createLogger('AIController');
const db = getFirestore();

export class AIController {
  static async generateCode(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const generateRequest: GenerateCodeRequest = await c.req.json();

      // Validate required fields
      if (!generateRequest.appId || !generateRequest.prompt) {
        return c.json({ success: false, error: 'App ID and prompt are required' }, 400);
      }

      // Check if app exists and user owns it
      const appDoc = await db.collection('apps').doc(generateRequest.appId).get();
      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = appDoc.data();
      if (appData?.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      // Create generation session
      const sessionData: Omit<GenerationSession, 'id'> = {
        userId: user.uid,
        appId: generateRequest.appId,
        status: 'pending',
        prompt: generateRequest.prompt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sessionRef = await db.collection('generation_sessions').add(sessionData);

      // TODO: Start actual AI generation process
      // This would typically:
      // 1. Queue the generation job
      // 2. Call the appropriate AI provider
      // 3. Update the session status as it progresses

      logger.info('Code generation session created', { 
        sessionId: sessionRef.id, 
        appId: generateRequest.appId, 
        userId: user.uid 
      });

      const response: ApiResponse<{ sessionId: string }> = {
        success: true,
        data: { sessionId: sessionRef.id },
      };

      return c.json(response, 202);
    } catch (error: any) {
      logger.error('Generate code error:', error);
      return c.json({ success: false, error: 'Failed to start code generation' }, 500);
    }
  }

  static async getGenerationSessions(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const offset = (page - 1) * limit;

      let query = db.collection('generation_sessions').where('userId', '==', user.uid);
      
      // Add sorting by creation date (newest first)
      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.offset(offset).limit(limit).get();
      const countSnapshot = await db.collection('generation_sessions')
        .where('userId', '==', user.uid)
        .count()
        .get();

      const sessions: GenerationSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() } as GenerationSession);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse<PaginatedResponse<GenerationSession>> = {
        success: true,
        data: {
          data: sessions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get generation sessions error:', error);
      return c.json({ success: false, error: 'Failed to get generation sessions' }, 500);
    }
  }

  static async getGenerationSession(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const sessionId = c.req.param('id');

      const sessionDoc = await db.collection('generation_sessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        return c.json({ success: false, error: 'Generation session not found' }, 404);
      }

      const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as GenerationSession;

      // Check if user owns the session
      if (sessionData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      const response: ApiResponse<GenerationSession> = {
        success: true,
        data: sessionData,
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get generation session error:', error);
      return c.json({ success: false, error: 'Failed to get generation session' }, 500);
    }
  }

  static async deleteGenerationSession(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const sessionId = c.req.param('id');

      // First check if session exists and user owns it
      const sessionDoc = await db.collection('generation_sessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        return c.json({ success: false, error: 'Generation session not found' }, 404);
      }

      const sessionData = sessionDoc.data() as GenerationSession;
      if (sessionData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      // Delete the session
      await db.collection('generation_sessions').doc(sessionId).delete();

      logger.info('Generation session deleted', { sessionId, userId: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Generation session deleted successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Delete generation session error:', error);
      return c.json({ success: false, error: 'Failed to delete generation session' }, 500);
    }
  }

  static async getAvailableProviders(c: Context): Promise<Response> {
    try {
      // Return list of available AI providers
      const providers: AIProvider[] = [
        {
          name: 'openai',
          model: 'gpt-4o',
          apiKey: '', // Don't expose API keys
          maxTokens: 4096,
          temperature: 0.7,
        },
        {
          name: 'anthropic',
          model: 'claude-3-5-sonnet',
          apiKey: '',
          maxTokens: 4096,
          temperature: 0.7,
        },
        {
          name: 'google',
          model: 'gemini-pro',
          apiKey: '',
          maxTokens: 4096,
          temperature: 0.7,
        },
        {
          name: 'cerebras',
          model: 'llama3.1-8b',
          apiKey: '',
          maxTokens: 4096,
          temperature: 0.7,
        },
      ];

      const response: ApiResponse<{ providers: AIProvider[] }> = {
        success: true,
        data: { providers },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get available providers error:', error);
      return c.json({ success: false, error: 'Failed to get providers' }, 500);
    }
  }

  static async testProvider(c: Context): Promise<Response> {
    try {
      const { provider } = await c.req.json();

      if (!provider || !provider.name) {
        return c.json({ success: false, error: 'Provider information is required' }, 400);
      }

      // TODO: Implement actual provider testing
      // This would make a test API call to the specified provider

      logger.info('Provider test initiated', { provider: provider.name });

      const response: ApiResponse<{ status: string; message: string }> = {
        success: true,
        data: {
          status: 'success',
          message: `Provider ${provider.name} is available`,
        },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Test provider error:', error);
      return c.json({ success: false, error: 'Failed to test provider' }, 500);
    }
  }

  static async getSessionStatus(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const sessionId = c.req.param('id');

      const sessionDoc = await db.collection('generation_sessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        return c.json({ success: false, error: 'Generation session not found' }, 404);
      }

      const sessionData = sessionDoc.data() as GenerationSession;

      if (sessionData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      const responseData: { status: string; result?: any; error?: string } = {
        status: sessionData.status,
      };

      if (sessionData.result) {
        responseData.result = sessionData.result;
      }

      if (sessionData.error) {
        responseData.error = sessionData.error;
      }

      const response: ApiResponse<{ status: string; result?: any; error?: string }> = {
        success: true,
        data: responseData,
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get session status error:', error);
      return c.json({ success: false, error: 'Failed to get session status' }, 500);
    }
  }

  static async cancelGeneration(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const sessionId = c.req.param('id');

      // First check if session exists and user owns it
      const sessionDoc = await db.collection('generation_sessions').doc(sessionId).get();

      if (!sessionDoc.exists) {
        return c.json({ success: false, error: 'Generation session not found' }, 404);
      }

      const sessionData = sessionDoc.data() as GenerationSession;
      if (sessionData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      if (sessionData.status === 'completed' || sessionData.status === 'failed') {
        return c.json({ success: false, error: 'Cannot cancel completed session' }, 400);
      }

      // Update session status to cancelled
      await db.collection('generation_sessions').doc(sessionId).update({
        status: 'failed',
        error: 'Cancelled by user',
        updatedAt: new Date(),
      });

      // TODO: Cancel any running generation processes

      logger.info('Generation session cancelled', { sessionId, userId: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Generation cancelled successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Cancel generation error:', error);
      return c.json({ success: false, error: 'Failed to cancel generation' }, 500);
    }
  }
}