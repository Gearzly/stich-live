import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { UsersController } from './controller';

export const usersRoutes = new Hono();

// All user routes require authentication
usersRoutes.use('*', authMiddleware);

// User management routes
usersRoutes.get('/', UsersController.getUsers);
usersRoutes.get('/:id', UsersController.getUserById);
usersRoutes.put('/:id', UsersController.updateUser);
usersRoutes.delete('/:id', UsersController.deleteUser);

// User preferences
usersRoutes.get('/:id/preferences', UsersController.getUserPreferences);
usersRoutes.put('/:id/preferences', UsersController.updateUserPreferences);