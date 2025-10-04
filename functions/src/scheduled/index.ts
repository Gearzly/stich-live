/**
 * Scheduled Functions
 * Handles periodic tasks and maintenance
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Daily analytics aggregation
 * Runs every day at 1:00 AM UTC
 */
export const dailyAnalytics = onSchedule(
  {
    schedule: '0 1 * * *',
    timeZone: 'UTC'
  },
  async () => {
    try {
      logger.info('Starting daily analytics aggregation');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // Aggregate user signups
      const usersSnapshot = await db.collection('users')
        .where('createdAt', '>=', new Date(dateStr))
        .where('createdAt', '<', new Date())
        .get();

      // Aggregate generations
      const generationsSnapshot = await db.collection('generations')
        .where('createdAt', '>=', new Date(dateStr))
        .where('createdAt', '<', new Date())
        .get();

      // Aggregate apps created
      const appsSnapshot = await db.collection('apps')
        .where('createdAt', '>=', new Date(dateStr))
        .where('createdAt', '<', new Date())
        .get();

      // Aggregate deployments
      const deploymentsSnapshot = await db.collection('deployments')
        .where('createdAt', '>=', new Date(dateStr))
        .where('createdAt', '<', new Date())
        .get();

      // Store aggregated data
      await db.collection('daily_analytics').doc(dateStr).set({
        date: dateStr,
        newUsers: usersSnapshot.size,
        totalGenerations: generationsSnapshot.size,
        completedGenerations: generationsSnapshot.docs.filter(doc => 
          doc.data().status === 'completed'
        ).length,
        newApps: appsSnapshot.size,
        newDeployments: deploymentsSnapshot.size,
        createdAt: new Date()
      });

      logger.info(`Daily analytics completed for ${dateStr}`, {
        newUsers: usersSnapshot.size,
        totalGenerations: generationsSnapshot.size,
        newApps: appsSnapshot.size,
        newDeployments: deploymentsSnapshot.size
      });

    } catch (error) {
      logger.error('Error in daily analytics:', error);
    }
  }
);

/**
 * Cleanup old generations
 * Runs every week on Sunday at 2:00 AM UTC
 */
export const cleanupOldGenerations = onSchedule(
  {
    schedule: '0 2 * * 0',
    timeZone: 'UTC'
  },
  async () => {
    try {
      logger.info('Starting cleanup of old generations');

      // Delete generations older than 30 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const oldGenerationsSnapshot = await db.collection('generations')
        .where('createdAt', '<', cutoffDate)
        .where('status', 'in', ['failed', 'cancelled'])
        .limit(100) // Process in batches
        .get();

      if (oldGenerationsSnapshot.empty) {
        logger.info('No old generations to cleanup');
        return;
      }

      const batch = db.batch();
      oldGenerationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`Cleaned up ${oldGenerationsSnapshot.size} old generations`);

    } catch (error) {
      logger.error('Error in cleanup old generations:', error);
    }
  }
);

/**
 * Update search index
 * Runs every hour to ensure search index is current
 */
export const updateSearchIndex = onSchedule(
  {
    schedule: '0 * * * *',
    timeZone: 'UTC'
  },
  async () => {
    try {
      logger.info('Starting search index update');

      // Get apps that were updated in the last hour but might not be in search index
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentAppsSnapshot = await db.collection('apps')
        .where('updatedAt', '>=', oneHourAgo)
        .get();

      let updatedCount = 0;

      for (const appDoc of recentAppsSnapshot.docs) {
        const appData = appDoc.data();
        const appId = appDoc.id;

        // Check if search index entry exists and is current
        const searchDoc = await db.collection('search_index').doc(appId).get();
        
        if (!searchDoc.exists || 
            !searchDoc.data()?.updatedAt || 
            searchDoc.data()!.updatedAt < appData.updatedAt) {
          
          // Update search index
          await db.collection('search_index').doc(appId).set({
            appId,
            title: appData.title?.toLowerCase() || '',
            description: appData.description?.toLowerCase() || '',
            features: appData.features?.map((f: string) => f.toLowerCase()) || [],
            techStack: appData.techStack?.map((t: string) => t.toLowerCase()) || [],
            userId: appData.userId,
            isPublic: appData.isPublic || false,
            createdAt: appData.createdAt,
            updatedAt: new Date()
          });

          updatedCount++;
        }
      }

      logger.info(`Search index update completed`, {
        checkedApps: recentAppsSnapshot.size,
        updatedEntries: updatedCount
      });

    } catch (error) {
      logger.error('Error in search index update:', error);
    }
  }
);

/**
 * Generate usage reports
 * Runs every Monday at 3:00 AM UTC
 */
export const generateUsageReports = onSchedule(
  {
    schedule: '0 3 * * 1',
    timeZone: 'UTC'
  },
  async () => {
    try {
      logger.info('Starting weekly usage report generation');

      // Get last 7 days of data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get analytics data for the week
      const analyticsSnapshot = await db.collection('daily_analytics')
        .where('date', '>=', weekAgo.toISOString().split('T')[0])
        .orderBy('date', 'desc')
        .get();

      const weeklyData = {
        weekEndingDate: new Date().toISOString().split('T')[0],
        totalNewUsers: 0,
        totalGenerations: 0,
        totalCompletedGenerations: 0,
        totalNewApps: 0,
        totalNewDeployments: 0,
        dailyBreakdown: [] as any[]
      };

      analyticsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        weeklyData.totalNewUsers += data.newUsers || 0;
        weeklyData.totalGenerations += data.totalGenerations || 0;
        weeklyData.totalCompletedGenerations += data.completedGenerations || 0;
        weeklyData.totalNewApps += data.newApps || 0;
        weeklyData.totalNewDeployments += data.newDeployments || 0;
        weeklyData.dailyBreakdown.push(data);
      });

      // Store weekly report
      await db.collection('weekly_reports').add({
        ...weeklyData,
        createdAt: new Date()
      });

      logger.info('Weekly usage report generated', weeklyData);

    } catch (error) {
      logger.error('Error generating usage reports:', error);
    }
  }
);