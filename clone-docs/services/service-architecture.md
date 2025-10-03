# Service Architecture Analysis - Stich Production

## Overview

The Stich Production platform implements a comprehensive service-oriented architecture with standardized patterns for dependency injection, error handling, logging, and resource management. This document analyzes all services and their implementation patterns.

## Core Service Architecture Patterns

### 1. Base Service Pattern

All database services extend from a common `BaseService` class that provides standardized patterns:

```typescript
export abstract class BaseService {
    protected logger = createLogger(this.constructor.name);
    protected db: DatabaseService;
    protected env: Env;
    
    constructor(env: Env) {
        this.db = createDatabaseService(env);
        this.env = env;
    }

    // Standardized error handling
    protected handleDatabaseError(error: unknown, operation: string, context?: Record<string, unknown>): never {
        this.logger.error(`Database error in ${operation}`, { error, context });
        throw error;
    }

    // Type-safe query building
    protected buildWhereConditions(conditions: (SQL<unknown> | undefined)[]): SQL<unknown> | undefined {
        const validConditions = conditions.filter((c): c is SQL<unknown> => c !== undefined);
        if (validConditions.length === 0) return undefined;
        if (validConditions.length === 1) return validConditions[0];
        return and(...validConditions);
    }
}
```

**Key Patterns:**
- **Dependency Injection**: Services receive `Env` and create their dependencies
- **Structured Logging**: Each service gets a logger with its class name
- **Error Boundaries**: Standardized error handling with context
- **Type Safety**: Drizzle ORM integration with compile-time type checking

### 2. Controller Error Handling Pattern

Controllers use a standardized error handling pattern:

```typescript
export class ControllerErrorHandler {
    static async handleControllerOperation<T>(
        operation: () => Promise<T>,
        operationName: string,
        context?: Record<string, any>
    ): Promise<T | Response> {
        try {
            return await operation();
        } catch (error) {
            const appError = ErrorHandler.handleError(error, operationName, context);
            return ErrorHandler.toResponse(appError);
        }
    }

    static validateRequiredParams(params: Record<string, any>, requiredFields: string[]): void {
        for (const field of requiredFields) {
            if (!params[field]) {
                throw ErrorFactory.validationError(`${field} is required`, { field });
            }
        }
    }
}
```

## Service Catalog

### 1. Authentication Services

#### AuthService
**Purpose**: Core authentication logic including login, registration, password management
**Location**: `worker/database/services/AuthService.ts`

**Key Patterns:**
```typescript
export class AuthService extends BaseService {
    async register(data: RegistrationData, request: Request): Promise<AuthResult> {
        try {
            // Input validation
            await this.validateRegistrationData(data);
            
            // Business logic
            const hashedPassword = await hash(data.password);
            const user = await this.createUser({ ...data, password: hashedPassword });
            
            // Audit logging
            await this.logAuthAttempt(data.email, 'register', true, request);
            
            return { success: true, user };
        } catch (error) {
            await this.logAuthAttempt(data.email, 'register', false, request);
            throw error;
        }
    }
}
```

**Features:**
- Password hashing with secure algorithms
- Rate limiting integration
- Audit trail logging
- JWT token management
- OAuth provider integration (Google, GitHub)

#### SessionService
**Purpose**: Session lifecycle management, device tracking, security monitoring
**Location**: `worker/database/services/SessionService.ts`

**Key Patterns:**
```typescript
export class SessionService extends BaseService {
    static readonly config: SessionConfig = {
        maxSessions: 5,
        sessionTTL: 3 * 24 * 60 * 60,
        cleanupInterval: 60 * 60,
        maxConcurrentDevices: 3,
    };

    async createSession(userId: string, request: Request): Promise<SessionResult> {
        // Device fingerprinting
        const deviceInfo = this.extractDeviceInfo(request);
        
        // Session cleanup
        await this.cleanupExpiredSessions(userId);
        
        // Security monitoring
        await this.detectSuspiciousActivity(userId, deviceInfo);
        
        // Session creation
        return this.createNewSession(userId, deviceInfo);
    }
}
```

**Features:**
- Device fingerprinting and tracking
- Concurrent session limits
- Automatic cleanup of expired sessions
- Security event logging
- Suspicious activity detection

### 2. Sandbox Services

#### BaseSandboxService
**Purpose**: Abstract base for all sandbox implementations
**Location**: `worker/services/sandbox/BaseSandboxService.ts`

