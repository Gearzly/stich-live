import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, limit, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';

export interface DatabaseMigration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class DatabaseMigrationService {
  private db: Firestore;

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
  }

  async getCurrentVersion(): Promise<string> {
    try {
      const versionDoc = await getDoc(doc(this.db, 'system', 'migration_version'));
      return versionDoc.exists() ? versionDoc.data().version : '0.0.0';
    } catch (error) {
      console.error('Error getting current migration version:', error);
      return '0.0.0';
    }
  }

  async setVersion(version: string): Promise<void> {
    await setDoc(doc(this.db, 'system', 'migration_version'), {
      version,
      updated_at: new Date(),
    });
  }

  async runMigrations(migrations: DatabaseMigration[]): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);

    const pendingMigrations = migrations.filter(m => 
      this.compareVersions(m.version, currentVersion) > 0
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} migrations...`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        await this.setVersion(migration.version);
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;
      
      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }
    
    return 0;
  }
}

// Define migrations for Firestore
export const firestoreMigrations: DatabaseMigration[] = [
  {
    version: '1.0.0',
    description: 'Initialize enhanced user profiles and system collections',
    up: async () => {
      const db = getFirestore();
      
      // Create system settings collection
      const systemSettings = [
        { key: 'app_name', value: 'Stich Production', description: 'Application name', is_public: true },
        { key: 'app_version', value: '1.0.0', description: 'Current application version', is_public: true },
        { key: 'maintenance_mode', value: false, description: 'Whether the app is in maintenance mode', is_public: false },
        { key: 'max_free_generations', value: 10, description: 'Maximum generations for free users per month', is_public: false },
        { key: 'max_pro_generations', value: 1000, description: 'Maximum generations for pro users per month', is_public: false },
        { key: 'supported_ai_providers', value: ['openai', 'anthropic', 'google', 'cerebras'], description: 'List of supported AI providers', is_public: true },
        { key: 'default_ai_provider', value: 'openai', description: 'Default AI provider for new users', is_public: true },
        { key: 'github_oauth_enabled', value: true, description: 'Whether GitHub OAuth is enabled', is_public: true },
        { key: 'google_oauth_enabled', value: true, description: 'Whether Google OAuth is enabled', is_public: true }
      ];

      for (const setting of systemSettings) {
        await setDoc(doc(db, 'system_settings', setting.key), {
          ...setting,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      // Create app templates collection
      const appTemplates = [
        {
          name: 'React Dashboard',
          description: 'A modern React dashboard with charts and data visualization',
          category: 'frontend',
          framework: 'react',
          language: 'typescript',
          difficulty: 'intermediate',
          prompt_template: 'Create a React dashboard application with {features} using TypeScript and modern UI components',
          file_structure: { src: { components: [], pages: [], hooks: [], utils: [] } },
          tags: ['react', 'dashboard', 'typescript', 'charts'],
          is_public: true,
          is_featured: true,
          usage_count: 0,
          like_count: 0
        },
        {
          name: 'Next.js Blog',
          description: 'A full-stack blog application built with Next.js',
          category: 'fullstack',
          framework: 'nextjs',
          language: 'typescript',
          difficulty: 'beginner',
          prompt_template: 'Build a blog application using Next.js with {features} and modern styling',
          file_structure: { pages: [], components: [], styles: [], lib: [] },
          tags: ['nextjs', 'blog', 'typescript', 'fullstack'],
          is_public: true,
          is_featured: true,
          usage_count: 0,
          like_count: 0
        },
        {
          name: 'Express API',
          description: 'A RESTful API built with Express.js and TypeScript',
          category: 'backend',
          framework: 'express',
          language: 'typescript',
          difficulty: 'intermediate',
          prompt_template: 'Create an Express.js API with {endpoints} using TypeScript and best practices',
          file_structure: { src: { routes: [], controllers: [], middleware: [], models: [] } },
          tags: ['express', 'api', 'typescript', 'backend'],
          is_public: true,
          is_featured: false,
          usage_count: 0,
          like_count: 0
        }
      ];

      for (const template of appTemplates) {
        await setDoc(doc(collection(db, 'app_templates')), {
          ...template,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      console.log('System collections initialized successfully');
    },
    down: async () => {
      const db = getFirestore();
      
      // Delete all system settings
      const settingsSnapshot = await getDocs(collection(db, 'system_settings'));
      for (const doc of settingsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete all app templates
      const templatesSnapshot = await getDocs(collection(db, 'app_templates'));
      for (const doc of templatesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      console.log('System collections removed');
    }
  },

  {
    version: '1.1.0',
    description: 'Enhance user profiles with additional metadata',
    up: async () => {
      const db = getFirestore();
      
      // Get all existing users and enhance their profiles
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const enhancedData = {
          ...userData,
          // Add new fields with defaults
          bio: userData.bio || '',
          website_url: userData.website_url || '',
          location: userData.location || '',
          company: userData.company || '',
          github_username: userData.github_username || '',
          twitter_username: userData.twitter_username || '',
          subscription_tier: userData.subscription_tier || 'free',
          is_premium: userData.is_premium || false,
          total_apps_created: userData.total_apps_created || 0,
          total_generations: userData.total_generations || 0,
          monthly_generations: userData.monthly_generations || 0,
          monthly_reset_date: userData.monthly_reset_date || new Date(),
          last_login_at: userData.last_login_at || null,
          updated_at: new Date()
        };

        await updateDoc(userDoc.ref, enhancedData);
      }

      console.log(`Enhanced ${usersSnapshot.docs.length} user profiles`);
    },
    down: async () => {
      const db = getFirestore();
      
      // Remove enhanced fields from user profiles
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fieldsToRemove = [
        'bio', 'website_url', 'location', 'company', 'github_username', 
        'twitter_username', 'subscription_tier', 'is_premium', 
        'total_apps_created', 'total_generations', 'monthly_generations',
        'monthly_reset_date', 'last_login_at'
      ];

      for (const userDoc of usersSnapshot.docs) {
        const updates: any = { updated_at: new Date() };
        for (const field of fieldsToRemove) {
          updates[field] = null; // Set to null to remove
        }
        await updateDoc(userDoc.ref, updates);
      }

      console.log('Removed enhanced user profile fields');
    }
  },

  {
    version: '1.2.0',
    description: 'Add comprehensive application tracking and analytics',
    up: async () => {
      const db = getFirestore();
      
      // Enhance existing applications with new fields
      const appsSnapshot = await getDocs(collection(db, 'applications'));
      
      for (const appDoc of appsSnapshot.docs) {
        const appData = appDoc.data();
        const enhancedData = {
          ...appData,
          // Technical details
          framework: appData.framework || 'unknown',
          language: appData.language || 'javascript',
          build_tool: appData.build_tool || '',
          deployment_platform: appData.deployment_platform || '',
          
          // AI details
          ai_provider: appData.ai_provider || 'openai',
          ai_model: appData.ai_model || 'gpt-4',
          generation_mode: appData.generation_mode || 'smart',
          
          // Status and metadata
          status: appData.status || 'completed',
          visibility: appData.visibility || 'private',
          tags: appData.tags || [],
          is_template: appData.is_template || false,
          is_featured: appData.is_featured || false,
          
          // Statistics
          view_count: appData.view_count || 0,
          like_count: appData.like_count || 0,
          fork_count: appData.fork_count || 0,
          download_count: appData.download_count || 0,
          
          // File information
          total_files: appData.total_files || 0,
          total_lines: appData.total_lines || 0,
          file_size_bytes: appData.file_size_bytes || 0,
          
          // Deployment
          deployed_url: appData.deployed_url || '',
          github_repo_url: appData.github_repo_url || '',
          deployment_status: appData.deployment_status || '',
          last_deployed_at: appData.last_deployed_at || null,
          
          updated_at: new Date()
        };

        await updateDoc(appDoc.ref, enhancedData);
      }

      // Initialize daily analytics document
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'usage_analytics', today), {
        date: today,
        total_users: 0,
        new_users: 0,
        active_users: 0,
        returning_users: 0,
        apps_created: 0,
        apps_deployed: 0,
        total_generations: 0,
        successful_generations: 0,
        failed_generations: 0,
        total_tokens: 0,
        total_cost: 0,
        openai_usage: 0,
        anthropic_usage: 0,
        google_usage: 0,
        cerebras_usage: 0,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log(`Enhanced ${appsSnapshot.docs.length} applications with tracking data`);
    },
    down: async () => {
      // Remove analytics and enhanced app fields
      const db = getFirestore();
      
      // Clean up analytics
      const analyticsSnapshot = await getDocs(collection(db, 'usage_analytics'));
      for (const doc of analyticsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      console.log('Removed application analytics and enhanced fields');
    }
  }
];

// Migration runner function
export async function runDatabaseMigrations(app: FirebaseApp): Promise<void> {
  const migrationService = new DatabaseMigrationService(app);
  await migrationService.runMigrations(firestoreMigrations);
}