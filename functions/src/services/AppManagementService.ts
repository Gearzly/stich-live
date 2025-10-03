import { BaseService, NotFoundError, AuthorizationError } from './BaseService';
import { z } from 'zod';
import { 
  App, 
  PaginatedResponse,
  AppConfig
} from '../types/api';

// Validation schemas
const createAppSchema = z.object({
  name: z.string().min(1, 'App name is required').max(255),
  description: z.string().max(1000).optional(),
  framework: z.enum(['react', 'vue', 'angular', 'vanilla']).optional(),
  styling: z.enum(['tailwind', 'css', 'styled-components']).optional(),
  features: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

const updateAppSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  framework: z.enum(['react', 'vue', 'angular', 'vanilla']).optional(),
  styling: z.enum(['tailwind', 'css', 'styled-components']).optional(),
  features: z.array(z.string()).optional(),
  isPublic: z.boolean().optional()
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export class AppManagementService extends BaseService {
  private readonly appsCollection = 'apps';

  /**
   * Creates a new application for the authenticated user
   */
  async createApp(userId: string, appData: unknown): Promise<App> {
    try {
      const validatedData = this.validateInput(appData, createAppSchema);
      
      // Apply defaults
      const config: AppConfig = {
        framework: validatedData.framework || 'react',
        styling: validatedData.styling || 'tailwind',
        features: validatedData.features || []
      };

      const app = {
        userId,
        name: validatedData.name,
        description: validatedData.description || '',
        status: 'draft' as const,
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          generatedFiles: 0
        }
      };

      const docRef = await this.db.collection(this.appsCollection).add(app);
      
      this.logger.info('App created successfully', { 
        appId: docRef.id, 
        userId,
        name: validatedData.name 
      });

      return { id: docRef.id, ...app };
    } catch (error) {
      this.handleError(error as Error, 'createApp');
    }
  }

  /**
   * Retrieves apps for a specific user with pagination
   */
  async getUserApps(
    userId: string, 
    paginationData: unknown
  ): Promise<PaginatedResponse<App>> {
    try {
      const paginationInput = this.validateInput(paginationData, paginationSchema);
      
      // Apply defaults
      const page = paginationInput.page || 1;
      const limit = paginationInput.limit || 10;
      const sortBy = paginationInput.sortBy || 'createdAt';
      const sortOrder = paginationInput.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      // Build query
      let query = this.db.collection(this.appsCollection)
        .where('userId', '==', userId)
        .orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await this.db.collection(this.appsCollection)
        .where('userId', '==', userId)
        .count()
        .get();

      // Get paginated results
      const snapshot = await query.offset(offset).limit(limit).get();

      const apps: App[] = [];
      snapshot.forEach(doc => {
        apps.push({ id: doc.id, ...doc.data() } as App);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      this.logger.info('Retrieved user apps', { 
        userId, 
        count: apps.length, 
        total 
      });

      return {
        data: apps,
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
      this.handleError(error as Error, 'getUserApps');
    }
  }

  /**
   * Retrieves a single app by ID with ownership verification
   */
  async getAppById(appId: string, userId: string): Promise<App> {
    try {
      const appDoc = await this.db.collection(this.appsCollection).doc(appId).get();
      
      if (!appDoc.exists) {
        throw new NotFoundError('App', appId);
      }

      const appData = appDoc.data() as Omit<App, 'id'>;
      
      // Verify ownership
      if (appData.userId !== userId) {
        throw new AuthorizationError('Access denied to this app');
      }

      this.logger.info('Retrieved app', { appId, userId });

      return { id: appDoc.id, ...appData };
    } catch (error) {
      this.handleError(error as Error, 'getAppById');
    }
  }

  /**
   * Updates an existing app with ownership verification
   */
  async updateApp(appId: string, userId: string, updateData: unknown): Promise<App> {
    try {
      const validatedData = this.validateInput(updateData, updateAppSchema);
      
      // Verify ownership
      const app = await this.getAppById(appId, userId);

      const updatedFields: any = {
        ...validatedData,
        updatedAt: new Date()
      };

      // Update config if framework/styling changed
      if (validatedData.framework || validatedData.styling || validatedData.features) {
        updatedFields.config = {
          ...app.config,
          ...(validatedData.framework && { framework: validatedData.framework }),
          ...(validatedData.styling && { styling: validatedData.styling }),
          ...(validatedData.features && { features: validatedData.features })
        };
      }

      await this.db.collection(this.appsCollection).doc(appId).update(updatedFields);

      this.logger.info('App updated successfully', { appId, userId });

      return { ...app, ...updatedFields };
    } catch (error) {
      this.handleError(error as Error, 'updateApp');
    }
  }

  /**
   * Deletes an app with ownership verification
   */
  async deleteApp(appId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      await this.getAppById(appId, userId);

      await this.db.collection(this.appsCollection).doc(appId).delete();

      this.logger.info('App deleted successfully', { appId, userId });
    } catch (error) {
      this.handleError(error as Error, 'deleteApp');
    }
  }

  /**
   * Updates app status
   */
  async updateAppStatus(
    appId: string, 
    userId: string, 
    status: 'draft' | 'generating' | 'ready' | 'deployed' | 'error'
  ): Promise<void> {
    try {
      // Verify ownership
      await this.getAppById(appId, userId);

      await this.db.collection(this.appsCollection).doc(appId).update({
        status,
        updatedAt: new Date()
      });

      this.logger.info('App status updated', { 
        appId, 
        userId, 
        status
      });
    } catch (error) {
      this.handleError(error as Error, 'updateAppStatus');
    }
  }

  /**
   * Updates app metadata
   */
  async updateAppMetadata(
    appId: string, 
    userId: string, 
    metadata: Partial<{ generatedFiles: number; deploymentUrl?: string; lastDeployedAt?: Date }>
  ): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getAppById(appId, userId);

      const updatedMetadata = {
        ...app.metadata,
        ...metadata
      };

      await this.db.collection(this.appsCollection).doc(appId).update({
        metadata: updatedMetadata,
        updatedAt: new Date()
      });

      this.logger.info('App metadata updated', { appId, userId, metadata });
    } catch (error) {
      this.handleError(error as Error, 'updateAppMetadata');
    }
  }

  /**
   * Retrieves public apps with pagination
   */
  async getPublicApps(paginationData: unknown): Promise<PaginatedResponse<App>> {
    try {
      const paginationInput = this.validateInput(paginationData, paginationSchema);
      
      // Apply defaults
      const page = paginationInput.page || 1;
      const limit = paginationInput.limit || 10;
      const sortBy = paginationInput.sortBy || 'createdAt';
      const sortOrder = paginationInput.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      // Build query for public apps only
      let query = this.db.collection(this.appsCollection)
        .where('status', '==', 'deployed') // Only show deployed apps as public
        .orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await this.db.collection(this.appsCollection)
        .where('status', '==', 'deployed')
        .count()
        .get();

      // Get paginated results
      const snapshot = await query.offset(offset).limit(limit).get();

      const apps: App[] = [];
      snapshot.forEach(doc => {
        apps.push({ id: doc.id, ...doc.data() } as App);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      this.logger.info('Retrieved public apps', { 
        count: apps.length, 
        total 
      });

      return {
        data: apps,
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
      this.handleError(error as Error, 'getPublicApps');
    }
  }
}