**Architecture Pattern:**
```typescript
export abstract class BaseSandboxService {
    protected logger: StructuredLogger;
    protected sandboxId: string;

    constructor(sandboxId: string) {
        this.logger = createObjectLogger(this, 'SandboxService');
        this.sandboxId = sandboxId;
    }

    // Template Management
    abstract getTemplateDetails(templateName: string): Promise<TemplateDetailsResponse>;
    static async listTemplates(): Promise<TemplateListResponse>;

    // Instance Lifecycle
    abstract bootstrap(templateName: string, projectName: string): Promise<BootstrapResponse>;
    abstract shutdown(instanceId: string): Promise<ShutdownResponse>;
    
    // File Operations
    abstract writeFiles(instanceId: string, request: WriteFilesRequest): Promise<WriteFilesResponse>;
    abstract getFiles(instanceId: string, paths?: string[]): Promise<GetFilesResponse>;
    
    // Command Execution
    abstract executeCommands(instanceId: string, commands: string[]): Promise<ExecuteCommandsResponse>;
}
```

**Implementation Patterns:**
- **Template Strategy**: Multiple sandbox implementations (SDK, Remote)
- **Lifecycle Management**: Bootstrap → Execute → Shutdown pattern
- **Resource Isolation**: Each sandbox instance is isolated
- **Logging Integration**: Structured logging for debugging

#### SandboxSdkClient
**Purpose**: Cloudflare SDK-based sandbox implementation
**Location**: `worker/services/sandbox/sandboxSdkClient.ts`

**Key Features:**
```typescript
export class SandboxSdkClient extends BaseSandboxService {
    private async waitForServerReady(instanceId: string, processId: string): Promise<boolean> {
        const readinessPatterns = [
            /Local:\s+https?:\/\/[^\s]+/,
            /ready in \d+ms/i,
            /Local development server started/i,
            /server ready/i
        ];

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const logsResult = await this.getLogs(instanceId, true);
            if (logsResult.success && this.checkReadinessPatterns(logsResult.logs.stdout, readinessPatterns)) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
        return false;
    }
}
```

**Patterns:**
- **Health Checking**: Monitor sandbox readiness through log patterns
- **Resource Provisioning**: Dynamic port allocation and URL generation
- **GitHub Integration**: Automated repository creation and file pushing
- **Error Recovery**: Automatic retry and fallback mechanisms

#### RemoteSandboxServiceClient
**Purpose**: Remote sandbox service integration
**Location**: `worker/services/sandbox/remoteSandboxService.ts`

**Network Pattern:**
```typescript
export class RemoteSandboxServiceClient extends BaseSandboxService {
    private async makeRequest<T>(
        endpoint: string,
        method: string = 'GET',
        body?: unknown,
        params?: Record<string, string>
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                method,
                headers: this.getHeaders(),
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error('Runner service request failed', { endpoint, error });
            throw error;
        }
    }
}
```

### 3. Database Services

#### ModelConfigService
**Purpose**: AI model configuration management
**Location**: `worker/database/services/ModelConfigService.ts`

**Configuration Pattern:**
```typescript
export class ModelConfigService extends BaseService {
    async getUserModelConfigs(userId: string): Promise<Record<AgentActionKey, UserModelConfigWithMetadata>> {
        const userConfigs = await this.database
            .select()
            .from(userModelConfigs)
            .where(and(
                eq(userModelConfigs.userId, userId),
                eq(userModelConfigs.isActive, true)
            ));

        const result: Record<string, UserModelConfigWithMetadata> = {};

        // Merge user configs with defaults
        for (const [actionKey, defaultConfig] of Object.entries(AGENT_CONFIG)) {
            const userConfig = userConfigs.find(uc => uc.agentActionName === actionKey);
            
            result[actionKey] = userConfig 
                ? this.mergeWithDefaults(userConfig, defaultConfig)
                : { ...defaultConfig, isUserOverride: false };
        }

        return result as Record<AgentActionKey, UserModelConfigWithMetadata>;
    }
}
```

#### AppService
**Purpose**: Application lifecycle and project management
**Location**: `worker/database/services/AppService.ts`

**CRUD Pattern:**
```typescript
export class AppService extends BaseService {
    async createApp(userId: string, appData: CreateAppData): Promise<App> {
        const appId = generateId();
        const now = new Date().toISOString();

        const [app] = await this.database
            .insert(schema.apps)
            .values({
                id: appId,
                userId,
                name: appData.name,
                description: appData.description,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        this.logger.info('App created', { appId, userId, name: appData.name });
        return app;
    }
}
```

### 4. Analytics Services

#### AiGatewayAnalyticsService
**Purpose**: AI Gateway analytics and metrics collection
**Location**: `worker/services/analytics/AiGatewayAnalyticsService.ts`

