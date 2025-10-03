# Development Rules & Guidelines

## Overview
Comprehensive development guidelines extracted from Stich Production platform analysis, providing coding standards, architectural principles, and best practices for building scalable applications using Vercel, Firebase, and modern TypeScript patterns.

## Table of Contents
1. [Architectural Principles](#architectural-principles)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [Service Architecture Rules](#service-architecture-rules)
4. [Database Design Principles](#database-design-principles)
5. [API Development Standards](#api-development-standards)
6. [Frontend Development Rules](#frontend-development-rules)
7. [Infrastructure Guidelines](#infrastructure-guidelines)
8. [Security Standards](#security-standards)
9. [Performance Guidelines](#performance-guidelines)
10. [Code Quality Rules](#code-quality-rules)

---

## Architectural Principles

### 1. Single Responsibility Principle (SRP)
- **Services**: Each service handles one specific business domain
- **Components**: React components should have a single, well-defined purpose
- **Firebase Functions**: Each function manages one type of operation
- **Middleware**: Each middleware function performs one specific task

### 2. Dependency Injection & Inversion of Control
```typescript
// ✅ Good: Constructor dependency injection
export class UserService {
  constructor(
    private authService: AuthService,
    private emailService: EmailService,
    private logger: Logger
  ) {}
}

// ❌ Bad: Direct instantiation
export class UserService {
  private authService = new AuthService(); // Tight coupling
}
```

### 3. Composition over Inheritance
```typescript
// ✅ Good: Composition with interfaces
interface DatabaseOperations {
  save(data: any): Promise<void>;
  findById(id: string): Promise<any>;
}

class UserService {
  constructor(private db: DatabaseOperations) {}
}

// ❌ Bad: Deep inheritance hierarchies
class BaseUserService extends BaseService {
  // Complex inheritance chain
}
```

### 4. Interface Segregation
```typescript
// ✅ Good: Specific interfaces
interface UserReader {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
}

interface UserWriter {
  create(user: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
}

// ❌ Bad: Monolithic interface
interface UserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  create(user: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  // ... many more methods
}
```

---

## TypeScript Guidelines

### 1. Type Safety Rules

#### Strict Type Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Prefer Type Assertions over Any
```typescript
// ✅ Good: Type assertions with validation
function processApiResponse(response: unknown): UserData {
  if (isUserData(response)) {
    return response;
  }
  throw new Error('Invalid user data format');
}

function isUserData(data: unknown): data is UserData {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'email' in data;
}

// ❌ Bad: Using any type
function processApiResponse(response: any): UserData {
  return response; // No type safety
}
```

### 2. Interface Design Patterns

#### Consistent Naming Conventions
```typescript
// ✅ Good: Descriptive and consistent naming
interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserRequest): Promise<User>;
}

// ❌ Bad: Inconsistent and unclear naming
interface IUser {
  id: string;
  email: string;
}

interface UserStuff {
  doSomething(data: any): any;
}
```

#### Generic Type Constraints
```typescript
// ✅ Good: Proper generic constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ❌ Bad: Unconstrained generics
interface Repository<T> {
  findById(id: string): Promise<T>;
  save(entity: T): Promise<T>;
}
```

### 3. Error Handling Patterns

#### Custom Error Types
```typescript
// ✅ Good: Specific error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// Usage with type-safe error handling
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ValidationError | NotFoundError };
```

---

## Service Architecture Rules

### 1. BaseService Pattern Implementation

#### Mandatory Service Structure
```typescript
// All services MUST extend BaseService
export abstract class BaseService {
  protected logger: Logger;
  protected db: DrizzleDB;

  constructor() {
    this.logger = createObjectLogger(this.constructor.name);
    this.db = getDatabase();
  }

  // Standardized error handling
  protected handleError(error: Error, context: string): never {
    this.logger.error(`${context}: ${error.message}`, error);
    
    if (error instanceof ValidationError) {
      throw new APIError(400, error.message, 'VALIDATION_ERROR');
    }
    if (error instanceof NotFoundError) {
      throw new APIError(404, error.message, 'NOT_FOUND');
    }
    
    throw new APIError(500, 'Internal server error', 'INTERNAL_ERROR');
  }

  // Standardized validation
  protected validateInput<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          `${firstError.path.join('.')}: ${firstError.message}`,
          firstError.path.join('.')
        );
      }
      throw error;
    }
  }
}
```

### 2. Service Layer Organization

#### Clear Service Boundaries
```typescript
// ✅ Good: Domain-specific services
export class UserManagementService extends BaseService {
  async createUser(data: CreateUserRequest): Promise<User> {
    // User creation logic only
  }
  
  async updateUserProfile(id: string, data: UpdateProfileRequest): Promise<User> {
    // Profile update logic only
  }
}

export class AuthenticationService extends BaseService {
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    // Authentication logic only
  }
  
  async refreshToken(token: string): Promise<AuthResult> {
    // Token refresh logic only
  }
}

// ❌ Bad: Mixed responsibilities
export class UserService extends BaseService {
  async createUser(data: CreateUserRequest): Promise<User> { /* ... */ }
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> { /* ... */ }
  async sendEmail(to: string, subject: string): Promise<void> { /* ... */ }
  async processPayment(amount: number): Promise<PaymentResult> { /* ... */ }
}
```

### 3. Transaction Management Patterns

#### Database Transaction Rules
```typescript
// ✅ Good: Explicit transaction boundaries
export class UserService extends BaseService {
  async createUserWithProfile(userData: CreateUserRequest): Promise<User> {
    return await this.db.transaction(async (tx) => {
      // Step 1: Create user
      const user = await tx.insert(usersTable).values({
        email: userData.email,
        hashedPassword: await this.hashPassword(userData.password)
      }).returning();

      // Step 2: Create profile
      await tx.insert(userProfilesTable).values({
        userId: user[0].id,
        name: userData.name,
        avatarUrl: userData.avatarUrl
      });

      // Step 3: Create settings
      await tx.insert(userSettingsTable).values({
        userId: user[0].id,
        theme: 'system',
        notifications: true
      });

      return user[0];
    });
  }
}

// ❌ Bad: No transaction management
export class UserService extends BaseService {
  async createUserWithProfile(userData: CreateUserRequest): Promise<User> {
    const user = await this.db.insert(usersTable).values(userData).returning();
    // If this fails, user is created but profile is not
    await this.db.insert(userProfilesTable).values({ userId: user[0].id });
    return user[0];
  }
}
```

---

## Database Design Principles

### 1. Schema Design Rules

#### Consistent Table Structure
```typescript
// ✅ Good: Consistent table patterns
export const usersTable = pgTable('users', {
  // Primary key
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  
  // Required fields
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  
  // Optional fields with defaults
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  
  // Timestamps (always include)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete support
});

// Indexes for performance
export const usersEmailIndex = index('users_email_idx').on(usersTable.email);
export const usersRoleIndex = index('users_role_idx').on(usersTable.role);
```

#### Relationship Management
```typescript
// ✅ Good: Explicit foreign key relationships
export const userProfilesTable = pgTable('user_profiles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => generateId()),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for type-safe joins
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  profile: one(userProfilesTable, {
    fields: [usersTable.id],
    references: [userProfilesTable.userId],
  }),
  apps: many(appsTable),
}));
```

### 2. Query Optimization Patterns

#### Efficient Query Construction
```typescript
// ✅ Good: Optimized queries with proper selection
export class UserRepository {
  async findUserWithProfile(id: string): Promise<UserWithProfile | null> {
    const result = await this.db
      .select({
        // Explicit field selection
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        profile: {
          name: userProfilesTable.name,
          bio: userProfilesTable.bio,
          avatarUrl: userProfilesTable.avatarUrl,
        }
      })
      .from(usersTable)
      .leftJoin(userProfilesTable, eq(usersTable.id, userProfilesTable.userId))
      .where(eq(usersTable.id, id))
      .limit(1);

    return result[0] || null;
  }

  // ❌ Bad: Select all with unnecessary data
  async findUserWithProfileBad(id: string): Promise<any> {
    return await this.db
      .select() // Selects all fields from all tables
      .from(usersTable)
      .leftJoin(userProfilesTable, eq(usersTable.id, userProfilesTable.userId))
      .where(eq(usersTable.id, id));
  }
}
```

#### Prepared Statement Usage
```typescript
// ✅ Good: Prepared statements for repeated queries
export class UserRepository {
  private findByEmailStmt = this.db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, placeholder('email')))
    .prepare();

  private updateLastLoginStmt = this.db
    .update(usersTable)
    .set({
      lastLoginAt: placeholder('lastLoginAt'),
      updatedAt: placeholder('updatedAt')
    })
    .where(eq(usersTable.id, placeholder('id')))
    .prepare();

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.findByEmailStmt.execute({ email });
    return result[0] || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    const now = new Date();
    await this.updateLastLoginStmt.execute({
      id,
      lastLoginAt: now,
      updatedAt: now
    });
  }
}
```

---

## API Development Standards

### 1. Hono Router Patterns

#### Hierarchical Route Organization
```typescript
// ✅ Good: Organized route hierarchy
const apiRouter = new Hono<{ Bindings: Env }>();

// Public routes (no authentication)
const publicRouter = new Hono<{ Bindings: Env }>();
publicRouter.get('/health', healthCheckHandler);
publicRouter.post('/auth/login', loginHandler);
publicRouter.post('/auth/register', registerHandler);

// Authenticated routes
const authRouter = new Hono<{ Bindings: Env }>();
authRouter.use('*', authenticationMiddleware);
authRouter.get('/users/me', getCurrentUserHandler);
authRouter.patch('/users/me', updateCurrentUserHandler);

// Owner-only routes
const ownerRouter = new Hono<{ Bindings: Env }>();
ownerRouter.use('*', authenticationMiddleware, ownershipMiddleware);
ownerRouter.get('/apps/:id', getAppHandler);
ownerRouter.patch('/apps/:id', updateAppHandler);
ownerRouter.delete('/apps/:id', deleteAppHandler);

// Compose routes
apiRouter.route('/public', publicRouter);
apiRouter.route('/auth', authRouter);
apiRouter.route('/owner', ownerRouter);
```

#### Middleware Pipeline Rules
```typescript
// ✅ Good: Composable middleware pipeline
const createAuthenticatedRoute = () => {
  const router = new Hono<{ Bindings: Env }>();
  
  // Apply middleware in order
  router.use('*', corsMiddleware);
  router.use('*', rateLimitMiddleware);
  router.use('*', authenticationMiddleware);
  router.use('*', validationMiddleware);
  
  return router;
};

// Individual middleware functions
const authenticationMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) {
    throw new APIError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    throw new APIError(401, 'Invalid token', 'INVALID_TOKEN');
  }
};
```

### 2. Request/Response Patterns

#### Consistent API Response Format
```typescript
// ✅ Good: Standardized response format
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    requestId?: string;
    timestamp?: string;
  };
}

// Response helpers
export const createSuccessResponse = <T>(data: T, meta?: any): APIResponse<T> => ({
  success: true,
  data,
  meta: {
    ...meta,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  }
});

export const createErrorResponse = (code: string, message: string, details?: any): APIResponse => ({
  success: false,
  error: { code, message, details },
  meta: {
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  }
});
```

#### Input Validation Standards
```typescript
// ✅ Good: Zod schema validation
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  role: z.enum(['user', 'admin']).optional().default('user')
});

const createUserHandler: Handler<{ Bindings: Env }> = async (c) => {
  try {
    // Validate input
    const body = await c.req.json();
    const validatedData = createUserSchema.parse(body);
    
    // Process request
    const userService = new UserManagementService();
    const user = await userService.createUser(validatedData);
    
    return c.json(createSuccessResponse(user), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        error.errors
      ), 400);
    }
    
    return handleAPIError(c, error);
  }
};
```

---

## Frontend Development Rules

### 1. Component Architecture Standards

#### Component Composition Rules
```tsx
// ✅ Good: Compound component pattern
function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  onRowClick
}: DataTableProps<T>) {
  if (isLoading) return <DataTable.Loading />;
  if (error) return <DataTable.Error error={error} />;
  if (data.length === 0) return <DataTable.Empty />;

  return (
    <div className="data-table">
      <DataTable.Header columns={columns} />
      <DataTable.Body data={data} columns={columns} onRowClick={onRowClick} />
      <DataTable.Footer />
    </div>
  );
}

// Sub-components
DataTable.Loading = () => <div className="loading-state">Loading...</div>;
DataTable.Error = ({ error }: { error: string }) => (
  <div className="error-state">{error}</div>
);
DataTable.Empty = () => <div className="empty-state">No data available</div>;
```

#### Props Interface Conventions
```tsx
// ✅ Good: Explicit props interfaces
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  variant = 'default',
  size = 'default',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
```

### 2. State Management Patterns

#### Context Organization Rules
```tsx
// ✅ Good: Focused context providers
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login: async (credentials: LoginCredentials) => {
      setIsLoading(true);
      try {
        const result = await authService.login(credentials);
        setUser(result.user);
      } finally {
        setIsLoading(false);
      }
    },
    logout: async () => {
      await authService.logout();
      setUser(null);
    },
    refreshUser: async () => {
      try {
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch (error) {
        setUser(null);
      }
    }
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Custom Hook Guidelines
```tsx
// ✅ Good: Specific, reusable hooks
export function useInfiniteScroll<T>(
  fetchFunction: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction(page);
      
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, page, isLoading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (page === 1 && data.length === 0) {
      loadMore();
    }
  }, deps);

  return { data, isLoading, hasMore, error, loadMore, reset };
}
```

### 3. Styling Guidelines

#### Design System Implementation
```tsx
// ✅ Good: Consistent design token usage
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-text-secondary text-bg-3 shadow-xs hover:bg-text-secondary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-bg-3 shadow-xs hover:bg-bg-4 hover:text-text-secondary",
        ghost: "hover:bg-accent hover:text-text-secondary text-text-primary",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Usage with proper typing
function Button({ variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), props.className)}
      {...props}
    />
  );
}
```

---

## Infrastructure Guidelines

### 1. Firebase Functions Design Principles

#### State Management Rules
```typescript
// ✅ Good: Proper state initialization and persistence with Firestore
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export class UserSessionService {
  private db = getFirestore();
  private state: SessionState = {
    userId: '',
    connections: new Map(),
    lastActivity: Date.now()
  };
  private initialized = false;

  async initialize(sessionId: string): Promise<void> {
    if (this.initialized) return;
    
    // Load persisted state from Firestore
    const sessionDoc = await getDoc(doc(this.db, 'sessions', sessionId));
    if (sessionDoc.exists()) {
      const storedState = sessionDoc.data() as SessionState;
      this.state = {
        ...storedState,
        connections: new Map() // Don't persist WebSocket connections
      };
    }
    
    this.initialized = true;
  }

  async updateActivity(sessionId: string): Promise<void> {
    this.state.lastActivity = Date.now();
    
    // Persist state changes to Firestore
    await setDoc(doc(this.db, 'sessions', sessionId), {
      ...this.state,
      connections: undefined // Exclude non-serializable data
    }, { merge: true });
  }

  // Cleanup inactive sessions
  async cleanup(sessionId: string): Promise<void> {
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - this.state.lastActivity > inactiveThreshold) {
      await deleteDoc(doc(this.db, 'sessions', sessionId));
    }
  }
}
```

#### Firebase Real-time Communication Patterns
```typescript
// ✅ Good: Structured real-time communication with Firebase
import { getDatabase, ref, push, onValue, off } from 'firebase/database';

export class ChatRoomService {
  private db = getDatabase();

  async handleJoin(roomId: string, userId: string): Promise<void> {
    // Add user to room participants
    await set(ref(this.db, `rooms/${roomId}/participants/${userId}`), {
      joinedAt: Date.now(),
      isActive: true
    });

    // Notify other participants
    await push(ref(this.db, `rooms/${roomId}/messages`), {
      type: 'user_joined',
      userId,
      timestamp: Date.now()
    });
  }

  subscribeToMessages(roomId: string, callback: (message: any) => void): () => void {
    const messagesRef = ref(this.db, `rooms/${roomId}/messages`);
    
    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      callback(messages);
    });

    // Return unsubscribe function
    return () => off(messagesRef);
  }
}
```

### 2. Vercel Deployment Patterns

#### Environment Configuration Management
```typescript
// ✅ Good: Environment-specific configuration
interface EnvironmentConfig {
  production: {
    maxInstances: 1000;
    instanceType: 'standard';
    rateLimits: {
      api: { limit: 10000, period: 3600 };
      auth: { limit: 100, period: 3600 };
    };
  };
  staging: {
    maxInstances: 100;
    instanceType: 'small';
    rateLimits: {
      api: { limit: 1000, period: 3600 };
      auth: { limit: 50, period: 3600 };
    };
  };
  development: {
    maxInstances: 10;
    instanceType: 'small';
    rateLimits: {
      api: { limit: 100, period: 3600 };
      auth: { limit: 10, period: 3600 };
    };
  };
}

