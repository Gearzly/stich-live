"use strict";
/**
 * Applications API
 * Handles CRUD operations for generated applications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppsApp = void 0;
const express_1 = __importDefault(require("express"));
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
const common_1 = require("../middleware/common");
const createAppsApp = () => {
    const app = (0, express_1.default)();
    // Apply middleware
    app.use(common_1.corsMiddleware);
    app.use(common_1.securityMiddleware);
    app.use(common_1.loggingMiddleware);
    app.use(express_1.default.json({ limit: '50mb' }));
    /**
     * GET /apps
     * Get all applications for the authenticated user
     */
    app.get('/', auth_1.verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
            const { limit = 20, offset = 0, status, search } = req.query;
            let query = config_1.db.collection('applications')
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
            }));
            // Apply search filter if provided
            if (search) {
                const searchTerm = String(search).toLowerCase();
                apps = apps.filter((app) => {
                    var _a, _b;
                    return ((_a = app.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                        ((_b = app.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm));
                });
            }
            res.json({
                success: true,
                data: {
                    applications: apps,
                    total: apps.length,
                    hasMore: snapshot.docs.length === Number(limit)
                }
            });
        }
        catch (error) {
            firebase_functions_1.logger.error('Error fetching applications:', error);
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
    app.get('/:id', auth_1.verifyToken, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const doc = await config_1.db.collection('applications').doc(id).get();
            if (!doc.exists) {
                res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
                return;
            }
            const app = { id: doc.id, ...doc.data() };
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
        }
        catch (error) {
            firebase_functions_1.logger.error('Error fetching application:', error);
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
    app.post('/', auth_1.verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
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
            const docRef = await config_1.db.collection('applications').add(appData);
            res.status(201).json({
                success: true,
                data: {
                    id: docRef.id,
                    ...appData
                }
            });
        }
        catch (error) {
            firebase_functions_1.logger.error('Error creating application:', error);
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
    app.put('/:id', auth_1.verifyToken, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const updates = req.body;
            // Get existing document
            const doc = await config_1.db.collection('applications').doc(id).get();
            if (!doc.exists) {
                res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
                return;
            }
            const app = doc.data();
            // Check ownership
            if ((app === null || app === void 0 ? void 0 : app.createdBy) !== userId) {
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
            await config_1.db.collection('applications').doc(id).update(updateData);
            res.json({
                success: true,
                data: {
                    id,
                    ...app,
                    ...updateData
                }
            });
        }
        catch (error) {
            firebase_functions_1.logger.error('Error updating application:', error);
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
    app.delete('/:id', auth_1.verifyToken, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            // Get existing document
            const doc = await config_1.db.collection('applications').doc(id).get();
            if (!doc.exists) {
                res.status(404).json({
                    success: false,
                    error: 'Application not found'
                });
                return;
            }
            const app = doc.data();
            // Check ownership
            if ((app === null || app === void 0 ? void 0 : app.createdBy) !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
                return;
            }
            await config_1.db.collection('applications').doc(id).delete();
            res.json({
                success: true,
                message: 'Application deleted successfully'
            });
        }
        catch (error) {
            firebase_functions_1.logger.error('Error deleting application:', error);
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
            let query = config_1.db.collection('applications')
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
            }));
            // Apply search filter if provided
            if (search) {
                const searchTerm = String(search).toLowerCase();
                apps = apps.filter((app) => {
                    var _a, _b, _c;
                    return ((_a = app.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm)) ||
                        ((_b = app.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm)) ||
                        ((_c = app.tags) === null || _c === void 0 ? void 0 : _c.some((tag) => tag.toLowerCase().includes(searchTerm)));
                });
            }
            res.json({
                success: true,
                data: {
                    applications: apps,
                    total: apps.length,
                    hasMore: snapshot.docs.length === Number(limit)
                }
            });
        }
        catch (error) {
            firebase_functions_1.logger.error('Error fetching public applications:', error);
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
    app.post('/:id/like', auth_1.verifyToken, async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const doc = await config_1.db.collection('applications').doc(id).get();
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
        }
        catch (error) {
            firebase_functions_1.logger.error('Error updating like status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update like status'
            });
        }
    });
    return app;
};
exports.createAppsApp = createAppsApp;
//# sourceMappingURL=apps.js.map