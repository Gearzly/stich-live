import { Context } from 'hono';
import { getFirestore } from 'firebase-admin/firestore';
import { createLogger } from '../../utils/logger';
import { ApiResponse, App, CreateAppRequest, UpdateAppRequest, GenerateCodeRequest, PaginatedResponse } from '../../types/api';
import { AuthUser } from '../../middleware/auth';

const logger = createLogger('AppsController');
const db = getFirestore();

export class AppsController {
  static async getApps(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const offset = (page - 1) * limit;

      let query = db.collection('apps').where('userId', '==', user.uid);
      
      // Add sorting
      const sortBy = c.req.query('sortBy') || 'createdAt';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      query = query.orderBy(sortBy, sortOrder as 'asc' | 'desc');

      const snapshot = await query.offset(offset).limit(limit).get();
      const countSnapshot = await db.collection('apps')
        .where('userId', '==', user.uid)
        .count()
        .get();

      const apps: App[] = [];
      snapshot.forEach(doc => {
        apps.push({ id: doc.id, ...doc.data() } as App);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse<PaginatedResponse<App>> = {
        success: true,
        data: {
          data: apps,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get apps error:', error);
      return c.json({ success: false, error: 'Failed to get apps' }, 500);
    }
  }

  static async createApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appData: CreateAppRequest = await c.req.json();

      // Validate required fields
      if (!appData.name || !appData.description) {
        return c.json({ success: false, error: 'Name and description are required' }, 400);
      }

      const newApp: Omit<App, 'id'> = {
        userId: user.uid,
        name: appData.name,
        description: appData.description,
        status: 'draft',
        config: appData.config,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await db.collection('apps').add(newApp);

      logger.info('App created successfully', { appId: docRef.id, userId: user.uid });

      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: docRef.id },
      };

      return c.json(response, 201);
    } catch (error: any) {
      logger.error('Create app error:', error);
      return c.json({ success: false, error: 'Failed to create app' }, 500);
    }
  }

  static async getAppById(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = { id: appDoc.id, ...appDoc.data() } as App;

      // Check if user owns the app
      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      const response: ApiResponse<App> = {
        success: true,
        data: appData,
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get app by ID error:', error);
      return c.json({ success: false, error: 'Failed to get app' }, 500);
    }
  }

  static async updateApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');
      const updateData: UpdateAppRequest = await c.req.json();

      // First check if app exists and user owns it
      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = appDoc.data() as App;
      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      // Update the app
      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
      };

      await db.collection('apps').doc(appId).update(updateFields);

      logger.info('App updated successfully', { appId, userId: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'App updated successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Update app error:', error);
      return c.json({ success: false, error: 'Failed to update app' }, 500);
    }
  }

  static async deleteApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      // First check if app exists and user owns it
      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = appDoc.data() as App;
      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      // Delete the app and related data
      await db.collection('apps').doc(appId).delete();

      // TODO: Also delete related generation sessions and files

      logger.info('App deleted successfully', { appId, userId: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'App deleted successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Delete app error:', error);
      return c.json({ success: false, error: 'Failed to delete app' }, 500);
    }
  }

  static async generateApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');
      const generateRequest: GenerateCodeRequest = await c.req.json();

      // First check if app exists and user owns it
      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = appDoc.data() as App;
      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      // Update app status to generating
      await db.collection('apps').doc(appId).update({
        status: 'generating',
        updatedAt: new Date(),
      });

      // TODO: Implement actual AI code generation logic
      // For now, just return a success response

      logger.info('App generation started', { appId, userId: user.uid });

      const response: ApiResponse<{ message: string; sessionId?: string }> = {
        success: true,
        data: { message: 'Code generation started' },
      };

      return c.json(response, 202);
    } catch (error: any) {
      logger.error('Generate app error:', error);
      return c.json({ success: false, error: 'Failed to start generation' }, 500);
    }
  }

  static async deployApp(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      // First check if app exists and user owns it
      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = appDoc.data() as App;
      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      if (appData.status !== 'ready') {
        return c.json({ success: false, error: 'App is not ready for deployment' }, 400);
      }

      // TODO: Implement actual deployment logic to Vercel/Netlify

      logger.info('App deployment started', { appId, userId: user.uid });

      const response: ApiResponse<{ message: string; deploymentUrl?: string }> = {
        success: true,
        data: { message: 'Deployment started' },
      };

      return c.json(response, 202);
    } catch (error: any) {
      logger.error('Deploy app error:', error);
      return c.json({ success: false, error: 'Failed to start deployment' }, 500);
    }
  }

  static async getAppStatus(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      const appDoc = await db.collection('apps').doc(appId).get();

      if (!appDoc.exists) {
        return c.json({ success: false, error: 'App not found' }, 404);
      }

      const appData = { id: appDoc.id, ...appDoc.data() } as App;

      if (appData.userId !== user.uid) {
        return c.json({ success: false, error: 'Access denied' }, 403);
      }

      const response: ApiResponse<{ status: string; metadata?: any }> = {
        success: true,
        data: {
          status: appData.status,
          metadata: appData.metadata,
        },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get app status error:', error);
      return c.json({ success: false, error: 'Failed to get app status' }, 500);
    }
  }

  static async getAppFiles(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      // TODO: Implement file retrieval from storage
      // This would typically fetch from Firebase Storage or similar

      const response: ApiResponse<{ files: any[] }> = {
        success: true,
        data: { files: [] },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get app files error:', error);
      return c.json({ success: false, error: 'Failed to get app files' }, 500);
    }
  }

  static async getAppStructure(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const appId = c.req.param('id');

      // TODO: Implement structure retrieval
      // This would return the file/folder structure of the generated app

      const response: ApiResponse<{ structure: any }> = {
        success: true,
        data: { structure: null },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get app structure error:', error);
      return c.json({ success: false, error: 'Failed to get app structure' }, 500);
    }
  }
}