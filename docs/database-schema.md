# Firestore Database Schema Documentation

## Overview
This document defines the complete Firestore database schema for the Stich Production platform, including collections, documents, indexes, and security considerations.

## Collections Structure

### 1. Users Collection (`/users/{userId}`)

**Purpose**: Store user account information and preferences

**Document ID**: Firebase Auth UID

**Schema**:
```typescript
interface User {
  id: string;                    // Document ID (Firebase Auth UID)
  email: string;                 // Required, validated email
  displayName?: string;          // Optional display name
  photoURL?: string;             // Profile picture URL
  role: 'user' | 'admin';       // User role, defaults to 'user'
  subscriptionTier: 'free' | 'pro' | 'enterprise'; // Subscription level
  createdAt: Timestamp;          // Account creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  lastLoginAt?: Timestamp;       // Last login timestamp
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;            // Language code (e.g., 'en', 'es')
  };
  usage: {
    appsCreated: number;         // Total apps created
    generationsUsed: number;     // Total AI generations used
    storageUsed: number;         // Storage used in bytes
  };
  metadata: {
    emailVerified: boolean;      // Email verification status
    provider: string;            // Auth provider (google, github, email)
    firstLoginAt: Timestamp;     // First login timestamp
  };
}
```

**Indexes**:
- `email` (single field index)
- `role` (single field index)
- `subscriptionTier` (single field index)
- `createdAt` (single field index)
- `role, createdAt` (composite index for admin queries)

### 2. Apps Collection (`/apps/{appId}`)

**Purpose**: Store application metadata and configuration

**Document ID**: Auto-generated Firestore document ID

**Schema**:
```typescript
interface App {
  id: string;                    // Document ID
  userId: string;                // Owner's Firebase Auth UID
  name: string;                  // Application name
  description?: string;          // Optional description
  status: 'draft' | 'generating' | 'completed' | 'deployed' | 'failed';
  visibility: 'private' | 'public' | 'unlisted';
  
  // Configuration
  config: {
    framework: string;           // React, Vue, Angular, etc.
    language: string;            // TypeScript, JavaScript
    styling: string;             // Tailwind, CSS, SCSS
    features: string[];          // List of requested features
    deployment: {
      platform: string;          // vercel, netlify, etc.
      domain?: string;           // Custom domain
      url?: string;              // Deployed URL
    };
  };
  
  // Generation metadata
  generation: {
    prompt: string;              // Original user prompt
    totalFiles: number;          // Number of files generated
    estimatedTokens: number;     // AI tokens used
    generationTime: number;      // Time taken in milliseconds
    version: string;             // Generator version used
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deployedAt?: Timestamp;
  
  // Statistics
  stats: {
    views: number;               // Public app views
    likes: number;               // User likes
    forks: number;               // Times forked
  };
  
  // Tags and search
  tags: string[];                // User-defined tags
  searchKeywords: string[];      // Generated search keywords
}
```

**Indexes**:
- `userId` (single field index)
- `status` (single field index)
- `visibility` (single field index)
- `createdAt` (single field index)
- `userId, status` (composite index)
- `userId, createdAt` (composite index)
- `visibility, createdAt` (composite index for public apps)
- `tags` (array-contains index)

### 3. Generation Sessions Subcollection (`/apps/{appId}/sessions/{sessionId}`)

**Purpose**: Track AI generation sessions for detailed progress and history

**Document ID**: Auto-generated Firestore document ID

