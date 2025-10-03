import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AppsController } from './controller';

export const appsRoutes = new Hono();

// All app routes require authentication
appsRoutes.use('*', authMiddleware);

// App CRUD operations
appsRoutes.get('/', AppsController.getApps);
appsRoutes.post('/', AppsController.createApp);
appsRoutes.get('/:id', AppsController.getAppById);
appsRoutes.put('/:id', AppsController.updateApp);
appsRoutes.delete('/:id', AppsController.deleteApp);

// App generation and deployment
appsRoutes.post('/:id/generate', AppsController.generateApp);
appsRoutes.post('/:id/deploy', AppsController.deployApp);
appsRoutes.get('/:id/status', AppsController.getAppStatus);

// App files and structure
appsRoutes.get('/:id/files', AppsController.getAppFiles);
appsRoutes.get('/:id/structure', AppsController.getAppStructure);