function getEnvironmentConfig(env: string): EnvironmentConfig[keyof EnvironmentConfig] {
  const configs: EnvironmentConfig = { /* ... */ };
  return configs[env as keyof EnvironmentConfig] || configs.development;
}
```

---

## Security Standards

### 1. Authentication & Authorization

#### JWT Token Management
```typescript
// ✅ Good: Secure JWT implementation
export class AuthService extends BaseService {
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async createTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = await this.signJWT(payload, this.JWT_EXPIRES_IN);
    const refreshToken = await this.signJWT(
      { sub: user.id, type: 'refresh' },
      this.REFRESH_TOKEN_EXPIRES_IN
    );

    // Store refresh token hash in database
    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return await jose.jwtVerify(token, new TextEncoder().encode(this.jwtSecret));
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}
```

#### Input Sanitization Rules
```typescript
// ✅ Good: Comprehensive input validation
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
};

const validateAndSanitizeUser = z.object({
  email: z.string().email().transform(val => val.toLowerCase().trim()),
  name: z.string().min(1).max(255).transform(sanitizeInput),
  bio: z.string().max(1000).optional().transform(val => val ? sanitizeInput(val) : val),
});
```

### 2. Rate Limiting Implementation

#### Multi-Level Rate Limiting
```typescript
// ✅ Good: Hierarchical rate limiting
export class RateLimitService {
  async checkRateLimit(
    identifier: string,
    endpoint: string,
    userTier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<RateLimitResult> {
    const limits = this.getLimitsForTier(userTier);
    
    // Check global rate limit
    const globalLimit = await this.checkLimit(
      `global:${identifier}`,
      limits.global
    );
    if (!globalLimit.success) return globalLimit;

    // Check endpoint-specific limit
    const endpointLimit = await this.checkLimit(
      `endpoint:${endpoint}:${identifier}`,
      limits.endpoints[endpoint] || limits.default
    );
    if (!endpointLimit.success) return endpointLimit;

    // Check burst limit
    const burstLimit = await this.checkBurstLimit(identifier, limits.burst);
    return burstLimit;
  }

  private getLimitsForTier(tier: string) {
    const configs = {
      free: {
        global: { limit: 1000, period: 3600 },
        endpoints: {
          '/api/generate': { limit: 10, period: 3600 },
          '/api/deploy': { limit: 5, period: 3600 }
        },
        burst: { limit: 20, period: 60 },
        default: { limit: 100, period: 3600 }
      },
      pro: {
        global: { limit: 10000, period: 3600 },
        endpoints: {
          '/api/generate': { limit: 100, period: 3600 },
          '/api/deploy': { limit: 50, period: 3600 }
        },
        burst: { limit: 200, period: 60 },
        default: { limit: 1000, period: 3600 }
      }
    };
    return configs[tier] || configs.free;
  }
}
```

---

## Performance Guidelines

### 1. Database Optimization

#### Query Performance Rules
```typescript
// ✅ Good: Optimized database queries
export class OptimizedUserRepository {
  // Use prepared statements for repeated queries
  private findActiveUsersStmt = this.db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: userProfilesTable.name,
    })
    .from(usersTable)
    .innerJoin(userProfilesTable, eq(usersTable.id, userProfilesTable.userId))
    .where(
      and(
        eq(usersTable.isActive, true),
        isNull(usersTable.deletedAt)
      )
    )
    .prepare();

  // Batch operations for bulk updates
  async updateLastLoginBatch(userIds: string[]): Promise<void> {
    const now = new Date();
    const batchSize = 100;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await this.db
        .update(usersTable)
        .set({ lastLoginAt: now, updatedAt: now })
        .where(inArray(usersTable.id, batch));
    }
  }

  // Use proper indexing strategies
  async findUsersByRole(role: string, limit: number = 50): Promise<User[]> {
    return await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, role))
      .orderBy(desc(usersTable.createdAt))
      .limit(limit); // Always limit results
  }
}
```

### 2. Frontend Optimization

#### Component Performance Rules
```tsx
// ✅ Good: Optimized component patterns
const ExpensiveComponent = React.memo(({
  data,
  onUpdate,
  filters
}: ExpensiveComponentProps) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data
      .filter(item => filters.status ? item.status === filters.status : true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [data, filters.status]);

  // Memoize callback functions
  const handleItemClick = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <ExpensiveItem
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
});

