import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface BackupData {
  collections: {
    [collectionName: string]: {
      [docId: string]: any;
    };
  };
  metadata: {
    timestamp: string;
    version: string;
    totalDocuments: number;
  };
}

export class DatabaseBackupService {
  private db: Firestore;

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
  }

  async createBackup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `firestore-backup-${timestamp}.json`;
    const filePath = backupPath ? join(backupPath, fileName) : fileName;

    console.log('Creating Firestore backup...');

    const backup: BackupData = {
      collections: {},
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        totalDocuments: 0
      }
    };

    // List of collections to backup
    const collectionsToBackup = [
      'users',
      'applications',
      'chats',
      'generations',
      'system_settings',
      'app_templates',
      'user_api_keys',
      'github_integrations',
      'usage_analytics',
      'app_analytics',
      'error_logs',
      'feedback',
      'notifications',
      'billing_events',
      'usage_quotas'
    ];

    let totalDocuments = 0;

    for (const collectionName of collectionsToBackup) {
      console.log(`Backing up collection: ${collectionName}`);
      
      try {
        const snapshot = await getDocs(collection(this.db, collectionName));
        const collectionData: { [docId: string]: any } = {};

        snapshot.forEach(doc => {
          collectionData[doc.id] = doc.data();
          totalDocuments++;
        });

        backup.collections[collectionName] = collectionData;
        console.log(`  ✅ ${snapshot.size} documents backed up from ${collectionName}`);
      } catch (error) {
        console.warn(`  ⚠️ Could not backup collection ${collectionName}:`, error);
        backup.collections[collectionName] = {};
      }
    }

    backup.metadata.totalDocuments = totalDocuments;

    // Write backup to file
    await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup completed: ${filePath}`);
    console.log(`📊 Total documents backed up: ${totalDocuments}`);

    return filePath;
  }

  async restoreBackup(backupFilePath: string, options: {
    clearExisting?: boolean;
    collectionsToRestore?: string[];
    dryRun?: boolean;
  } = {}): Promise<void> {
    const { clearExisting = false, collectionsToRestore, dryRun = false } = options;

    console.log(`${dryRun ? '[DRY RUN] ' : ''}Restoring Firestore backup from: ${backupFilePath}`);

    // Read backup file
    const backupContent = await fs.readFile(backupFilePath, 'utf-8');
    const backup: BackupData = JSON.parse(backupContent);

    console.log(`Backup metadata:`, backup.metadata);

    const collections = collectionsToRestore || Object.keys(backup.collections);

    for (const collectionName of collections) {
      const collectionData = backup.collections[collectionName];
      
      if (!collectionData) {
        console.warn(`Collection ${collectionName} not found in backup`);
        continue;
      }

      console.log(`${dryRun ? '[DRY RUN] ' : ''}Restoring collection: ${collectionName}`);

      if (clearExisting && !dryRun) {
        // Clear existing documents
        const existingDocs = await getDocs(collection(this.db, collectionName));
        const batch = writeBatch(this.db);
        
        existingDocs.forEach(doc => {
          batch.delete(doc.ref);
        });

        if (existingDocs.size > 0) {
          await batch.commit();
          console.log(`  🗑️ Cleared ${existingDocs.size} existing documents`);
        }
      }

      // Restore documents in batches
      const docIds = Object.keys(collectionData);
      const batchSize = 500; // Firestore batch limit
      
      for (let i = 0; i < docIds.length; i += batchSize) {
        const batch = writeBatch(this.db);
        const batchDocIds = docIds.slice(i, i + batchSize);

        for (const docId of batchDocIds) {
          const docData = collectionData[docId];
          const docRef = doc(this.db, collectionName, docId);
          
          if (!dryRun) {
            batch.set(docRef, docData);
          }
        }

        if (!dryRun && batchDocIds.length > 0) {
          await batch.commit();
        }

        console.log(`  ${dryRun ? '[DRY RUN] ' : ''}✅ Batch ${Math.floor(i / batchSize) + 1}: ${batchDocIds.length} documents`);
      }

      console.log(`  📊 Total documents in ${collectionName}: ${docIds.length}`);
    }

    console.log(`${dryRun ? '[DRY RUN] ' : ''}✅ Restore completed!`);
  }

  async validateBackup(backupFilePath: string): Promise<boolean> {
    try {
      console.log('Validating backup file...');
      
      const backupContent = await fs.readFile(backupFilePath, 'utf-8');
      const backup: BackupData = JSON.parse(backupContent);

      // Check required structure
      if (!backup.collections || !backup.metadata) {
        console.error('❌ Invalid backup structure: missing collections or metadata');
        return false;
      }

      // Validate metadata
      const { timestamp, version, totalDocuments } = backup.metadata;
      if (!timestamp || !version || typeof totalDocuments !== 'number') {
        console.error('❌ Invalid backup metadata');
        return false;
      }

      // Count documents
      let actualDocCount = 0;
      for (const collectionName of Object.keys(backup.collections)) {
        const collection = backup.collections[collectionName];
        actualDocCount += Object.keys(collection).length;
      }

      if (actualDocCount !== totalDocuments) {
        console.warn(`⚠️ Document count mismatch: expected ${totalDocuments}, found ${actualDocCount}`);
      }

      console.log('✅ Backup validation passed');
      console.log(`📊 Collections: ${Object.keys(backup.collections).length}`);
      console.log(`📊 Documents: ${actualDocCount}`);
      console.log(`📅 Created: ${timestamp}`);

      return true;
    } catch (error) {
      console.error('❌ Backup validation failed:', error);
      return false;
    }
  }

  async listBackups(backupDirectory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(backupDirectory);
      const backupFiles = files.filter(file => 
        file.startsWith('firestore-backup-') && file.endsWith('.json')
      );

      console.log(`Found ${backupFiles.length} backup files:`);
      for (const file of backupFiles) {
        console.log(`  📄 ${file}`);
      }

      return backupFiles.map(file => join(backupDirectory, file));
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async cleanupOldBackups(backupDirectory: string, keepCount: number = 5): Promise<void> {
    const backupFiles = await this.listBackups(backupDirectory);
    
    if (backupFiles.length <= keepCount) {
      console.log(`No cleanup needed. Current backups: ${backupFiles.length}, Keep: ${keepCount}`);
      return;
    }

    // Sort by creation time (newest first)
    const sortedFiles = backupFiles.sort().reverse();
    const filesToDelete = sortedFiles.slice(keepCount);

    console.log(`Cleaning up ${filesToDelete.length} old backup files...`);

    for (const file of filesToDelete) {
      try {
        await fs.unlink(file);
        console.log(`  🗑️ Deleted: ${file}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete ${file}:`, error);
      }
    }

    console.log('✅ Backup cleanup completed');
  }
}