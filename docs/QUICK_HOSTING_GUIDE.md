# 🚀 Quick Hosting Guide for Stich Production

## Prerequisites Setup (5 minutes)

1. **Install Required Tools**:
   ```bash
   npm install -g firebase-tools
   npm install -g tsx
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

## Environment Setup (10 minutes)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication, Firestore, Storage, Functions, and Hosting

2. **Get Firebase Configuration**:
   - Project Settings → General → Your apps → Add app (Web)
   - Copy the config object values

3. **Configure Environment**:
   ```bash
   # Copy and edit environment file
   cp .env.production .env
   
   # Edit .env with your Firebase config
   # Replace all "your-project-id" with actual values
   ```

## One-Command Deployment 🎯

```bash
# Install dependencies and deploy everything
npm install
npm run deploy
```

That's it! The script will:
- ✅ Build the React application
- ✅ Deploy Firebase Functions
- ✅ Deploy to Firebase Hosting
- ✅ Run database migrations
- ✅ Perform health checks

**Your app will be live at**: `https://your-project-id.web.app`

## Manual Step-by-Step (if needed)

### 1. Deploy Firebase Functions Only
```bash
npm run deploy:functions
```

### 2. Deploy Firebase Hosting Only
```bash
npm run deploy:hosting
```

### 3. Database Setup
```bash
npm run db:migrate
npm run db:health
```

## Firebase Project Configuration

Your Firebase project should have these services enabled:
- **Authentication**: Google, Email/Password providers
- **Firestore**: NoSQL database for app data
- **Storage**: File storage for generated applications
- **Functions**: Serverless backend API
- **Hosting**: Static website hosting with CDN

## Environment Variables Setup

Edit your `.env` file with these values:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_APP_URL=https://your-project-id.web.app
VITE_API_BASE_URL=https://your-project-id.web.app/api
VITE_FUNCTIONS_BASE_URL=https://us-central1-your-project-id.cloudfunctions.net
```

## Post-Deployment

1. **Your app is live at**:
   - Primary URL: `https://your-project-id.web.app`
   - Alternative: `https://your-project-id.firebaseapp.com`

2. **Test the application**:
   - Visit your Firebase Hosting URL
   - Test user registration/login
   - Test AI chat functionality
   - Test all enterprise features

## Custom Domain (Optional)

1. **Add domain in Firebase Console**:
   - Hosting → Add custom domain
   - Follow DNS configuration steps

2. **Update environment variables**:
   ```
   VITE_APP_URL=https://your-custom-domain.com
   VITE_ALLOWED_ORIGINS=https://your-custom-domain.com
   ```

## Why Firebase Hosting?

### Advantages over other platforms:
- ✅ **Unified Platform**: Everything in Firebase ecosystem
- ✅ **Zero Configuration**: Automatic SSL, CDN, and scaling
- ✅ **Built-in Integration**: Seamless with Firebase Functions
- ✅ **Global CDN**: Fast worldwide delivery
- ✅ **Custom Domains**: Free SSL certificates
- ✅ **Easy Rollbacks**: Simple version management
- ✅ **Cost Effective**: Generous free tier

## Troubleshooting

### Build Fails
```bash
npm install
npm run build
```

### Functions Don't Deploy
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Environment Variables Issues
- Check Firebase project configuration
- Ensure all values are correct in `.env`
- No trailing spaces or quotes in values

### Health Check Fails
```bash
npm run db:health -- --verbose
```

## Production URLs

After successful deployment:
- **Frontend**: `https://your-project-id.web.app`
- **Functions**: `https://us-central1-your-project-id.cloudfunctions.net`
- **Firebase Console**: `https://console.firebase.google.com/project/your-project-id`

## Support Commands

```bash
# Deployment help
npm run deploy -- --help

# Functions only
npm run deploy:functions

# Hosting only  
npm run deploy:hosting

# Health check with details
npm run db:health -- --verbose

# Backup database
npm run db:backup create

# View deployment logs
firebase functions:log
```

---

## 🎉 That's it!

Your Stich Production application is now live on Firebase with all enterprise features:
- ✅ Advanced Chat Interface
- ✅ Blueprint Visualization  
- ✅ Phase Timeline
- ✅ Debug Panel
- ✅ BYOK API Key Management
- ✅ Enhanced File Manager
- ✅ GitHub Export
- ✅ Database Schema & Management

**Total deployment time: ~15 minutes** 🚀