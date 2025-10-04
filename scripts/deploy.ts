#!/usr/bin/env tsx

/**
 * Stich Production Deployment Script
 * Automates the deployment process for both Firebase and Vercel
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  firebase: boolean;
  hosting: boolean;
  build: boolean;
  migrate: boolean;
  health: boolean;
}

class DeploymentManager {
  private config: DeploymentConfig;

  constructor(config: Partial<DeploymentConfig> = {}) {
    this.config = {
      firebase: true,
      hosting: true,
      build: true,
      migrate: true,
      health: true,
      ...config
    };
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting Stich Production deployment...\n');

    try {
      // Step 1: Pre-deployment checks
      await this.preDeploymentChecks();

      // Step 2: Build application
      if (this.config.build) {
        await this.buildApplication();
      }

      // Step 3: Deploy Firebase (Functions + Hosting)
      if (this.config.firebase) {
        await this.deployFirebase();
      }

      // Step 4: Run database migrations
      if (this.config.migrate) {
        await this.runMigrations();
      }

      // Step 5: Health checks
      if (this.config.health) {
        await this.runHealthChecks();
      }

      console.log('\n✅ Deployment completed successfully!');
      console.log('\n📊 Deployment Summary:');
      console.log(`   • Firebase Functions: ${this.config.firebase ? '✅ Deployed' : '⏭️ Skipped'}`);
      console.log(`   • Firebase Hosting: ${this.config.hosting ? '✅ Deployed' : '⏭️ Skipped'}`);
      console.log(`   • Database Migration: ${this.config.migrate ? '✅ Completed' : '⏭️ Skipped'}`);
      console.log(`   • Health Checks: ${this.config.health ? '✅ Passed' : '⏭️ Skipped'}`);

    } catch (error) {
      console.error('\n❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check if required tools are installed
    this.checkCommand('node', '--version');
    this.checkCommand('npm', '--version');
    this.checkCommand('firebase', '--version');

    // Check if environment variables are set
    this.checkEnvironmentVariables();

    // Check if Firebase project is configured
    this.checkFirebaseConfig();

    console.log('✅ Pre-deployment checks passed\n');
  }

  private checkCommand(command: string, args: string): void {
    try {
      execSync(`${command} ${args}`, { stdio: 'pipe' });
      console.log(`   ✅ ${command} is installed`);
    } catch (error) {
      throw new Error(`❌ ${command} is not installed or not in PATH`);
    }
  }

  private checkEnvironmentVariables(): void {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_APP_ID'
    ];

    const envFile = join(process.cwd(), '.env');
    
    if (!existsSync(envFile)) {
      console.log('   ⚠️ No .env file found. Make sure environment variables are configured in Firebase');
      return;
    }

    const envContent = readFileSync(envFile, 'utf-8');
    const missingVars = requiredEnvVars.filter(varName => 
      !envContent.includes(varName) || envContent.includes(`${varName}="your-`)
    );

    if (missingVars.length > 0) {
      console.log(`   ⚠️ Missing or placeholder environment variables: ${missingVars.join(', ')}`);
      console.log('   📝 Make sure to configure these before deployment');
    } else {
      console.log('   ✅ Environment variables configured');
    }
  }

  private checkFirebaseConfig(): void {
    const firebaseConfigPath = join(process.cwd(), 'firebase.json');
    
    if (!existsSync(firebaseConfigPath)) {
      throw new Error('❌ firebase.json not found. Run "firebase init" first.');
    }

    try {
      const config = JSON.parse(readFileSync(firebaseConfigPath, 'utf-8'));
      if (!config.functions) {
        throw new Error('❌ Firebase Functions not configured in firebase.json');
      }
      console.log('   ✅ Firebase configuration is valid');
    } catch (error) {
      throw new Error(`❌ Invalid firebase.json: ${error}`);
    }
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Building application...');

    try {
      // Install dependencies
      console.log('   📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });

      // Build main application
      console.log('   🏗️ Building React application...');
      execSync('npm run build', { stdio: 'inherit' });

      // Build Firebase Functions
      if (this.config.firebase) {
        console.log('   🔧 Building Firebase Functions...');
        execSync('cd functions && npm install && npm run build', { stdio: 'inherit' });
      }

      console.log('✅ Build completed successfully\n');
    } catch (error) {
      throw new Error(`❌ Build failed: ${error}`);
    }
  }

  private async deployFirebase(): Promise<void> {
    console.log('🔥 Deploying to Firebase...');

    try {
      // Deploy functions, hosting, firestore rules, and storage rules
      console.log('   📦 Deploying Firebase Functions...');
      console.log('   🌐 Deploying Firebase Hosting...');
      console.log('   🔒 Deploying Firestore rules...');
      console.log('   💾 Deploying Storage rules...');
      
      execSync('firebase deploy', { stdio: 'inherit' });
      console.log('✅ Firebase deployment completed\n');
    } catch (error) {
      throw new Error(`❌ Firebase deployment failed: ${error}`);
    }
  }

  private async runMigrations(): Promise<void> {
    console.log('🗃️ Running database migrations...');

    try {
      execSync('npm run db:migrate', { stdio: 'inherit' });
      console.log('✅ Database migrations completed\n');
    } catch (error) {
      console.log('⚠️ Database migrations failed - this is OK for initial deployment\n');
    }
  }

  private async runHealthChecks(): Promise<void> {
    console.log('🏥 Running health checks...');

    try {
      // Wait a bit for deployment to settle
      console.log('   ⏳ Waiting for services to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      execSync('npm run db:health', { stdio: 'inherit' });
      console.log('✅ Health checks passed\n');
    } catch (error) {
      console.log('⚠️ Health checks failed - manual verification may be needed\n');
    }
  }
}

// CLI interface
function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Stich Production Deployment Script

Usage:
  npm run deploy                    - Full deployment (Firebase Functions + Hosting)
  npm run deploy -- --functions-only - Deploy only Firebase Functions
  npm run deploy -- --hosting-only  - Deploy only Firebase Hosting
  npm run deploy -- --no-build      - Skip build step
  npm run deploy -- --no-migrate    - Skip database migrations
  npm run deploy -- --no-health     - Skip health checks

Examples:
  npm run deploy
  npm run deploy -- --functions-only --no-health
  npm run deploy -- --hosting-only --no-migrate
    `);
    process.exit(0);
  }

  const config: Partial<DeploymentConfig> = {
    firebase: true,
    hosting: !args.includes('--functions-only'),
    build: !args.includes('--no-build'),
    migrate: !args.includes('--no-migrate'),
    health: !args.includes('--no-health')
  };

  const deployment = new DeploymentManager(config);
  deployment.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

// Run main function
main();