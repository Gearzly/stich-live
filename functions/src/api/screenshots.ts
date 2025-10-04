import { Hono } from 'hono';
import { Context } from 'hono';
import { z } from 'zod';
import { ScreenshotSystemService, type ScreenshotConfig } from '../services/ScreenshotSystemService';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

const app = new Hono();

// Validation schemas
const createJobSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  targetUrl: z.string().url('Valid URL is required'),
  configs: z.array(z.object({
    width: z.number().min(100).max(4000),
    height: z.number().min(100).max(4000),
    deviceScaleFactor: z.number().min(0.5).max(3),
    fullPage: z.boolean(),
    format: z.enum(['png', 'jpeg', 'webp']),
    quality: z.number().min(10).max(100).optional(),
    delay: z.number().min(0).max(30000).optional(),
    waitForSelector: z.string().optional(),
    hideElements: z.array(z.string()).optional(),
    viewport: z.object({
      width: z.number().min(100).max(4000),
      height: z.number().min(100).max(4000),
      isMobile: z.boolean().optional(),
      deviceScaleFactor: z.number().min(0.5).max(3).optional(),
    }).optional(),
  })).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

const createGallerySchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  name: z.string().min(1, 'Gallery name is required').max(100),
  description: z.string().max(500).optional(),
  screenshots: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

const updateGallerySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  screenshots: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  order: z.number().min(0).optional(),
});

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
  pageSize: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
  appId: z.string().optional(),
});

const screenshotService = new ScreenshotSystemService();

// Create screenshot job
app.post('/', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = createJobSchema.parse(body);

    const job = await screenshotService.createScreenshotJob(user.uid, validatedData as {
      appId: string;
      targetUrl: string;
      configs?: ScreenshotConfig[];
      priority?: 'low' | 'normal' | 'high';
    });

    // Start processing the job asynchronously
    // In a real implementation, this would be handled by a queue system
    screenshotService.processScreenshotJob(job.id).catch(error => {
      console.error('Failed to process screenshot job:', error);
    });

    return c.json(createSuccessResponse(job), 201);
  } catch (error) {
    console.error('Failed to create screenshot job:', error);
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error.errors), 400);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to create screenshot job'), 500);
  }
});

// Get job status
app.get('/jobs/:jobId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const jobId = c.req.param('jobId');

    const job = await screenshotService.getJobStatus(user.uid, jobId);

    if (!job) {
      return c.json(createErrorResponse('NOT_FOUND', 'Screenshot job not found'), 404);
    }

    return c.json(createSuccessResponse(job));
  } catch (error) {
    console.error('Failed to get job status:', error);
    if (error.message === 'Access denied') {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to get job status'), 500);
  }
});

// Get user's screenshot jobs
app.get('/jobs', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const validatedQuery = paginationSchema.parse(query);

    const result = await screenshotService.getUserJobs(user.uid, validatedQuery);

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Failed to get user jobs:', error);
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters', error.errors), 400);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to get screenshot jobs'), 500);
  }
});

// Get app screenshots
app.get('/apps/:appId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const appId = c.req.param('appId');
    const type = c.req.query('type') as 'primary' | 'thumbnail' | 'gallery' | 'mobile' | 'desktop' | undefined;

    const screenshots = await screenshotService.getAppScreenshots(user.uid, appId, type);

    return c.json(createSuccessResponse(screenshots));
  } catch (error) {
    console.error('Failed to get app screenshots:', error);
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to get app screenshots'), 500);
  }
});

// Get specific screenshot
app.get('/:screenshotId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const screenshotId = c.req.param('screenshotId');

    const screenshot = await screenshotService.getScreenshot(user.uid, screenshotId);

    if (!screenshot) {
      return c.json(createErrorResponse('NOT_FOUND', 'Screenshot not found'), 404);
    }

    return c.json(createSuccessResponse(screenshot));
  } catch (error) {
    console.error('Failed to get screenshot:', error);
    if (error.message === 'Access denied') {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to get screenshot'), 500);
  }
});

// Delete screenshot
app.delete('/:screenshotId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const screenshotId = c.req.param('screenshotId');

    await screenshotService.deleteScreenshot(user.uid, screenshotId);

    return c.json(createSuccessResponse({ message: 'Screenshot deleted successfully' }));
  } catch (error) {
    console.error('Failed to delete screenshot:', error);
    if (error.message === 'Screenshot not found') {
      return c.json(createErrorResponse('NOT_FOUND', 'Screenshot not found'), 404);
    }
    if (error.message === 'Access denied') {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to delete screenshot'), 500);
  }
});

// Gallery Management Routes

