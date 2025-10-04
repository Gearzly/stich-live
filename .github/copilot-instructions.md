# GitHub Copilot Instructions for Stich Production

## Project Overview

**Stich Production** is a sophisticated AI-powered web application generator built on Vercel's platform with Firebase backend. The system enables users to describe an application and have AI generate, deploy, and host it instantly. This is a full-stack TypeScript application with React frontend and Firebase backend services.

### Key Architecture Components
- **Frontend**: React 19.1.1 + Vite + TypeScript with modern UI components (Vercel)
- **Backend**: Firebase Functions with Hono.js framework  
- **Database**: Firebase Firestore (NoSQL) with strong typing
- **Real-time**: Firebase Realtime Database for live updates
- **AI Integration**: Multi-provider support (OpenAI, Anthropic, Google AI, Cerebras)
- **File Storage**: Firebase Storage for generated app assets
- **Authentication**: Firebase Auth with OAuth (Google, GitHub) and email/password

## Development Workflow

### Essential Commands
```bash
# Development
npm run dev          # Start local development with hot reload
npm run build        # Build for production
vercel               # Deploy to Vercel (preview)
vercel --prod        # Deploy to production

# Firebase Operations
firebase emulators:start  # Start Firebase emulators locally
firebase deploy           # Deploy Firebase functions and rules
firebase firestore:delete --all-collections  # Clear Firestore data

# Database Operations (Firestore)
npm run db:seed      # Seed initial data to Firestore
npm run db:backup    # Backup Firestore data
npm run db:restore   # Restore Firestore data

# Testing & Quality
npm test             # Run test suite
npm run lint         # ESLint checking
npm run typecheck    # TypeScript compilation check
```

### Project Structure
```
stich-production/
├── src/                    # React frontend application (Vercel)
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React contexts (auth, theme, apps)
│   ├── hooks/             # Custom React hooks
│   ├── routes/            # Page components and routing
│   └── lib/               # Utility libraries and API client
├── functions/             # Firebase Functions backend
│   ├── src/
│   │   ├── api/           # REST API endpoints
│   │   ├── agents/        # AI code generation services
│   │   ├── database/      # Firestore services and models
│   │   ├── middleware/    # Auth, CORS, security middleware
│   │   └── services/      # Business logic services
├── firebase/              # Firebase configuration
│   ├── firestore.rules    # Security rules
│   ├── storage.rules      # Storage security rules
│   └── firebase.json      # Firebase project config
├── shared/                # Shared types and utilities
└── vercel.json            # Vercel deployment configuration
```

## Code Generation & AI Integration

### Core AI Agent System
The platform uses **Firebase Functions** for stateful AI code generation:

- **`SmartCodeGeneratorAgent`**: Main AI orchestration service
- **State Management**: Persistent using Firestore real-time listeners
- **Multi-Phase Generation**: Blueprint → Files → Review → Deploy
- **Provider Routing**: Intelligent selection between AI providers

Key classes and patterns:
```typescript
// Agent initialization
const agent = new SmartCodeGeneratorAgent();
await agent.initialize(initArgs, agentMode);

// State-driven generation with Firestore
const state = await agent.generateAllFiles(reviewCycles);
```

### Real-time Communication
Real-time updates use Firebase Realtime Database or Firestore listeners:
```typescript
// Frontend connection pattern
import { onSnapshot, doc } from 'firebase/firestore';

const unsubscribe = onSnapshot(doc(db, 'generations', chatId), (doc) => {
  const data = doc.data();
  // Handle state updates, file generation, deployment progress
});
```

## Database Architecture

### Firestore Patterns
All database operations use **Firestore** with strong typing:

```typescript
// Service base class pattern
export class BaseService {
  protected db: Firestore;
  protected logger: ReturnType<typeof createLogger>;
  
  constructor() {
    this.db = getFirestore();
    this.logger = createLogger(this.constructor.name);
  }
}

// Example service implementation
export class UserService extends BaseService {
  async createUser(userData: CreateUserData): Promise<User> {
    const docRef = await addDoc(collection(this.db, 'users'), userData);
    return { id: docRef.id, ...userData };
  }
}
```

