/**
 * Applications API
 * Handles CRUD operations for generated applications
 */

import * as express from 'express';
import { logger } from 'firebase-functions';
import { db } from '../config';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { corsMiddleware, securityMiddleware, loggingMiddleware } from '../middleware/common';

export const createAppsApp = () => {
  const app = express();
  
  // Apply middleware
  app.use(corsMiddleware);
  app.use(securityMiddleware);
  app.use(loggingMiddleware);
  app.use(express.json({ limit: '50mb' }));

  /**
   * GET /apps
   * Get all applications for the authenticated user
   */
  app.get('/', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { limit = 20, offset = 0, status, search } = req.query;
      
      let query = db.collection('applications')
        .where('createdBy', '==', userId)
        .orderBy('createdAt', 'desc');
      
      // Add filters
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query
        .limit(Number(limit))
        .offset(Number(offset))
        .get();
      
      let apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Apply search filter if provided
      if (search) {
        const searchTerm = String(search).toLowerCase();
        apps = apps.filter((app: any) => 
          app.name?.toLowerCase().includes(searchTerm) ||
          app.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      res.json({
        success: true,
        data: {
          applications: apps,
          total: apps.length,
          hasMore: snapshot.docs.length === Number(limit)
        }
      });
      
    } catch (error) {
      logger.error('Error fetching applications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications'
      });
    }
  });

  /**
   * GET /apps/:id
   * Get a specific application by ID
   */
  app.get('/:id', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const doc = await db.collection('applications').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          success: false,
          error: 'Application not found'
        });
        return;
      }
      
      const app = { id: doc.id, ...doc.data() } as any;
      
      // Check ownership or public access
      if (app.createdBy !== userId && !app.isPublic) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }
      
      res.json({
        success: true,
        data: app
      });
      
    } catch (error) {
      logger.error('Error fetching application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch application'
      });
    }
  });

  /**
   * POST /apps
   * Create a new application
   */
  app.post('/', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { name, description, category, framework, tags = [], isPublic = false } = req.body;
      
      // Validation
      if (!name || !category || !framework) {
        res.status(400).json({
          success: false,
          error: 'Name, category, and framework are required'
        });
        return;
      }
      
      const appData = {
        name,
        description: description || '',
        category,
        framework,
        tags,
        isPublic,
        status: 'generating',
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        analytics: {
          views: 0,
          likes: 0,
          forks: 0,
          shares: 0
        }
      };
      
      const docRef = await db.collection('applications').add(appData);
      
      res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...appData
        }
      });
      
    } catch (error) {
      logger.error('Error creating application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create application'
      });
    }
  });

  /**
   * PUT /apps/:id
   * Update an existing application
   */
  app.put('/:id', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const updates = req.body;
      
      // Get existing document
      const doc = await db.collection('applications').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          success: false,
          error: 'Application not found'
        });
        return;
      }
      
      const app = doc.data();
      
      // Check ownership
      if (app?.createdBy !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }
      
      // Prepare update data
      const updateData = {
        ...updates,
        updatedBy: userId,
        updatedAt: new Date()
      };
      
      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdBy;
      delete updateData.createdAt;
      
      await db.collection('applications').doc(id).update(updateData);
      
      res.json({
        success: true,
        data: {
          id,
          ...app,
          ...updateData
        }
      });
      
    } catch (error) {
      logger.error('Error updating application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update application'
      });
    }
  });

  /**
   * DELETE /apps/:id
   * Delete an application
   */
  app.delete('/:id', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      // Get existing document
      const doc = await db.collection('applications').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          success: false,
          error: 'Application not found'
        });
        return;
      }
      
      const app = doc.data();
      
      // Check ownership
      if (app?.createdBy !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }
      
      await db.collection('applications').doc(id).delete();
      
      res.json({
        success: true,
        message: 'Application deleted successfully'
      });
      
    } catch (error) {
      logger.error('Error deleting application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete application'
      });
    }
  });

  /**
   * GET /apps/public
   * Get public applications for the gallery
   */
  app.get('/public/gallery', async (req, res) => {
    try {
      const { limit = 20, offset = 0, category, framework, search, sort = 'featured' } = req.query;
      
      let query = db.collection('applications')
        .where('isPublic', '==', true)
        .where('status', '==', 'deployed');
      
      // Add filters
      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }
      
      if (framework && framework !== 'all') {
        query = query.where('framework', '==', framework);
      }
      
      // Apply sorting
      switch (sort) {
        case 'newest':
          query = query.orderBy('createdAt', 'desc');
          break;
        case 'popular':
          query = query.orderBy('analytics.views', 'desc');
          break;
        case 'trending':
          query = query.orderBy('analytics.likes', 'desc');
          break;
        default:
          query = query.orderBy('isFavorite', 'desc').orderBy('analytics.views', 'desc');
      }
      
      const snapshot = await query
        .limit(Number(limit))
        .offset(Number(offset))
        .get();
      
      let apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Apply search filter if provided
      if (search) {
        const searchTerm = String(search).toLowerCase();
        apps = apps.filter((app: any) => 
          app.name?.toLowerCase().includes(searchTerm) ||
          app.description?.toLowerCase().includes(searchTerm) ||
          app.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      res.json({
        success: true,
        data: {
          applications: apps,
          total: apps.length,
          hasMore: snapshot.docs.length === Number(limit)
        }
      });
      
    } catch (error) {
      logger.error('Error fetching public applications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch public applications'
      });
    }
  });

  /**
   * POST /apps/:id/like
   * Like/unlike an application
   */
  app.post('/:id/like', verifyToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      const doc = await db.collection('applications').doc(id).get();
      
      if (!doc.exists) {
        res.status(404).json({
          success: false,
          error: 'Application not found'
        });
        return;
      }
      
      // TODO: Implement like/unlike logic with proper user tracking
      // This would typically use a subcollection or separate likes collection
      
      res.json({
        success: true,
        message: 'Like status updated'
      });
      
    } catch (error) {
      logger.error('Error updating like status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update like status'
      });
    }
  });

  return app;
};