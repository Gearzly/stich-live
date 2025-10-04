import { BaseService } from './BaseService';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Analytics event types
export type AnalyticsEventType = 
  | 'app_created'
  | 'app_updated'
  | 'app_deleted'
  | 'app_deployed'
  | 'app_viewed'
  | 'app_starred'
  | 'app_unstarred'
  | 'app_forked'
  | 'app_exported'
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'user_login'
  | 'user_logout'
  | 'github_connected'
  | 'github_disconnected'
  | 'realtime_session_started'
  | 'realtime_session_ended'
  | 'file_edited'
  | 'chat_message_sent';

export interface AnalyticsEvent {
  id?: string;
  userId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    platform?: string;
    sessionId?: string;
    appId?: string;
    generationId?: string;
  };
  timestamp: Date;
}

export interface UserActivitySummary {
  userId: string;
  totalEvents: number;
  appsCreated: number;
  appsDeployed: number;
  appsStarred: number;
  appsForked: number;
  appsExported: number;
  generationsStarted: number;
  generationsCompleted: number;
  realtimeSessions: number;
  chatMessages: number;
  lastActiveAt: Date;
  firstActiveAt: Date;
  averageSessionDuration: number;
  topFrameworks: string[];
  topCategories: string[];
}

export interface ActivityTimeline {
  date: string;
  events: AnalyticsEvent[];
  eventCounts: Record<AnalyticsEventType, number>;
  totalEvents: number;
}

export interface UsageStats {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalGenerations: number;
  totalApps: number;
  popularFrameworks: Array<{ framework: string; count: number }>;
  popularCategories: Array<{ category: string; count: number }>;
  averageSessionDuration: number;
}

/**
 * Analytics Service
 * Handles user activity tracking, metrics collection, and analytics reporting
 */
export class AnalyticsService extends BaseService {
  protected db: any;

  constructor() {
    super();
    this.db = getFirestore();
  }

  /**
   * Track a user activity event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventDoc: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Store event in analytics collection
      await this.db.collection('analytics_events').add(eventDoc);

      // Update user activity summary
      await this.updateUserActivitySummary(event.userId, event.eventType, event.eventData);

      // Update real-time counters if needed
      await this.updateRealTimeCounters(event.eventType);

      this.logger.info('Analytics event tracked', {
        userId: event.userId,
        eventType: event.eventType,
        appId: event.metadata.appId,
      });
    } catch (error) {
      this.logger.error('Failed to track analytics event', {
        userId: event.userId,
        eventType: event.eventType,
        error,
      });
      // Don't throw error as analytics shouldn't break main functionality
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<UserActivitySummary | null> {
    try {
      const summaryDoc = await this.db
        .collection('user_activity_summaries')
        .doc(userId)
        .get();

      if (!summaryDoc.exists) {
        // Generate summary from events if it doesn't exist
        return await this.generateUserActivitySummary(userId);
      }

      const data = summaryDoc.data();
      return {
        ...data,
        lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
        firstActiveAt: data.firstActiveAt?.toDate() || new Date(),
      } as UserActivitySummary;
    } catch (error) {
      this.logger.error('Failed to get user activity summary', { userId, error });
      return null;
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 50
  ): Promise<ActivityTimeline[]> {
    try {
      const events = await this.db
        .collection('analytics_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      // Group events by date
      const timelineMap = new Map<string, AnalyticsEvent[]>();
      
      events.docs.forEach(doc => {
        const event = { id: doc.id, ...doc.data() } as AnalyticsEvent;
        const timestamp = event.timestamp as any;
        event.timestamp = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        
        const dateKey = event.timestamp.toISOString().split('T')[0];
        
        if (!timelineMap.has(dateKey)) {
          timelineMap.set(dateKey, []);
        }
        timelineMap.get(dateKey)!.push(event);
      });

      // Convert to timeline format
      const timeline: ActivityTimeline[] = [];
      
      for (const [date, dayEvents] of timelineMap) {
        const eventCounts: Record<AnalyticsEventType, number> = {} as any;
        
        dayEvents.forEach(event => {
          eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
        });

        timeline.push({
          date,
          events: dayEvents,
          eventCounts,
          totalEvents: dayEvents.length,
        });
      }

      return timeline.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      this.logger.error('Failed to get user activity timeline', { userId, error });
      return [];
    }
  }

  /**
   * Get user generation statistics
   */
  async getUserGenerationStats(userId: string): Promise<{
    totalGenerations: number;
    completedGenerations: number;
    failedGenerations: number;
    averageGenerationTime: number;
    frameworkBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    recentGenerations: any[];
  }> {
    try {
      // Get generation events
      const generationEvents = await this.db
        .collection('analytics_events')
        .where('userId', '==', userId)
        .where('eventType', 'in', ['generation_started', 'generation_completed', 'generation_failed'])
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const events = generationEvents.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      // Calculate statistics
      const totalGenerations = events.filter(e => e.eventType === 'generation_started').length;
      const completedGenerations = events.filter(e => e.eventType === 'generation_completed').length;
      const failedGenerations = events.filter(e => e.eventType === 'generation_failed').length;

      // Framework and category breakdown
      const frameworkBreakdown: Record<string, number> = {};
      const categoryBreakdown: Record<string, number> = {};

      events.forEach(event => {
        if (event.eventData?.framework) {
          frameworkBreakdown[event.eventData.framework] = (frameworkBreakdown[event.eventData.framework] || 0) + 1;
        }
        if (event.eventData?.category) {
          categoryBreakdown[event.eventData.category] = (categoryBreakdown[event.eventData.category] || 0) + 1;
        }
      });

      // Recent generations (last 10)
      const recentGenerations = events
        .filter(e => e.eventType === 'generation_started')
        .slice(0, 10);

      return {
        totalGenerations,
        completedGenerations,
        failedGenerations,
        averageGenerationTime: 0, // TODO: Calculate from start/complete pairs
        frameworkBreakdown,
        categoryBreakdown,
        recentGenerations,
      };
    } catch (error) {
      this.logger.error('Failed to get user generation stats', { userId, error });
      return {
        totalGenerations: 0,
        completedGenerations: 0,
        failedGenerations: 0,
        averageGenerationTime: 0,
        frameworkBreakdown: {},
        categoryBreakdown: {},
        recentGenerations: [],
      };
    }
  }

