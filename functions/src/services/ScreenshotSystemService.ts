import { BaseService } from './BaseService';
import { AnalyticsService } from './AnalyticsService';

/**
 * Screenshot configuration options
 */
export interface ScreenshotConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  fullPage: boolean;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number; // Only for jpeg and webp
  delay?: number; // Wait time before screenshot in milliseconds
  waitForSelector?: string; // Wait for specific element
  hideElements?: string[]; // CSS selectors to hide
  viewport?: {
    width: number;
    height: number;
    isMobile?: boolean;
    deviceScaleFactor?: number;
  };
}

/**
 * Screenshot metadata
 */
export interface Screenshot {
  id: string;
  appId: string;
  userId: string;
  type: 'primary' | 'thumbnail' | 'gallery' | 'mobile' | 'desktop';
  url: string;
  fileName: string;
  filePath: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  format: string;
  config: ScreenshotConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    originalUrl?: string;
    captureTime?: number;
    optimized?: boolean;
    thumbnailGenerated?: boolean;
    cdnUrl?: string;
  };
}

/**
 * Screenshot generation job
 */
export interface ScreenshotJob {
  id: string;
  appId: string;
  userId: string;
  targetUrl: string;
  configs: ScreenshotConfig[];
  priority: 'low' | 'normal' | 'high';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  screenshots: string[]; // Screenshot IDs
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Gallery management
 */
export interface Gallery {
  id: string;
  appId: string;
  userId: string;
  name: string;
  description?: string;
  screenshots: string[]; // Screenshot IDs
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Screenshot optimization settings
 */
export interface OptimizationSettings {
  enableWebP: boolean;
  quality: {
    jpeg: number;
    webp: number;
  };
  sizes: Array<{
    name: string;
    width: number;
    height?: number;
    suffix: string;
  }>;
  enableProgressiveJPEG: boolean;
  stripMetadata: boolean;
}

/**
 * Screenshot System Service
 * Handles automated screenshot generation, optimization, and gallery management
 */
export class ScreenshotSystemService extends BaseService {
  private analyticsService: AnalyticsService;

