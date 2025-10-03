import { 
  where, 
  orderBy, 
  limit as firestoreLimit,
  QueryConstraint 
} from 'firebase/firestore';
import { BaseService } from '../core/BaseService';

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

export interface CreateApplicationData {
  name: string;
  description: string;
  category: string;
  framework: Application['framework'];
  isPublic?: boolean;
  tags?: string[];
  generationSettings: Application['generationSettings'];
}

export interface UpdateApplicationData {
  name?: string;
  description?: string;
  category?: string;
  framework?: Application['framework'];
  status?: Application['status'];
  isPublic?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  repositoryUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  generationSettings?: Partial<Application['generationSettings']>;
}

export interface ApplicationFilters {
  category?: string;
  framework?: string;
  status?: string;
  isPublic?: boolean;
  tags?: string[];
  createdBy?: string;
}

export interface ApplicationSearchOptions {
  searchTerm?: string;
  filters?: ApplicationFilters;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

// Application Management Service
export class ApplicationService extends BaseService {
  private readonly COLLECTION_NAME = 'applications';

  // Create new application
  async createApplication(data: CreateApplicationData): Promise<Application> {
    try {
      const applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
        ...data,
        status: 'draft',
        isPublic: data.isPublic ?? false,
        isFavorite: false,
        tags: data.tags ?? [],
        analytics: {
          views: 0,
          likes: 0,
          forks: 0,
          shares: 0,
        },
      };

      return await this.createDocument<Application>(this.COLLECTION_NAME, applicationData);
    } catch (error) {
      this.handleError(error, 'createApplication');
    }
  }

  // Get application by ID
  async getApplication(id: string): Promise<Application | null> {
    try {
      const app = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      
      // Increment view count if app exists and user is not the owner
      if (app && app.createdBy !== this.getCurrentUserId()) {
        await this.incrementAnalytics(id, 'views');
      }
      
      return app;
    } catch (error) {
      this.handleError(error, 'getApplication');
    }
  }

  // Update application
  async updateApplication(id: string, data: UpdateApplicationData): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      if (!app) {
        throw new Error('Application not found');
      }
      
      const currentUserId = this.getCurrentUserId();
      if (app.createdBy !== currentUserId) {
        throw new Error('Unauthorized: You can only update your own applications');
      }

