import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth';
import { AuthController } from './controller';
export const authRoutes = new Hono();
// Create controller instance following dependency injection pattern
const authController = new AuthController();
// Public routes
authRoutes.post('/register', (c) => authController.register(c));
authRoutes.post('/login', (c) => authController.login(c));
authRoutes.post('/refresh', (c) => authController.refreshToken(c));
// Protected routes
authRoutes.use('/profile/*', authMiddleware);
authRoutes.get('/profile', (c) => authController.getProfile(c));
authRoutes.put('/profile', (c) => authController.updateProfile(c));
authRoutes.use('/logout', authMiddleware);
authRoutes.post('/logout', (c) => authController.logout(c));
//# sourceMappingURL=routes.js.map