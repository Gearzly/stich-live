# GitHub Copilot Instructions for Stich Production

## Project Overview

**Stich Production** is a sophisticated AI-powered web application generator built on Vercel's platform with Firebase backend. The system enables users to describe an application and have AI generate, deploy, and host it instantly. This is a full-stack TypeScript application with React frontend and Firebase backend services.

### Key Architecture Components
- **Frontend**: React 19.1.1 + Vite + TypeScript with modern UI components (Vercel)
- **Backend**: Firebase Functions with Express.js/Hono.js framework  
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

### Firebase Functions + Express/Hono.js Patterns
All API routes use **Express.js** or **Hono.js** in Firebase Functions:

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

export const api = onRequest(app.fetch);
```

### Controller Patterns
All controllers follow Firebase Functions patterns with error handling:

```typescript
export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validation
      const body = validateRequestBody(req.body, loginSchema);
      
      // Business logic
      const authService = new AuthService();
      const result = await authService.authenticateUser(body);
      
      // Response
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Authentication failed' });
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
// Firebase Auth middleware for Functions
import { auth } from 'firebase-admin';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decodedToken = await auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
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
// Security configuration for Firebase Functions
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());
```

## Error Handling

### Standardized Error Responses
```typescript
// Firebase Functions error handling
export class BaseController {
  protected static handleError(error: unknown, operation: string, res: Response): void {
    console.error(`Error in ${operation}:`, error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Frontend error handling with Firebase
try {
  const response = await fetch('/api/apps', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appData)
  });
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

## Development Rules & Standards

### MANDATORY: BaseService Pattern
All services MUST extend the BaseService class for consistency:

```typescript
export class UserManagementService extends BaseService {
  constructor() {
    super(); // Provides logger, db, error handling
  }

  async createUser(userData: unknown): Promise<User> {
    try {
      // Always validate input with Zod schemas
      const validatedData = this.validateInput(userData, createUserSchema);
      
      // Business logic here
      const result = await this.db.collection('users').add(validatedData);
      
      this.logger.info('User created', { userId: result.id });
      return result;
    } catch (error) {
      // Use standardized error handling
      this.handleError(error as Error, 'createUser');
    }
  }
}
```

### MANDATORY: Custom Error Types
Always use specific error types instead of generic Error:

```typescript
// ✅ Good - Use specific error types
throw new ValidationError('Email is required', 'email');
throw new NotFoundError('User', userId);
throw new AuthorizationError('Insufficient permissions');

// ❌ Bad - Generic error
throw new Error('Something went wrong');
```

### MANDATORY: Input Validation
All user input MUST be validated using Zod schemas:

```typescript
// ✅ Good - Zod schema validation
const createUserSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(255)
});

// In service method
const validatedData = this.validateInput(userData, createUserSchema);

// ❌ Bad - Manual validation
if (!userData.email) {
  throw new Error('Email is required');
}
```

### MANDATORY: Dependency Injection
Controllers must use dependency injection, not static methods:

```typescript
// ✅ Good - Instance-based with DI
export class AuthController {
  private authService: AuthenticationService;

  constructor() {
    this.authService = new AuthenticationService();
  }

  async register(c: Context): Promise<Response> {
    const result = await this.authService.register(body);
    return c.json(this.createSuccessResponse(result));
  }
}

// ❌ Bad - Static methods
export class AuthController {
  static async register(c: Context): Promise<Response> {
    // Direct database access, no DI
  }
}
```

### MANDATORY: Standardized API Responses
All API responses must follow the standard format:

```typescript
// Success response
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    pagination?: PaginationMeta;
  };
}

// Error response  
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
  };
}
```

### MANDATORY: Service Layer Organization
Each service handles ONE specific business domain:

```typescript
// ✅ Good - Single responsibility
export class UserManagementService extends BaseService {
  async createUser(data: CreateUserRequest): Promise<User> { }
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> { }
  async deleteUser(id: string): Promise<void> { }
}

export class AuthenticationService extends BaseService {
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> { }
  async refreshToken(token: string): Promise<AuthResult> { }
}

// ❌ Bad - Mixed responsibilities
export class UserService extends BaseService {
  async createUser() { }
  async authenticateUser() { }  // Auth responsibility
  async sendEmail() { }        // Email responsibility
  async processPayment() { }   // Payment responsibility
}
```

### MANDATORY: Error Handling Standards
Use the BaseService error handling pattern:

```typescript
export class SomeService extends BaseService {
  async someMethod(data: unknown): Promise<Result> {
    try {
      // Validate input
      const validated = this.validateInput(data, schema);
      
      // Business logic
      const result = await this.performOperation(validated);
      
      this.logger.info('Operation successful', { context });
      return result;
    } catch (error) {
      // Standardized error handling
      this.handleError(error as Error, 'someMethod');
    }
  }
}
```

### Database Transaction Rules
Use explicit transaction boundaries for multi-step operations:

```typescript
// ✅ Good - Explicit transactions
async createUserWithProfile(userData: CreateUserRequest): Promise<User> {
  return await this.db.runTransaction(async (transaction) => {
    // Step 1: Create user
    const userRef = this.db.collection('users').doc();
    await transaction.set(userRef, userData);

    // Step 2: Create profile
    const profileRef = this.db.collection('profiles').doc();
    await transaction.set(profileRef, { userId: userRef.id, ...profileData });

    return { id: userRef.id, ...userData };
  });
}

// ❌ Bad - No transaction management
async createUserWithProfile(userData: CreateUserRequest): Promise<User> {
  const user = await this.db.collection('users').add(userData);
  // If this fails, user is created but profile is not
  await this.db.collection('profiles').add({ userId: user.id });
  return user;
}
```

### Component Architecture (React)
Follow compound component and composition patterns:

```typescript
// ✅ Good - Compound component pattern
function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  if (isLoading) return <DataTable.Loading />;
  if (error) return <DataTable.Error error={error} />;
  if (data.length === 0) return <DataTable.Empty />;

  return (
    <div className="data-table">
      <DataTable.Header columns={columns} />
      <DataTable.Body data={data} columns={columns} onRowClick={onRowClick} />
    </div>
  );
}

// Sub-components
DataTable.Loading = () => <div className="loading-state">Loading...</div>;
DataTable.Error = ({ error }: { error: string }) => <div className="error-state">{error}</div>;
```

### Performance Guidelines
- Use React.memo for expensive components
- Implement proper useMemo and useCallback for optimization
- Use code splitting with React.lazy for route-based chunks
- Implement proper pagination with Firestore cursors
- Use prepared statements for repeated database queries

### Firebase-Specific Patterns

#### Firestore Operations
Always use proper Firestore patterns with error handling:

```typescript
// ✅ Good - Proper Firestore operations
async findUserById(userId: string): Promise<User> {
  try {
    const userDoc = await this.db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new NotFoundError('User', userId);
    }

    return { id: userDoc.id, ...userDoc.data() } as User;
  } catch (error) {
    this.handleError(error as Error, 'findUserById');
  }
}

// Use transactions for multi-document operations
async transferData(fromId: string, toId: string, amount: number): Promise<void> {
  await this.db.runTransaction(async (transaction) => {
    const fromRef = this.db.collection('accounts').doc(fromId);
    const toRef = this.db.collection('accounts').doc(toId);
    
    const fromDoc = await transaction.get(fromRef);
    const toDoc = await transaction.get(toRef);
    
    // Validation and updates within transaction
    transaction.update(fromRef, { balance: fromDoc.data()!.balance - amount });
    transaction.update(toRef, { balance: toDoc.data()!.balance + amount });
  });
}
```

#### Firebase Functions Patterns
Structure functions with proper middleware and error handling:

```typescript
// Firebase Functions with Hono.js
export const api = onRequest(
  {
    cors: true,
    maxInstances: 10,
    memory: '1GiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      // Convert to Hono Request/Response format
      const request = new Request(url, requestInit);
      const response = await app.fetch(request);
      
      // Handle response conversion
      res.status(response.status);
      response.headers.forEach((value, key) => res.set(key, value));
      const body = await response.text();
      res.send(body);
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

#### Real-time Listeners
Use proper listener patterns with cleanup:

```typescript
// ✅ Good - Proper listener with cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'generations', chatId),
    (doc) => {
      const data = doc.data();
      // Handle real-time updates
      setGenerationState(data);
    },
    (error) => {
      console.error('Listener error:', error);
      setError(error.message);
    }
  );

  // Cleanup listener on unmount
  return () => unsubscribe();
}, [chatId]);
```

### Security Standards
- Always validate and sanitize user input
- Use proper Firebase Security Rules
- Implement rate limiting with proper client identification
- Use proper CORS configuration
- Never expose API keys or sensitive data in client code

This guide provides the essential knowledge for productive AI assistance with the Stich Production codebase using Vercel and Firebase. Follow these patterns and conventions for consistent, maintainable code that aligns with the project's architecture and standards.