// Create gallery
app.post('/galleries', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validatedData = createGallerySchema.parse(body);

    const gallery = await screenshotService.createGallery(user.uid, validatedData as {
      appId: string;
      name: string;
      description?: string;
      screenshots?: string[];
      isDefault?: boolean;
      isPublic?: boolean;
    });

    return c.json(createSuccessResponse(gallery), 201);
  } catch (error) {
    console.error('Failed to create gallery:', error);
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error.errors), 400);
    }
    return c.json(createErrorResponse('GALLERY_ERROR', 'Failed to create gallery'), 500);
  }
});

// Get app galleries
app.get('/galleries/apps/:appId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const appId = c.req.param('appId');

    const galleries = await screenshotService.getAppGalleries(user.uid, appId);

    return c.json(createSuccessResponse(galleries));
  } catch (error) {
    console.error('Failed to get app galleries:', error);
    return c.json(createErrorResponse('GALLERY_ERROR', 'Failed to get app galleries'), 500);
  }
});

// Update gallery
app.put('/galleries/:galleryId', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const galleryId = c.req.param('galleryId');
    const body = await c.req.json();
    const validatedData = updateGallerySchema.parse(body);

    const gallery = await screenshotService.updateGallery(user.uid, galleryId, validatedData);

    return c.json(createSuccessResponse(gallery));
  } catch (error) {
    console.error('Failed to update gallery:', error);
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid request data', error.errors), 400);
    }
    if (error.message === 'Gallery not found') {
      return c.json(createErrorResponse('NOT_FOUND', 'Gallery not found'), 404);
    }
    if (error.message === 'Access denied') {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    return c.json(createErrorResponse('GALLERY_ERROR', 'Failed to update gallery'), 500);
  }
});

// Trigger screenshot processing manually (useful for re-processing failed jobs)
app.post('/jobs/:jobId/process', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const jobId = c.req.param('jobId');

    // Verify job ownership first
    const job = await screenshotService.getJobStatus(user.uid, jobId);
    if (!job) {
      return c.json(createErrorResponse('NOT_FOUND', 'Screenshot job not found'), 404);
    }

    if (job.status === 'processing') {
      return c.json(createErrorResponse('INVALID_STATUS', 'Job is already being processed'), 400);
    }

    if (job.status === 'completed') {
      return c.json(createErrorResponse('INVALID_STATUS', 'Job is already completed'), 400);
    }

    // Start processing
    screenshotService.processScreenshotJob(jobId).catch(error => {
      console.error('Failed to process screenshot job:', error);
    });

    return c.json(createSuccessResponse({ 
      message: 'Screenshot job processing started',
      jobId: jobId 
    }));
  } catch (error) {
    console.error('Failed to trigger job processing:', error);
    if (error.message === 'Access denied') {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    return c.json(createErrorResponse('SCREENSHOT_ERROR', 'Failed to trigger job processing'), 500);
  }
});

// Get screenshot optimization settings (future enhancement)
app.get('/settings/optimization', honoAuthMiddleware, async (c: Context) => {
  try {
    // Return default optimization settings
    const settings = {
      enableWebP: true,
      quality: {
        jpeg: 85,
        webp: 80,
      },
      sizes: [
        { name: 'thumbnail', width: 300, height: 200, suffix: '_thumb' },
        { name: 'small', width: 600, height: 400, suffix: '_small' },
        { name: 'medium', width: 1200, height: 800, suffix: '_medium' },
        { name: 'large', width: 1920, height: 1080, suffix: '_large' },
      ],
      enableProgressiveJPEG: true,
      stripMetadata: true,
    };

    return c.json(createSuccessResponse(settings));
  } catch (error) {
    console.error('Failed to get optimization settings:', error);
    return c.json(createErrorResponse('SETTINGS_ERROR', 'Failed to get optimization settings'), 500);
  }
});

// Get screenshot statistics for an app
app.get('/apps/:appId/stats', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const appId = c.req.param('appId');

    const screenshots = await screenshotService.getAppScreenshots(user.uid, appId);
    
    const stats = {
      totalScreenshots: screenshots.length,
      byType: {
        primary: screenshots.filter(s => s.type === 'primary').length,
        thumbnail: screenshots.filter(s => s.type === 'thumbnail').length,
        gallery: screenshots.filter(s => s.type === 'gallery').length,
        mobile: screenshots.filter(s => s.type === 'mobile').length,
        desktop: screenshots.filter(s => s.type === 'desktop').length,
      },
      byFormat: {
        png: screenshots.filter(s => s.format === 'png').length,
        jpeg: screenshots.filter(s => s.format === 'jpeg').length,
        webp: screenshots.filter(s => s.format === 'webp').length,
      },
      totalSize: screenshots.reduce((total, s) => total + s.size, 0),
      optimized: screenshots.filter(s => s.metadata.optimized).length,
      withThumbnails: screenshots.filter(s => s.metadata.thumbnailGenerated).length,
      latestScreenshot: screenshots[0]?.createdAt || null,
    };

    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error('Failed to get screenshot stats:', error);
    return c.json(createErrorResponse('STATS_ERROR', 'Failed to get screenshot statistics'), 500);
  }
});

export default app;