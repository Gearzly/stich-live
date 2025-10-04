/**
 * Analytics API
 * Handles usage tracking, metrics, and analytics
 */

import { Hono } from 'hono';
import { logger } from 'firebase-functions';
import { db } from '../config';
import { authMiddleware, AuthUser } from '../middleware/hono-auth';
import { corsMiddleware } from '../middleware/hono-cors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

interface AnalyticsContext {
  Variables: {
    user: AuthUser;
  };
}

export const createAnalyticsApp = () => {
  const app = new Hono<AnalyticsContext>();
  
  // Apply middleware
  app.use('*', corsMiddleware);

  /**
   * Health check endpoint
   */
  app.get('/health', (c) => {
    return c.json({ 
      success: true, 
      service: 'analytics', 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /user-stats
   * Get user analytics and statistics
   */
  app.get('/user-stats', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      
      // Get user's applications count
      const appsSnapshot = await db.collection('applications')
        .where('createdBy', '==', user.uid)
        .get();

      // Get user's generations count
      const generationsSnapshot = await db.collection('generations')
        .where('userId', '==', user.uid)
        .get();

      // Get user's files count
      const filesSnapshot = await db.collection('files')
        .where('uploadedBy', '==', user.uid)
        .get();

      // Calculate statistics
      const stats = {
        applications: {
          total: appsSnapshot.docs.length,
          byStatus: {} as Record<string, number>,
          byFramework: {} as Record<string, number>,
        },
        generations: {
          total: generationsSnapshot.docs.length,
          successful: 0,
          failed: 0,
        },
        files: {
          total: filesSnapshot.docs.length,
          totalSize: 0,
        },
        account: {
          createdAt: user.email ? new Date() : null, // Placeholder
          lastActive: new Date(),
        }
      };

      // Analyze applications
      appsSnapshot.docs.forEach(doc => {
        const app = doc.data();
        const status = app.status || 'unknown';
        const framework = app.framework || 'unknown';
        
        stats.applications.byStatus[status] = (stats.applications.byStatus[status] || 0) + 1;
        stats.applications.byFramework[framework] = (stats.applications.byFramework[framework] || 0) + 1;
      });

      // Analyze generations
      generationsSnapshot.docs.forEach(doc => {
        const generation = doc.data();
        if (generation.status === 'completed') {
          stats.generations.successful++;
        } else if (generation.status === 'failed') {
          stats.generations.failed++;
        }
      });

      // Analyze files
      filesSnapshot.docs.forEach(doc => {
        const file = doc.data();
        stats.files.totalSize += file.size || 0;
      });

      return c.json(createSuccessResponse(stats));
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      return c.json(createErrorResponse('STATS_ERROR', 'Failed to get user statistics'), 500);
    }
  });

  /**
   * POST /track-event
   * Track analytics events
   */
  app.post('/track-event', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const { event, properties = {}, timestamp = new Date() } = body;
      
      if (!event) {
        return c.json(createErrorResponse('VALIDATION_ERROR', 'Event name is required'), 400);
      }

      // Store analytics event
      const eventDoc = {
        userId: user.uid,
        event,
        properties,
        timestamp: new Date(timestamp),
        userAgent: c.req.header('user-agent') || '',
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
      };

      await db.collection('analytics_events').add(eventDoc);

      return c.json(createSuccessResponse({ message: 'Event tracked successfully' }));
    } catch (error) {
      logger.error('Failed to track event:', error);
      return c.json(createErrorResponse('TRACKING_ERROR', 'Failed to track event'), 500);
    }
  });

  /**
   * GET /usage-metrics
   * Get detailed usage metrics
   */
  app.get('/usage-metrics', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const query = c.req.query();
      
      const timeRange = query.timeRange || '30d'; // 7d, 30d, 90d, 1y
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on time range
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get analytics events for the time range
      const eventsSnapshot = await db.collection('analytics_events')
        .where('userId', '==', user.uid)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .get();

      const events = eventsSnapshot.docs.map(doc => doc.data());

      // Aggregate metrics
      const metrics = {
        totalEvents: events.length,
        eventTypes: {} as Record<string, number>,
        dailyActivity: {} as Record<string, number>,
        topEvents: [] as Array<{ event: string; count: number }>,
      };

      // Count events by type
      events.forEach(event => {
        const eventName = event.event;
        metrics.eventTypes[eventName] = (metrics.eventTypes[eventName] || 0) + 1;

        // Daily activity
        const dateKey = event.timestamp.toDate().toISOString().split('T')[0];
        metrics.dailyActivity[dateKey] = (metrics.dailyActivity[dateKey] || 0) + 1;
      });

      // Get top events
      metrics.topEvents = Object.entries(metrics.eventTypes)
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return c.json(createSuccessResponse(metrics));
    } catch (error) {
      logger.error('Failed to get usage metrics:', error);
      return c.json(createErrorResponse('METRICS_ERROR', 'Failed to get usage metrics'), 500);
    }
  });

  return app;
};