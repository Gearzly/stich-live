"use strict";
/**
 * Firestore Database Triggers
 * Handles real-time database events and automated processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onAppDeleted = exports.onAppUpdated = exports.onAppCreated = exports.onGenerationUpdated = exports.onGenerationCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const v2_1 = require("firebase-functions/v2");
const firestore_2 = require("firebase-admin/firestore");
const db = (0, firestore_2.getFirestore)();
/**
 * Trigger when a new generation is created
 * Handles initialization and validation
 */
exports.onGenerationCreated = (0, firestore_1.onDocumentCreated)('generations/{generationId}', async (event) => {
    var _a, _b;
    try {
        const generationId = event.params.generationId;
        const generationData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!generationData) {
            v2_1.logger.warn(`No data found for generation: ${generationId}`);
            return;
        }
        v2_1.logger.info(`Processing new generation: ${generationId}`, {
            userId: generationData.userId,
            description: (_b = generationData.description) === null || _b === void 0 ? void 0 : _b.substring(0, 100)
        });
        // TODO: Start actual AI generation process
        // This would trigger the AI agent to begin work
        // Update user's generation count
        const userRef = db.collection('users').doc(generationData.userId);
        await userRef.update({
            totalGenerations: firestore_2.FieldValue.increment(1),
            lastGenerationAt: new Date()
        });
    }
    catch (error) {
        v2_1.logger.error('Error in onGenerationCreated:', error);
    }
});
/**
 * Trigger when a generation is updated
 * Handles status changes and progress tracking
 */
