# 🔒 Environment Variables Security Guide

## ✅ Git Security Configured

Your `.gitignore` has been updated to prevent sensitive environment files from being committed to the repository.

### 📋 Protected Files

The following environment files are **automatically ignored** by git:
```
.env
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local
.env.staging
.env.staging.local
```

### ✅ Safe to Commit
```
.env.example     # Template with placeholder values
.env.template    # Alternative template naming
```

## 🛡️ Security Best Practices

### 1. Never Commit Real Credentials
- ❌ **DON'T**: Put real API keys in `.env.production`
- ✅ **DO**: Use `.env.example` for documentation

### 2. Use Environment-Specific Files
```bash
# Development
.env.development.local    # Your local dev secrets

# Production (on server)
.env.production          # Real production secrets

# Testing
.env.test.local          # Test environment secrets
```

### 3. Platform-Specific Setup

#### Firebase Hosting
- Environment variables are configured in Firebase Console
- Use `.env` files only for local development

#### Vercel (if used)
- Set environment variables in Vercel Dashboard
- Use `.env.local` for local development

#### Other Platforms
- Check platform documentation for environment variable setup
- Always use platform-specific secure storage

## 🔧 Local Development Setup

### Step 1: Copy Template
```bash
cp .env.example .env
```

### Step 2: Add Your Values
Edit `.env` with your actual development credentials:
```bash
VITE_FIREBASE_API_KEY="your-actual-dev-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
# ... other values
```

### Step 3: Verify Git Ignores It
```bash
git status
# .env should NOT appear in untracked files
```

## 🚨 If You Accidentally Committed Secrets

### 1. Remove from Git History
```bash
# Remove file from git tracking
git rm --cached .env

# Commit the removal
git commit -m "Remove .env file from tracking"

# IMPORTANT: Change all exposed credentials immediately!
```

### 2. Rotate All Credentials
- Generate new Firebase API keys
- Update all external service keys
- Update production environment variables

### 3. Add to .gitignore (already done)
```bash
git add .gitignore
git commit -m "Add comprehensive .gitignore for environment files"
```

## 📝 Environment File Guidelines

### .env.example Template
```bash
# Application Info
VITE_APP_NAME="Stich Production"
VITE_APP_VERSION="1.0.0"
VITE_APP_URL="http://localhost:3000"

# Firebase Configuration (replace with your values)
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="your-app-id"

# API URLs
VITE_FUNCTIONS_BASE_URL="https://us-central1-your-project-id.cloudfunctions.net"

# Feature Flags
VITE_FEATURE_AUTH="true"
VITE_FEATURE_REALTIME="true"
VITE_DEBUG="false"
```

### Local Development (.env)
```bash
# Same structure as .env.example but with REAL values
# This file is git-ignored and safe for local use
```

## ✅ Security Checklist

- [x] **.gitignore updated** - All .env files (except examples) are ignored
- [x] **Template provided** - `.env.example` available for reference
- [x] **Documentation created** - Security guidelines documented
- [ ] **Credentials secured** - Replace placeholder values in your local `.env`
- [ ] **Production setup** - Configure environment variables in hosting platform
- [ ] **Team informed** - Share security practices with team members

## 🛠️ Quick Commands

```bash
# Check what files git is tracking
git ls-files | grep -E "\.env"

# Should only show .env.example, NOT .env or .env.production

# Check git status for environment files
git status --ignored | grep -E "\.env"

# Should show .env files in "Ignored files" section

# Create local environment file
cp .env.example .env
```

## 🔗 Related Documentation

- [Firebase Environment Variables](https://firebase.google.com/docs/functions/config-env)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Git Security Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)

---

## 🎯 Summary

Your repository is now properly configured to prevent accidental commits of sensitive environment variables. Always remember:

1. **Local Development**: Use `.env` (git-ignored)
2. **Documentation**: Update `.env.example` (git-tracked)
3. **Production**: Use platform environment variable settings
4. **Security**: Never commit real credentials to git

Stay secure! 🔒