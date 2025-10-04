#!/usr/bin/env tsx

import { initializeApp } from 'firebase/app';
import { DatabaseHealthChecker } from './database-health-checker.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function main() {
  const outputFormat = process.argv.includes('--json') ? 'json' : 'text';
  const verbose = process.argv.includes('--verbose');

  try {
    console.log('🏥 Initializing Firebase Health Check...');
    const app = initializeApp(firebaseConfig);
    const healthChecker = new DatabaseHealthChecker(app);

    console.log('🔍 Running comprehensive database health check...');
    const report = await healthChecker.runHealthCheck();

    if (outputFormat === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      await healthChecker.printHealthReport(report);
      
      if (verbose) {
        console.log('\n🔧 RECOMMENDATIONS');
        
        for (const [checkName, result] of Object.entries(report.checks)) {
          if (result.status === 'warning' || result.status === 'critical') {
            console.log(`\n${checkName.toUpperCase()}:`);
            
            switch (checkName) {
              case 'system_settings':
                if (result.status === 'warning') {
                  console.log('  • Run database migrations to add missing system settings');
                  console.log('  • Command: npm run db:migrate');
                }
                break;
                
              case 'user_profiles':
                if (result.status === 'warning') {
                  console.log('  • Consider implementing profile completion prompts');
                  console.log('  • Add validation for required user fields');
                }
                break;
                
              case 'applications':
                if (result.status === 'warning' || result.status === 'critical') {
                  console.log('  • Investigate failed application generations');
                  console.log('  • Check AI provider status and API keys');
                  console.log('  • Review error logs for common failure patterns');
                }
                break;
                
              case 'chat_sessions':
                if (result.status === 'warning') {
                  console.log('  • Clean up orphaned chat sessions');
                  console.log('  • Implement session cleanup job');
                }
                break;
                
              case 'api_keys':
                if (result.status === 'warning') {
                  console.log('  • Notify users of expired API keys');
                  console.log('  • Implement automated key rotation reminders');
                }
                break;
                
              case 'analytics':
                if (result.status === 'warning') {
                  console.log('  • Check analytics collection service');
                  console.log('  • Verify daily analytics cron job is running');
                }
                break;
                
              case 'data_consistency':
                if (result.status === 'warning') {
                  console.log('  • Run data cleanup script for orphaned records');
                  console.log('  • Implement referential integrity checks');
                }
                break;
                
              case 'performance':
                if (result.status === 'warning') {
                  console.log('  • Review Firestore indexes for slow queries');
                  console.log('  • Consider database optimization');
                } else if (result.status === 'critical') {
                  console.log('  • Immediate investigation required for database performance');
                  console.log('  • Check Firebase console for quota limits');
                  console.log('  • Review network connectivity');
                }
                break;
            }
          }
        }
      }
    }

    // Exit with appropriate code
    const exitCode = report.overall === 'critical' ? 2 : 
                     report.overall === 'warning' ? 1 : 0;
    
    if (exitCode > 0) {
      console.log(`\n⚠️ Health check completed with ${report.overall} status (exit code: ${exitCode})`);
    }
    
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(3);
  }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🏥 Database Health Check Utility

Usage:
  npm run db:health                 - Run health check with text output
  npm run db:health -- --json       - Output results in JSON format
  npm run db:health -- --verbose    - Include detailed recommendations
  npm run db:health -- --help       - Show this help message

Exit Codes:
  0 - Healthy (all checks passed)
  1 - Warning (some issues found)
  2 - Critical (serious issues found)
  3 - Error (health check failed to run)

Examples:
  npm run db:health
  npm run db:health -- --json --verbose
  npm run db:health -- --json > health-report.json
  `);
  process.exit(0);
}

main();