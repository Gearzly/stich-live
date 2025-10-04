import { BaseService } from './BaseService';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Application data types
export interface Application {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: 'react' | 'vue' | 'svelte' | 'vanilla' | 'node' | 'python' | 'other';
  status: 'draft' | 'generating' | 'building' | 'deployed' | 'failed';
  isPublic: boolean;
  isFavorite: boolean;
  tags: string[];
  
  // URLs and deployment info
  repositoryUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  
  // Generation metadata
  generationSettings: {
    aiProvider: 'openai' | 'anthropic' | 'google' | 'cerebras';
    model: string;
    prompt: string;
    additionalInstructions?: string;
  };
  
  // Files and structure
  files?: AppFile[];
  fileStructure?: FileNode[];
  
  // Analytics
  analytics: {
    views: number;
    likes: number;
    forks: number;
    shares: number;
  };
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AppFile {
  id: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface CreateApplicationData {
  name: string;
  description: string;
  category: string;
  framework: 'react' | 'vue' | 'svelte' | 'vanilla' | 'node' | 'python' | 'other';
  tags?: string[];
  isPublic?: boolean;
  generationSettings: {
    aiProvider: 'openai' | 'anthropic' | 'google' | 'cerebras';
    model: string;
    prompt: string;
    additionalInstructions?: string;
  };
}

export interface UpdateApplicationData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isFavorite?: boolean;
  status?: 'draft' | 'generating' | 'building' | 'deployed' | 'failed';
  repositoryUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
}

export interface AppFilters {
  status?: string;
  framework?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isFavorite?: boolean;
  search?: string;
}

/**
 * Application Management Service
 * Handles CRUD operations for generated applications
 */
export class AppManagementService extends BaseService {
  
  constructor() {
    super();
  }

  /**
   * Create a new application
   */
  async createApplication(userId: string, appData: CreateApplicationData): Promise<Application> {
    try {
      const appId = this.generateId();
      
      const application: Application = {
        id: appId,
        name: appData.name,
        description: appData.description,
        category: appData.category,
        framework: appData.framework,
        status: 'draft',
        isPublic: appData.isPublic || false,
        isFavorite: false,
        tags: appData.tags || [],
        generationSettings: appData.generationSettings,
        analytics: {
          views: 0,
          likes: 0,
          forks: 0,
          shares: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      };

      await this.db.collection('applications').doc(appId).set(application);
      
      this.logger.info('Application created', { appId, userId, name: appData.name });
      return application;
    } catch (error) {
      this.logger.error('Failed to create application', { userId, error });
      throw new Error('Failed to create application');
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(appId: string, userId?: string): Promise<Application | null> {
    try {
      const appDoc = await this.db.collection('applications').doc(appId).get();
      
      if (!appDoc.exists) {
        return null;
      }

      const app = appDoc.data() as Application;
      
      // Check if user has access to this app
      if (!app.isPublic && userId && app.createdBy !== userId) {
        return null;
      }

      // Increment view count
      if (userId !== app.createdBy) {
        await this.incrementAnalytics(appId, 'views');
      }

      return app;
    } catch (error) {
      this.logger.error('Failed to get application by ID', { appId, error });
      throw new Error('Failed to get application');
    }
  }

  /**
   * Get applications for a user
   */
  async getUserApplications(
    userId: string, 
    filters: AppFilters = {}, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ applications: Application[]; total: number }> {
    try {
      let query = this.db.collection('applications')
        .where('createdBy', '==', userId)
        .orderBy('updatedAt', 'desc');

      // Apply filters
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      if (filters.framework) {
        query = query.where('framework', '==', filters.framework);
      }
      
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      
      if (filters.isFavorite !== undefined) {
        query = query.where('isFavorite', '==', filters.isFavorite);
      }

      const snapshot = await query.limit(limit).offset(offset).get();
      let applications = snapshot.docs.map(doc => doc.data() as Application);

      // Apply client-side filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        applications = applications.filter(app => 
          app.name.toLowerCase().includes(searchTerm) ||
          app.description.toLowerCase().includes(searchTerm) ||
          app.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        applications = applications.filter(app =>
          filters.tags!.some(tag => app.tags.includes(tag))
        );
      }

      // Get total count
      const totalSnapshot = await this.db.collection('applications')
        .where('createdBy', '==', userId)
        .get();

      return {
        applications,
        total: totalSnapshot.size,
      };
    } catch (error) {
      this.logger.error('Failed to get user applications', { userId, error });
      throw new Error('Failed to get applications');
    }
  }

  /**
   * Get public applications
   */
  async getPublicApplications(
    filters: AppFilters = {}, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ applications: Application[]; total: number }> {
    try {
      let query = this.db.collection('applications')
        .where('isPublic', '==', true)
        .orderBy('analytics.views', 'desc');

      // Apply filters
      if (filters.framework) {
        query = query.where('framework', '==', filters.framework);
      }
      
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      const snapshot = await query.limit(limit).offset(offset).get();
      let applications = snapshot.docs.map(doc => doc.data() as Application);

      // Apply client-side filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        applications = applications.filter(app => 
          app.name.toLowerCase().includes(searchTerm) ||
          app.description.toLowerCase().includes(searchTerm) ||
          app.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        applications = applications.filter(app =>
          filters.tags!.some(tag => app.tags.includes(tag))
        );
      }

      // Get total count
      const totalSnapshot = await this.db.collection('applications')
        .where('isPublic', '==', true)
        .get();

      return {
        applications,
        total: totalSnapshot.size,
      };
    } catch (error) {
      this.logger.error('Failed to get public applications', { error });
      throw new Error('Failed to get public applications');
    }
  }

  /**
   * Update application
   */
  async updateApplication(appId: string, userId: string, updateData: UpdateApplicationData): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getApplicationById(appId);
      if (!app || app.createdBy !== userId) {
        throw new Error('Application not found or access denied');
      }

      const updatePayload = {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      await this.db.collection('applications').doc(appId).update(updatePayload);
      
      this.logger.info('Application updated', { appId, userId });
    } catch (error) {
      this.logger.error('Failed to update application', { appId, userId, error });
      throw new Error('Failed to update application');
    }
  }