  /**
   * Get platform usage statistics (admin only)
   */
  async getPlatformUsageStats(startDate: Date, endDate: Date): Promise<UsageStats> {
    try {
      const events = await this.db
        .collection('analytics_events')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const uniqueUsers = new Set<string>();
      const frameworks: Record<string, number> = {};
      const categories: Record<string, number> = {};
      let totalGenerations = 0;
      let totalApps = 0;

      events.docs.forEach(doc => {
        const event = doc.data();
        uniqueUsers.add(event.userId);

        if (event.eventType === 'generation_started') {
          totalGenerations++;
        }
        if (event.eventType === 'app_created') {
          totalApps++;
        }

        if (event.eventData?.framework) {
          frameworks[event.eventData.framework] = (frameworks[event.eventData.framework] || 0) + 1;
        }
        if (event.eventData?.category) {
          categories[event.eventData.category] = (categories[event.eventData.category] || 0) + 1;
        }
      });

      // Convert to sorted arrays
      const popularFrameworks = Object.entries(frameworks)
        .map(([framework, count]) => ({ framework, count }))
        .sort((a, b) => b.count - a.count);

      const popularCategories = Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        dailyActiveUsers: uniqueUsers.size,
        weeklyActiveUsers: uniqueUsers.size,
        monthlyActiveUsers: uniqueUsers.size,
        totalGenerations,
        totalApps,
        popularFrameworks,
        popularCategories,
        averageSessionDuration: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get platform usage stats', { error });
      throw new Error('Failed to get platform usage statistics');
    }
  }

