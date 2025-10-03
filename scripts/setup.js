#!/usr/bin/env node

/**
 * Setup script for Stich Production
 * Initializes the project with required configurations
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = process.cwd();

console.log('🚀 Setting up Stich Production...\n');

// Check if required tools are installed
function checkRequirements() {
  console.log('📋 Checking requirements...');
  
  const requirements = [
    { name: 'Node.js', command: 'node --version', min: 'v18.0.0' },
    { name: 'npm', command: 'npm --version' },
    { name: 'Firebase CLI', command: 'firebase --version' }
  ];

  for (const req of requirements) {
    try {
      const version = execSync(req.command, { encoding: 'utf8' }).trim();
      console.log(`  ✅ ${req.name}: ${version}`);
    } catch (error) {
      console.log(`  ❌ ${req.name}: Not installed`);
      if (req.name === 'Firebase CLI') {
        console.log('     Install with: npm install -g firebase-tools');
      }
    }
  }
  console.log('');
}

// Setup environment variables
function setupEnvironment() {
  console.log('🔧 Setting up environment...');
  
  const envPath = join(PROJECT_ROOT, '.env.local');
  
  if (!existsSync(envPath)) {
    const envTemplate = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional Configuration
VITE_APP_NAME=Stich Production
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
`;

    writeFileSync(envPath, envTemplate);
    console.log('  ✅ Created .env.local file');
    console.log('  📝 Please update .env.local with your Firebase configuration');
  } else {
    console.log('  ✅ .env.local already exists');
  }
  console.log('');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    console.log('  Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
    
    console.log('  Installing function dependencies...');
    const functionsPath = join(PROJECT_ROOT, 'functions');
    if (existsSync(functionsPath)) {
      execSync('npm install', { stdio: 'inherit', cwd: functionsPath });
    }
    
    console.log('  ✅ Dependencies installed successfully');
  } catch (error) {
    console.log('  ❌ Failed to install dependencies');
    console.error(error.message);
  }
  console.log('');
}

// Setup Firebase
function setupFirebase() {
  console.log('🔥 Setting up Firebase...');
  
  try {
    // Check if user is logged in
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log('  ✅ Firebase CLI authenticated');
    
    // Check if project is initialized
    const firebaseConfigPath = join(PROJECT_ROOT, 'firebase.json');
    if (!existsSync(firebaseConfigPath)) {
      console.log('  📝 Please run: firebase init');
      console.log('     Select: Functions, Firestore, Storage, Hosting');
    } else {
      console.log('  ✅ Firebase project initialized');
    }
  } catch (error) {
    console.log('  ❌ Firebase CLI not authenticated');
    console.log('     Please run: firebase login');
  }
  console.log('');
}

// Main setup function
function main() {
  checkRequirements();
  setupEnvironment();
  installDependencies();
  setupFirebase();
  
  console.log('🎉 Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update .env.local with your Firebase configuration');
  console.log('2. Run: firebase login (if not already logged in)');
  console.log('3. Run: firebase init (if not already initialized)');
  console.log('4. Run: npm run firebase:emulators (to start development)');
  console.log('5. Run: npm run dev (to start the frontend)');
  console.log('');
  console.log('Happy coding! 🚀');
}

main();