  constructor() {
    super();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Create a screenshot generation job
   */
  async createScreenshotJob(userId: string, jobData: {
    appId: string;
    targetUrl: string;
    configs?: ScreenshotConfig[];
    priority?: 'low' | 'normal' | 'high';
  }): Promise<ScreenshotJob> {
    try {
      this.logger.info('Creating screenshot job', { 
        userId, 
        appId: jobData.appId, 
        targetUrl: jobData.targetUrl 
      });

      const jobId = this.generateId();
      const defaultConfigs = this.getDefaultScreenshotConfigs();
      
      const job: ScreenshotJob = {
        id: jobId,
        appId: jobData.appId,
        userId,
        targetUrl: jobData.targetUrl,
        configs: jobData.configs || defaultConfigs,
        priority: jobData.priority || 'normal',
        status: 'queued',
        progress: 0,
        screenshots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('screenshot_jobs').doc(jobId).set(job);

      // Track analytics
      await this.analyticsService.trackEvent({
        userId,
        eventType: 'app_created', // We'll need screenshot_job_created
        eventData: {
          appId: jobData.appId,
          jobId,
          configCount: job.configs.length,
        },
        metadata: {},
      });

      this.logger.info('Screenshot job created successfully', { jobId, userId });
      return job;
    } catch (error) {
      this.logger.error('Failed to create screenshot job:', error);
      throw new Error('Failed to create screenshot job');
    }
  }

  /**
   * Process a screenshot job
   */
  async processScreenshotJob(jobId: string): Promise<ScreenshotJob> {
    try {
      this.logger.info('Processing screenshot job', { jobId });

      const jobDoc = await this.db.collection('screenshot_jobs').doc(jobId).get();
      if (!jobDoc.exists) {
        throw new Error('Screenshot job not found');
      }

      const job = jobDoc.data() as ScreenshotJob;
      
      // Update job status to processing
      await this.updateJobStatus(jobId, 'processing', 0);

      const screenshots: string[] = [];
      const totalConfigs = job.configs.length;

      for (let i = 0; i < job.configs.length; i++) {
        const config = job.configs[i];
        
        try {
          this.logger.info('Capturing screenshot', { jobId, configIndex: i });
          
          const screenshot = await this.captureScreenshot(
            job.userId,
            job.appId,
            job.targetUrl,
            config,
            this.getScreenshotType(config)
          );
          
          screenshots.push(screenshot.id);
          
          // Update progress
          const progress = Math.round(((i + 1) / totalConfigs) * 100);
          await this.updateJobProgress(jobId, progress);
          
        } catch (error) {
          this.logger.error('Failed to capture screenshot:', error);
          // Continue with other screenshots even if one fails
        }
      }

      // Update job as completed
      const updatedJob = await this.completeJob(jobId, screenshots);
      
      // Generate thumbnails and optimize images
      await this.postProcessScreenshots(screenshots);

      this.logger.info('Screenshot job completed successfully', { jobId, screenshotCount: screenshots.length });
      return updatedJob;
    } catch (error) {
      this.logger.error('Failed to process screenshot job:', error);
      await this.updateJobStatus(jobId, 'failed', 100, error.message);
      throw new Error('Failed to process screenshot job');
    }
  }

  /**
   * Capture a single screenshot
   */
  private async captureScreenshot(
    userId: string,
    appId: string,
    targetUrl: string,
    config: ScreenshotConfig,
    type: Screenshot['type']
  ): Promise<Screenshot> {
    try {
      const screenshotId = this.generateId();
      const fileName = `${appId}_${type}_${Date.now()}.${config.format}`;
      const filePath = `screenshots/${userId}/${appId}/${fileName}`;

      // For this implementation, we'll simulate screenshot capture
      // In a real implementation, you would use a service like Puppeteer, Playwright, or a cloud service
      const mockScreenshotData = await this.simulateScreenshotCapture(targetUrl, config);

      const screenshot: Screenshot = {
        id: screenshotId,
        appId,
        userId,
        type,
        url: mockScreenshotData.url,
        fileName,
        filePath,
        size: mockScreenshotData.size,
        dimensions: {
          width: config.width,
          height: config.height,
        },
        format: config.format,
        config,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          originalUrl: targetUrl,
          captureTime: mockScreenshotData.captureTime,
          optimized: false,
          thumbnailGenerated: false,
        },
      };

      await this.db.collection('screenshots').doc(screenshotId).set(screenshot);

      this.logger.info('Screenshot captured successfully', { screenshotId, appId, type });
      return screenshot;
    } catch (error) {
      this.logger.error('Failed to capture screenshot:', error);
      throw new Error('Failed to capture screenshot');
    }
  }

  /**
   * Simulate screenshot capture (placeholder implementation)
   */
  private async simulateScreenshotCapture(url: string, config: ScreenshotConfig): Promise<{
    url: string;
    size: number;
    captureTime: number;
  }> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // In a real implementation, this would use Puppeteer or similar
    const simulatedSize = Math.floor(50000 + Math.random() * 200000); // 50KB - 250KB
    const captureTime = 1000 + Math.random() * 3000; // 1-4 seconds

    return {
      url: `https://cdn.example.com/screenshots/${Date.now()}.${config.format}`,
      size: simulatedSize,
      captureTime,
    };
  }

  /**
   * Get screenshot type based on configuration
   */
  private getScreenshotType(config: ScreenshotConfig): Screenshot['type'] {
    if (config.width <= 400) return 'thumbnail';
    if (config.viewport?.isMobile) return 'mobile';
    if (config.width >= 1920) return 'desktop';
    return 'primary';
  }