  /**
   * Update user activity summary
   */
  private async updateUserActivitySummary(
    userId: string,
    eventType: AnalyticsEventType,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const summaryRef = this.db.collection('user_activity_summaries').doc(userId);
      
      const updateData: any = {
        userId,
        lastActiveAt: new Date(),
        totalEvents: FieldValue.increment(1),
      };

      // Set first active date if new user
      const summaryDoc = await summaryRef.get();
      if (!summaryDoc.exists) {
        updateData.firstActiveAt = new Date();
      }

      // Update specific counters based on event type
      switch (eventType) {
        case 'app_created':
          updateData.appsCreated = FieldValue.increment(1);
          break;
        case 'app_deployed':
          updateData.appsDeployed = FieldValue.increment(1);
          break;
        case 'app_starred':
          updateData.appsStarred = FieldValue.increment(1);
          break;
        case 'app_forked':
          updateData.appsForked = FieldValue.increment(1);
          break;
        case 'app_exported':
          updateData.appsExported = FieldValue.increment(1);
          break;
        case 'generation_started':
          updateData.generationsStarted = FieldValue.increment(1);
          break;
        case 'generation_completed':
          updateData.generationsCompleted = FieldValue.increment(1);
          break;
        case 'realtime_session_started':
          updateData.realtimeSessions = FieldValue.increment(1);
          break;
        case 'chat_message_sent':
          updateData.chatMessages = FieldValue.increment(1);
          break;
      }

      // Update framework and category arrays
      if (eventData.framework) {
        updateData.topFrameworks = FieldValue.arrayUnion(eventData.framework);
      }
      if (eventData.category) {
        updateData.topCategories = FieldValue.arrayUnion(eventData.category);
      }

      await summaryRef.set(updateData, { merge: true });
    } catch (error) {
      this.logger.error('Failed to update user activity summary', { userId, eventType, error });
    }
  }

  /**
   * Generate user activity summary from events
   */
  private async generateUserActivitySummary(userId: string): Promise<UserActivitySummary | null> {
    try {
      const events = await this.db
        .collection('analytics_events')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get();

      if (events.empty) {
        return null;
      }

      const eventDocs = events.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      const firstEvent = eventDocs[0];
      const lastEvent = eventDocs[eventDocs.length - 1];

      const summary: UserActivitySummary = {
        userId,
        totalEvents: eventDocs.length,
        appsCreated: eventDocs.filter(e => e.eventType === 'app_created').length,
        appsDeployed: eventDocs.filter(e => e.eventType === 'app_deployed').length,
        appsStarred: eventDocs.filter(e => e.eventType === 'app_starred').length,
        appsForked: eventDocs.filter(e => e.eventType === 'app_forked').length,
        appsExported: eventDocs.filter(e => e.eventType === 'app_exported').length,
        generationsStarted: eventDocs.filter(e => e.eventType === 'generation_started').length,
        generationsCompleted: eventDocs.filter(e => e.eventType === 'generation_completed').length,
        realtimeSessions: eventDocs.filter(e => e.eventType === 'realtime_session_started').length,
        chatMessages: eventDocs.filter(e => e.eventType === 'chat_message_sent').length,
        lastActiveAt: lastEvent.timestamp,
        firstActiveAt: firstEvent.timestamp,
        averageSessionDuration: 0,
        topFrameworks: [...new Set(eventDocs.map(e => e.eventData?.framework).filter(Boolean))] as string[],
        topCategories: [...new Set(eventDocs.map(e => e.eventData?.category).filter(Boolean))] as string[],
      };

      // Save generated summary
      await this.db.collection('user_activity_summaries').doc(userId).set(summary);

      return summary;
    } catch (error) {
      this.logger.error('Failed to generate user activity summary', { userId, error });
      return null;
    }
  }

  /**
   * Update real-time counters for dashboard
   */
  private async updateRealTimeCounters(eventType: AnalyticsEventType): Promise<void> {
    try {
      const countersRef = this.db.collection('platform_stats').doc('realtime_counters');
      
      const updateData: any = {
        lastUpdated: new Date(),
      };

      switch (eventType) {
        case 'app_created':
          updateData.totalApps = FieldValue.increment(1);
          break;
        case 'generation_started':
          updateData.totalGenerations = FieldValue.increment(1);
          break;
        case 'user_login':
          updateData.activeUsers = FieldValue.increment(1);
          break;
        case 'github_connected':
          updateData.githubConnections = FieldValue.increment(1);
          break;
      }

      if (Object.keys(updateData).length > 1) {
        await countersRef.set(updateData, { merge: true });
      }
    } catch (error) {
      this.logger.error('Failed to update real-time counters', { eventType, error });
    }
  }

  /**
   * Clean up old analytics events (for data retention)
   */
  async cleanupOldEvents(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldEvents = await this.db
        .collection('analytics_events')
        .where('timestamp', '<', cutoffDate)
        .limit(500)
        .get();

      if (!oldEvents.empty) {
        const batch = this.db.batch();
        oldEvents.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        this.logger.info('Cleaned up old analytics events', { 
          deletedCount: oldEvents.docs.length,
          cutoffDate: cutoffDate.toISOString(),
        });
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old analytics events', { error });
    }
  }
}