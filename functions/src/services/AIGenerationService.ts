import { BaseService, NotFoundError, AuthorizationError } from './BaseService';
import { z } from 'zod';
import { 
  GenerationSession, 
  AIProviderName, 
  PaginatedResponse
} from '../types/api';

// Validation schemas
const generateCodeSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  prompt: z.string().min(1, 'Prompt is required').max(10000),
  provider: z.enum(['openai', 'anthropic', 'google', 'cerebras']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  stream: z.boolean().optional()
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export class AIGenerationService extends BaseService {
  private readonly generationsCollection = 'generations';
  private readonly appsCollection = 'apps';

  /**
   * Initiates a new code generation session
   */
  async generateCode(userId: string, generateRequest: unknown): Promise<GenerationSession> {
    try {
      const validatedData = this.validateInput(generateRequest, generateCodeSchema);
      
      // Verify app ownership
      const appDoc = await this.db.collection(this.appsCollection).doc(validatedData.appId).get();
      if (!appDoc.exists) {
        throw new NotFoundError('App', validatedData.appId);
      }

      const appData = appDoc.data();
      if (appData?.userId !== userId) {
        throw new AuthorizationError('Access denied to this app');
      }

      // Apply defaults
      const provider: AIProviderName = validatedData.provider || 'openai';
      const model = validatedData.model || this.getDefaultModel(provider);
      const temperature = validatedData.temperature || 0.7;
      const maxTokens = validatedData.maxTokens || 2000;
      const stream = validatedData.stream || false;

      // Create generation session
      const session: Omit<GenerationSession, 'id'> = {
        userId,
        appId: validatedData.appId,
        prompt: validatedData.prompt,
        provider,
        model,
        temperature,
        maxTokens,
        stream,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedFiles: [],
        metadata: {
          startTime: Date.now(),
          estimatedDuration: this.estimateGenerationTime(validatedData.prompt.length)
        }
      };

      const docRef = await this.db.collection(this.generationsCollection).add(session);
      
      // Update app metadata
      await this.db.collection(this.appsCollection).doc(validatedData.appId).update({
        'metadata.lastGenerationId': docRef.id,
        'metadata.lastGeneratedAt': new Date(),
        updatedAt: new Date()
      });

      this.logger.info('Code generation initiated', { 
        generationId: docRef.id,
        appId: validatedData.appId,
        userId,
        provider,
        model
      });

      return { id: docRef.id, ...session };
    } catch (error) {
      this.handleError(error as Error, 'generateCode');
    }
  }

  /**
   * Updates generation session status and progress
   */
  async updateGenerationStatus(
    generationId: string,
    userId: string,
    updates: {
      status?: 'pending' | 'running' | 'completed' | 'failed';
      progress?: number;
      generatedFiles?: Array<{ path: string; content: string; type: string }>;
      error?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      // Verify ownership
      const generation = await this.getGenerationById(generationId, userId);

      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Update completion time if completed or failed
      if (updates.status === 'completed' || updates.status === 'failed') {
        updateData.metadata = {
          ...generation.metadata,
          ...updates.metadata,
          endTime: Date.now(),
          duration: Date.now() - (generation.metadata?.startTime || Date.now())
        };
      }

      await this.db.collection(this.generationsCollection).doc(generationId).update(updateData);

      this.logger.info('Generation status updated', { 
        generationId,
        userId,
        status: updates.status,
        progress: updates.progress
      });
    } catch (error) {
      this.handleError(error as Error, 'updateGenerationStatus');
    }
  }

  /**
   * Retrieves a generation session by ID with ownership verification
   */
  async getGenerationById(generationId: string, userId: string): Promise<GenerationSession> {
    try {
      const generationDoc = await this.db.collection(this.generationsCollection).doc(generationId).get();
      
      if (!generationDoc.exists) {
        throw new NotFoundError('Generation', generationId);
      }

      const generationData = generationDoc.data() as Omit<GenerationSession, 'id'>;
      
      // Verify ownership
      if (generationData.userId !== userId) {
        throw new AuthorizationError('Access denied to this generation');
      }

      this.logger.info('Retrieved generation', { generationId, userId });

      return { id: generationDoc.id, ...generationData };
    } catch (error) {
      this.handleError(error as Error, 'getGenerationById');
    }
  }

  /**
   * Retrieves generation sessions for a user with pagination
   */
  async getUserGenerations(
    userId: string,
    paginationData: unknown
  ): Promise<PaginatedResponse<GenerationSession>> {
    try {
      const paginationInput = this.validateInput(paginationData, paginationSchema);
      
      // Apply defaults
      const page = paginationInput.page || 1;
      const limit = paginationInput.limit || 10;
      const sortBy = paginationInput.sortBy || 'createdAt';
      const sortOrder = paginationInput.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      // Build query
      let query = this.db.collection(this.generationsCollection)
        .where('userId', '==', userId)
        .orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await this.db.collection(this.generationsCollection)
        .where('userId', '==', userId)
        .count()
        .get();

      // Get paginated results
      const snapshot = await query.offset(offset).limit(limit).get();

      const generations: GenerationSession[] = [];
      snapshot.forEach(doc => {
        generations.push({ id: doc.id, ...doc.data() } as GenerationSession);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      this.logger.info('Retrieved user generations', { 
        userId, 
        count: generations.length, 
        total 
      });

      return {
        data: generations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'getUserGenerations');
    }
  }

  /**
   * Retrieves generation sessions for a specific app
   */
  async getAppGenerations(
    appId: string,
    userId: string,
    paginationData: unknown
  ): Promise<PaginatedResponse<GenerationSession>> {
    try {
      // Verify app ownership first
      const appDoc = await this.db.collection(this.appsCollection).doc(appId).get();
      if (!appDoc.exists) {
        throw new NotFoundError('App', appId);
      }

      const appData = appDoc.data();
      if (appData?.userId !== userId) {
        throw new AuthorizationError('Access denied to this app');
      }

      const paginationInput = this.validateInput(paginationData, paginationSchema);
      
      // Apply defaults
      const page = paginationInput.page || 1;
      const limit = paginationInput.limit || 10;
      const sortBy = paginationInput.sortBy || 'createdAt';
      const sortOrder = paginationInput.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      // Build query
      let query = this.db.collection(this.generationsCollection)
        .where('appId', '==', appId)
        .orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await this.db.collection(this.generationsCollection)
        .where('appId', '==', appId)
        .count()
        .get();

      // Get paginated results
      const snapshot = await query.offset(offset).limit(limit).get();

      const generations: GenerationSession[] = [];
      snapshot.forEach(doc => {
        generations.push({ id: doc.id, ...doc.data() } as GenerationSession);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      this.logger.info('Retrieved app generations', { 
        appId,
        userId, 
        count: generations.length, 
        total 
      });

      return {
        data: generations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'getAppGenerations');
    }
  }

  /**
   * Cancels a running generation session
   */
  async cancelGeneration(generationId: string, userId: string): Promise<void> {
    try {
      const generation = await this.getGenerationById(generationId, userId);
      
      // Only allow cancellation of pending or running generations
      if (generation.status !== 'pending' && generation.status !== 'running') {
        throw new Error('Cannot cancel completed or failed generation');
      }

      await this.updateGenerationStatus(generationId, userId, {
        status: 'failed',
        error: 'Cancelled by user'
      });

      this.logger.info('Generation cancelled', { generationId, userId });
    } catch (error) {
      this.handleError(error as Error, 'cancelGeneration');
    }
  }

  /**
   * Deletes a generation session and its associated files
   */
  async deleteGeneration(generationId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      await this.getGenerationById(generationId, userId);

      await this.db.collection(this.generationsCollection).doc(generationId).delete();

      this.logger.info('Generation deleted', { generationId, userId });
    } catch (error) {
      this.handleError(error as Error, 'deleteGeneration');
    }
  }

  /**
   * Gets statistics for user's AI usage
   */
  async getUserAIStats(userId: string): Promise<{
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageDuration: number;
    providerUsage: Record<AIProviderName, number>;
    monthlyUsage: { month: string; count: number }[];
  }> {
    try {
      // Get all user generations for stats
      const snapshot = await this.db.collection(this.generationsCollection)
        .where('userId', '==', userId)
        .get();

      const generations: GenerationSession[] = [];
      snapshot.forEach(doc => {
        generations.push({ id: doc.id, ...doc.data() } as GenerationSession);
      });

      // Calculate statistics
      const totalGenerations = generations.length;
      const successfulGenerations = generations.filter(g => g.status === 'completed').length;
      const failedGenerations = generations.filter(g => g.status === 'failed').length;
      
      const completedGenerations = generations.filter(g => g.metadata?.duration);
      const averageDuration = completedGenerations.length > 0 
        ? completedGenerations.reduce((sum, g) => sum + (g.metadata?.duration || 0), 0) / completedGenerations.length
        : 0;

      // Provider usage stats
      const providerUsage: Record<AIProviderName, number> = {
        openai: 0,
        anthropic: 0,
        google: 0,
        cerebras: 0
      };

      generations.forEach(g => {
        providerUsage[g.provider] = (providerUsage[g.provider] || 0) + 1;
      });

      // Monthly usage (last 12 months)
      const monthlyUsage: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.toISOString().slice(0, 7); // YYYY-MM format
        const count = generations.filter(g => {
          const genMonth = g.createdAt.toISOString().slice(0, 7);
          return genMonth === month;
        }).length;
        monthlyUsage.push({ month, count });
      }

      this.logger.info('Retrieved user AI stats', { 
        userId,
        totalGenerations,
        successfulGenerations
      });

      return {
        totalGenerations,
        successfulGenerations,
        failedGenerations,
        averageDuration,
        providerUsage,
        monthlyUsage
      };
    } catch (error) {
      this.handleError(error as Error, 'getUserAIStats');
    }
  }

  /**
   * Gets the default model for a given provider
   */
  private getDefaultModel(provider: AIProviderName): string {
    const defaults: Record<AIProviderName, string> = {
      openai: 'gpt-4o',
      anthropic: 'claude-3-5-sonnet-20241022',
      google: 'gemini-1.5-pro',
      cerebras: 'llama3.1-8b'
    };
    return defaults[provider];
  }

  /**
   * Estimates generation time based on prompt length
   */
  private estimateGenerationTime(promptLength: number): number {
    // Base estimation: 30 seconds + 1 second per 100 characters
    return 30000 + Math.ceil(promptLength / 100) * 1000;
  }
}