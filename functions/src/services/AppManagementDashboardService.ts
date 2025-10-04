import { BaseService } from './BaseService';
import { AnalyticsService, AnalyticsEventType } from './AnalyticsService';
import { Application } from './AppManagementService';

/**
 * Dashboard metrics and insights
 */
export interface DashboardMetrics {
  totalApps: number;
  publicApps: number;
  privateApps: number;
  totalStars: number;
  totalViews: number;
  recentActivity: {
    appsCreatedToday: number;
    appsCreatedThisWeek: number;
    appsCreatedThisMonth: number;
  };
  topApps: {
    mostStarred: Application[];
    mostViewed: Application[];
    recentlyCreated: Application[];
  };
  engagement: {
    averageStarsPerApp: number;
    averageViewsPerApp: number;
    popularityTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

/**
 * Bulk operation types
 */
export type BulkOperationType = 
  | 'delete'
  | 'make_public'
  | 'make_private'
  | 'make_unlisted'
  | 'archive'
  | 'unarchive';

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    appId: string;
    error: string;
  }>;
}

/**
 * App search and filtering options
 */
export interface AppSearchOptions {
  searchTerm?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  framework?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * App Management Dashboard Service
 * Provides comprehensive app management, analytics, and bulk operations
 */
export class AppManagementDashboardService extends BaseService {
  private analyticsService: AnalyticsService;

  constructor() {
    super();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get comprehensive dashboard metrics for a user
   */
  async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      this.logger.info('Generating dashboard metrics for user:', userId);

      // Get user's apps using Firebase Admin SDK
      const appsSnapshot = await this.db.collection('applications')
        .where('createdBy', '==', userId)
        .get();

      const userApps: Application[] = appsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));

      // Calculate basic metrics
      const totalApps = userApps.length;
      const publicApps = userApps.filter(app => app.isPublic).length;
      const privateApps = totalApps - publicApps;
      const totalStars = userApps.reduce((sum, app) => sum + (app.analytics?.likes || 0), 0);
      const totalViews = userApps.reduce((sum, app) => sum + (app.analytics?.views || 0), 0);

      // Calculate recent activity
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const appsCreatedToday = userApps.filter(app => 
        app.createdAt && new Date(app.createdAt) >= today
      ).length;

      const appsCreatedThisWeek = userApps.filter(app => 
        app.createdAt && new Date(app.createdAt) >= weekAgo
      ).length;

      const appsCreatedThisMonth = userApps.filter(app => 
        app.createdAt && new Date(app.createdAt) >= monthAgo
      ).length;

      // Get top apps
      const mostStarred = [...userApps]
        .sort((a, b) => (b.analytics?.likes || 0) - (a.analytics?.likes || 0))
        .slice(0, 5);