### Schema Conventions
- Use **camelCase** for TypeScript and Firestore document fields
- Proper indexing on frequently queried fields in Firestore
- Subcollections for hierarchical data relationships
- Audit fields: `createdAt`, `updatedAt` as Firestore Timestamps on all documents

## API Architecture

### Hono.js Patterns
All API routes use **Hono.js** in Firebase Functions:

```typescript
// Firebase Functions setup pattern
import { onRequest } from 'firebase-functions/v2/https';
import { Hono } from 'hono';

const app = new Hono();

// Public routes
app.post('/login', async (c) => {
  // Authentication logic
});

// Protected routes  
app.get('/profile', authMiddleware, async (c) => {
  // Profile logic
});

export const api = onRequest(honoToFirebase(app));
```

### Controller Patterns
All controllers follow Hono patterns with Firebase Functions and error handling:

```typescript
export class AuthController {
  static async login(c: Context): Promise<Response> {
    try {
      // Validation
      const body = await c.req.json();
      const validatedData = loginSchema.parse(body);
      
      // Business logic
      const authService = new AuthService();
      const result = await authService.authenticateUser(validatedData);
      
      // Response
      return c.json(createSuccessResponse(result), 200);
    } catch (error) {
      logger.error('Login error:', error);
      return c.json(createErrorResponse('AUTH_ERROR', 'Authentication failed'), 500);
    }
  }
}
```

## Authentication System

### Firebase Auth Architecture
- **Firebase Auth** for user management and authentication
- **Custom claims** for role-based access control
- **Auto token refresh** handled by Firebase SDK
- **OAuth integration** with Google and GitHub providers

### Authentication Middleware
```typescript
// Firebase Auth middleware for Hono
import { Context } from 'hono';
import { auth } from 'firebase-admin';

export const authMiddleware = async (c: Context, next: () => Promise<void>) => {
  try {
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: 'No token provided' }, 401);
    }
    
    const decodedToken = await auth().verifyIdToken(token);
    c.set('user', decodedToken);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
```

### Frontend Auth Context
```typescript
// Firebase Auth hook usage
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth();

// Protected action pattern with Firebase Auth
const handleProtectedAction = async () => {
  if (!user) {
    // Show auth modal or redirect to login
    return;
  }
  
  // Get fresh token for API calls
  const token = await user.getIdToken();
  // Execute protected action with token
};
```

## Frontend Development

### React Patterns
- **Function components** with hooks (no class components)
- **TypeScript strict mode** with proper type definitions
- **Context providers** for global state (auth, theme, apps data)
- **Custom hooks** for reusable logic and API calls

### Component Architecture
```typescript
// Component naming: PascalCase for components, camelCase for hooks
export function AppCard({ app, onClick, showStats = false }: AppCardProps) {
  const { user } = useAuth();
  const { toggleFavorite } = useAppsData();
  
  return (
    <Card className="app-card">
      {/* Component implementation */}
    </Card>
  );
}

// Hook pattern for API operations
export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Implementation with error handling and loading states
  return { apps, loading, refetch };
}
```

### Routing with React Router
```typescript
// Protected route wrapper
const routes = [
  {
    path: '/profile',
    element: React.createElement(ProtectedRoute, { 
      children: React.createElement(Profile) 
    }),
  }
];
```

## Security Patterns

### Input Validation
- **Zod schemas** for all API request validation
- **CSRF protection** on state-changing operations
- **Rate limiting** with Firebase Functions quotas and custom middleware
- **Firestore Security Rules** for database-level access control

### Security Headers & CORS
```typescript
// Security configuration for Firebase Functions with Hono
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors({ 
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Error Handling

### Standardized Error Responses
```typescript
// Firebase Functions error handling with Hono
import { Context } from 'hono';

