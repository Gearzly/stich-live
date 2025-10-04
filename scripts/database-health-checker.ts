import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy, limit, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: any;
}

export interface DatabaseHealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: {
    [checkName: string]: HealthCheckResult;
  };
  statistics: {
    totalCollections: number;
    totalDocuments: number;
    collectionSizes: { [collection: string]: number };
  };
}

export class DatabaseHealthChecker {
  private db: Firestore;

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
  }

  async runHealthCheck(): Promise<DatabaseHealthReport> {
    console.log('🏥 Starting database health check...');

    const report: DatabaseHealthReport = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      statistics: {
        totalCollections: 0,
        totalDocuments: 0,
        collectionSizes: {}
      }
    };

    // Run all health checks
    const checks = [
      this.checkSystemSettings(),
      this.checkUserProfiles(),
      this.checkApplications(),
      this.checkChatSessions(),
      this.checkAPIKeys(),
      this.checkAnalytics(),
      this.checkDataConsistency(),
      this.checkPerformanceMetrics()
    ];

    const results = await Promise.allSettled(checks);

    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        const checkResult = result.value as { [key: string]: HealthCheckResult };
        const checkName = Object.keys(checkResult)[0];
        report.checks[checkName] = checkResult[checkName];
      } else {
        report.checks[`check_${i}_failed`] = {
          status: 'critical',
          message: `Health check failed: ${result.reason}`,
          details: { error: result.reason }
        };
      }
    }

    // Calculate overall statistics
    await this.calculateStatistics(report);

    // Determine overall health
    report.overall = this.calculateOverallHealth(report.checks);

    console.log(`🏥 Health check completed. Overall status: ${report.overall}`);
    return report;
  }

  private async checkSystemSettings(): Promise<{ system_settings: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(collection(this.db, 'system_settings'));
      const requiredSettings = [
        'app_name', 'app_version', 'maintenance_mode', 
        'max_free_generations', 'max_pro_generations',
        'supported_ai_providers', 'default_ai_provider'
      ];

      const existingSettings = snapshot.docs.map(doc => doc.id);
      const missingSettings = requiredSettings.filter(setting => 
        !existingSettings.includes(setting)
      );

      if (missingSettings.length > 0) {
        return {
          system_settings: {
            status: 'warning',
            message: `Missing system settings: ${missingSettings.join(', ')}`,
            details: { missing: missingSettings, total: snapshot.size }
          }
        };
      }

      return {
        system_settings: {
          status: 'healthy',
          message: `All ${snapshot.size} system settings are present`,
          details: { settings_count: snapshot.size }
        }
      };
    } catch (error) {
      return {
        system_settings: {
          status: 'critical',
          message: 'Failed to check system settings',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkUserProfiles(): Promise<{ user_profiles: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(collection(this.db, 'users'));
      let incompleteProfiles = 0;
      let premiumUsers = 0;
      let activeUsers = 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        
        // Check for incomplete profiles
        if (!userData.email || !userData.display_name) {
          incompleteProfiles++;
        }

        // Count premium users
        if (userData.is_premium || userData.subscription_tier === 'pro') {
          premiumUsers++;
        }

        // Count active users (logged in within last week)
        if (userData.last_login_at && userData.last_login_at.toDate() > oneWeekAgo) {
          activeUsers++;
        }
      }

      const healthLevel = incompleteProfiles > snapshot.size * 0.1 ? 'warning' : 'healthy';

      return {
        user_profiles: {
          status: healthLevel,
          message: `${snapshot.size} total users, ${incompleteProfiles} incomplete profiles`,
          details: {
            total_users: snapshot.size,
            incomplete_profiles: incompleteProfiles,
            premium_users: premiumUsers,
            active_users: activeUsers,
            completion_rate: ((snapshot.size - incompleteProfiles) / snapshot.size * 100).toFixed(1) + '%'
          }
        }
      };
    } catch (error) {
      return {
        user_profiles: {
          status: 'critical',
          message: 'Failed to check user profiles',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkApplications(): Promise<{ applications: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(collection(this.db, 'applications'));
      let failedApps = 0;
      let deployedApps = 0;
      let totalSize = 0;

      for (const doc of snapshot.docs) {
        const appData = doc.data();
        
        if (appData.status === 'failed' || appData.status === 'error') {
          failedApps++;
        }

        if (appData.deployed_url) {
          deployedApps++;
        }

        if (appData.file_size_bytes) {
          totalSize += appData.file_size_bytes;
        }
      }

      const failureRate = (failedApps / snapshot.size) * 100;
      const healthLevel = failureRate > 5 ? 'warning' : failureRate > 10 ? 'critical' : 'healthy';

      return {
        applications: {
          status: healthLevel,
          message: `${snapshot.size} total apps, ${failedApps} failed (${failureRate.toFixed(1)}%)`,
          details: {
            total_apps: snapshot.size,
            failed_apps: failedApps,
            deployed_apps: deployedApps,
            failure_rate: failureRate.toFixed(1) + '%',
            deployment_rate: ((deployedApps / snapshot.size) * 100).toFixed(1) + '%',
            total_size_mb: (totalSize / (1024 * 1024)).toFixed(2)
          }
        }
      };
    } catch (error) {
      return {
        applications: {
          status: 'critical',
          message: 'Failed to check applications',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkChatSessions(): Promise<{ chat_sessions: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(collection(this.db, 'chats'));
      let activeSessions = 0;
      let orphanedSessions = 0;

      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      for (const doc of snapshot.docs) {
        const chatData = doc.data();
        
        if (chatData.updated_at && chatData.updated_at.toDate() > twentyFourHoursAgo) {
          activeSessions++;
        }

        // Check for orphaned sessions (no associated user)
        if (!chatData.user_id) {
          orphanedSessions++;
        }
      }

      const orphanRate = (orphanedSessions / snapshot.size) * 100;
      const healthLevel = orphanRate > 5 ? 'warning' : 'healthy';

      return {
        chat_sessions: {
          status: healthLevel,
          message: `${snapshot.size} total chats, ${activeSessions} active in 24h`,
          details: {
            total_chats: snapshot.size,
            active_sessions: activeSessions,
            orphaned_sessions: orphanedSessions,
            orphan_rate: orphanRate.toFixed(1) + '%'
          }
        }
      };
    } catch (error) {
      return {
        chat_sessions: {
          status: 'critical',
          message: 'Failed to check chat sessions',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkAPIKeys(): Promise<{ api_keys: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(collection(this.db, 'user_api_keys'));
      let expiredKeys = 0;
      let providersUsed = new Set<string>();

      const now = new Date();

      for (const doc of snapshot.docs) {
        const keyData = doc.data();
        
        if (keyData.expires_at && keyData.expires_at.toDate() < now) {
          expiredKeys++;
        }

        if (keyData.provider) {
          providersUsed.add(keyData.provider);
        }
      }

      const expiredRate = (expiredKeys / snapshot.size) * 100;
      const healthLevel = expiredRate > 10 ? 'warning' : 'healthy';

      return {
        api_keys: {
          status: healthLevel,
          message: `${snapshot.size} API keys, ${expiredKeys} expired`,
          details: {
            total_keys: snapshot.size,
            expired_keys: expiredKeys,
            expired_rate: expiredRate.toFixed(1) + '%',
            providers_used: Array.from(providersUsed)
          }
        }
      };
    } catch (error) {
      return {
        api_keys: {
          status: 'warning',
          message: 'Failed to check API keys (collection may not exist)',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkAnalytics(): Promise<{ analytics: HealthCheckResult }> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, 'usage_analytics'),
          orderBy('date', 'desc'),
          limit(7)
        )
      );

      const today = new Date().toISOString().split('T')[0];
      const hasToday = snapshot.docs.some(doc => doc.id === today);

      if (!hasToday) {
        return {
          analytics: {
            status: 'warning',
            message: 'Missing analytics data for today',
            details: {
              recent_days: snapshot.size,
              has_today: false,
              last_update: snapshot.docs[0]?.id || 'none'
            }
          }
        };
      }

      return {
        analytics: {
          status: 'healthy',
          message: `Analytics up to date (${snapshot.size} recent days)`,
          details: {
            recent_days: snapshot.size,
            has_today: true,
            last_update: snapshot.docs[0]?.id
          }
        }
      };
    } catch (error) {
      return {
        analytics: {
          status: 'warning',
          message: 'Failed to check analytics',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkDataConsistency(): Promise<{ data_consistency: HealthCheckResult }> {
    try {
      // Check for users with apps but missing user records
      const appsSnapshot = await getDocs(collection(this.db, 'applications'));
      const usersSnapshot = await getDocs(collection(this.db, 'users'));
      
      const userIds = new Set(usersSnapshot.docs.map(doc => doc.id));
      const orphanedApps = appsSnapshot.docs.filter(doc => {
        const appData = doc.data();
        return appData.user_id && !userIds.has(appData.user_id);
      });

      if (orphanedApps.length > 0) {
        return {
          data_consistency: {
            status: 'warning',
            message: `Found ${orphanedApps.length} orphaned applications`,
            details: {
              orphaned_apps: orphanedApps.length,
              total_apps: appsSnapshot.size,
              orphan_rate: ((orphanedApps.length / appsSnapshot.size) * 100).toFixed(1) + '%'
            }
          }
        };
      }

      return {
        data_consistency: {
          status: 'healthy',
          message: 'No data consistency issues found',
          details: {
            checked_relationships: ['users_to_apps'],
            orphaned_records: 0
          }
        }
      };
    } catch (error) {
      return {
        data_consistency: {
          status: 'critical',
          message: 'Failed to check data consistency',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async checkPerformanceMetrics(): Promise<{ performance: HealthCheckResult }> {
    try {
      const startTime = Date.now();
      
      // Simple performance test: fetch a small collection
      const testQuery = query(collection(this.db, 'users'), limit(10));
      await getDocs(testQuery);
      
      const queryTime = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (queryTime > 2000) status = 'critical';
      else if (queryTime > 1000) status = 'warning';

      return {
        performance: {
          status,
          message: `Query response time: ${queryTime}ms`,
          details: {
            query_time_ms: queryTime,
            threshold_warning: 1000,
            threshold_critical: 2000
          }
        }
      };
    } catch (error) {
      return {
        performance: {
          status: 'critical',
          message: 'Performance check failed',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  private async calculateStatistics(report: DatabaseHealthReport): Promise<void> {
    const collections = [
      'users', 'applications', 'chats', 'generations',
      'system_settings', 'app_templates', 'user_api_keys',
      'github_integrations', 'usage_analytics'
    ];

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(this.db, collectionName));
        report.statistics.collectionSizes[collectionName] = snapshot.size;
        report.statistics.totalDocuments += snapshot.size;
      } catch (error) {
        // Collection might not exist
        report.statistics.collectionSizes[collectionName] = 0;
      }
    }

    report.statistics.totalCollections = Object.keys(report.statistics.collectionSizes).length;
  }

  private calculateOverallHealth(checks: { [checkName: string]: HealthCheckResult }): 'healthy' | 'warning' | 'critical' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  async printHealthReport(report: DatabaseHealthReport): Promise<void> {
    console.log('\n📋 DATABASE HEALTH REPORT');
    console.log('================================');
    console.log(`🕐 Generated: ${report.timestamp}`);
    console.log(`🎯 Overall Status: ${this.getStatusEmoji(report.overall)} ${report.overall.toUpperCase()}`);
    
    console.log('\n📊 STATISTICS');
    console.log(`Total Collections: ${report.statistics.totalCollections}`);
    console.log(`Total Documents: ${report.statistics.totalDocuments}`);
    
    console.log('\n📈 COLLECTION SIZES');
    for (const [collection, size] of Object.entries(report.statistics.collectionSizes)) {
      console.log(`  ${collection}: ${size} documents`);
    }

    console.log('\n🔍 HEALTH CHECKS');
    for (const [checkName, result] of Object.entries(report.checks)) {
      console.log(`${this.getStatusEmoji(result.status)} ${checkName}: ${result.message}`);
      if (result.details && result.status !== 'healthy') {
        console.log(`    Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    console.log('\n================================');
  }

  private getStatusEmoji(status: 'healthy' | 'warning' | 'critical'): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }
}