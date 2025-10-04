import { Hono } from 'hono';
import { Context } from 'hono';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { AnalyticsService } from '../services/AnalyticsService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from 'firebase-functions';
import { z } from 'zod';

const app = new Hono();

// Validation schema for tracking events
const trackEventSchema = z.object({
  eventType: z.enum([
    'app_created',
    'app_updated', 
    'app_deleted',
    'app_deployed',
    'app_viewed',
    'app_starred',
    'app_unstarred',
    'app_forked',
    'app_exported',
    'generation_started',
    'generation_completed',
    'generation_failed',
    'user_login',
    'user_logout',
    'github_connected',
    'github_disconnected',
    'realtime_session_started',
    'realtime_session_ended',
    'file_edited',
    'chat_message_sent',
  ] as const),
  eventData: z.record(z.any()).default({}),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    platform: z.string().optional(),
    sessionId: z.string().optional(),
    appId: z.string().optional(),
    generationId: z.string().optional(),
  }).default({}),
});

/**
 * POST /analytics/track
 * Track a user activity event
 */
app.post('/track', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = trackEventSchema.parse(body);

    const eventData = {
      userId: user.uid,
      eventType: validatedData.eventType,
      eventData: validatedData.eventData,
      metadata: {
        ...validatedData.metadata,
        userAgent: c.req.header('user-agent'),
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      },
    };

    const analyticsService = new AnalyticsService();
    await analyticsService.trackEvent(eventData);

    return c.json(createSuccessResponse({
      tracked: true,
      eventType: validatedData.eventType,
    }));
  } catch (error) {
    logger.error('Analytics tracking error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid event data'), 400);
    }
    
    return c.json(createErrorResponse('ANALYTICS_ERROR', 'Failed to track event'), 500);
  }
});

/**
 * GET /analytics/summary
 * Get user activity summary
 */
app.get('/summary', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const analyticsService = new AnalyticsService();
    
    const summary = await analyticsService.getUserActivitySummary(user.uid);

    if (!summary) {
      return c.json(createSuccessResponse({
        hasActivity: false,
        message: 'No activity data found',
      }));
    }

    return c.json(createSuccessResponse({
      hasActivity: true,
      summary,
    }));
  } catch (error) {
    logger.error('Analytics summary error:', error);
    return c.json(createErrorResponse('ANALYTICS_ERROR', 'Failed to get activity summary'), 500);
  }
});

/**
 * GET /analytics/dashboard
 * Get dashboard analytics data for user
 */
app.get('/dashboard', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const analyticsService = new AnalyticsService();

    const [summary, timeline, generationStats] = await Promise.all([
      analyticsService.getUserActivitySummary(user.uid),
      analyticsService.getUserActivityTimeline(user.uid, (() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      })(), new Date(), 20),
      analyticsService.getUserGenerationStats(user.uid),
    ]);

    return c.json(createSuccessResponse({
      summary,
      recentActivity: timeline,
      generationStats,
      dashboardGenerated: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Analytics dashboard error:', error);
    return c.json(createErrorResponse('ANALYTICS_ERROR', 'Failed to get dashboard data'), 500);
  }
});

export default app;