export class BaseController {
  protected static handleError(error: unknown, operation: string, c: Context): Response {
    console.error(`Error in ${operation}:`, error);
    
    if (error instanceof ValidationError) {
      return c.json({ success: false, error: error.message }, 400);
    }
    
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

// Frontend error handling with Firebase and Hono backend
try {
  const response = await fetch('/api/apps', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }
} catch (error) {
  console.error('API error:', error);
  toast.error('An unexpected error occurred');
}
```

## Performance & Optimization

### Vercel & Firebase Optimization
- **Vercel Edge Network** for global CDN and static asset optimization
- **Firebase Functions** for serverless backend operations
- **Firestore composite indexes** for efficient queries
- **Firebase Storage** with CDN for file hosting and optimization

### Frontend Performance
- **Code splitting** with React.lazy for route-based chunks
- **Infinite scrolling** for large data sets (apps, chat history)
- **Optimistic updates** for immediate UI feedback
- **Firebase Realtime Database** for real-time updates

## Testing Strategy

### Backend Testing
- **Unit tests** for Firebase Functions business logic
- **Firebase Emulators** for local testing environment
- **Integration tests** for API endpoints with emulated services

### Frontend Testing
- **Component testing** with React Testing Library
- **Hook testing** for custom hooks
- **E2E testing** for critical user flows

## Environment Configuration

### Local Development
```bash
# Required environment variables
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

### Production Deployment
- **Vercel configuration** in `vercel.json`
- **Firebase configuration** in `firebase.json`
- **Environment-specific** settings for staging/production
- **Firestore indexes** deployed before functions
- **Asset optimization** through Vite build process

## AI Integration Guidelines

### Multi-Provider Support
```typescript
// Provider configuration
const config = {
  provider: 'openai' | 'anthropic' | 'google' | 'cerebras',
  model: 'gpt-4o' | 'claude-3-5-sonnet' | 'gemini-pro',
  // Provider-specific settings
};

// Usage in code generation
const response = await aiService.generateCode(prompt, config);
```

### Code Generation Patterns
- **Structured prompts** with clear context and requirements
- **Iterative refinement** through review cycles
- **Template-based generation** for consistent output formats
- **Error recovery** with fallback providers and retry logic

## Common Pitfalls & Solutions

### Authentication Issues
- Always check Firebase Auth state before accessing protected resources
- Use Firebase Auth state listeners for real-time auth changes
- Handle OAuth redirects properly with Firebase Auth SDK

### Database Operations
- Use Firestore transactions for multi-document operations
- Implement proper error handling with Firestore error codes
- Use Firestore Security Rules for server-side data validation

### Real-time Connections
- Handle Firestore listener cleanup in component unmount
- Implement proper error handling for connection failures
- Use Firestore offline persistence for better UX

### Performance Considerations
- Implement proper pagination with Firestore cursors
- Use Firestore composite indexes for complex queries
- Optimize bundle size with proper code splitting

## Code Style & Conventions

### TypeScript
- Strict mode enabled with comprehensive type checking
- Prefer interfaces over types for object shapes
- Use proper generic constraints and utility types
- Export types and interfaces for reusability

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`, `auth-button.tsx`)
- **Components**: PascalCase (`UserProfile`, `AuthButton`)
- **Functions/Variables**: camelCase (`getUserProfile`, `isAuthenticated`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`, `TOKEN_EXPIRY`)

### Import Organization
```typescript
// 1. External libraries
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 2. Internal modules (absolute imports)
import { AuthService } from '@/services/auth';
import { BaseController } from '@/api/controllers/base';

// 3. Relative imports
import { validateRequestBody } from '../utils/validation';
import type { UserData } from './types';
```

This guide provides the essential knowledge for productive AI assistance with the Stich Production codebase using Vercel and Firebase. Follow these patterns and conventions for consistent, maintainable code that aligns with the project's architecture and standards.