**Schema**:
```typescript
interface GenerationSession {
  id: string;                    // Document ID
  appId: string;                 // Parent app ID
  userId: string;                // Owner's Firebase Auth UID
  status: 'planning' | 'generating' | 'reviewing' | 'completed' | 'failed' | 'cancelled';
  
  // AI Configuration
  aiConfig: {
    provider: AIProviderName;    // openai, anthropic, google, cerebras
    model: string;               // Specific model used
    temperature: number;         // AI temperature setting
    maxTokens: number;           // Token limit
  };
  
  // Generation phases
  phases: {
    planning: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      output?: any;              // Planning output
    };
    generation: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      filesGenerated: number;
      progress: number;          // 0-100 percentage
    };
    review: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      startedAt?: Timestamp;
      completedAt?: Timestamp;
      reviewCycles: number;
      improvements: string[];
    };
  };
  
  // Progress tracking
  progress: {
    currentPhase: string;
    percentage: number;          // Overall progress 0-100
    estimatedTimeLeft: number;   // Milliseconds remaining
    stepDescription: string;     // Current step description
  };
  
  // Resource usage
  usage: {
    tokensUsed: number;          // Total tokens consumed
    costEstimate: number;        // Estimated cost in USD
    executionTime: number;       // Total time in milliseconds
  };
  
  // Error handling
  error?: {
    code: string;                // Error code
    message: string;             // Error message
    stack?: string;              // Error stack trace
    recoverable: boolean;        // Whether error is recoverable
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

**Indexes**:
- `appId` (single field index)
- `userId` (single field index)
- `status` (single field index)
- `createdAt` (single field index)
- `userId, status` (composite index)
- `appId, createdAt` (composite index)

### 4. Templates Collection (`/templates/{templateId}`)

**Purpose**: Store reusable application templates

**Document ID**: Auto-generated Firestore document ID

**Schema**:
```typescript
interface Template {
  id: string;                    // Document ID
  name: string;                  // Template name
  description: string;           // Template description
  category: string;              // Template category
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Template configuration
  config: {
    framework: string;
    language: string;
    styling: string;
    features: string[];
    dependencies: string[];      // Required packages
  };
  
  // Template metadata
  metadata: {
    version: string;             // Template version
    author: string;              // Template author
    tags: string[];              // Search tags
    estimatedTime: number;       // Generation time estimate
    complexity: number;          // Complexity score 1-10
  };
  
  // Usage statistics
  usage: {
    timesUsed: number;           // Usage count
    successRate: number;         // Success percentage
    averageRating: number;       // User ratings average
    totalRatings: number;        // Number of ratings
  };
  
  // Template assets
  assets: {
    thumbnail: string;           // Thumbnail image URL
    preview: string[];           // Preview image URLs
    demoUrl?: string;            // Live demo URL
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Status
  status: 'active' | 'deprecated' | 'beta';
  featured: boolean;             // Featured template flag
}
```

**Indexes**:
- `category` (single field index)
- `difficulty` (single field index)
- `status` (single field index)
- `featured` (single field index)
- `tags` (array-contains index)
- `usage.timesUsed` (single field index)

### 5. Generation Logs Collection (`/generation_logs/{logId}`)

**Purpose**: Audit trail for all generation activities

**Document ID**: Auto-generated Firestore document ID

**Schema**:
```typescript
interface GenerationLog {
  id: string;                    // Document ID
  userId: string;                // User who performed action
  sessionId?: string;            // Related generation session
  appId?: string;                // Related app
  
  // Action details
  action: string;                // Action type (create, update, deploy, etc.)
  details: string;               // Action description
  result: 'success' | 'failure' | 'partial';
  
  // Context information
  context: {
    userAgent?: string;          // User agent string
    ipAddress?: string;          // IP address (hashed for privacy)
    location?: string;           // General location (city/country)
  };
  
  // Metadata
  metadata: any;                 // Additional context data
  duration?: number;             // Action duration in milliseconds
  
  // Timestamps
  timestamp: Timestamp;          // When action occurred
}
```

**Indexes**:
- `userId` (single field index)
- `action` (single field index)
- `result` (single field index)
- `timestamp` (single field index)
- `userId, timestamp` (composite index)
- `action, timestamp` (composite index)

### 6. Usage Collection (`/usage/{userId}`)

**Purpose**: Track user usage metrics and quotas

**Document ID**: Firebase Auth UID

**Schema**:
```typescript
interface Usage {
  id: string;                    // Document ID (Firebase Auth UID)
  
