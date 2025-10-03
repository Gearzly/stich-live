import { BaseService } from './BaseService';
import { App, PaginatedResponse } from '../types/api';
export declare class AppManagementService extends BaseService {
    private readonly appsCollection;
    /**
     * Creates a new application for the authenticated user
     */
    createApp(userId: string, appData: unknown): Promise<App>;
    /**
     * Retrieves apps for a specific user with pagination
     */
    getUserApps(userId: string, paginationData: unknown): Promise<PaginatedResponse<App>>;
    /**
     * Retrieves a single app by ID with ownership verification
     */
    getAppById(appId: string, userId: string): Promise<App>;
    /**
     * Updates an existing app with ownership verification
     */
    updateApp(appId: string, userId: string, updateData: unknown): Promise<App>;
    /**
     * Deletes an app with ownership verification
     */
    deleteApp(appId: string, userId: string): Promise<void>;
    /**
     * Updates app status
     */
    updateAppStatus(appId: string, userId: string, status: 'draft' | 'generating' | 'ready' | 'deployed' | 'error'): Promise<void>;
    /**
     * Updates app metadata
     */
    updateAppMetadata(appId: string, userId: string, metadata: Partial<{
        generatedFiles: number;
        deploymentUrl?: string;
        lastDeployedAt?: Date;
    }>): Promise<void>;
    /**
     * Retrieves public apps with pagination
     */
    getPublicApps(paginationData: unknown): Promise<PaginatedResponse<App>>;
}
//# sourceMappingURL=AppManagementService.d.ts.map