  /**
   * Get default screenshot configurations
   */
  private getDefaultScreenshotConfigs(): ScreenshotConfig[] {
    return [
      // Primary desktop screenshot
      {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        fullPage: false,
        format: 'png',
        delay: 2000,
        viewport: {
          width: 1920,
          height: 1080,
          isMobile: false,
        },
      },
      // Mobile screenshot
      {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        fullPage: false,
        format: 'png',
        delay: 2000,
        viewport: {
          width: 375,
          height: 812,
          isMobile: true,
          deviceScaleFactor: 2,
        },
      },
      // Thumbnail
      {
        width: 300,
        height: 200,
        deviceScaleFactor: 1,
        fullPage: false,
        format: 'jpeg',
        quality: 80,
        delay: 1000,
      },
      // Full page screenshot
      {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        fullPage: true,
        format: 'png',
        delay: 3000,
        viewport: {
          width: 1920,
          height: 1080,
          isMobile: false,
        },
      },
    ];
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string, 
    status: ScreenshotJob['status'], 
    progress: number,
    error?: string
  ): Promise<void> {
    const updateData: Partial<ScreenshotJob> = {
      status,
      progress,
      updatedAt: new Date(),
    };

    if (error) {
      updateData.error = error;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await this.db.collection('screenshot_jobs').doc(jobId).update(updateData);
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(jobId: string, progress: number): Promise<void> {
    await this.db.collection('screenshot_jobs').doc(jobId).update({
      progress,
      updatedAt: new Date(),
    });
  }

  /**
   * Complete a job
   */
  private async completeJob(jobId: string, screenshots: string[]): Promise<ScreenshotJob> {
    const updateData = {
      status: 'completed' as const,
      progress: 100,
      screenshots,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.collection('screenshot_jobs').doc(jobId).update(updateData);

    const jobDoc = await this.db.collection('screenshot_jobs').doc(jobId).get();
    return jobDoc.data() as ScreenshotJob;
  }

  /**
   * Post-process screenshots (optimization, thumbnails)
   */
  private async postProcessScreenshots(screenshotIds: string[]): Promise<void> {
    try {
      for (const screenshotId of screenshotIds) {
        // Simulate optimization process
        await this.optimizeScreenshot(screenshotId);
        await this.generateThumbnail(screenshotId);
      }
    } catch (error) {
      this.logger.error('Failed to post-process screenshots:', error);
      // Don't throw as this is non-critical
    }
  }

  /**
   * Optimize a screenshot
   */
  private async optimizeScreenshot(screenshotId: string): Promise<void> {
    try {
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 500));

      await this.db.collection('screenshots').doc(screenshotId).update({
        'metadata.optimized': true,
        updatedAt: new Date(),
      });

      this.logger.info('Screenshot optimized', { screenshotId });
    } catch (error) {
      this.logger.error('Failed to optimize screenshot:', error);
    }
  }

  /**
   * Generate thumbnail for a screenshot
   */
  private async generateThumbnail(screenshotId: string): Promise<void> {
    try {
      // Simulate thumbnail generation
      await new Promise(resolve => setTimeout(resolve, 300));

      await this.db.collection('screenshots').doc(screenshotId).update({
        'metadata.thumbnailGenerated': true,
        updatedAt: new Date(),
      });

      this.logger.info('Thumbnail generated', { screenshotId });
    } catch (error) {
      this.logger.error('Failed to generate thumbnail:', error);
    }
  }

  /**
   * Get screenshots for an app
   */
  async getAppScreenshots(userId: string, appId: string, type?: Screenshot['type']): Promise<Screenshot[]> {
    try {
      let query = this.db.collection('screenshots')
        .where('appId', '==', appId)
        .where('userId', '==', userId)
        .where('status', '==', 'completed');

      if (type) {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data() as Screenshot);
    } catch (error) {
      this.logger.error('Failed to get app screenshots:', error);
      throw new Error('Failed to get app screenshots');
    }
  }

  /**
   * Get a specific screenshot
   */
  async getScreenshot(userId: string, screenshotId: string): Promise<Screenshot | null> {
    try {
      const screenshotDoc = await this.db.collection('screenshots').doc(screenshotId).get();

      if (!screenshotDoc.exists) {
        return null;
      }

      const screenshot = screenshotDoc.data() as Screenshot;

      // Verify ownership
      if (screenshot.userId !== userId) {
        throw new Error('Access denied');
      }

      return screenshot;
    } catch (error) {
      this.logger.error('Failed to get screenshot:', error);
      throw new Error('Failed to get screenshot');
    }
  }

  /**
   * Delete a screenshot
   */
  async deleteScreenshot(userId: string, screenshotId: string): Promise<void> {
    try {
      const screenshot = await this.getScreenshot(userId, screenshotId);

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // In a real implementation, you would also delete the file from storage
      await this.db.collection('screenshots').doc(screenshotId).delete();

      this.logger.info('Screenshot deleted successfully', { screenshotId, userId });
    } catch (error) {
      this.logger.error('Failed to delete screenshot:', error);
      throw new Error('Failed to delete screenshot');
    }
  }

  /**
   * Create a gallery
   */
  async createGallery(userId: string, galleryData: {
    appId: string;
    name: string;
    description?: string;
    screenshots?: string[];
    isDefault?: boolean;
    isPublic?: boolean;
  }): Promise<Gallery> {
    try {
      const galleryId = this.generateId();
      
      // If this is set as default, unset other defaults for the app
      if (galleryData.isDefault) {
        await this.unsetDefaultGalleries(galleryData.appId);
      }

      const gallery: Gallery = {
        id: galleryId,
        appId: galleryData.appId,
        userId,
        name: galleryData.name,
        description: galleryData.description,
        screenshots: galleryData.screenshots || [],
        isDefault: galleryData.isDefault || false,
        isPublic: galleryData.isPublic || false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('galleries').doc(galleryId).set(gallery);

      this.logger.info('Gallery created successfully', { galleryId, userId, appId: galleryData.appId });
      return gallery;
    } catch (error) {
      this.logger.error('Failed to create gallery:', error);
      throw new Error('Failed to create gallery');
    }
  }

  /**
   * Get galleries for an app
   */
  async getAppGalleries(userId: string, appId: string): Promise<Gallery[]> {
    try {
      const snapshot = await this.db.collection('galleries')
        .where('appId', '==', appId)
        .where('userId', '==', userId)
        .orderBy('order', 'asc')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Gallery);
    } catch (error) {
      this.logger.error('Failed to get app galleries:', error);
      throw new Error('Failed to get app galleries');
    }
  }

  /**
   * Update a gallery
   */
  async updateGallery(userId: string, galleryId: string, updates: {
    name?: string;
    description?: string;
    screenshots?: string[];
    isDefault?: boolean;
    isPublic?: boolean;
    order?: number;
  }): Promise<Gallery> {
    try {
      const galleryDoc = await this.db.collection('galleries').doc(galleryId).get();

      if (!galleryDoc.exists) {
        throw new Error('Gallery not found');
      }

      const gallery = galleryDoc.data() as Gallery;

      // Verify ownership
      if (gallery.userId !== userId) {
        throw new Error('Access denied');
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await this.unsetDefaultGalleries(gallery.appId, galleryId);
      }

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await this.db.collection('galleries').doc(galleryId).update(updateData);

      const updatedGallery = { ...gallery, ...updateData };
      this.logger.info('Gallery updated successfully', { galleryId, userId });
      return updatedGallery;
    } catch (error) {
      this.logger.error('Failed to update gallery:', error);
      throw new Error('Failed to update gallery');
    }
  }

  /**
   * Unset default flag from other galleries
   */
  private async unsetDefaultGalleries(appId: string, excludeGalleryId?: string): Promise<void> {
    const snapshot = await this.db.collection('galleries')
      .where('appId', '==', appId)
      .where('isDefault', '==', true)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      if (!excludeGalleryId || doc.id !== excludeGalleryId) {
        batch.update(doc.ref, { isDefault: false, updatedAt: new Date() });
      }
    });

    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(userId: string, jobId: string): Promise<ScreenshotJob | null> {
    try {
      const jobDoc = await this.db.collection('screenshot_jobs').doc(jobId).get();

      if (!jobDoc.exists) {
        return null;
      }

      const job = jobDoc.data() as ScreenshotJob;

      // Verify ownership
      if (job.userId !== userId) {
        throw new Error('Access denied');
      }

      return job;
    } catch (error) {
      this.logger.error('Failed to get job status:', error);
      throw new Error('Failed to get job status');
    }
  }

  /**
   * Get user's screenshot jobs
   */
  async getUserJobs(userId: string, options: {
    status?: ScreenshotJob['status'];
    appId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    jobs: ScreenshotJob[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      let query = this.db.collection('screenshot_jobs')
        .where('userId', '==', userId);

      if (options.status) {
        query = query.where('status', '==', options.status);
      }

      if (options.appId) {
        query = query.where('appId', '==', options.appId);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      let jobs = snapshot.docs.map(doc => doc.data() as ScreenshotJob);

      const totalCount = jobs.length;

      // Apply pagination
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedJobs = jobs.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      return {
        jobs: paginatedJobs,
        totalCount,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to get user jobs:', error);
      throw new Error('Failed to get user jobs');
    }
  }
}