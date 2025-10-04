# Stich Production Deployment Guide

## Prerequisites

Before deploying Stich Production, ensure you have:

1. **Firebase Account**: Set up a Firebase project
2. **Node.js**: Version 18 or higher
3. **Firebase CLI**: Install with `npm install -g firebase-tools`

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Select the following services:
# - Firestore
# - Functions
# - Storage
# - Hosting
```

### 1.2 Configure Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Copy your Firebase configuration

### 1.3 Set up Authentication
1. Go to Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google
   - GitHub (optional)

### 1.4 Set up Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Update security rules from `firestore.rules`

### 1.5 Set up Storage
1. Go to Storage
2. Get started with default bucket
3. Update security rules from `storage.rules`

## Step 2: Environment Configuration

### 2.1 Create Environment File
```bash
# Copy the production template
cp .env.production .env

# Edit .env with your actual Firebase configuration
# Replace all "your-project-id" and API keys with real values
```

### 2.2 Required Environment Variables
```bash
# Firebase Configuration (Get from Firebase Console)
VITE_FIREBASE_API_KEY="your-actual-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-actual-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Update URLs with your project ID
VITE_APP_URL="https://your-project-id.web.app"
VITE_API_BASE_URL="https://your-project-id.web.app/api"
VITE_FUNCTIONS_BASE_URL="https://us-central1-your-project-id.cloudfunctions.net"
```

## Step 3: Deploy Firebase Functions

### 3.1 Install Dependencies
```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 3.2 Build and Deploy Functions
```bash
# Build the functions
cd functions
npm run build
cd ..

# Deploy to Firebase
firebase deploy --only functions

# Or deploy everything (functions, firestore rules, storage rules)
firebase deploy
```

### 3.3 Verify Functions Deployment
```bash
# Check functions in Firebase Console
# Go to Functions section and verify all functions are deployed
```

## Step 4: Deploy Frontend to Firebase Hosting

### 4.1 Build Frontend Application
```bash
# Build the frontend for production
npm run build
```

### 4.2 Deploy with Automated Script
```bash
# Deploy using the automated deployment script
npm run deploy
```

The deployment script will:
- Run pre-deployment checks
- Build the frontend
- Deploy Firebase Functions
- Deploy to Firebase Hosting
- Run post-deployment health checks

### 4.3 Manual Deployment (Alternative)
```bash
# Deploy everything (functions, hosting, rules)
firebase deploy

# Deploy only hosting (if functions unchanged)
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

### 4.4 Verify Firebase Hosting Deployment
Your application will be available at:
- **Primary URL**: `https://your-project-id.web.app`
- **Custom Domain**: `https://your-project-id.firebaseapp.com`

Check Firebase Console > Hosting for deployment status and logs.

## Step 5: Post-Deployment Configuration

### 5.1 Update Firebase Authentication Settings
1. Go to Firebase Console > Authentication > Settings
2. Add your Firebase Hosting domain to Authorized domains:
   - `your-project-id.web.app`
   - `your-project-id.firebaseapp.com`
   - Any custom domains you plan to use

### 5.2 Update CORS Configuration
Firebase Functions automatically handle CORS for Firebase Hosting domains.
If you need additional domains, update your functions CORS configuration.

### 5.3 Database Initialization
```bash
# Run database migrations
npm run db:migrate

# Seed initial data if needed
npm run db:seed

# Run health check
npm run db:health
```

## Step 6: Verification & Testing

### 6.1 Health Checks
```bash
# Run comprehensive health check
npm run db:health -- --verbose

# Check deployment status
firebase hosting:sites:list
```

### 6.2 Feature Testing
Test all major features on your deployed application:
- User registration and authentication
- AI chat functionality with multiple providers
- File management and generation
- GitHub integration and export
- Enterprise features (if enabled)
- Database operations and real-time updates

### 6.3 Performance Testing
1. Test application load times on Firebase Hosting
2. Verify CDN performance globally
3. Check mobile responsiveness
4. Test with different browsers
5. Monitor Firebase Console for errors

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain to Firebase Hosting
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning

### 7.2 Update Environment Variables
```bash
# Update .env with custom domain
VITE_APP_URL=https://your-custom-domain.com
VITE_API_BASE_URL=https://your-custom-domain.com/api
```

### 7.3 Update Firebase Authentication
1. Add custom domain to Firebase Authentication > Settings > Authorized domains
2. Remove old test domains if no longer needed

## Common Issues & Solutions

### Issue: Firebase Functions Not Working
```bash
# Check functions logs
firebase functions:log

# Redeploy functions
firebase deploy --only functions --force

# Check function URLs in Firebase Console
```

### Issue: Environment Variables Not Loading
```bash
# Verify environment file exists
cat .env

# Check if variables are being loaded during build
npm run build -- --debug

# Verify Firebase configuration
firebase projects:list
```

### Issue: CORS Errors
```bash
# Firebase Hosting automatically handles CORS for same domain
# For external domains, update functions CORS configuration
# Check Firebase Console > Functions for error logs
```

### Issue: Database Connection Errors
```bash
# Run health check
npm run db:health

# Check Firebase project settings
# Verify environment variables match Firebase config
```

## Monitoring & Maintenance

### Daily Tasks
```bash
# Run health check
npm run db:health

# Check Firebase Console for errors
# Monitor user activity and performance
```

### Weekly Tasks
```bash
# Create database backup
npm run db:backup create

# Review Firebase logs and analytics
# Update dependencies if needed
```

### Monthly Tasks
```bash
# Clean up old backups
npm run db:backup cleanup

# Review Firebase usage and costs
# Plan feature updates and optimizations
```

## Support

For deployment issues:
1. Check Firebase Console for errors and logs
2. Review deployment script output
3. Run health checks locally: `npm run db:health`
4. Verify all environment variables are set correctly
5. Check Firebase project configuration

## Production URLs

After successful deployment:
- **Frontend**: https://your-project-id.web.app
- **Alternative URL**: https://your-project-id.firebaseapp.com
- **Functions**: https://us-central1-your-project-id.cloudfunctions.net
- **Firebase Console**: https://console.firebase.google.com/project/your-project-id

---

## Quick Deployment Commands

```bash
# Complete deployment workflow (recommended)
npm run deploy

# Manual Firebase deployment
firebase deploy

# Deploy only specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```
npm install
cd functions && npm install && cd ..
firebase deploy
vercel --prod
npm run db:migrate
npm run db:health
```

Your Stich Production application should now be live and fully functional! 🚀