**GraphQL Integration Pattern:**
```typescript
export class AiGatewayAnalyticsService {
    private async executeGraphQLQuery<T>(
        query: string,
        variables: GraphQLQueryVariables
    ): Promise<T> {
        const response = await fetch(this.config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new AnalyticsError(
                `GraphQL request failed: ${response.status}`,
                'GRAPHQL_ERROR',
                response.status
            );
        }

        const result = await response.json() as CloudflareAnalyticsResponse<T>;
        
        if (result.errors?.length) {
            throw new AnalyticsError(
                `GraphQL errors: ${JSON.stringify(result.errors)}`,
                'GRAPHQL_ERROR',
                400
            );
        }

        return result.data;
    }
}
```

### 5. Rate Limiting Services

#### RateLimitService
**Purpose**: Traffic control and abuse prevention
**Location**: `worker/services/rate-limit/rateLimits.ts`

**Sliding Window Pattern:**
```typescript
export class RateLimitService {
    static async enforceRateLimit(
        env: Env,
        config: RateLimitConfig,
        identifier: string,
        limitType: RateLimitType
    ): Promise<void> {
        const store = new KVRateLimitStore(env.RATE_LIMIT_KV);
        const key = `${limitType}:${identifier}`;
        
        const result = await store.checkAndIncrement(
            key,
            config.limit,
            config.windowSizeMs
        );

        if (!result.allowed) {
            throw new RateLimitExceededError(
                `Rate limit exceeded for ${limitType}`,
                limitType,
                config.limit,
                config.windowSizeMs
            );
        }
    }
}
```

### 6. Security Services

#### CsrfService
**Purpose**: CSRF protection using double-submit cookie pattern
**Location**: `worker/services/csrf/CsrfService.ts`

**Double-Submit Cookie Pattern:**
```typescript
export class CsrfService {
    static async generateToken(env: Env): Promise<{ token: string; cookie: string }> {
        const token = await generateSecureToken(32);
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        const cookie = createSecureCookie('csrf_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            expires,
            path: '/'
        });

        return { token, cookie };
    }

    static async validateToken(request: Request, token: string): Promise<boolean> {
        const cookies = parseCookies(request.headers.get('cookie') || '');
        const cookieToken = cookies.csrf_token;
        
        if (!cookieToken || cookieToken !== token) {
            logger.warn('CSRF token validation failed', { 
                hasCookie: !!cookieToken,
                tokensMatch: cookieToken === token 
            });
            return false;
        }

        return true;
    }
}
```

## Logging and Monitoring Patterns

### 1. Structured Logging

```typescript
export class StructuredLogger {
    private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: scrubCredentials(message) as string,
            component: this.component,
            ...this.contextFields
        };

        // Add scrubbed data
        if (data) {
            try {
                const scrubbedData = scrubCredentials(data);
                if (scrubbedData && typeof scrubbedData === 'object') {
                    Object.assign(logEntry, scrubbedData as Record<string, unknown>);
                }
            } catch {
                logEntry.data = '[DATA_SCRUB_FAILED]';
            }
        }

        // Add error details with credential scrubbing
        if (error instanceof Error) {
            logEntry.error = {
                name: error.name,
                message: scrubCredentials(error.message) as string,
                stack: scrubCredentials(error.stack) as string | undefined,
            };
        }

        this.output(level, logEntry);
    }
}
```

### 2. Error Factory Pattern

```typescript
export class ErrorFactory {
    static validationError(message: string, context?: Record<string, any>): AppError {
        return new AppError('VALIDATION_ERROR', message, 400, context);
    }

    static authenticationError(message: string = 'Authentication required'): AppError {
        return new AppError('AUTHENTICATION_ERROR', message, 401);
    }

    static authorizationError(message: string = 'Insufficient permissions'): AppError {
        return new AppError('AUTHORIZATION_ERROR', message, 403);
    }

    static notFoundError(resource: string): AppError {
        return new AppError('NOT_FOUND', `${resource} not found`, 404);
    }

    static rateLimitError(message: string = 'Rate limit exceeded'): AppError {
        return new AppError('RATE_LIMIT_EXCEEDED', message, 429);
    }
}
```

## Development Rules and Patterns

### 1. Service Design Principles

#### Single Responsibility
- Each service handles one domain area
- Clear boundaries between services
- Minimal coupling between services

#### Dependency Injection
```typescript
// ✅ Good: Constructor injection
export class UserService extends BaseService {
    constructor(env: Env) {
        super(env);
        this.authService = new AuthService(env);
    }
}

// ❌ Bad: Hard-coded dependencies
export class UserService {
    private authService = new AuthService(); // Hard to test
}
```