  // Current period usage
  current: {
    period: string;              // Billing period identifier
    periodStart: Timestamp;      // Period start date
    periodEnd: Timestamp;        // Period end date
    
    apps: {
      created: number;           // Apps created this period
      limit: number;             // App creation limit
    };
    
    generations: {
      used: number;              // Generations used this period
      limit: number;             // Generation limit
    };
    
    storage: {
      used: number;              // Storage used in bytes
      limit: number;             // Storage limit in bytes
    };
    
    bandwidth: {
      used: number;              // Bandwidth used in bytes
      limit: number;             // Bandwidth limit in bytes
    };
  };
  
  // Historical usage
  history: {
    [periodId: string]: {
      apps: number;
      generations: number;
      storage: number;
      bandwidth: number;
    };
  };
  
  // Quotas and limits
  quotas: {
    subscriptionTier: string;    // Current subscription
    upgradeDate?: Timestamp;     // Last upgrade date
    customLimits: any;           // Any custom limits
  };
  
  // Timestamps
  updatedAt: Timestamp;
  resetAt: Timestamp;            // Next quota reset
}
```

**Indexes**:
- `current.periodEnd` (single field index)
- `quotas.subscriptionTier` (single field index)

### 7. Rate Limits Collection (`/rate_limits/{clientId}`)

**Purpose**: Store rate limiting data

**Document ID**: Client identifier (IP address hash or user ID)

**Schema**:
```typescript
interface RateLimit {
  id: string;                    // Document ID (client identifier)
  requests: {
    timestamp: Timestamp;
    count: number;
  }[];
  windowStart: Timestamp;
  lastReset: Timestamp;
  blocked: boolean;
  blockUntil?: Timestamp;
}
```

**Indexes**:
- `windowStart` (single field index)
- `blocked` (single field index)

## Database Indexes Summary

### Single Field Indexes
- `users.email`
- `users.role`
- `users.subscriptionTier`
- `users.createdAt`
- `apps.userId`
- `apps.status`
- `apps.visibility`
- `apps.createdAt`
- `apps.tags` (array-contains)
- `sessions.appId`
- `sessions.userId`
- `sessions.status`
- `sessions.createdAt`
- `templates.category`
- `templates.difficulty`
- `templates.status`
- `templates.featured`
- `templates.tags` (array-contains)
- `templates.usage.timesUsed`
- `generation_logs.userId`
- `generation_logs.action`
- `generation_logs.result`
- `generation_logs.timestamp`
- `usage.current.periodEnd`
- `usage.quotas.subscriptionTier`
- `rate_limits.windowStart`
- `rate_limits.blocked`

### Composite Indexes
- `users: role, createdAt`
- `apps: userId, status`
- `apps: userId, createdAt`
- `apps: visibility, createdAt`
- `sessions: userId, status`
- `sessions: appId, createdAt`
- `generation_logs: userId, timestamp`
- `generation_logs: action, timestamp`

## Security Rules Summary

The Firestore security rules implement:

1. **User Data Protection**: Users can only access their own data
2. **App Ownership**: App access restricted to owners
3. **Public App Discovery**: Public apps readable by authenticated users
4. **Admin Controls**: Admin-only access to sensitive collections
5. **Hierarchical Security**: Session access controlled by app ownership
6. **Data Validation**: Comprehensive validation functions for all document types

## Migration and Maintenance

### Initial Setup
1. Deploy Firestore rules using Firebase CLI
2. Create composite indexes using Firebase Console or CLI
3. Set up monitoring and alerting for quota usage
4. Configure backup schedules for critical data

### Performance Considerations
1. Use pagination for large collections
2. Implement efficient query patterns
3. Monitor index usage and costs
4. Regular cleanup of old logs and sessions

### Scaling Considerations
1. Partition large collections by user or date
2. Use subcollections for related data
3. Implement data archiving for old records
4. Monitor and optimize frequently used queries

This schema provides a solid foundation for the Stich Production platform with proper security, scalability, and maintainability considerations.