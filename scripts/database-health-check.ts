import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Database validation and health check script for Stich Production
 * Validates schema compliance, data integrity, and performance
 */

interface ValidationResult {
  collection: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  documentCount: number;
}

interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  results: ValidationResult[];
  summary: {
    totalCollections: number;
    totalDocuments: number;
    passedValidations: number;
    failedValidations: number;
    warnings: number;
  };
}

async function validateUsersCollection(): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: 'users',
    passed: true,
    errors: [],
    warnings: [],
    documentCount: 0
  };

  try {
    const snapshot = await db.collection('users').limit(100).get();
    result.documentCount = snapshot.size;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Required fields validation
      const requiredFields = ['email', 'role', 'subscriptionTier', 'createdAt'];
      for (const field of requiredFields) {
        if (!data[field]) {
          result.errors.push(`Document ${doc.id} missing required field: ${field}`);
          result.passed = false;
        }
      }

      // Email validation
      if (data.email && !data.email.includes('@')) {
        result.errors.push(`Document ${doc.id} has invalid email format`);
        result.passed = false;
      }

      // Role validation
      if (data.role && !['user', 'admin'].includes(data.role)) {
        result.errors.push(`Document ${doc.id} has invalid role: ${data.role}`);
        result.passed = false;
      }

      // Subscription tier validation
      if (data.subscriptionTier && !['free', 'pro', 'enterprise'].includes(data.subscriptionTier)) {
        result.errors.push(`Document ${doc.id} has invalid subscription tier: ${data.subscriptionTier}`);
        result.passed = false;
      }

      // Check for orphaned data
      if (!data.updatedAt) {
        result.warnings.push(`Document ${doc.id} missing updatedAt field`);
      }

      // Check preferences structure
      if (data.preferences) {
        if (!data.preferences.theme || !['light', 'dark', 'system'].includes(data.preferences.theme)) {
          result.warnings.push(`Document ${doc.id} has invalid theme preference`);
        }
      }
    }

  } catch (error) {
    result.errors.push(`Failed to validate users collection: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateAppsCollection(): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: 'apps',
    passed: true,
    errors: [],
    warnings: [],
    documentCount: 0
  };

  try {
    const snapshot = await db.collection('apps').limit(100).get();
    result.documentCount = snapshot.size;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Required fields validation
      const requiredFields = ['name', 'userId', 'status', 'createdAt'];
      for (const field of requiredFields) {
        if (!data[field]) {
          result.errors.push(`Document ${doc.id} missing required field: ${field}`);
          result.passed = false;
        }
      }

      // Status validation
      const validStatuses = ['draft', 'generating', 'completed', 'deployed', 'failed'];
      if (data.status && !validStatuses.includes(data.status)) {
        result.errors.push(`Document ${doc.id} has invalid status: ${data.status}`);
        result.passed = false;
      }

      // Visibility validation
      if (data.visibility && !['private', 'public', 'unlisted'].includes(data.visibility)) {
        result.errors.push(`Document ${doc.id} has invalid visibility: ${data.visibility}`);
        result.passed = false;
      }

      // Check for user reference integrity
      if (data.userId) {
        try {
          const userDoc = await db.collection('users').doc(data.userId).get();
          if (!userDoc.exists) {
            result.errors.push(`Document ${doc.id} references non-existent user: ${data.userId}`);
            result.passed = false;
          }
        } catch (error) {
          result.warnings.push(`Could not verify user reference for app ${doc.id}`);
        }
      }

      // Check configuration structure
      if (data.config) {
        if (!data.config.framework) {
          result.warnings.push(`Document ${doc.id} missing framework in config`);
        }
        if (!data.config.language) {
          result.warnings.push(`Document ${doc.id} missing language in config`);
        }
      }
    }

  } catch (error) {
    result.errors.push(`Failed to validate apps collection: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateTemplatesCollection(): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: 'templates',
    passed: true,
    errors: [],
    warnings: [],
    documentCount: 0
  };

  try {
    const snapshot = await db.collection('templates').get();
    result.documentCount = snapshot.size;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Required fields validation
      const requiredFields = ['name', 'description', 'category', 'difficulty', 'status'];
      for (const field of requiredFields) {
        if (!data[field]) {
          result.errors.push(`Document ${doc.id} missing required field: ${field}`);
          result.passed = false;
        }
      }

      // Difficulty validation
      if (data.difficulty && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
        result.errors.push(`Document ${doc.id} has invalid difficulty: ${data.difficulty}`);
        result.passed = false;
      }

      // Status validation
      if (data.status && !['active', 'deprecated', 'beta'].includes(data.status)) {
        result.errors.push(`Document ${doc.id} has invalid status: ${data.status}`);
        result.passed = false;
      }

      // Check usage statistics structure
      if (data.usage) {
        if (typeof data.usage.timesUsed !== 'number' || data.usage.timesUsed < 0) {
          result.warnings.push(`Document ${doc.id} has invalid timesUsed value`);
        }
        if (typeof data.usage.successRate !== 'number' || data.usage.successRate < 0 || data.usage.successRate > 100) {
          result.warnings.push(`Document ${doc.id} has invalid successRate value`);
        }
      }

      // Check metadata structure
      if (data.metadata) {
        if (!data.metadata.version) {
          result.warnings.push(`Document ${doc.id} missing version in metadata`);
        }
        if (!data.metadata.author) {
          result.warnings.push(`Document ${doc.id} missing author in metadata`);
        }
      }
    }

  } catch (error) {
    result.errors.push(`Failed to validate templates collection: ${error}`);
    result.passed = false;
  }

  return result;
}

