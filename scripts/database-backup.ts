#!/usr/bin/env tsx

import { initializeApp } from 'firebase/app';
import { DatabaseBackupService } from './database-backup-service.js';
import { join } from 'path';

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
  const command = process.argv[2];
  const backupDir = join(process.cwd(), 'backups');

  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const backupService = new DatabaseBackupService(app);

    switch (command) {
      case 'create':
      case 'backup':
        console.log('🗂️ Creating database backup...');
        const backupPath = await backupService.createBackup(backupDir);
        console.log(`✅ Backup created: ${backupPath}`);
        break;

      case 'restore':
        const restoreFile = process.argv[3];
        if (!restoreFile) {
          console.error('❌ Please provide backup file path: npm run db:backup restore <backup-file>');
          process.exit(1);
        }
        
        const clearExisting = process.argv.includes('--clear');
        const dryRun = process.argv.includes('--dry-run');
        
        console.log(`🔄 Restoring database from: ${restoreFile}`);
        if (dryRun) console.log('🧪 DRY RUN MODE - No changes will be made');
        
        await backupService.restoreBackup(restoreFile, { 
          clearExisting, 
          dryRun 
        });
        break;

      case 'validate':
        const validateFile = process.argv[3];
        if (!validateFile) {
          console.error('❌ Please provide backup file path: npm run db:backup validate <backup-file>');
          process.exit(1);
        }
        
        console.log(`🔍 Validating backup: ${validateFile}`);
        const isValid = await backupService.validateBackup(validateFile);
        process.exit(isValid ? 0 : 1);
        break;

      case 'list':
        console.log('📋 Listing available backups...');
        await backupService.listBackups(backupDir);
        break;

      case 'cleanup':
        const keepCount = parseInt(process.argv[3]) || 5;
        console.log(`🧹 Cleaning up old backups (keeping ${keepCount} most recent)...`);
        await backupService.cleanupOldBackups(backupDir, keepCount);
        break;

      default:
        console.log(`
📦 Database Backup Utility

Usage:
  npm run db:backup create              - Create a new backup
  npm run db:backup restore <file>      - Restore from backup
  npm run db:backup restore <file> --clear --dry-run
  npm run db:backup validate <file>     - Validate backup file
  npm run db:backup list                - List available backups
  npm run db:backup cleanup [count]     - Clean up old backups (default: keep 5)

Options:
  --clear     Clear existing data before restore
  --dry-run   Preview restore without making changes

Examples:
  npm run db:backup create
  npm run db:backup restore backups/firestore-backup-2024-01-15.json
  npm run db:backup cleanup 3
        `);
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database backup operation failed:', error);
    process.exit(1);
  }
}

main();