// Separate expensive sub-components
const ExpensiveItem = React.memo(({
  item,
  onClick
}: ExpensiveItemProps) => {
  return (
    <div onClick={() => onClick(item.id)}>
      {/* Expensive rendering logic */}
    </div>
  );
});
```

#### Code Splitting and Lazy Loading
```tsx
// ✅ Good: Route-based code splitting
const LazyAdminPanel = lazy(() => import('./AdminPanel'));
const LazyUserDashboard = lazy(() => import('./UserDashboard'));
const LazySettingsPage = lazy(() => import('./SettingsPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<GlobalLoadingSpinner />}>
        <Routes>
          <Route path="/admin/*" element={<LazyAdminPanel />} />
          <Route path="/dashboard/*" element={<LazyUserDashboard />} />
          <Route path="/settings/*" element={<LazySettingsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Component-level lazy loading for heavy components
const LazyCodeEditor = lazy(() => import('./CodeEditor'));

function CodeEditorContainer({ code, onChange }: Props) {
  const [shouldLoad, setShouldLoad] = useState(false);

  return (
    <div>
      {shouldLoad ? (
        <Suspense fallback={<CodeEditorSkeleton />}>
          <LazyCodeEditor code={code} onChange={onChange} />
        </Suspense>
      ) : (
        <button onClick={() => setShouldLoad(true)}>
          Load Code Editor
        </button>
      )}
    </div>
  );
}
```

---

## Code Quality Rules

### 1. Error Handling Standards

#### Comprehensive Error Management
```typescript
// ✅ Good: Structured error handling
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ErrorHandler {
  static handle(error: Error, context: string): never {
    // Log error with context
    logger.error(`${context}: ${error.message}`, {
      error: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Convert to application error
    if (error instanceof ApplicationError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      throw new ApplicationError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        error.errors
      );
    }

    // Default to internal server error
    throw new ApplicationError(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}
```

### 2. Testing Guidelines

#### Test Structure Patterns
```typescript
// ✅ Good: Comprehensive test coverage
describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<DrizzleDB>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    userService = new UserService(mockDb);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User'
      };
      const expectedUser = { id: '123', ...userData };
      mockDb.insert.mockResolvedValue([expectedUser]);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockDb.insert).toHaveBeenCalledWith(
        usersTable,
        expect.objectContaining({
          email: userData.email,
          hashedPassword: expect.any(String)
        })
      );
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const userData = { email: 'duplicate@example.com' };
      mockDb.insert.mockRejectedValue(new Error('UNIQUE constraint failed'));

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

### 3. Documentation Standards

#### Code Documentation Rules
```typescript
/**
 * UserManagementService handles all user-related operations including
 * creation, authentication, profile management, and account lifecycle.
 * 
 * @example
 * ```typescript
 * const userService = new UserManagementService();
 * const user = await userService.createUser({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   name: 'John Doe'
 * });
 * ```
 */
export class UserManagementService extends BaseService {
  /**
   * Creates a new user account with the provided information.
   * 
   * @param userData - User registration data
   * @param userData.email - User's email address (must be unique)
   * @param userData.password - Plain text password (will be hashed)
   * @param userData.name - User's display name
   * @returns Promise resolving to the created user (without password)
   * 
   * @throws {ValidationError} When input data is invalid
   * @throws {ConflictError} When email already exists
   * 
   * @example
   * ```typescript
   * const user = await userService.createUser({
   *   email: 'john@example.com',
   *   password: 'mySecurePassword123',
   *   name: 'John Doe'
   * });
   * console.log(user.id); // Generated UUID
   * ```
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Implementation...
  }
}
```

---

## Summary

These development rules and guidelines provide a comprehensive framework for building scalable, maintainable applications using the Stich Production platform patterns. Key principles include:

1. **Type Safety First**: Use TypeScript strictly with proper interfaces and validation
2. **Service-Oriented Architecture**: Clear separation of concerns with dependency injection
3. **Database Best Practices**: Optimized queries, proper indexing, and transaction management
4. **API Consistency**: Standardized request/response patterns with comprehensive error handling
5. **Component Composition**: Reusable, well-typed React components with proper state management
6. **Infrastructure as Code**: Declarative configuration with environment-specific settings
7. **Security by Design**: Multi-layer authentication, authorization, and input validation
8. **Performance Optimization**: Efficient queries, code splitting, and caching strategies
9. **Error Handling**: Comprehensive error management with proper logging and recovery
10. **Code Quality**: Extensive testing, clear documentation, and consistent patterns

Following these guidelines ensures applications built using this platform will be robust, scalable, and maintainable while leveraging the full power of Cloudflare's edge computing platform.