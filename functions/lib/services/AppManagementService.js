import { BaseService, NotFoundError, AuthorizationError } from './BaseService';
import { z } from 'zod';
// Validation schemas
const createAppSchema = z.object({
    name: z.string().min(1, 'App name is required').max(255),
    description: z.string().max(1000).optional(),
    framework: z.enum(['react', 'vue', 'angular', 'vanilla']).optional(),
    styling: z.enum(['tailwind', 'css', 'styled-components']).optional(),
    features: z.array(z.string()).optional(),
    isPublic: z.boolean().optional()
});
const updateAppSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    framework: z.enum(['react', 'vue', 'angular', 'vanilla']).optional(),
    styling: z.enum(['tailwind', 'css', 'styled-components']).optional(),
    features: z.array(z.string()).optional(),
    isPublic: z.boolean().optional()
});
const paginationSchema = z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
});
export class AppManagementService extends BaseService {
    appsCollection = 'apps';
    /**
     * Creates a new application for the authenticated user
     */
    async createApp(userId, appData) {
        try {
            const validatedData = this.validateInput(appData, createAppSchema);
            // Apply defaults
            const config = {
                framework: validatedData.framework || 'react',
                styling: validatedData.styling || 'tailwind',
                features: validatedData.features || []
            };
            const app = {
                userId,
                name: validatedData.name,
                description: validatedData.description || '',
                status: 'draft',
                config,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                    generatedFiles: 0
                }
            };
            const docRef = await this.db.collection(this.appsCollection).add(app);
            this.logger.info('App created successfully', {
                appId: docRef.id,
                userId,
                name: validatedData.name
            });
            return { id: docRef.id, ...app };
        }
        catch (error) {
            this.handleError(error, 'createApp');
        }
    }
    /**
     * Retrieves apps for a specific user with pagination
     */
    async getUserApps(userId, paginationData) {
        try {
            const paginationInput = this.validateInput(paginationData, paginationSchema);
            // Apply defaults
            const page = paginationInput.page || 1;
            const limit = paginationInput.limit || 10;
            const sortBy = paginationInput.sortBy || 'createdAt';
            const sortOrder = paginationInput.sortOrder || 'desc';
            const offset = (page - 1) * limit;
            // Build query
            let query = this.db.collection(this.appsCollection)
                .where('userId', '==', userId)
                .orderBy(sortBy, sortOrder);
            // Get total count
            const countSnapshot = await this.db.collection(this.appsCollection)
                .where('userId', '==', userId)
                .count()
                .get();
            // Get paginated results
            const snapshot = await query.offset(offset).limit(limit).get();
            const apps = [];
            snapshot.forEach(doc => {
                apps.push({ id: doc.id, ...doc.data() });
            });
            const total = countSnapshot.data().count;
            const totalPages = Math.ceil(total / limit);
            this.logger.info('Retrieved user apps', {
                userId,
                count: apps.length,
                total
            });
            return {
                data: apps,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            this.handleError(error, 'getUserApps');
        }
    }
    /**
     * Retrieves a single app by ID with ownership verification
     */
    async getAppById(appId, userId) {
        try {
            const appDoc = await this.db.collection(this.appsCollection).doc(appId).get();
            if (!appDoc.exists) {
                throw new NotFoundError('App', appId);
            }
            const appData = appDoc.data();
            // Verify ownership
            if (appData.userId !== userId) {
                throw new AuthorizationError('Access denied to this app');
            }
            this.logger.info('Retrieved app', { appId, userId });
            return { id: appDoc.id, ...appData };
        }
        catch (error) {
            this.handleError(error, 'getAppById');
        }
    }
    /**
     * Updates an existing app with ownership verification
     */
    async updateApp(appId, userId, updateData) {
        try {
            const validatedData = this.validateInput(updateData, updateAppSchema);
            // Verify ownership
            const app = await this.getAppById(appId, userId);
            const updatedFields = {
                ...validatedData,
                updatedAt: new Date()
            };
            // Update config if framework/styling changed
            if (validatedData.framework || validatedData.styling || validatedData.features) {
                updatedFields.config = {
                    ...app.config,
                    ...(validatedData.framework && { framework: validatedData.framework }),
                    ...(validatedData.styling && { styling: validatedData.styling }),
                    ...(validatedData.features && { features: validatedData.features })
                };
            }
            await this.db.collection(this.appsCollection).doc(appId).update(updatedFields);
            this.logger.info('App updated successfully', { appId, userId });
            return { ...app, ...updatedFields };
        }
        catch (error) {
            this.handleError(error, 'updateApp');
        }
    }
    /**
     * Deletes an app with ownership verification
     */
    async deleteApp(appId, userId) {
        try {
            // Verify ownership
            await this.getAppById(appId, userId);
            await this.db.collection(this.appsCollection).doc(appId).delete();
            this.logger.info('App deleted successfully', { appId, userId });
        }
        catch (error) {
            this.handleError(error, 'deleteApp');
        }
    }
    /**
     * Updates app status
     */
    async updateAppStatus(appId, userId, status) {
        try {
            // Verify ownership
            await this.getAppById(appId, userId);
            await this.db.collection(this.appsCollection).doc(appId).update({
                status,
                updatedAt: new Date()
            });
            this.logger.info('App status updated', {
                appId,
                userId,
                status
            });
        }
        catch (error) {
            this.handleError(error, 'updateAppStatus');
        }
    }
    /**
     * Updates app metadata
     */
    async updateAppMetadata(appId, userId, metadata) {
        try {
            // Verify ownership
            const app = await this.getAppById(appId, userId);
            const updatedMetadata = {
                ...app.metadata,
                ...metadata
            };
            await this.db.collection(this.appsCollection).doc(appId).update({
                metadata: updatedMetadata,
                updatedAt: new Date()
            });
            this.logger.info('App metadata updated', { appId, userId, metadata });
        }
        catch (error) {
            this.handleError(error, 'updateAppMetadata');
        }
    }
    /**
     * Retrieves public apps with pagination
     */
    async getPublicApps(paginationData) {
        try {
            const paginationInput = this.validateInput(paginationData, paginationSchema);
            // Apply defaults
            const page = paginationInput.page || 1;
            const limit = paginationInput.limit || 10;
            const sortBy = paginationInput.sortBy || 'createdAt';
            const sortOrder = paginationInput.sortOrder || 'desc';
            const offset = (page - 1) * limit;
            // Build query for public apps only
            let query = this.db.collection(this.appsCollection)
                .where('status', '==', 'deployed') // Only show deployed apps as public
                .orderBy(sortBy, sortOrder);
            // Get total count
            const countSnapshot = await this.db.collection(this.appsCollection)
                .where('status', '==', 'deployed')
                .count()
                .get();
            // Get paginated results
            const snapshot = await query.offset(offset).limit(limit).get();
            const apps = [];
            snapshot.forEach(doc => {
                apps.push({ id: doc.id, ...doc.data() });
            });
            const total = countSnapshot.data().count;
            const totalPages = Math.ceil(total / limit);
            this.logger.info('Retrieved public apps', {
                count: apps.length,
                total
            });
            return {
                data: apps,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        }
        catch (error) {
            this.handleError(error, 'getPublicApps');
        }
    }
}
//# sourceMappingURL=AppManagementService.js.map