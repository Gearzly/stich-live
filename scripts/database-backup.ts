#!/usr/bin/env node

/**
 * Database backup and restore script for Stich Production
 * Handles Firestore data backup and restoration
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();
const FIREBASE_PROJECT = process.env.FIREBASE_PROJECT || 'stich-production';
const BACKUP_DIR = join(PROJECT_ROOT, 'backups');

function runCommand(command: string, description: string): string {
  console.log(`\n🚀 ${description}...`);
  try {
    const output = execSync(command, { 
      stdio: ['inherit', 'pipe', 'inherit'], 
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    process.exit(1);
  }
}

function ensureBackupDirectory() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

function generateBackupFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `firestore-backup-${timestamp}.json`;
}

function backupDatabase() {
  ensureBackupDirectory();
  
  const backupFileName = generateBackupFileName();
  const backupPath = join(BACKUP_DIR, backupFileName);
  
  console.log(`📦 Creating backup: ${backupFileName}`);
  
  // Use Firebase CLI to export Firestore data
  runCommand(
    `firebase firestore:export ${BACKUP_DIR} --project ${FIREBASE_PROJECT}`,
    'Exporting Firestore data'
  );
  
  console.log(`✅ Backup completed: ${backupPath}`);
  return backupPath;
}

function listBackups() {
  ensureBackupDirectory();
  
  console.log('\n📋 Available backups:');
  
  try {
    const files = execSync(`ls -la ${BACKUP_DIR}`, { encoding: 'utf8' });
    console.log(files);
  } catch (error) {
    console.log('No backups found in backup directory');
  }
}

function restoreDatabase(backupPath?: string) {
  if (!backupPath) {
    console.error('❌ Backup path is required for restore operation');
    console.log('Usage: npm run db:restore <backup-path>');
    process.exit(1);
  }
  
  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }
  
  console.log(`🔄 Restoring from backup: ${backupPath}`);
  console.log('⚠️  WARNING: This will overwrite existing data!');
  
  // In production, you might want to add a confirmation prompt here
  
  runCommand(
    `firebase firestore:import ${backupPath} --project ${FIREBASE_PROJECT}`,
    'Importing Firestore data'
  );
  
  console.log('✅ Database restore completed');
}

function clearDatabase() {
  console.log('🗑️  WARNING: This will delete ALL data in Firestore!');
  console.log('This operation cannot be undone.');
  
  // In production, add confirmation prompt
  
  runCommand(
    `firebase firestore:delete --all-collections --project ${FIREBASE_PROJECT} --yes`,
    'Clearing Firestore database'
  );
  
  console.log('✅ Database cleared');
}

function showUsage() {
  console.log('\n📖 Database Backup & Restore Usage:');
  console.log('');
  console.log('Available commands:');
  console.log('  npm run db:backup          - Create a new backup');
  console.log('  npm run db:restore <path>  - Restore from backup');
  console.log('  npm run db:list-backups    - List available backups');
  console.log('  npm run db:clear           - Clear all database data');
  console.log('');
  console.log('Examples:');
  console.log('  npm run db:backup');
  console.log('  npm run db:restore ./backups/firestore-backup-2024-01-01.json');
  console.log('  npm run db:list-backups');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🗄️  Stich Production Database Management');
  console.log(`📊 Target Project: ${FIREBASE_PROJECT}`);
  
  switch (command) {
    case 'backup':
      backupDatabase();
      break;
      
    case 'restore':
      const backupPath = args[1];
      restoreDatabase(backupPath);
      break;
      
    case 'list':
    case 'list-backups':
      listBackups();
      break;
      
    case 'clear':
      clearDatabase();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showUsage();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  });
}

export { backupDatabase, restoreDatabase, clearDatabase, listBackups };