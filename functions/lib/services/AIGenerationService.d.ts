import { BaseService } from './BaseService';
import { GenerationSession, AIProviderName, PaginatedResponse } from '../types/api';
export declare class AIGenerationService extends BaseService {
    private readonly generationsCollection;
    private readonly appsCollection;
    /**
     * Initiates a new code generation session
     */
    generateCode(userId: string, generateRequest: unknown): Promise<GenerationSession>;
    /**
     * Updates generation session status and progress
     */
    updateGenerationStatus(generationId: string, userId: string, updates: {
        status?: 'pending' | 'running' | 'completed' | 'failed';
        progress?: number;
        generatedFiles?: Array<{
            path: string;
            content: string;
            type: string;
        }>;
        error?: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Retrieves a generation session by ID with ownership verification
     */
    getGenerationById(generationId: string, userId: string): Promise<GenerationSession>;
    /**
     * Retrieves generation sessions for a user with pagination
     */
    getUserGenerations(userId: string, paginationData: unknown): Promise<PaginatedResponse<GenerationSession>>;
    /**
     * Retrieves generation sessions for a specific app
     */
    getAppGenerations(appId: string, userId: string, paginationData: unknown): Promise<PaginatedResponse<GenerationSession>>;
    /**
     * Cancels a running generation session
     */
    cancelGeneration(generationId: string, userId: string): Promise<void>;
    /**
     * Deletes a generation session and its associated files
     */
    deleteGeneration(generationId: string, userId: string): Promise<void>;
    /**
     * Gets statistics for user's AI usage
     */
    getUserAIStats(userId: string): Promise<{
        totalGenerations: number;
        successfulGenerations: number;
        failedGenerations: number;
        averageDuration: number;
        providerUsage: Record<AIProviderName, number>;
        monthlyUsage: {
            month: string;
            count: number;
        }[];
    }>;
    /**
     * Gets the default model for a given provider
     */
    private getDefaultModel;
    /**
     * Estimates generation time based on prompt length
     */
    private estimateGenerationTime;
}
//# sourceMappingURL=AIGenerationService.d.ts.map