"use strict";
/**
 * Callable Functions for AI Generation and Deployment
 * Firebase callable functions for real-time client interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelGeneration = exports.getGenerationStatus = exports.deployApp = exports.generateApp = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-admin/firestore");
// Initialize Firestore
const db = (0, firestore_1.getFirestore)();
/**
 * Callable function to generate a new application
 */
exports.generateApp = (0, https_1.onCall)({
    cors: true,
    enforceAppCheck: false,
    timeoutSeconds: 540, // 9 minutes for complex generations
    memory: '1GiB'
}, async (request) => {
    try {
        // Verify authentication
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const { description, features, techStack, complexity = 'medium', userId } = request.data;
        // Validate required parameters
        if (!description || !features || features.length === 0) {
            throw new Error('Description and features are required');
        }
        // Verify user matches authenticated user
        if (userId !== request.auth.uid) {
            throw new Error('User ID mismatch');
        }
        v2_1.logger.info(`Starting app generation for user: ${userId}`, {
            description: description.substring(0, 100),
            featuresCount: features.length,
            complexity
        });
        // Create generation record in Firestore
        const generationRef = db.collection('generations').doc();
        await generationRef.set({
            userId,
            description,
            features,
            techStack: techStack || [],
            complexity,
            status: 'initializing',
            createdAt: new Date(),
            updatedAt: new Date(),
            progress: {
                stage: 'blueprint',
                percentage: 0,
                message: 'Initializing generation process...'
            }
        });
        // TODO: Implement actual AI generation logic
        // This would involve:
        // 1. Blueprint generation
        // 2. File structure creation
        // 3. Code generation
        // 4. Review and refinement
        // 5. Package preparation
        // For now, return the generation ID for tracking
        return {
            success: true,
            generationId: generationRef.id,
            message: 'Generation started successfully',
            estimatedTime: '5-10 minutes'
        };
    }
    catch (error) {
        v2_1.logger.error('Error in generateApp:', error);
        throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Callable function to deploy a generated application
 */
exports.deployApp = (0, https_1.onCall)({
    cors: true,
    enforceAppCheck: false,
    timeoutSeconds: 300, // 5 minutes for deployment
    memory: '512MiB'
}, async (request) => {
    try {
        // Verify authentication
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const { appId, generationId, deploymentConfig } = request.data;
        // Validate required parameters
        if (!appId || !generationId) {
            throw new Error('App ID and generation ID are required');
        }
        v2_1.logger.info(`Starting deployment for app: ${appId}`, {
            generationId,
            userId: request.auth.uid,
            config: deploymentConfig
        });
        // Verify app ownership
        const appDoc = await db.collection('apps').doc(appId).get();
        if (!appDoc.exists) {
            throw new Error('App not found');
        }
        const appData = appDoc.data();
        if ((appData === null || appData === void 0 ? void 0 : appData.userId) !== request.auth.uid) {
            throw new Error('Unauthorized: App does not belong to user');
        }
        // Verify generation exists and is complete
        const generationDoc = await db.collection('generations').doc(generationId).get();
        if (!generationDoc.exists) {
            throw new Error('Generation not found');
        }
        const generationData = generationDoc.data();
        if ((generationData === null || generationData === void 0 ? void 0 : generationData.status) !== 'completed') {
            throw new Error('Generation must be completed before deployment');
        }
        // Create deployment record
        const deploymentRef = db.collection('deployments').doc();
        await deploymentRef.set({
            appId,
            generationId,
            userId: request.auth.uid,
            config: deploymentConfig || {},
            status: 'preparing',
            createdAt: new Date(),
            updatedAt: new Date(),
            progress: {
                stage: 'preparation',
                percentage: 0,
                message: 'Preparing deployment...'
            }
        });
        // TODO: Implement actual deployment logic
        // This would involve:
        // 1. File preparation and optimization
        // 2. Vercel/Netlify deployment
        // 3. Domain configuration
        // 4. SSL setup
        // 5. Analytics setup
        return {
            success: true,
            deploymentId: deploymentRef.id,
            message: 'Deployment started successfully',
            estimatedTime: '3-5 minutes'
        };
    }
    catch (error) {
        v2_1.logger.error('Error in deployApp:', error);
        throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Callable function to get generation status
 */
exports.getGenerationStatus = (0, https_1.onCall)({
    cors: true,
    enforceAppCheck: false
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const { generationId } = request.data;
        if (!generationId) {
            throw new Error('Generation ID is required');
        }
        const generationDoc = await db.collection('generations').doc(generationId).get();
        if (!generationDoc.exists) {
            throw new Error('Generation not found');
        }
        const generationData = generationDoc.data();
        // Verify ownership
        if ((generationData === null || generationData === void 0 ? void 0 : generationData.userId) !== request.auth.uid) {
            throw new Error('Unauthorized: Generation does not belong to user');
        }
        return {
            success: true,
            generation: {
                id: generationId,
                ...generationData
            }
        };
    }
    catch (error) {
        v2_1.logger.error('Error in getGenerationStatus:', error);
        throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Callable function to cancel ongoing generation
 */
exports.cancelGeneration = (0, https_1.onCall)({
    cors: true,
    enforceAppCheck: false
}, async (request) => {
    try {
        if (!request.auth) {
            throw new Error('Authentication required');
        }
        const { generationId } = request.data;
        if (!generationId) {
            throw new Error('Generation ID is required');
        }
        const generationRef = db.collection('generations').doc(generationId);
        const generationDoc = await generationRef.get();
        if (!generationDoc.exists) {
            throw new Error('Generation not found');
        }
        const generationData = generationDoc.data();
        // Verify ownership
        if ((generationData === null || generationData === void 0 ? void 0 : generationData.userId) !== request.auth.uid) {
            throw new Error('Unauthorized: Generation does not belong to user');
        }
        // Check if cancellable
        if (['completed', 'failed', 'cancelled'].includes(generationData === null || generationData === void 0 ? void 0 : generationData.status)) {
            throw new Error('Generation cannot be cancelled in current status');
        }
        // Update status to cancelled
        await generationRef.update({
            status: 'cancelled',
            updatedAt: new Date(),
            progress: {
                stage: 'cancelled',
                percentage: 0,
                message: 'Generation cancelled by user'
            }
        });
        v2_1.logger.info(`Generation cancelled: ${generationId}`, {
            userId: request.auth.uid
        });
        return {
            success: true,
            message: 'Generation cancelled successfully'
        };
    }
    catch (error) {
        v2_1.logger.error('Error in cancelGeneration:', error);
        throw new Error(`Cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
//# sourceMappingURL=index.js.map