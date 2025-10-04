/**
 * Firestore Database Triggers
 * Handles real-time database events and automated processing
 */

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Trigger when a new generation is created
 * Handles initialization and validation
 */
export const onGenerationCreated = onDocumentCreated(
  'generations/{generationId}',
  async (event) => {
    try {
      const generationId = event.params.generationId;
      const generationData = event.data?.data();

      if (!generationData) {
        logger.warn(`No data found for generation: ${generationId}`);
        return;
      }

      logger.info(`Processing new generation: ${generationId}`, {
        userId: generationData.userId,
        description: generationData.description?.substring(0, 100)
      });

      // TODO: Start actual AI generation process
      // This would trigger the AI agent to begin work

      // Update user's generation count
      const userRef = db.collection('users').doc(generationData.userId);
      await userRef.update({
        totalGenerations: FieldValue.increment(1),
        lastGenerationAt: new Date()
      });

    } catch (error) {
      logger.error('Error in onGenerationCreated:', error);
    }
  }
);

/**
 * Trigger when a generation is updated
 * Handles status changes and progress tracking
 */
export const onGenerationUpdated = onDocumentUpdated(
  'generations/{generationId}',
  async (event) => {
    try {
      const generationId = event.params.generationId;
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();

      if (!beforeData || !afterData) {
        return;
      }

      // Check if status changed to completed
      if (beforeData.status !== 'completed' && afterData.status === 'completed') {
        logger.info(`Generation completed: ${generationId}`);

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
        logger.error(`Generation failed: ${generationId}`, {
          error: afterData.error
        });

        // Update user's failed generation count
        const userRef = db.collection('users').doc(afterData.userId);
        await userRef.update({
          failedGenerations: FieldValue.increment(1)
        });
      }

    } catch (error) {
      logger.error('Error in onGenerationUpdated:', error);
    }
  }
);

/**
 * Trigger when an app is created
 * Handles app initialization and indexing
 */
export const onAppCreated = onDocumentCreated(
  'apps/{appId}',
  async (event) => {
    try {
      const appId = event.params.appId;
      const appData = event.data?.data();

      if (!appData) {
        return;
      }

      logger.info(`New app created: ${appId}`, {
        userId: appData.userId,
        title: appData.title
      });

      // Update user's app count
      const userRef = db.collection('users').doc(appData.userId);
      await userRef.update({
        totalApps: FieldValue.increment(1),
        lastAppCreatedAt: new Date()
      });

      // Add to search index (for future search functionality)
      const searchRef = db.collection('search_index').doc(appId);
      await searchRef.set({
        appId,
        title: appData.title?.toLowerCase() || '',
        description: appData.description?.toLowerCase() || '',
        features: appData.features?.map((f: string) => f.toLowerCase()) || [],
        techStack: appData.techStack?.map((t: string) => t.toLowerCase()) || [],
        userId: appData.userId,
        isPublic: appData.isPublic || false,
        createdAt: appData.createdAt
      });

    } catch (error) {
      logger.error('Error in onAppCreated:', error);
    }
  }
);

/**
 * Trigger when an app is updated
 * Handles search index updates and analytics
 */
export const onAppUpdated = onDocumentUpdated(
  'apps/{appId}',
  async (event) => {
    try {
      const appId = event.params.appId;
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();

      if (!beforeData || !afterData) {
        return;
      }

      // Update search index if relevant fields changed
      const fieldsToIndex = ['title', 'description', 'features', 'techStack', 'isPublic'];
      const shouldUpdateIndex = fieldsToIndex.some(field => 
        JSON.stringify(beforeData[field]) !== JSON.stringify(afterData[field])
      );

      if (shouldUpdateIndex) {
        const searchRef = db.collection('search_index').doc(appId);
        await searchRef.update({
          title: afterData.title?.toLowerCase() || '',
          description: afterData.description?.toLowerCase() || '',
          features: afterData.features?.map((f: string) => f.toLowerCase()) || [],
          techStack: afterData.techStack?.map((t: string) => t.toLowerCase()) || [],
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

    } catch (error) {
      logger.error('Error in onAppUpdated:', error);
    }
  }
);

/**
 * Trigger when an app is deleted
 * Handles cleanup and analytics
 */
export const onAppDeleted = onDocumentDeleted(
  'apps/{appId}',
  async (event) => {
    try {
      const appId = event.params.appId;
      const appData = event.data?.data();

      if (!appData) {
        return;
      }

      logger.info(`App deleted: ${appId}`, {
        userId: appData.userId,
        title: appData.title
      });

      // Update user's app count
      const userRef = db.collection('users').doc(appData.userId);
      await userRef.update({
        totalApps: FieldValue.increment(-1)
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

    } catch (error) {
      logger.error('Error in onAppDeleted:', error);
    }
  }
);

/**
 * Trigger when a user is created
 * Handles user profile initialization
 */
export const onUserCreated = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    try {
      const userId = event.params.userId;
      const userData = event.data?.data();

      if (!userData) {
        return;
      }

      logger.info(`New user created: ${userId}`, {
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
        newUsers: FieldValue.increment(1)
      }, { merge: true });

    } catch (error) {
      logger.error('Error in onUserCreated:', error);
    }
  }
);