      const mostViewed = [...userApps]
        .sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0))
        .slice(0, 5);

      const recentlyCreated = [...userApps]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      // Calculate engagement metrics
      const averageStarsPerApp = totalApps > 0 ? totalStars / totalApps : 0;
      const averageViewsPerApp = totalApps > 0 ? totalViews / totalApps : 0;

      // Determine popularity trend (simplified)
      const recentAppsAvgStars = recentlyCreated.slice(0, 3)
        .reduce((sum, app) => sum + (app.analytics?.likes || 0), 0) / Math.max(3, 1);
      const olderAppsAvgStars = userApps.slice(-3)
        .reduce((sum, app) => sum + (app.analytics?.likes || 0), 0) / Math.max(3, 1);
      
      let popularityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAppsAvgStars > olderAppsAvgStars * 1.2) {
        popularityTrend = 'increasing';
      } else if (recentAppsAvgStars < olderAppsAvgStars * 0.8) {
        popularityTrend = 'decreasing';
      }

      const metrics: DashboardMetrics = {
        totalApps,
        publicApps,
        privateApps,
        totalStars,
        totalViews,
        recentActivity: {
          appsCreatedToday,
          appsCreatedThisWeek,
          appsCreatedThisMonth,
        },
        topApps: {
          mostStarred,
          mostViewed,
          recentlyCreated,
        },
        engagement: {
          averageStarsPerApp,
          averageViewsPerApp,
          popularityTrend,
        },
      };

      this.logger.info('Dashboard metrics generated successfully');
      return metrics;
    } catch (error) {
      this.logger.error('Error generating dashboard metrics:', error);
      throw new Error('Failed to generate dashboard metrics');
    }
  }

  /**
   * Advanced app search with filtering and sorting
   */
  async searchApps(userId: string, options: AppSearchOptions = {}): Promise<{
    apps: Application[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      this.logger.info('Searching apps with options:', options);

      // Build query with Firebase Admin SDK
      let query = this.db.collection('applications')
        .where('createdBy', '==', userId);

      // Apply visibility filter
      if (options.visibility) {
        const isPublic = options.visibility === 'public';
        query = query.where('isPublic', '==', isPublic);
      }

      // Apply category filter
      if (options.category) {
        query = query.where('category', '==', options.category);
      }

      // Apply framework filter
      if (options.framework) {
        query = query.where('framework', '==', options.framework);
      }

      // Get all matching apps
      const allAppsSnapshot = await query.get();
      let allApps = allAppsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));

      // Apply client-side filters
      if (options.searchTerm) {
        const searchLower = options.searchTerm.toLowerCase();
        allApps = allApps.filter(app => 
          app.name.toLowerCase().includes(searchLower) ||
          app.description?.toLowerCase().includes(searchLower) ||
          app.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (options.tags && options.tags.length > 0) {
        allApps = allApps.filter(app => 
          app.tags && options.tags!.some(tag => app.tags!.includes(tag))
        );
      }

      // Apply sorting
      const sortField = options.sortBy || 'createdAt';
      const sortDirection = options.sortOrder || 'desc';
      
      allApps.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'views':
            aValue = a.analytics?.views || 0;
            bValue = b.analytics?.views || 0;
            break;
          case 'likes':
            aValue = a.analytics?.likes || 0;
            bValue = b.analytics?.likes || 0;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'createdAt':
          case 'updatedAt':
          default:
            aValue = a[sortField] ? new Date(a[sortField]).getTime() : 0;
            bValue = b[sortField] ? new Date(b[sortField]).getTime() : 0;
            break;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      const totalCount = allApps.length;

      // Apply pagination
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      const paginatedApps = allApps.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      this.logger.info(`Found ${totalCount} apps, returning ${paginatedApps.length}`);

      return {
        apps: paginatedApps,
        totalCount,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Error searching apps:', error);
      throw new Error('Failed to search apps');
    }
  }

  /**
   * Perform bulk operations on multiple apps
   */
  async performBulkOperation(
    userId: string,
    appIds: string[],
    operation: BulkOperationType
  ): Promise<BulkOperationResult> {
    try {
      this.logger.info(`Performing bulk ${operation} on ${appIds.length} apps`);

      const batch = this.db.batch();
      const errors: Array<{ appId: string; error: string }> = [];
      let processedCount = 0;

      for (const appId of appIds) {
        try {
          const appRef = this.db.collection('applications').doc(appId);
          const appDoc = await appRef.get();

          if (!appDoc.exists) {
            errors.push({ appId, error: 'App not found' });
            continue;
          }

          const appData = appDoc.data() as Application;

          // Verify ownership
          if (appData.createdBy !== userId) {
            errors.push({ appId, error: 'Access denied' });
            continue;
          }

          // Apply operation
          switch (operation) {
            case 'delete':
              batch.delete(appRef);
              break;

            case 'make_public':
              batch.update(appRef, { 
                isPublic: true,
                updatedAt: new Date()
              });
              break;

            case 'make_private':
              batch.update(appRef, { 
                isPublic: false,
                updatedAt: new Date()
              });
              break;

            case 'archive':
              batch.update(appRef, { 
                archived: true,
                archivedAt: new Date(),
                updatedAt: new Date()
              });
              break;

            case 'unarchive':
              batch.update(appRef, { 
                archived: false,
                archivedAt: null,
                updatedAt: new Date()
              });
              break;

            default:
              errors.push({ appId, error: `Unsupported operation: ${operation}` });
              continue;
          }

          processedCount++;
        } catch (error) {
          this.logger.error(`Error processing app ${appId}:`, error);
          errors.push({ appId, error: 'Processing failed' });
        }
      }

      // Commit batch operations
      if (processedCount > 0) {
        await batch.commit();
        
        // Track analytics
        await this.analyticsService.trackEvent({
          userId,
          eventType: 'app_updated',
          eventData: {
            operation,
            processedCount,
            failedCount: errors.length,
            totalApps: appIds.length,
          },
          metadata: {},
        });
      }

      const result: BulkOperationResult = {
        success: errors.length === 0,
        processedCount,
        failedCount: errors.length,
        errors,
      };

      this.logger.info('Bulk operation completed:', result);
      return result;
    } catch (error) {
      this.logger.error('Error performing bulk operation:', error);
      throw new Error('Failed to perform bulk operation');
    }
  }

  /**
   * Export dashboard data for external analysis
   */
  async exportDashboardData(userId: string, format: 'json' | 'csv' = 'json'): Promise<{
    data: any;
    filename: string;
    mimeType: string;
  }> {
    try {
      this.logger.info(`Exporting dashboard data for user ${userId} in ${format} format`);

      const [metrics, searchResult] = await Promise.all([
        this.getDashboardMetrics(userId),
        this.searchApps(userId, { pageSize: 1000 }), // Get all apps
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId,
        metrics,
        apps: searchResult.apps,
        summary: {
          totalApps: searchResult.totalCount,
          totalStars: metrics.totalStars,
          totalViews: metrics.totalViews,
        },
      };

      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        return {
          data: JSON.stringify(exportData, null, 2),
          filename: `dashboard-export-${timestamp}.json`,
          mimeType: 'application/json',
        };
      } else {
        // Convert to CSV format
        const csvHeaders = [
          'App ID', 'Name', 'Description', 'Framework', 'Public', 
          'Views', 'Likes', 'Created At', 'Updated At'
        ];
        
        const csvRows = searchResult.apps.map(app => [
          app.id,
          app.name,
          app.description || '',
          app.framework || '',
          app.isPublic ? 'Yes' : 'No',
          app.analytics?.views || 0,
          app.analytics?.likes || 0,
          app.createdAt ? new Date(app.createdAt).toISOString() : '',
          app.updatedAt ? new Date(app.updatedAt).toISOString() : '',
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(','))
        ].join('\n');

        return {
          data: csvContent,
          filename: `dashboard-export-${timestamp}.csv`,
          mimeType: 'text/csv',
        };
      }
    } catch (error) {
      this.logger.error('Error exporting dashboard data:', error);
      throw new Error('Failed to export dashboard data');
    }
  }
}