#### Error Handling
```typescript
// ✅ Good: Structured error handling
try {
    const result = await this.performOperation();
    this.logger.info('Operation completed', { result });
    return result;
} catch (error) {
    this.logger.error('Operation failed', { error });
    throw this.handleDatabaseError(error, 'performOperation');
}

// ❌ Bad: Silent failures
try {
    const result = await this.performOperation();
    return result;
} catch (error) {
    return null; // Silent failure
}
```

### 2. Database Patterns

#### Repository Pattern
```typescript
export class UserRepository {
    async findById(id: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);
        
        return user || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const [user] = await this.database
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email.toLowerCase()))
            .limit(1);
        
        return user || null;
    }
}
```

#### Transaction Pattern
```typescript
async transferOwnership(fromUserId: string, toUserId: string, appId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
        // Verify ownership
        const app = await tx.select().from(schema.apps)
            .where(and(eq(schema.apps.id, appId), eq(schema.apps.userId, fromUserId)))
            .limit(1);
        
        if (!app.length) {
            throw new Error('App not found or access denied');
        }

        // Transfer ownership
        await tx.update(schema.apps)
            .set({ userId: toUserId, updatedAt: new Date().toISOString() })
            .where(eq(schema.apps.id, appId));

        // Log transfer
        await tx.insert(schema.auditLog).values({
            action: 'ownership_transfer',
            resourceId: appId,
            userId: fromUserId,
            details: { newOwnerId: toUserId }
        });
    });
}
```

### 3. API Patterns

#### Request Validation
```typescript
const createAppSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    visibility: z.enum(['public', 'private']).default('private')
});

export async function createApp(c: Context) {
    try {
        const body = await c.req.json();
        const data = createAppSchema.parse(body);
        
        const user = c.get('user');
        ControllerErrorHandler.requireAuthentication(user);
        
        const app = await appService.createApp(user.id, data);
        return c.json({ success: true, data: app });
    } catch (error) {
        return ControllerErrorHandler.handleControllerOperation(
            () => { throw error; },
            'createApp',
            { userId: c.get('user')?.id }
        );
    }
}
```

#### Response Standardization
```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}

export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
    return { success: true, data, meta };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse<never> {
    return { success: false, error: { code, message, details } };
}
```

### 4. Testing Patterns

#### Service Testing
```typescript
describe('UserService', () => {
    let userService: UserService;
    let mockEnv: Env;

    beforeEach(() => {
        mockEnv = createMockEnv();
        userService = new UserService(mockEnv);
    });

    it('should create user successfully', async () => {
        const userData = { email: 'test@example.com', name: 'Test User' };
        const user = await userService.createUser(userData);
        
        expect(user.email).toBe(userData.email);
        expect(user.id).toBeDefined();
    });

    it('should handle duplicate email error', async () => {
        const userData = { email: 'test@example.com', name: 'Test User' };
        await userService.createUser(userData);
        
        await expect(userService.createUser(userData))
            .rejects.toThrow('Email already exists');
    });
});
```

## Performance Optimization Patterns

### 1. Caching Strategies

```typescript
export class CachedUserService extends BaseService {
    private cache = new Map<string, User>();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    async getUserById(id: string): Promise<User | null> {
        const cached = this.cache.get(id);
        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        const user = await this.database
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);

        if (user.length) {
            this.cache.set(id, { ...user[0], _cacheTime: Date.now() });
            return user[0];
        }

        return null;
    }

    private isCacheValid(item: any): boolean {
        return Date.now() - item._cacheTime < this.cacheTimeout;
    }
}
```

### 2. Connection Pooling

```typescript
export class DatabaseService {
    private static connections = new Map<string, DrizzleD1Database>();

    static getConnection(env: Env): DrizzleD1Database {
        const key = env.DATABASE_URL || 'default';
        
        if (!this.connections.has(key)) {
            const db = drizzle(env.DB);
            this.connections.set(key, db);
        }

        return this.connections.get(key)!;
    }
}
```

### 3. Lazy Loading

```typescript
export class LazyLoadedService {
    private _heavyResource: HeavyResource | null = null;

    private async getHeavyResource(): Promise<HeavyResource> {
        if (!this._heavyResource) {
            this._heavyResource = await this.initializeHeavyResource();
        }
        return this._heavyResource;
    }

    async performHeavyOperation(): Promise<Result> {
        const resource = await this.getHeavyResource();
        return resource.performOperation();
    }
}
```