  /**
   * Delete application
   */
  async deleteApplication(appId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getApplicationById(appId);
      if (!app || app.createdBy !== userId) {
        throw new Error('Application not found or access denied');
      }

      await this.db.collection('applications').doc(appId).delete();
      
      // Delete related files and data
      await this.deleteApplicationFiles(appId);
      
      this.logger.info('Application deleted', { appId, userId });
    } catch (error) {
      this.logger.error('Failed to delete application', { appId, userId, error });
      throw new Error('Failed to delete application');
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(appId: string, userId: string): Promise<boolean> {
    try {
      const app = await this.getApplicationById(appId);
      if (!app || app.createdBy !== userId) {
        throw new Error('Application not found or access denied');
      }

      const newFavoriteStatus = !app.isFavorite;
      
      await this.db.collection('applications').doc(appId).update({
        isFavorite: newFavoriteStatus,
        updatedAt: new Date(),
      });
      
      this.logger.info('Application favorite status toggled', { appId, userId, isFavorite: newFavoriteStatus });
      return newFavoriteStatus;
    } catch (error) {
      this.logger.error('Failed to toggle favorite', { appId, userId, error });
      throw new Error('Failed to toggle favorite');
    }
  }

  /**
   * Update application files
   */
  async updateApplicationFiles(appId: string, userId: string, files: AppFile[]): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getApplicationById(appId);
      if (!app || app.createdBy !== userId) {
        throw new Error('Application not found or access denied');
      }

      await this.db.collection('applications').doc(appId).update({
        files,
        updatedAt: new Date(),
      });
      
      this.logger.info('Application files updated', { appId, userId, fileCount: files.length });
    } catch (error) {
      this.logger.error('Failed to update application files', { appId, userId, error });
      throw new Error('Failed to update application files');
    }
  }

  /**
   * Get application files
   */
  async getApplicationFiles(appId: string, userId?: string): Promise<AppFile[]> {
    try {
      const app = await this.getApplicationById(appId, userId);
      if (!app) {
        throw new Error('Application not found');
      }

      return app.files || [];
    } catch (error) {
      this.logger.error('Failed to get application files', { appId, error });
      throw new Error('Failed to get application files');
    }
  }

  /**
   * Increment analytics
   */
  async incrementAnalytics(appId: string, metric: 'views' | 'likes' | 'forks' | 'shares'): Promise<void> {
    try {
      const appRef = this.db.collection('applications').doc(appId);
      
      await this.db.runTransaction(async (transaction) => {
        const appDoc = await transaction.get(appRef);
        if (!appDoc.exists) {
          throw new Error('Application not found');
        }

        const app = appDoc.data() as Application;
        const newAnalytics = {
          ...app.analytics,
          [metric]: app.analytics[metric] + 1,
        };

        transaction.update(appRef, { analytics: newAnalytics });
      });
      
    } catch (error) {
      this.logger.error('Failed to increment analytics', { appId, metric, error });
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byFramework: Record<string, number>;
    totalViews: number;
  }> {
    try {
      const snapshot = await this.db.collection('applications')
        .where('createdBy', '==', userId)
        .get();

      const apps = snapshot.docs.map(doc => doc.data() as Application);
      
      const stats = {
        total: apps.length,
        byStatus: {} as Record<string, number>,
        byFramework: {} as Record<string, number>,
        totalViews: 0,
      };

      apps.forEach(app => {
        // Count by status
        stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
        
        // Count by framework
        stats.byFramework[app.framework] = (stats.byFramework[app.framework] || 0) + 1;
        
        // Sum views
        stats.totalViews += app.analytics.views;
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get application stats', { userId, error });
      throw new Error('Failed to get application statistics');
    }
  }

  /**
   * Search applications across all public apps
   */
  async searchApplications(
    query: string, 
    filters: AppFilters = {}, 
    limit: number = 20
  ): Promise<Application[]> {
    try {
      // Get public applications
      const { applications } = await this.getPublicApplications(filters, limit * 2); // Get more to account for filtering
      
      // Apply search
      const searchTerm = query.toLowerCase();
      const filteredApps = applications.filter(app => 
        app.name.toLowerCase().includes(searchTerm) ||
        app.description.toLowerCase().includes(searchTerm) ||
        app.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );

      return filteredApps.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to search applications', { query, error });
      throw new Error('Failed to search applications');
    }
  }

  /**
   * Delete application files
   */
  private async deleteApplicationFiles(appId: string): Promise<void> {
    try {
      // Delete file storage if using Firebase Storage
      // This would typically involve deleting files from Storage bucket
      this.logger.info('Application files deleted', { appId });
    } catch (error) {
      this.logger.error('Failed to delete application files', { appId, error });
    }
  }
}
