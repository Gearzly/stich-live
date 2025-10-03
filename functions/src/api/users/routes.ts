import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { UsersController } from './controller';

export const usersRoutes = new Hono();

// Create controller instance following dependency injection pattern
const usersController = new UsersController();

// All user routes require authentication
usersRoutes.use('*', authMiddleware);

// User CRUD operations
usersRoutes.get('/', (c) => usersController.getUsers(c));
usersRoutes.get('/me', (c) => usersController.getCurrentUser(c));
usersRoutes.get('/:id', (c) => usersController.getUserById(c));
usersRoutes.put('/:id', (c) => usersController.updateUser(c));
usersRoutes.delete('/:id', (c) => usersController.deleteUser(c));

// User preferences
usersRoutes.get('/:id/preferences', (c) => usersController.getUserPreferences(c));
usersRoutes.put('/:id/preferences', (c) => usersController.updateUserPreferences(c));