## Security Implementation Patterns

### 1. Input Sanitization

```typescript
export function sanitizeInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove potential HTML
        .replace(/['";]/g, '') // Remove SQL injection chars
        .trim()
        .slice(0, 1000); // Limit length
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}
```

### 2. Access Control

```typescript
export class AccessControl {
    static async canAccess(
        user: AuthUser,
        resource: string,
        action: string,
        resourceId?: string
    ): Promise<boolean> {
        // Role-based access
        if (user.role === 'admin') return true;
        
        // Resource-specific permissions
        if (resourceId) {
            const ownership = await this.checkOwnership(user.id, resource, resourceId);
            if (ownership) return true;
        }
        
        // Permission-based access
        return this.hasPermission(user, resource, action);
    }

    private static async checkOwnership(
        userId: string,
        resource: string,
        resourceId: string
    ): Promise<boolean> {
        // Implementation specific to resource type
        switch (resource) {
            case 'app':
                return this.checkAppOwnership(userId, resourceId);
            case 'session':
                return this.checkSessionOwnership(userId, resourceId);
            default:
                return false;
        }
    }
}
```

## Deployment and Scaling Patterns

### 1. Health Checks

```typescript
export class HealthCheckService {
    async checkHealth(): Promise<HealthStatus> {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkExternalServices(),
            this.checkMemoryUsage()
        ]);

        const status: HealthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {}
        };

        checks.forEach((check, index) => {
            const name = ['database', 'external', 'memory'][index];
            status.checks[name] = check.status === 'fulfilled' 
                ? check.value 
                : { status: 'unhealthy', error: check.reason };
        });

        const hasUnhealthy = Object.values(status.checks)
            .some(check => check.status === 'unhealthy');
        
        if (hasUnhealthy) status.status = 'unhealthy';

        return status;
    }
}
```

### 2. Circuit Breaker Pattern

```typescript
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'half-open';
            } else {
                throw new Error('Circuit breaker is open');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.threshold) {
            this.state = 'open';
        }
    }
}
```

## Migration and Upgrade Patterns

### 1. Database Migrations

```typescript
export class MigrationService {
    async runMigrations(): Promise<void> {
        const appliedMigrations = await this.getAppliedMigrations();
        const availableMigrations = await this.getAvailableMigrations();
        
        const pendingMigrations = availableMigrations
            .filter(m => !appliedMigrations.includes(m.id))
            .sort((a, b) => a.timestamp - b.timestamp);

        for (const migration of pendingMigrations) {
            await this.applyMigration(migration);
        }
    }

    private async applyMigration(migration: Migration): Promise<void> {
        await this.database.transaction(async (tx) => {
            // Apply migration
            await migration.up(tx);
            
            // Record migration
            await tx.insert(schema.migrations).values({
                id: migration.id,
                name: migration.name,
                appliedAt: new Date().toISOString()
            });
        });
    }
}
```

### 2. Feature Flags

```typescript
export class FeatureFlags {
    private flags: Map<string, boolean> = new Map();

    async isEnabled(flag: string, userId?: string): Promise<boolean> {
        // Global flags
        if (this.flags.has(flag)) {
            return this.flags.get(flag)!;
        }

        // User-specific flags
        if (userId) {
            return this.getUserFlag(flag, userId);
        }

        return false;
    }

    async setFlag(flag: string, enabled: boolean): Promise<void> {
        this.flags.set(flag, enabled);
        await this.persistFlag(flag, enabled);
    }
}
```

## Best Practices Summary

### ✅ Do's

1. **Use dependency injection** for all service dependencies
2. **Implement structured logging** with context and error details
3. **Handle errors gracefully** with proper error types and messages
4. **Validate all inputs** at service boundaries
5. **Use transactions** for multi-step database operations
6. **Implement rate limiting** for public APIs
7. **Add health checks** for all critical services
8. **Use type-safe database queries** with Drizzle ORM
9. **Implement proper access control** for all resources
10. **Add comprehensive testing** for all service methods

### ❌ Don'ts

1. **Don't use global state** in services
2. **Don't ignore errors** or fail silently
3. **Don't hardcode configuration** values
4. **Don't mix business logic** with presentation logic
5. **Don't skip input validation** at any layer
6. **Don't expose internal errors** to users
7. **Don't use synchronous operations** for I/O
8. **Don't create circular dependencies** between services
9. **Don't bypass rate limiting** in any scenario
10. **Don't skip logging** for important operations

This service architecture provides a robust foundation for building scalable, maintainable applications with proper separation of concerns, error handling, and security considerations.