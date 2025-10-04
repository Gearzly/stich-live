#!/usr/bin/env tsx

import { initializeApp } from 'firebase/app';
import { runDatabaseMigrations } from './database-migrations.js';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function main() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    
    console.log('Starting database migrations...');
    await runDatabaseMigrations(app);
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

main();