import { Hono } from 'hono';
import { Context } from 'hono';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { AppManagementDashboardService } from '../services/AppManagementDashboardService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from 'firebase-functions';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const searchAppsSchema = z.object({
  searchTerm: z.string().optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  category: z.string().optional(),
  framework: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'views', 'likes', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

const bulkOperationSchema = z.object({
  appIds: z.array(z.string()).min(1).max(50),
  operation: z.enum(['delete', 'make_public', 'make_private', 'make_unlisted', 'archive', 'unarchive']),
});

/**
 * GET /dashboard/metrics
 * Get comprehensive dashboard metrics
 */
app.get('/metrics', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const dashboardService = new AppManagementDashboardService();
    
    const metrics = await dashboardService.getDashboardMetrics(user.uid);

    return c.json(createSuccessResponse({
      metrics,
      generatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Dashboard metrics error:', error);
    return c.json(createErrorResponse('DASHBOARD_ERROR', 'Failed to get dashboard metrics'), 500);
  }
});

/**
 * POST /dashboard/search
 * Advanced app search with filtering and sorting
 */
app.post('/search', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = searchAppsSchema.parse(body);
    const dashboardService = new AppManagementDashboardService();
    
    const results = await dashboardService.searchApps(user.uid, validatedData);

    return c.json(createSuccessResponse({
      apps: results.apps,
      pagination: {
        totalCount: results.totalCount,
        hasMore: results.hasMore,
        page: validatedData.page || 1,
        pageSize: validatedData.pageSize || 20,
      },
      searchCriteria: validatedData,
    }));
  } catch (error) {
    logger.error('Dashboard search error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid search criteria'), 400);
    }
    
    return c.json(createErrorResponse('DASHBOARD_ERROR', 'Failed to search apps'), 500);
  }
});

/**
 * POST /dashboard/bulk-operation
 * Perform bulk operations on multiple apps
 */
app.post('/bulk-operation', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = bulkOperationSchema.parse(body);
    const dashboardService = new AppManagementDashboardService();
    
    const result = await dashboardService.performBulkOperation(
      user.uid,
      validatedData.appIds,
      validatedData.operation
    );

    return c.json(createSuccessResponse({
      operation: validatedData.operation,
      result,
      summary: {
        total: validatedData.appIds.length,
        successful: result.processedCount,
        failed: result.failedCount,
      },
    }));
  } catch (error) {
    logger.error('Dashboard bulk operation error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid bulk operation data'), 400);
    }
    
    return c.json(createErrorResponse('DASHBOARD_ERROR', 'Failed to perform bulk operation'), 500);
  }
});

/**
 * GET /dashboard/export
 * Export dashboard data
 */
app.get('/export', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const format = c.req.query('format') as 'json' | 'csv' || 'json';
    
    if (!['json', 'csv'].includes(format)) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid export format. Use json or csv'), 400);
    }

    const dashboardService = new AppManagementDashboardService();
    const exportData = await dashboardService.exportDashboardData(user.uid, format);

    return c.json(createSuccessResponse({
      filename: exportData.filename,
      mimeType: exportData.mimeType,
      data: exportData.data,
      exportedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Dashboard export error:', error);
    return c.json(createErrorResponse('DASHBOARD_ERROR', 'Failed to export dashboard data'), 500);
  }
});

export default app;
