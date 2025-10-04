"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppManagementService = void 0;
const BaseService_1 = require("./BaseService");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Application Management Service
 * Handles CRUD operations for generated applications
 */
class AppManagementService extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    /**
     * Create a new application
     */
    async createApplication(userId, appData) {
        try {
            const appId = this.generateId();
            const application = {
                id: appId,
                name: appData.name,
                description: appData.description,
                category: appData.category,
                framework: appData.framework,
                status: 'draft',
                isPublic: appData.isPublic || false,
                isFavorite: false,
                tags: appData.tags || [],
                generationSettings: appData.generationSettings,
                analytics: {
                    views: 0,
                    likes: 0,
                    forks: 0,
                    shares: 0,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId,
            };
            await this.db.collection('applications').doc(appId).set(application);
            this.logger.info('Application created', { appId, userId, name: appData.name });
            return application;
        }
        catch (error) {
            this.logger.error('Failed to create application', { userId, error });
            throw new Error('Failed to create application');
        }
    }
    /**
     * Get application by ID
     */
    async getApplicationById(appId, userId) {
        try {
            const appDoc = await this.db.collection('applications').doc(appId).get();
            if (!appDoc.exists) {
                return null;
            }
            const app = appDoc.data();
            // Check if user has access to this app
            if (!app.isPublic && userId && app.createdBy !== userId) {
                return null;
            }
            // Increment view count
            if (userId !== app.createdBy) {
                await this.incrementAnalytics(appId, 'views');
            }
            return app;
        }
        catch (error) {
            this.logger.error('Failed to get application by ID', { appId, error });
            throw new Error('Failed to get application');
        }
    }
    /**
     * Get applications for a user
     */
    async getUserApplications(userId, filters = {}, limit = 20, offset = 0) {
        try {
            let query = this.db.collection('applications')
                .where('createdBy', '==', userId)
                .orderBy('updatedAt', 'desc');
            // Apply filters
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.framework) {
                query = query.where('framework', '==', filters.framework);
            }
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.isFavorite !== undefined) {
                query = query.where('isFavorite', '==', filters.isFavorite);
            }
            const snapshot = await query.limit(limit).offset(offset).get();
            let applications = snapshot.docs.map(doc => doc.data());
            // Apply client-side filters
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                applications = applications.filter(app => app.name.toLowerCase().includes(searchTerm) ||
                    app.description.toLowerCase().includes(searchTerm) ||
                    app.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            }
            if (filters.tags && filters.tags.length > 0) {
                applications = applications.filter(app => filters.tags.some(tag => app.tags.includes(tag)));
            }
            // Get total count
            const totalSnapshot = await this.db.collection('applications')
                .where('createdBy', '==', userId)
                .get();
            return {
                applications,
                total: totalSnapshot.size,
            };
        }
        catch (error) {
            this.logger.error('Failed to get user applications', { userId, error });
            throw new Error('Failed to get applications');
        }
    }
    /**
     * Get public applications
     */
    async getPublicApplications(filters = {}, limit = 20, offset = 0) {
        try {
            let query = this.db.collection('applications')
                .where('isPublic', '==', true);
            // Apply sorting
            const sortBy = filters.sortBy || 'createdAt';
            const sortOrder = filters.sortOrder || 'desc';
            if (sortBy === 'views') {
                query = query.orderBy('analytics.views', sortOrder);
            }
            else if (sortBy === 'likes') {
                query = query.orderBy('analytics.likes', sortOrder);
            }
            else if (sortBy === 'name') {
                query = query.orderBy('name', sortOrder);
            }
            else {
                query = query.orderBy('createdAt', sortOrder);
            }
            // Apply filters
            if (filters.framework) {
                query = query.where('framework', '==', filters.framework);
            }
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            const snapshot = await query.limit(limit).offset(offset).get();
            let applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Apply client-side filters
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                applications = applications.filter(app => app.name.toLowerCase().includes(searchTerm) ||
                    app.description.toLowerCase().includes(searchTerm) ||
                    app.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            }
            if (filters.tags && filters.tags.length > 0) {
                applications = applications.filter(app => filters.tags.some(tag => app.tags.includes(tag)));
            }
            // Get total count
            const totalSnapshot = await this.db.collection('applications')
                .where('isPublic', '==', true)
                .get();
            return {
                applications,
                total: totalSnapshot.size,
                hasMore: offset + applications.length < totalSnapshot.size
            };
        }
        catch (error) {
            this.logger.error('Failed to get public applications', { error });
            throw new Error('Failed to get public applications');
        }
    }
    /**
     * Update application
     */
    async updateApplication(appId, userId, updateData) {
        try {
            // Verify ownership
            const app = await this.getApplicationById(appId);
            if (!app || app.createdBy !== userId) {
                throw new Error('Application not found or access denied');
            }
            const updatePayload = {
                ...updateData,
                updatedAt: new Date(),
                updatedBy: userId,
            };
            await this.db.collection('applications').doc(appId).update(updatePayload);
            this.logger.info('Application updated', { appId, userId });
        }
        catch (error) {
            this.logger.error('Failed to update application', { appId, userId, error });
            throw new Error('Failed to update application');
        }
    }
    /**
     * Delete application
     */
    async deleteApplication(appId, userId) {
        try {
            // Verify ownership
            const app = await this.getApplicationById(appId);
            if (!app || app.createdBy !== userId) {
                throw new Error('Application not found or access denied');
            }
            await this.db.collection('applications').doc(appId).delete();
            // Delete related files and data
            await this.deleteApplicationFiles(appId);
            this.logger.info('Application deleted', { appId, userId });
        }
        catch (error) {
            this.logger.error('Failed to delete application', { appId, userId, error });
            throw new Error('Failed to delete application');
        }
    }
    /**
     * Toggle favorite status
     */
    async toggleFavorite(appId, userId) {
        try {
            const app = await this.getApplicationById(appId);
            if (!app || app.createdBy !== userId) {
                throw new Error('Application not found or access denied');
            }
            const newFavoriteStatus = !app.isFavorite;
            await this.db.collection('applications').doc(appId).update({
                isFavorite: newFavoriteStatus,
                updatedAt: new Date(),
            });
            this.logger.info('Application favorite status toggled', { appId, userId, isFavorite: newFavoriteStatus });
            return newFavoriteStatus;
        }
        catch (error) {
            this.logger.error('Failed to toggle favorite', { appId, userId, error });
            throw new Error('Failed to toggle favorite');
        }
    }
    /**
     * Get user's favorite applications
     */
    async getUserFavorites(userId, limit = 20, offset = 0) {
        try {
            const query = this.db.collection('applications')
                .where('createdBy', '==', userId)
                .where('isFavorite', '==', true)
                .orderBy('updatedAt', 'desc')
                .limit(limit)
                .offset(offset);
            const snapshot = await query.get();
            const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Get total count
            const countQuery = this.db.collection('applications')
                .where('createdBy', '==', userId)
                .where('isFavorite', '==', true);
            const countSnapshot = await countQuery.get();
            const total = countSnapshot.size;
            return {
                applications,
                total,
                hasMore: offset + applications.length < total
            };
        }
        catch (error) {
            this.logger.error('Failed to get user favorites', { userId, error });
            throw new Error('Failed to get favorite applications');
        }
    }
    /**
     * Toggle star/like status for an application
     */
    async toggleStar(appId, userId) {
        try {
            // Check if app exists and is public or user owns it
            const app = await this.getApplicationById(appId);
            if (!app || (!app.isPublic && app.createdBy !== userId)) {
                throw new Error('Application not found or access denied');
            }
            // Check if user has already starred this app
            const starRef = this.db.collection('applications').doc(appId).collection('stars').doc(userId);
            const starDoc = await starRef.get();
            const isCurrentlyStarred = starDoc.exists;
            const newStarredStatus = !isCurrentlyStarred;
            await this.db.runTransaction(async (transaction) => {
                if (newStarredStatus) {
                    // Add star
                    transaction.set(starRef, {
                        userId,
                        createdAt: new Date()
                    });
                    // Increment analytics
                    transaction.update(this.db.collection('applications').doc(appId), {
                        'analytics.likes': firestore_1.FieldValue.increment(1)
                    });
                }
                else {
                    // Remove star
                    transaction.delete(starRef);
                    // Decrement analytics
                    transaction.update(this.db.collection('applications').doc(appId), {
                        'analytics.likes': firestore_1.FieldValue.increment(-1)
                    });
                }
            });
            // Get updated star count
            const starsSnapshot = await this.db.collection('applications').doc(appId).collection('stars').get();
            const totalStars = starsSnapshot.size;
            this.logger.info('Application star status toggled', { appId, userId, isStarred: newStarredStatus, totalStars });
            return {
                isStarred: newStarredStatus,
                totalStars
            };
        }
        catch (error) {
            this.logger.error('Failed to toggle star', { appId, userId, error });
            throw new Error('Failed to toggle star');
        }
    }
    /**
     * Fork an application (create a copy for the user)
     */
    async forkApplication(appId, userId, forkData) {
        try {
            // Get the original app
            const originalApp = await this.getApplicationById(appId);
            if (!originalApp) {
                throw new Error('Application not found');
            }
            // Check if app is public or user owns it
            if (!originalApp.isPublic && originalApp.createdBy !== userId) {
                throw new Error('Cannot fork private application');
            }
            // Get app files
            const originalFiles = await this.getApplicationFiles(appId);
            // Create forked app data
            const now = new Date();
            const forkedAppData = {
                name: (forkData === null || forkData === void 0 ? void 0 : forkData.name) || `${originalApp.name} (Fork)`,
                description: (forkData === null || forkData === void 0 ? void 0 : forkData.description) || `Forked from ${originalApp.name}: ${originalApp.description}`,
                category: originalApp.category,
                framework: originalApp.framework,
                status: 'draft',
                isPublic: (forkData === null || forkData === void 0 ? void 0 : forkData.isPublic) || false,
                isFavorite: false,
                tags: [...originalApp.tags, 'forked'],
                repositoryUrl: undefined, // Reset deployment info
                deploymentUrl: undefined,
                previewUrl: undefined,
                generationSettings: {
                    ...originalApp.generationSettings,
                    prompt: `Fork of: ${originalApp.generationSettings.prompt}`,
                },
                files: originalFiles,
                fileStructure: originalApp.fileStructure,
                analytics: {
                    views: 0,
                    likes: 0,
                    forks: 0,
                    shares: 0,
                },
                createdAt: now,
                updatedAt: now,
                createdBy: userId,
                updatedBy: userId,
            };
            // Create the forked app
            const docRef = this.db.collection('applications').doc();
            await docRef.set(forkedAppData);
            // Copy files to new app
            if (originalFiles.length > 0) {
                const batch = this.db.batch();
                originalFiles.forEach(file => {
                    const newFileRef = docRef.collection('files').doc();
                    batch.set(newFileRef, {
                        ...file,
                        id: newFileRef.id,
                        lastModified: now,
                    });
                });
                await batch.commit();
            }
            // Increment fork count on original app
            await this.incrementAnalytics(appId, 'forks');
            const forkedApp = {
                id: docRef.id,
                ...forkedAppData,
            };
            this.logger.info('Application forked successfully', {
                originalAppId: appId,
                forkedAppId: docRef.id,
                userId
            });
            return forkedApp;
        }
        catch (error) {
            this.logger.error('Failed to fork application', { appId, userId, error });
            throw new Error('Failed to fork application');
        }
    }
    /**
     * Update application visibility settings
     */
    async updateAppVisibility(appId, userId, visibilityData) {
        try {
            const app = await this.getApplicationById(appId);
            if (!app || app.createdBy !== userId) {
                throw new Error('Application not found or access denied');
            }
            await this.db.collection('applications').doc(appId).update({
                isPublic: visibilityData.isPublic,
                updatedAt: new Date(),
                updatedBy: userId,
            });
            this.logger.info('Application visibility updated', {
                appId,
                userId,
                isPublic: visibilityData.isPublic
            });
        }
        catch (error) {
            this.logger.error('Failed to update app visibility', { appId, userId, error });
            throw new Error('Failed to update application visibility');
        }
    }
    /**
     * Update application files
     */
    async updateApplicationFiles(appId, userId, files) {
        try {
            // Verify ownership
            const app = await this.getApplicationById(appId);
            if (!app || app.createdBy !== userId) {
                throw new Error('Application not found or access denied');
            }
            await this.db.collection('applications').doc(appId).update({
                files,
                updatedAt: new Date(),
            });
            this.logger.info('Application files updated', { appId, userId, fileCount: files.length });
        }
        catch (error) {
            this.logger.error('Failed to update application files', { appId, userId, error });
            throw new Error('Failed to update application files');
        }
    }
    /**
     * Get application files
     */
    async getApplicationFiles(appId, userId) {
        try {
            const app = await this.getApplicationById(appId, userId);
            if (!app) {
                throw new Error('Application not found');
            }
            return app.files || [];
        }
        catch (error) {
            this.logger.error('Failed to get application files', { appId, error });
            throw new Error('Failed to get application files');
        }
    }
    /**
     * Increment analytics
     */
    async incrementAnalytics(appId, metric) {
        try {
            const appRef = this.db.collection('applications').doc(appId);
            await this.db.runTransaction(async (transaction) => {
                const appDoc = await transaction.get(appRef);
                if (!appDoc.exists) {
                    throw new Error('Application not found');
                }
                const app = appDoc.data();
                const newAnalytics = {
                    ...app.analytics,
                    [metric]: app.analytics[metric] + 1,
                };
                transaction.update(appRef, { analytics: newAnalytics });
            });
        }
        catch (error) {
            this.logger.error('Failed to increment analytics', { appId, metric, error });
        }
    }
    /**
     * Get application statistics
     */
    async getApplicationStats(userId) {
        try {
            const snapshot = await this.db.collection('applications')
                .where('createdBy', '==', userId)
                .get();
            const apps = snapshot.docs.map(doc => doc.data());
            const stats = {
                total: apps.length,
                byStatus: {},
                byFramework: {},
                totalViews: 0,
            };
            apps.forEach(app => {
                // Count by status
                stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;
                // Count by framework
                stats.byFramework[app.framework] = (stats.byFramework[app.framework] || 0) + 1;
                // Sum views
                stats.totalViews += app.analytics.views;
            });
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get application stats', { userId, error });
            throw new Error('Failed to get application statistics');
        }
    }
    /**
     * Search applications across all public apps
     */
    async searchApplications(query, filters = {}, limit = 20) {
        try {
            // Get public applications
            const { applications } = await this.getPublicApplications(filters, limit * 2); // Get more to account for filtering
            // Apply search
            const searchTerm = query.toLowerCase();
            const filteredApps = applications.filter(app => app.name.toLowerCase().includes(searchTerm) ||
                app.description.toLowerCase().includes(searchTerm) ||
                app.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            return filteredApps.slice(0, limit);
        }
        catch (error) {
            this.logger.error('Failed to search applications', { query, error });
            throw new Error('Failed to search applications');
        }
    }
    /**
     * Delete application files
     */
    async deleteApplicationFiles(appId) {
        try {
            // Delete file storage if using Firebase Storage
            // This would typically involve deleting files from Storage bucket
            this.logger.info('Application files deleted', { appId });
        }
        catch (error) {
            this.logger.error('Failed to delete application files', { appId, error });
        }
    }
}
exports.AppManagementService = AppManagementService;
//# sourceMappingURL=AppManagementService.js.map