async function validateIndexes(): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: 'indexes',
    passed: true,
    errors: [],
    warnings: [],
    documentCount: 0
  };

  try {
    // Check if critical indexes exist by running test queries
    const testQueries = [
      { collection: 'users', field: 'email' },
      { collection: 'apps', field: 'userId' },
      { collection: 'apps', field: 'status' },
      { collection: 'templates', field: 'category' }
    ];

    for (const query of testQueries) {
      try {
        await db.collection(query.collection)
          .where(query.field, '>=', '')
          .limit(1)
          .get();
      } catch (error) {
        if (error.toString().includes('index')) {
          result.errors.push(`Missing index for ${query.collection}.${query.field}`);
          result.passed = false;
        }
      }
    }

    // Test composite indexes
    try {
      await db.collection('apps')
        .where('userId', '==', 'test')
        .where('status', '==', 'active')
        .limit(1)
        .get();
    } catch (error) {
      if (error.toString().includes('index')) {
        result.warnings.push('Missing composite index for apps userId+status queries');
      }
    }

  } catch (error) {
    result.errors.push(`Failed to validate indexes: ${error}`);
    result.passed = false;
  }

  return result;
}

async function checkPerformance(): Promise<ValidationResult> {
  const result: ValidationResult = {
    collection: 'performance',
    passed: true,
    errors: [],
    warnings: [],
    documentCount: 0
  };

  try {
    // Check collection sizes
    const collections = ['users', 'apps', 'templates', 'generation_logs'];
    
    for (const collectionName of collections) {
      const start = Date.now();
      const snapshot = await db.collection(collectionName).limit(1000).get();
      const queryTime = Date.now() - start;
      
      result.documentCount += snapshot.size;
      
      if (queryTime > 5000) { // 5 seconds
        result.errors.push(`Slow query detected in ${collectionName}: ${queryTime}ms`);
        result.passed = false;
      } else if (queryTime > 2000) { // 2 seconds
        result.warnings.push(`Slow query in ${collectionName}: ${queryTime}ms`);
      }
      
      // Check for large documents
      for (const doc of snapshot.docs) {
        const docSize = JSON.stringify(doc.data()).length;
        if (docSize > 1000000) { // 1MB
          result.errors.push(`Large document detected in ${collectionName}: ${doc.id} (${docSize} bytes)`);
          result.passed = false;
        } else if (docSize > 500000) { // 500KB
          result.warnings.push(`Large document in ${collectionName}: ${doc.id} (${docSize} bytes)`);
        }
      }
    }

  } catch (error) {
    result.errors.push(`Failed to check performance: ${error}`);
    result.passed = false;
  }

  return result;
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('🏥 Running database health check...');
  
  const results: ValidationResult[] = [];
  
  // Run all validations
  results.push(await validateUsersCollection());
  results.push(await validateAppsCollection());
  results.push(await validateTemplatesCollection());
  results.push(await validateIndexes());
  results.push(await checkPerformance());
  
  // Calculate summary
  const summary = {
    totalCollections: results.length,
    totalDocuments: results.reduce((sum, r) => sum + r.documentCount, 0),
    passedValidations: results.filter(r => r.passed).length,
    failedValidations: results.filter(r => !r.passed).length,
    warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
  };
  
  const overall = summary.failedValidations > 0 ? 'critical' : 
                 summary.warnings > 0 ? 'warning' : 'healthy';
  
  return { overall, results, summary };
}

function printHealthCheckReport(healthCheck: HealthCheckResult) {
  console.log('\n📊 Database Health Check Report');
  console.log('================================');
  
  // Overall status
  const statusEmoji = healthCheck.overall === 'healthy' ? '✅' : 
                     healthCheck.overall === 'warning' ? '⚠️' : '❌';
  console.log(`\n${statusEmoji} Overall Status: ${healthCheck.overall.toUpperCase()}`);
  
  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Collections Validated: ${healthCheck.summary.totalCollections}`);
  console.log(`  Total Documents: ${healthCheck.summary.totalDocuments}`);
  console.log(`  Passed Validations: ${healthCheck.summary.passedValidations}`);
  console.log(`  Failed Validations: ${healthCheck.summary.failedValidations}`);
  console.log(`  Warnings: ${healthCheck.summary.warnings}`);
  
  // Detailed results
  console.log('\n🔍 Detailed Results:');
  for (const result of healthCheck.results) {
    const emoji = result.passed ? '✅' : '❌';
    console.log(`\n${emoji} ${result.collection.toUpperCase()}`);
    console.log(`  Documents: ${result.documentCount}`);
    
    if (result.errors.length > 0) {
      console.log(`  ❌ Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`    • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log(`  ⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach(warning => console.log(`    • ${warning}`));
    }
    
    if (result.passed && result.errors.length === 0 && result.warnings.length === 0) {
      console.log('  ✅ All checks passed');
    }
  }
  
  // Recommendations
  if (healthCheck.overall !== 'healthy') {
    console.log('\n💡 Recommendations:');
    if (healthCheck.summary.failedValidations > 0) {
      console.log('  • Fix data integrity issues immediately');
      console.log('  • Review and update validation rules');
    }
    if (healthCheck.summary.warnings > 0) {
      console.log('  • Address performance and data quality warnings');
      console.log('  • Consider data cleanup and optimization');
    }
  }
}

async function main() {
  try {
    const healthCheck = await runHealthCheck();
    printHealthCheckReport(healthCheck);
    
    // Exit with appropriate code
    process.exit(healthCheck.overall === 'critical' ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

// Run the health check
if (require.main === module) {
  main();
}

export { runHealthCheck, printHealthCheckReport };