      await this.updateDocument(this.COLLECTION_NAME, id, data);
    } catch (error) {
      this.handleError(error, 'updateApplication');
    }
  }

  // Delete application
  async deleteApplication(id: string): Promise<void> {
    try {
      // Verify ownership
      const app = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      if (!app) {
        throw new Error('Application not found');
      }
      
      const currentUserId = this.getCurrentUserId();
      if (app.createdBy !== currentUserId) {
        throw new Error('Unauthorized: You can only delete your own applications');
      }

      await this.deleteDocument(this.COLLECTION_NAME, id);
    } catch (error) {
      this.handleError(error, 'deleteApplication');
    }
  }

  // Get user's applications
  async getUserApplications(userId?: string): Promise<Application[]> {
    try {
      const targetUserId = userId || this.getCurrentUserId();
      
      return await this.queryDocuments<Application>(
        this.COLLECTION_NAME,
        [
          where('createdBy', '==', targetUserId),
          orderBy('updatedAt', 'desc'),
        ]
      );
    } catch (error) {
      this.handleError(error, 'getUserApplications');
    }
  }

  // Search applications
  async searchApplications(options: ApplicationSearchOptions = {}): Promise<Application[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (options.filters) {
        const { category, framework, status, isPublic, createdBy } = options.filters;
        
        if (category) {
          constraints.push(where('category', '==', category));
        }
        
        if (framework) {
          constraints.push(where('framework', '==', framework));
        }
        
        if (status) {
          constraints.push(where('status', '==', status));
        }
        
        if (isPublic !== undefined) {
          constraints.push(where('isPublic', '==', isPublic));
        }
        
        if (createdBy) {
          constraints.push(where('createdBy', '==', createdBy));
        }
      }

      // Add ordering
      const sortBy = options.sortBy || 'updatedAt';
      const sortOrder = options.sortOrder || 'desc';
      constraints.push(orderBy(sortBy, sortOrder));

      // Add limit
      if (options.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      let results = await this.queryDocuments<Application>(this.COLLECTION_NAME, constraints);

      // Client-side text search (in production, consider using Algolia)
      if (options.searchTerm) {
        const searchTerm = options.searchTerm.toLowerCase();
        results = results.filter(app => 
          app.name.toLowerCase().includes(searchTerm) ||
          app.description.toLowerCase().includes(searchTerm) ||
          app.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Client-side tag filtering
      if (options.filters?.tags && options.filters.tags.length > 0) {
        results = results.filter(app =>
          options.filters!.tags!.some(tag => app.tags.includes(tag))
        );
      }

      return results;
    } catch (error) {
      this.handleError(error, 'searchApplications');
    }
  }

  // Get public applications
  async getPublicApplications(limit = 20): Promise<Application[]> {
    try {
      return await this.queryDocuments<Application>(
        this.COLLECTION_NAME,
        [
          where('isPublic', '==', true),
          where('status', '==', 'deployed'),
          orderBy('updatedAt', 'desc'),
          firestoreLimit(limit),
        ]
      );
    } catch (error) {
      this.handleError(error, 'getPublicApplications');
    }
  }

  // Get trending applications
  async getTrendingApplications(limit = 10): Promise<Application[]> {
    try {
      return await this.queryDocuments<Application>(
        this.COLLECTION_NAME,
        [
          where('isPublic', '==', true),
          where('status', '==', 'deployed'),
          orderBy('analytics.views', 'desc'),
          firestoreLimit(limit),
        ]
      );
    } catch (error) {
      this.handleError(error, 'getTrendingApplications');
    }
  }

  // Toggle favorite status
  async toggleFavorite(id: string): Promise<boolean> {
    try {
      const app = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      if (!app) {
        throw new Error('Application not found');
      }
      
      const currentUserId = this.getCurrentUserId();
      if (app.createdBy !== currentUserId) {
        throw new Error('Unauthorized: You can only favorite your own applications');
      }

      const newFavoriteStatus = !app.isFavorite;
      await this.updateDocument(this.COLLECTION_NAME, id, { isFavorite: newFavoriteStatus });
      
      return newFavoriteStatus;
    } catch (error) {
      this.handleError(error, 'toggleFavorite');
    }
  }

  // Increment analytics counters
  async incrementAnalytics(
    id: string, 
    metric: 'views' | 'likes' | 'forks' | 'shares'
  ): Promise<void> {
    try {
      const app = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      if (!app) {
        throw new Error('Application not found');
      }

      const currentCount = app.analytics[metric] || 0;
      await this.updateDocument(this.COLLECTION_NAME, id, {
        analytics: {
          ...app.analytics,
          [metric]: currentCount + 1,
        },
      });
    } catch (error) {
      this.handleError(error, 'incrementAnalytics');
    }
  }

  // Get application categories
  async getCategories(): Promise<string[]> {
    try {
      // In production, you might want to cache this or store in a separate collection
      const apps = await this.queryDocuments<Application>(this.COLLECTION_NAME, [
        where('isPublic', '==', true),
      ]);
      
      const categories = new Set<string>();
      apps.forEach(app => categories.add(app.category));
      
      return Array.from(categories).sort();
    } catch (error) {
      this.handleError(error, 'getCategories');
    }
  }

  // Get popular tags
  async getPopularTags(limit = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      const apps = await this.queryDocuments<Application>(this.COLLECTION_NAME, [
        where('isPublic', '==', true),
      ]);
      
      const tagCounts = new Map<string, number>();
      apps.forEach(app => {
        app.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      
      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      this.handleError(error, 'getPopularTags');
    }
  }

  // Clone application (create a copy)
  async cloneApplication(id: string, newName?: string): Promise<Application> {
    try {
      const originalApp = await this.getDocument<Application>(this.COLLECTION_NAME, id);
      if (!originalApp) {
        throw new Error('Application not found');
      }
      
      if (!originalApp.isPublic && originalApp.createdBy !== this.getCurrentUserId()) {
        throw new Error('Cannot clone private application');
      }

      const cloneData: CreateApplicationData = {
        name: newName || `${originalApp.name} (Copy)`,
        description: originalApp.description,
        category: originalApp.category,
        framework: originalApp.framework,
        isPublic: false, // Clones are private by default
        tags: [...originalApp.tags],
        generationSettings: { ...originalApp.generationSettings },
      };

      const clonedApp = await this.createApplication(cloneData);
      
      // Increment fork count on original
      await this.incrementAnalytics(id, 'forks');
      
      return clonedApp;
    } catch (error) {
      this.handleError(error, 'cloneApplication');
    }
  }
}