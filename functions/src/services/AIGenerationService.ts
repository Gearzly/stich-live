import { BaseService } from './BaseService';
import { 
  GenerationRequest, 
  GenerationSession, 
  GeneratedFile, 
  AIResponse,
  CodeGenerationPrompt,
  StreamChunk
} from '../types/ai';
import { env, AIProvider, DEFAULT_MODELS } from '../config/env';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/**
 * AI Generation Service
 * Handles code generation using multiple AI providers
 */
export class AIGenerationService extends BaseService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    super();
    
    // Initialize AI providers
    this.openai = new OpenAI({ apiKey: env.openai.apiKey });
    this.anthropic = new Anthropic({ apiKey: env.anthropic.apiKey });
  }

  /**
   * Generate code for an application
   */
  async generateCode(userId: string, request: GenerationRequest): Promise<GenerationSession> {
    try {
      // Create generation session
      const sessionId = this.generateId();
      const session: GenerationSession = {
        id: sessionId,
        userId,
        request,
        status: 'pending',
        files: [],
        metadata: {
          provider: request.provider,
          model: request.model || DEFAULT_MODELS[request.provider],
        },
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      // Save session to Firestore
      await this.db.collection('generations').doc(sessionId).set(session);

      // Start generation process
      this.processGeneration(session).catch(error => {
        this.logger.error('Background generation failed:', error);
        this.updateSessionStatus(sessionId, 'failed', { error: error.message });
      });

      return session;
    } catch (error) {
      this.handleError(error, 'generateCode');
    }
  }

  /**
   * Get generation session by ID
   */
  async getGenerationById(sessionId: string, userId: string): Promise<GenerationSession> {
    try {
      const doc = await this.db.collection('generations').doc(sessionId).get();
      
      if (!doc.exists) {
        throw new Error('Generation session not found');
      }

      const session = doc.data() as GenerationSession;
      
      if (session.userId !== userId) {
        throw new Error('Unauthorized access to generation session');
      }

      return session;
    } catch (error) {
      this.handleError(error, 'getGenerationById');
    }
  }

  /**
   * Process generation in background
   */
  private async processGeneration(session: GenerationSession): Promise<void> {
    try {
      // Update status to generating
      await this.updateSessionStatus(session.id, 'generating');

      // Generate prompt
      const prompt = this.buildGenerationPrompt(session.request);

      // Call AI provider
      const startTime = Date.now();
      const response = await this.callAIProvider(session.request.provider, prompt, session.request);
      const processingTime = Date.now() - startTime;

      if (response.success && response.files) {
        // Update session with generated files
        await this.updateSessionFiles(session.id, response.files, {
          tokensUsed: response.metadata?.tokensUsed,
          processingTime,
          provider: session.request.provider,
          model: session.request.model || DEFAULT_MODELS[session.request.provider],
        });

        await this.updateSessionStatus(session.id, 'completed');
      } else {
        await this.updateSessionStatus(session.id, 'failed', { error: response.error });
      }
    } catch (error) {
      await this.updateSessionStatus(session.id, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Build generation prompt based on request
   */
  private buildGenerationPrompt(request: GenerationRequest): CodeGenerationPrompt {
    const systemPrompt = `You are an expert full-stack developer specializing in modern web applications.

Generate a complete, production-ready application based on the user's requirements.

Guidelines:
- Use modern best practices and clean code principles
- Include proper TypeScript types and interfaces
- Add comprehensive error handling and validation
- Create responsive, accessible UI components
- Include proper file structure and organization
- Add comments and documentation where helpful
- Ensure code is secure and follows security best practices

Return a JSON response with this structure:
{
  "files": [
    {
      "name": "filename.ext",
      "path": "relative/path/to/file",
      "content": "file content here",
      "language": "typescript|javascript|css|html|json",
      "type": "component|page|config|style|data|test"
    }
  ]
}`;

    let userPrompt = `Create a ${request.appType || 'web application'} with the following requirements:

Description: ${request.prompt}`;

    if (request.framework) {
      userPrompt += `\nFramework: ${request.framework}`;
    }

    if (request.features?.length) {
      userPrompt += `\nRequired features: ${request.features.join(', ')}`;
    }

    if (request.customization) {
      userPrompt += `\nCustomization preferences:`;
      if (request.customization.theme) {
        userPrompt += `\n- Theme: ${request.customization.theme}`;
      }
      if (request.customization.layout) {
        userPrompt += `\n- Layout: ${request.customization.layout}`;
      }
      if (request.customization.components?.length) {
        userPrompt += `\n- Components: ${request.customization.components.join(', ')}`;
      }
    }

    return {
      systemPrompt,
      userPrompt,
    };
  }

  /**
   * Call the appropriate AI provider
   */
  private async callAIProvider(provider: AIProvider, prompt: CodeGenerationPrompt, request: GenerationRequest): Promise<AIResponse> {
    switch (provider) {
      case 'openai':
        return this.callOpenAI(prompt, request);
      case 'anthropic':
        return this.callAnthropic(prompt, request);
      case 'google':
        return this.callGoogle(prompt, request);
      case 'cerebras':
        return this.callCerebras(prompt, request);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: CodeGenerationPrompt, request: GenerationRequest): Promise<AIResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: request.model || DEFAULT_MODELS.openai,
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        files: parsed.files || [],
        metadata: {
          tokensUsed: response.usage?.total_tokens || 0,
          processingTime: 0,
          model: response.model,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: CodeGenerationPrompt, request: GenerationRequest): Promise<AIResponse> {
    try {
      const response = await this.anthropic.messages.create({
        model: request.model || DEFAULT_MODELS.anthropic,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        messages: [
          { role: 'user', content: `${prompt.systemPrompt}\n\n${prompt.userPrompt}` }
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Invalid response type from Anthropic');
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Anthropic');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        files: parsed.files || [],
        metadata: {
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          processingTime: 0,
          model: response.model,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Call Google AI API (placeholder)
   */
  private async callGoogle(prompt: CodeGenerationPrompt, request: GenerationRequest): Promise<AIResponse> {
    // TODO: Implement Google AI integration
    return {
      success: false,
      error: 'Google AI integration not yet implemented',
    };
  }

  /**
   * Call Cerebras API (placeholder)
   */
  private async callCerebras(prompt: CodeGenerationPrompt, request: GenerationRequest): Promise<AIResponse> {
    // TODO: Implement Cerebras integration
    return {
      success: false,
      error: 'Cerebras integration not yet implemented',
    };
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(sessionId: string, status: GenerationSession['status'], additionalData?: any): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: this.now(),
    };

    if (status === 'completed') {
      updateData.completedAt = this.now();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await this.db.collection('generations').doc(sessionId).update(updateData);
  }

  /**
   * Update session with generated files
   */
  private async updateSessionFiles(sessionId: string, files: GeneratedFile[], metadata: any): Promise<void> {
    await this.db.collection('generations').doc(sessionId).update({
      files,
      metadata,
      updatedAt: this.now(),
    });
  }

  /**
   * Stream generation progress (for WebSocket integration)
   */
  async *streamGeneration(sessionId: string, userId: string): AsyncGenerator<StreamChunk> {
    // TODO: Implement real-time streaming
    // This would integrate with WebSocket service for live updates
    const session = await this.getGenerationById(sessionId, userId);
    
    // For now, just yield the current session status
    yield {
      type: 'status',
      data: { status: session.status },
      timestamp: Date.now(),
    };

    if (session.status === 'completed') {
      yield {
        type: 'completed',
        data: { files: session.files },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * List user's generation sessions with pagination
   */
  async listUserGenerations(userId: string, options?: { 
    limit?: number; 
    offset?: number; 
    status?: string; 
  }): Promise<GenerationSession[]> {
    try {
      let query = this.db.collection('generations')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      if (options?.status) {
        query = query.where('status', '==', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GenerationSession));
    } catch (error) {
      this.handleError(error, 'listUserGenerations');
    }
  }

  /**
   * Delete generation session
   */
  async deleteGeneration(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.getGenerationById(sessionId, userId);
      
      if (session.userId !== userId) {
        throw new Error('Unauthorized access to generation session');
      }

      await this.db.collection('generations').doc(sessionId).delete();
    } catch (error) {
      this.handleError(error, 'deleteGeneration');
    }
  }

  /**
   * Test AI provider connectivity
   */
  async testProvider(provider: AIProvider): Promise<{ success: boolean; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      
      const testPrompt: CodeGenerationPrompt = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say "Hello, world!" and return it as JSON: {"message": "Hello, world!"}',
      };

      const response = await this.callAIProvider(provider, testPrompt, {
        prompt: 'test',
        provider,
        temperature: 0.1,
        maxTokens: 50,
      });

      const latency = Date.now() - startTime;

      return {
        success: response.success,
        latency,
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