exports.onGenerationUpdated = (0, firestore_1.onDocumentUpdated)('generations/{generationId}', async (event) => {
    var _a, _b;
    try {
        const generationId = event.params.generationId;
        const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
        const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
        if (!beforeData || !afterData) {
            return;
        }
        // Check if status changed to completed
        if (beforeData.status !== 'completed' && afterData.status === 'completed') {
            v2_1.logger.info(`Generation completed: ${generationId}`);
            // Create app record if generation is successful
            if (afterData.result && afterData.result.files) {
                const appRef = db.collection('apps').doc();
                await appRef.set({
                    id: appRef.id,
                    userId: afterData.userId,
                    title: afterData.result.title || 'Generated App',
                    description: afterData.description,
                    features: afterData.features,
                    techStack: afterData.techStack || [],
                    generationId,
                    status: 'ready',
                    isPublic: false,
                    likes: 0,
                    views: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                // Update generation with app ID
                await event.data.after.ref.update({
                    appId: appRef.id
                });
            }
        }
        // Check if status changed to failed
        if (beforeData.status !== 'failed' && afterData.status === 'failed') {
            v2_1.logger.error(`Generation failed: ${generationId}`, {
                error: afterData.error
            });
            // Update user's failed generation count
            const userRef = db.collection('users').doc(afterData.userId);
            await userRef.update({
                failedGenerations: firestore_2.FieldValue.increment(1)
            });
        }
    }
    catch (error) {
        v2_1.logger.error('Error in onGenerationUpdated:', error);
    }
});
/**
 * Trigger when an app is created
 * Handles app initialization and indexing
 */
exports.onAppCreated = (0, firestore_1.onDocumentCreated)('apps/{appId}', async (event) => {
    var _a, _b, _c, _d, _e;
    try {
        const appId = event.params.appId;
        const appData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!appData) {
            return;
        }
        v2_1.logger.info(`New app created: ${appId}`, {
            userId: appData.userId,
            title: appData.title
        });
        // Update user's app count
        const userRef = db.collection('users').doc(appData.userId);
        await userRef.update({
            totalApps: firestore_2.FieldValue.increment(1),
            lastAppCreatedAt: new Date()
        });
        // Add to search index (for future search functionality)
        const searchRef = db.collection('search_index').doc(appId);
        await searchRef.set({
            appId,
            title: ((_b = appData.title) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '',
            description: ((_c = appData.description) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '',
            features: ((_d = appData.features) === null || _d === void 0 ? void 0 : _d.map((f) => f.toLowerCase())) || [],
            techStack: ((_e = appData.techStack) === null || _e === void 0 ? void 0 : _e.map((t) => t.toLowerCase())) || [],
            userId: appData.userId,
            isPublic: appData.isPublic || false,
            createdAt: appData.createdAt
        });
    }
    catch (error) {
        v2_1.logger.error('Error in onAppCreated:', error);
    }
});
/**
 * Trigger when an app is updated
 * Handles search index updates and analytics
 */
exports.onAppUpdated = (0, firestore_1.onDocumentUpdated)('apps/{appId}', async (event) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        const appId = event.params.appId;
        const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
        const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
        if (!beforeData || !afterData) {
            return;
        }
        // Update search index if relevant fields changed
        const fieldsToIndex = ['title', 'description', 'features', 'techStack', 'isPublic'];
        const shouldUpdateIndex = fieldsToIndex.some(field => JSON.stringify(beforeData[field]) !== JSON.stringify(afterData[field]));
        if (shouldUpdateIndex) {
            const searchRef = db.collection('search_index').doc(appId);
            await searchRef.update({
                title: ((_c = afterData.title) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '',
                description: ((_d = afterData.description) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '',
                features: ((_e = afterData.features) === null || _e === void 0 ? void 0 : _e.map((f) => f.toLowerCase())) || [],
                techStack: ((_f = afterData.techStack) === null || _f === void 0 ? void 0 : _f.map((t) => t.toLowerCase())) || [],
                isPublic: afterData.isPublic || false,
                updatedAt: new Date()
            });
        }
        // Track like changes for analytics
        if (beforeData.likes !== afterData.likes) {
            const analyticsRef = db.collection('analytics').doc('app_likes');
            await analyticsRef.set({
                [`${appId}_${new Date().toISOString().split('T')[0]}`]: {
                    appId,
                    likes: afterData.likes,
                    likeDelta: afterData.likes - beforeData.likes,
                    timestamp: new Date()
                }
            }, { merge: true });
        }
    }
    catch (error) {
        v2_1.logger.error('Error in onAppUpdated:', error);
    }
});
/**
 * Trigger when an app is deleted
 * Handles cleanup and analytics
 */
exports.onAppDeleted = (0, firestore_1.onDocumentDeleted)('apps/{appId}', async (event) => {
    var _a;
    try {
        const appId = event.params.appId;
        const appData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!appData) {
            return;
        }
        v2_1.logger.info(`App deleted: ${appId}`, {
            userId: appData.userId,
            title: appData.title
        });
        // Update user's app count
        const userRef = db.collection('users').doc(appData.userId);
        await userRef.update({
            totalApps: firestore_2.FieldValue.increment(-1)
        });
        // Remove from search index
        const searchRef = db.collection('search_index').doc(appId);
        await searchRef.delete();
        // Clean up related generations
        if (appData.generationId) {
            const generationRef = db.collection('generations').doc(appData.generationId);
            await generationRef.update({
                appDeleted: true,
                deletedAt: new Date()
            });
        }
        // Clean up deployments
        const deploymentsQuery = db.collection('deployments').where('appId', '==', appId);
        const deployments = await deploymentsQuery.get();
        const batch = db.batch();
        deployments.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    catch (error) {
        v2_1.logger.error('Error in onAppDeleted:', error);
    }
});
/**
 * Trigger when a user is created
 * Handles user profile initialization
 */
exports.onUserCreated = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    var _a;
    try {
        const userId = event.params.userId;
        const userData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!userData) {
            return;
        }
        v2_1.logger.info(`New user created: ${userId}`, {
            email: userData.email
        });
        // Initialize user analytics
        const analyticsRef = db.collection('user_analytics').doc(userId);
        await analyticsRef.set({
            userId,
            signupDate: new Date(),
            totalGenerations: 0,
            totalApps: 0,
            totalDeployments: 0,
            lastActive: new Date(),
            createdAt: new Date()
        });
        // Add to daily signup metrics
        const today = new Date().toISOString().split('T')[0];
        const dailyMetricsRef = db.collection('daily_metrics').doc(today);
        await dailyMetricsRef.set({
            date: today,
            newUsers: firestore_2.FieldValue.increment(1)
        }, { merge: true });
    }
    catch (error) {
        v2_1.logger.error('Error in onUserCreated:', error);
    }
});
//# sourceMappingURL=index.js.map