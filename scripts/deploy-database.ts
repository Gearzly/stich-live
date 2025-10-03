#!/usr/bin/env node

/**
 * Database deployment script for Stich Production
 * Deploys Firestore rules, indexes, and seeds initial data
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'stich-production';

function runCommand(command: string, description: string) {
  console.log(`\n🚀 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: PROJECT_ROOT });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    process.exit(1);
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is installed');
  } catch (error) {
    console.error('❌ Firebase CLI is not installed. Please install it with:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
  
  // Check if firebase.json exists
  if (!existsSync(join(PROJECT_ROOT, 'firebase.json'))) {
    console.error('❌ firebase.json not found. Please run from project root.');
    process.exit(1);
  }
  
  // Check if firestore.rules exists
  if (!existsSync(join(PROJECT_ROOT, 'firestore.rules'))) {
    console.error('❌ firestore.rules not found.');
    process.exit(1);
  }
  
  // Check if firestore.indexes.json exists
  if (!existsSync(join(PROJECT_ROOT, 'firestore.indexes.json'))) {
    console.error('❌ firestore.indexes.json not found.');
    process.exit(1);
  }
  
  console.log('✅ All prerequisites met');
}

function deployFirestoreRules() {
  runCommand(
    `firebase deploy --only firestore:rules --project ${FIREBASE_PROJECT}`,
    'Deploying Firestore security rules'
  );
}

function deployFirestoreIndexes() {
  runCommand(
    `firebase deploy --only firestore:indexes --project ${FIREBASE_PROJECT}`,
    'Deploying Firestore indexes'
  );
}

function seedDatabase() {
  console.log('\n🌱 Seeding database with initial data...');
  
  // Check if seed script exists
  const seedScriptPath = join(PROJECT_ROOT, 'scripts', 'seed-database.ts');
  if (!existsSync(seedScriptPath)) {
    console.log('⚠️  Seed script not found, skipping database seeding');
    return;
  }
  
  runCommand(
    'npx tsx scripts/seed-database.ts',
    'Running database seed script'
  );
}

function verifyDeployment() {
  console.log('\n🔍 Verifying deployment...');
  
  try {
    // Check Firestore rules
    execSync(
      `firebase firestore:rules get --project ${FIREBASE_PROJECT}`,
      { stdio: 'pipe' }
    );
    console.log('✅ Firestore rules deployed successfully');
    
    // List indexes
    const indexOutput = execSync(
      `firebase firestore:indexes --project ${FIREBASE_PROJECT}`,
      { encoding: 'utf8' }
    );
    
    if (indexOutput.includes('No indexes')) {
      console.log('⚠️  No indexes found - they may still be building');
    } else {
      console.log('✅ Firestore indexes deployed successfully');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

function printPostDeploymentInfo() {
  console.log('\n🎉 Database deployment completed!');
  console.log('\n📋 Post-deployment checklist:');
  console.log('1. Verify Firestore rules in Firebase Console');
  console.log('2. Check index building progress in Firebase Console');
  console.log('3. Test authentication and data access');
  console.log('4. Monitor performance and costs');
  console.log('\n🔗 Firebase Console:');
  console.log(`https://console.firebase.google.com/project/${FIREBASE_PROJECT}/firestore`);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed');
  const rulesOnly = args.includes('--rules-only');
  const indexesOnly = args.includes('--indexes-only');
  
  console.log('🏗️  Stich Production Database Deployment');
  console.log(`📊 Target Project: ${FIREBASE_PROJECT}`);
  
  checkPrerequisites();
  
  if (indexesOnly) {
    deployFirestoreIndexes();
  } else if (rulesOnly) {
    deployFirestoreRules();
  } else {
    // Deploy everything
    deployFirestoreRules();
    deployFirestoreIndexes();
  }
  
  if (shouldSeed) {
    seedDatabase();
  }
  
  verifyDeployment();
  printPostDeploymentInfo();
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
}

export { main as deployDatabase };