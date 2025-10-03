import { Context } from 'hono';
import { getFirestore } from 'firebase-admin/firestore';
import { createLogger } from '../../utils/logger';
import { ApiResponse, User, UserPreferences, PaginatedResponse } from '../../types/api';
import { AuthUser } from '../../middleware/auth';

const logger = createLogger('UsersController');
const db = getFirestore();

export class UsersController {
  static async getUsers(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      
      // Only admins can list all users
      if (user.role !== 'admin') {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const offset = (page - 1) * limit;

      const usersRef = db.collection('users');
      const snapshot = await usersRef.offset(offset).limit(limit).get();
      const countSnapshot = await usersRef.count().get();

      const users: User[] = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });

      const total = countSnapshot.data().count;
      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse<PaginatedResponse<User>> = {
        success: true,
        data: {
          data: users,
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
      logger.error('Get users error:', error);
      return c.json({ success: false, error: 'Failed to get users' }, 500);
    }
  }

  static async getUserById(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const userId = c.req.param('id');

      // Users can only access their own data, admins can access any
      if (user.uid !== userId && user.role !== 'admin') {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User;

      const response: ApiResponse<User> = {
        success: true,
        data: userData,
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get user by ID error:', error);
      return c.json({ success: false, error: 'Failed to get user' }, 500);
    }
  }

  static async updateUser(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const userId = c.req.param('id');
      const updateData = await c.req.json();

      // Users can only update their own data, admins can update any
      if (user.uid !== userId && user.role !== 'admin') {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      // Remove sensitive fields that shouldn't be updated directly
      const { id, createdAt, ...safeUpdateData } = updateData;
      safeUpdateData.updatedAt = new Date();

      await db.collection('users').doc(userId).update(safeUpdateData);

      logger.info('User updated successfully', { userId, updatedBy: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'User updated successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Update user error:', error);
      return c.json({ success: false, error: 'Failed to update user' }, 500);
    }
  }

  static async deleteUser(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const userId = c.req.param('id');

      // Users can delete their own account, admins can delete any
      if (user.uid !== userId && user.role !== 'admin') {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      // Delete user from Firestore
      await db.collection('users').doc(userId).delete();

      // Also delete from Firebase Auth if it's the user's own account
      if (user.uid === userId) {
        const { auth } = await import('firebase-admin');
        await auth().deleteUser(userId);
      }

      logger.info('User deleted successfully', { userId, deletedBy: user.uid });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'User deleted successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Delete user error:', error);
      return c.json({ success: false, error: 'Failed to delete user' }, 500);
    }
  }

  static async getUserPreferences(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const userId = c.req.param('id');

      // Users can only access their own preferences
      if (user.uid !== userId) {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      const userData = userDoc.data() as User;
      const preferences = userData.preferences || {
        theme: 'light',
        notifications: true,
        language: 'en',
      };

      const response: ApiResponse<UserPreferences> = {
        success: true,
        data: preferences,
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Get user preferences error:', error);
      return c.json({ success: false, error: 'Failed to get preferences' }, 500);
    }
  }

  static async updateUserPreferences(c: Context): Promise<Response> {
    try {
      const user = c.get('user') as AuthUser;
      const userId = c.req.param('id');
      const preferences = await c.req.json();

      // Users can only update their own preferences
      if (user.uid !== userId) {
        return c.json({ success: false, error: 'Insufficient permissions' }, 403);
      }

      await db.collection('users').doc(userId).update({
        preferences,
        updatedAt: new Date(),
      });

      logger.info('User preferences updated', { userId });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Preferences updated successfully' },
      };

      return c.json(response);
    } catch (error: any) {
      logger.error('Update preferences error:', error);
      return c.json({ success: false, error: 'Failed to update preferences' }, 500);
    }
  }
}