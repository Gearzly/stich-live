import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AppsController } from './controller';
export const appsRoutes = new Hono();
// Create controller instance following dependency injection pattern
const appsController = new AppsController();
// All app routes require authentication
appsRoutes.use('*', authMiddleware);
// App CRUD operations
appsRoutes.get('/', (c) => appsController.getUserApps(c));
appsRoutes.post('/', (c) => appsController.createApp(c));
appsRoutes.get('/:id', (c) => appsController.getAppById(c));
appsRoutes.put('/:id', (c) => appsController.updateApp(c));
appsRoutes.delete('/:id', (c) => appsController.deleteApp(c));
// App management operations
appsRoutes.put('/:id/status', (c) => appsController.updateAppStatus(c));
appsRoutes.put('/:id/metadata', (c) => appsController.updateAppMetadata(c));
// Public app discovery (no auth required)
appsRoutes.get('/public', (c) => appsController.getPublicApps(c));
//# sourceMappingURL=routes.js.map