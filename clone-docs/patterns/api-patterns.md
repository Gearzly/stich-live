# API Patterns Analysis - Stich Production

## Overview

The Stich Production platform uses **Hono.js** as its web framework with **Cloudflare Workers** for a high-performance, type-safe API architecture. The implementation demonstrates advanced patterns for routing, middleware, authentication, and request handling.

## Core API Architecture

### 1. Application Bootstrap Pattern

```typescript
export function createApp(env: Env): Hono<AppEnv> {
    const app = new Hono<AppEnv>();

    // 1. Security Middlewares (skip for WebSocket upgrades)
    app.use('*', async (c, next) => {
        const upgradeHeader = c.req.header('upgrade');
        if (upgradeHeader?.toLowerCase() === 'websocket') {
            return next();
        }
        return secureHeaders(getSecureHeadersConfig(env))(c, next);
    });
    
    // 2. CORS Configuration
    app.use('/api/*', cors(getCORSConfig(env)));
    
    // 3. CSRF Protection (double-submit cookie pattern)
    app.use('*', async (c, next) => {
        const method = c.req.method.toUpperCase();
        
        // Skip for WebSocket upgrades and GET requests
        if (upgradeHeader?.toLowerCase() === 'websocket' || method === 'GET') {
            return next();
        }
        
        const token = c.req.header('x-csrf-token');
        const isValid = await CsrfService.validateToken(c.req.raw, token || '');
        
        if (!isValid) {
            throw new SecurityError(SecurityErrorType.CSRF_VIOLATION, 'Invalid CSRF token');
        }
        
        return next();
    });

    // 4. Global Configuration Middleware
    app.use('/api/*', async (c, next) => {
        const config = await getGlobalConfigurableSettings(env);
        c.set('config', config);
        
        // Global rate limiting
        await RateLimitService.enforceGlobalApiRateLimit(env, config.security.rateLimit, null, c.req.raw);
        await next();
    });

    // 5. Default Authentication Requirement
    app.use('/api/*', setAuthLevel(AuthConfig.ownerOnly));

    // 6. Route Setup
    setupRoutes(app);

    // 7. Fallback to Assets
    app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));
    
    return app;
}
```

**Architecture Layers:**
1. **Security Layer**: Headers, CORS, CSRF protection
2. **Configuration Layer**: Global settings and rate limiting
3. **Authentication Layer**: Default auth requirements
4. **Route Layer**: Business logic routing
5. **Fallback Layer**: Asset serving for SPA

### 2. Request Routing Pattern

#### Main Application Routing
```typescript
async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { hostname, pathname } = new URL(request.url);
    const previewDomain = env.CUSTOM_PREVIEW_DOMAIN || 'localhost';
    
    const isMainDomainRequest = hostname === env.CUSTOM_DOMAIN || hostname === 'localhost';
    const isSubdomainRequest = hostname.endsWith(`.${previewDomain}`) || 
                               (hostname.endsWith('.localhost') && hostname !== 'localhost');

    // Route 1: Main Platform Request (API and static assets)
    if (isMainDomainRequest) {
        if (!pathname.startsWith('/api/')) {
            return env.ASSETS.fetch(request); // Static assets
        }
        const app = createApp(env);
        return app.fetch(request, env, ctx); // API requests
    }

    // Route 2: User App Request (subdomain previews)
    if (isSubdomainRequest) {
        return handleUserAppRequest(request, env, ctx);
    }

    return new Response('Not Found', { status: 404 });
}
```

**Request Flow:**
1. **Domain Detection**: Main platform vs user app subdomains
2. **Static Assets**: Direct routing to Cloudflare Assets
3. **API Requests**: Full middleware pipeline processing
4. **User Apps**: Subdomain-based app serving

## Authentication and Authorization Patterns

### 1. Hierarchical Authentication System

```typescript
export type AuthLevel = 'public' | 'authenticated' | 'owner-only';

export interface AuthRequirement {
    required: boolean;
    level: AuthLevel;
    resourceOwnershipCheck?: (env: Env, user: AuthUser, params: Record<string, string>) => Promise<boolean>;
}

export const AuthConfig = {
    // Public route - no authentication required
    public: { 
        required: false, 
        level: 'public' as const 
    },
    
    // Require authentication (any valid user)
    authenticated: { 
        required: true, 
        level: 'authenticated' as const 
    },
    
    // Require resource ownership
    ownerOnly: { 
        required: true, 
        level: 'owner-only' as const,
        resourceOwnershipCheck: checkAppOwnership
    },
} as const;
```

### 2. Route Authentication Enforcement

```typescript
export async function routeAuthChecks(
    user: AuthUser | null,
    env: Env,
    requirement: AuthRequirement,
    params?: Record<string, string>
): Promise<{ success: boolean; response?: Response }> {
    // Public routes always pass
    if (requirement.level === 'public') {
        return { success: true };
    }

    // Authenticated routes
    if (requirement.level === 'authenticated') {
        if (!user) {
            return {
                success: false,
                response: createAuthRequiredResponse()
            };
        }
        return { success: true };
    }

    // Owner-only routes
    if (requirement.level === 'owner-only') {
        if (!user) {
            return {
                success: false,
                response: createAuthRequiredResponse('Account required')
            };
        }

        // Check resource ownership if function provided
        if (requirement.resourceOwnershipCheck && params) {
            const hasAccess = await requirement.resourceOwnershipCheck(env, user, params);
            if (!hasAccess) {
                return {
                    success: false,
                    response: errorResponse('FORBIDDEN', 'Access denied', 403)
                };
            }
        }

        return { success: true };
    }

    return { success: false, response: createAuthRequiredResponse() };
}
```

### 3. Resource Ownership Checking

```typescript
async function checkAppOwnership(env: Env, user: AuthUser, params: Record<string, string>): Promise<boolean> {
    const appId = params.id;
    if (!appId) return false;

    const appService = new AppService(env);
    const ownership = await appService.checkAppOwnership(appId, user.id);
    return ownership.success;
}

// Usage in routes
app.put('/api/apps/:id', setAuthLevel(AuthConfig.ownerOnly), adaptController(AppController, AppController.updateApp));
```

## Router and Middleware Patterns

### 1. Modular Route Organization

```typescript
export function setupRoutes(app: Hono<AppEnv>): void {
    // Health check
    app.get('/api/health', (c) => c.json({ status: 'ok' })); 
    
    // Public routes
    setupSentryRoutes(app);      // Error reporting
    setupStatusRoutes(app);      // Platform status
    
    // Authentication system
    setupAuthRoutes(app);        // Login, OAuth, sessions
    
    // Core business logic
    setupCodegenRoutes(app);     // AI code generation
    setupAppRoutes(app);         // App management
    setupUserRoutes(app);        // User profiles
    
    // Analytics and monitoring
    setupStatsRoutes(app);       // Usage statistics
    setupAnalyticsRoutes(app);   // AI Gateway analytics
    
    // Configuration and secrets
    setupSecretsRoutes(app);     // API key management
    setupModelConfigRoutes(app); // AI model configuration
    setupModelProviderRoutes(app); // Custom providers
    
    // Integrations
    setupGitHubExporterRoutes(app); // GitHub export
    setupScreenshotRoutes(app);     // App screenshots
}
```

### 2. Sub-Router Pattern

```typescript
export function setupAppRoutes(app: Hono<AppEnv>): void {
    const appRouter = new Hono<AppEnv>();
    
    // ========================================
    // PUBLIC ROUTES (Unauthenticated access)
    // ========================================
    appRouter.get('/public', setAuthLevel(AuthConfig.public), 
        adaptController(AppController, AppController.getPublicApps));
    
    appRouter.get('/:id', setAuthLevel(AuthConfig.public), 
        adaptController(AppViewController, AppViewController.getAppDetails));

    // ========================================
    // AUTHENTICATED USER ROUTES
    // ========================================
    appRouter.get('/', setAuthLevel(AuthConfig.authenticated), 
        adaptController(AppController, AppController.getUserApps));
    
    appRouter.get('/recent', setAuthLevel(AuthConfig.authenticated), 
        adaptController(AppController, AppController.getRecentApps));

    // ========================================
    // OWNER-ONLY ROUTES (Resource modification)
    // ========================================
    appRouter.put('/:id/visibility', setAuthLevel(AuthConfig.ownerOnly), 
        adaptController(AppController, AppController.updateAppVisibility));
    
    appRouter.delete('/:id', setAuthLevel(AuthConfig.ownerOnly), 
        adaptController(AppController, AppController.deleteApp));
    
    // Mount under /api/apps
    app.route('/api/apps', appRouter);
}
```

### 3. Controller Adapter Pattern

```typescript
type ControllerMethod<T extends BaseController> = (
    this: T,
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    context: RouteContext
) => Promise<Response>;

export function adaptController<T extends BaseController>(
    controller: T,
    method: ControllerMethod<T>
) {
    return async (c: Context<AppEnv>): Promise<Response> => {
        // 1. Enforce authentication requirement
        const authResult = await enforceAuthRequirement(c);
        if (authResult) {
            return authResult;
        }

        // 2. Build route context
        const routeContext: RouteContext = {
            user: c.get('user'),
            sessionId: c.get('sessionId'),
            config: c.get('config'),
            pathParams: c.req.param(),
            queryParams: new URL(c.req.url).searchParams,
        };

        // 3. Execute controller method
        return await method.call(controller, c.req.raw, c.env, c.executionCtx, routeContext);
    };
}
```

**Benefits:**
- **Type Safety**: Full TypeScript integration
- **Consistent Context**: Standardized request context
- **Automatic Auth**: Seamless authentication enforcement
- **Clean Separation**: Controllers independent of framework

## Request/Response Patterns

### 1. Standardized Response Format

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
        hasMore?: boolean;
    };
}

// Success response helper
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
    return { success: true, data, meta };
}

// Error response helper
export function errorResponse(code: string, message: string, status: number = 400, details?: unknown): Response {
    return new Response(JSON.stringify({
        success: false,
        error: { code, message, details }
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}
```

### 2. Input Validation Pattern

```typescript
// Zod validation schemas
const createAppSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    framework: z.string().optional(),
    visibility: z.enum(['public', 'private']).default('private')
});

// Controller with validation
export class AppController extends BaseController {
    static async createApp(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        try {
            // 1. Parse and validate input
            const body = await request.json();
            const validatedData = createAppSchema.parse(body);
            
            // 2. Business logic
            const appService = new AppService(env);
            const app = await appService.createApp({
                ...validatedData,
                userId: routeContext.user!.id
            });
            
            // 3. Standardized response
            return AppController.createSuccessResponse(app);
            
        } catch (error) {
            if (error instanceof z.ZodError) {
                return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, error.errors);
            }
            
            return AppController.handleError(error, 'createApp', { userId: routeContext.user?.id });
        }
    }
}
```

### 3. Pagination Pattern

```typescript
interface PaginationParams {
    limit?: number;
    offset?: number;
    cursor?: string;
}

interface PaginatedResult<T> {
    data: T[];
    total?: number;
    hasMore: boolean;
    nextCursor?: string;
}

// Controller implementation
static async getPublicApps(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const orderBy = url.searchParams.get('orderBy') || 'recent';
    const framework = url.searchParams.get('framework') || undefined;

    const appService = new AppService(env);
    const result = await appService.getPublicAppsWithStats({
        limit,
        offset,
        orderBy: orderBy as 'recent' | 'popular' | 'viewed',
        framework
    });

    return AppController.createSuccessResponse(result.data, {
        total: result.total,
        hasMore: result.hasMore,
        page: Math.floor(offset / limit) + 1,
        limit
    });
}
```

## Security Patterns

### 1. Rate Limiting Middleware

```typescript
export class RateLimitService {
    static async enforceGlobalApiRateLimit(
        env: Env,
        config: RateLimitConfig,
        user: AuthUser | null,
        request: Request
    ): Promise<void> {
        const identifier = user?.id || this.getClientIdentifier(request);
        const limitType = user ? 'authenticated_user' : 'anonymous_user';
        
        const result = await this.checkRateLimit(env, identifier, limitType, config);
        
        if (!result.allowed) {
            throw new RateLimitExceededError(
                `Rate limit exceeded: ${result.remaining}/${config.limit} requests per ${config.windowMs}ms`,
                limitType,
                config.limit,
                config.windowMs,
                ['Upgrade your account for higher limits', 'Wait before making more requests']
            );
        }
    }

    private static getClientIdentifier(request: Request): string {
        const clientIP = request.headers.get('CF-Connecting-IP') || 
                        request.headers.get('X-Forwarded-For') || 
                        'unknown';
        const userAgent = request.headers.get('User-Agent') || 'unknown';
        return `${clientIP}:${userAgent.slice(0, 50)}`;
    }
}
```

### 2. CSRF Protection Pattern

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
            return false;
        }

        return true;
    }
}
```

### 3. Secure Headers Configuration

```typescript
export function getSecureHeadersConfig(env: Env): Parameters<typeof secureHeaders>[0] {
    return {
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.sentry-cdn.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.cloudflare.com", "wss:", "ws:"],
            frameSrc: ["'self'", "https:"],
            mediaSrc: ["'self'", "blob:"],
            workerSrc: ["'self'", "blob:"]
        },
        crossOriginEmbedderPolicy: false, // Allows iframe embedding
        crossOriginOpenerPolicy: false,   // Allows popup windows
        crossOriginResourcePolicy: false, // Allows cross-origin requests
        referrerPolicy: "strict-origin-when-cross-origin",
        xContentTypeOptions: "nosniff",
        xFrameOptions: false, // We want to allow embedding
        xXSSProtection: "1; mode=block"
    };
}
```

## Error Handling Patterns

### 1. Centralized Error Handling

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
            if (error instanceof SecurityError) {
                return errorResponse(error.type, error.message, error.statusCode);
            }
            
            if (error instanceof RateLimitExceededError) {
                return new Response(JSON.stringify({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: error.message,
                        details: error.details
                    }
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            if (error instanceof z.ZodError) {
                return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, error.errors);
            }
            
            // Generic error handling
            const appError = ErrorHandler.handleError(error, operationName, context);
            return ErrorHandler.toResponse(appError);
        }
    }
}
```

### 2. Type-Safe Error Responses

```typescript
export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class ErrorFactory {
    static validationError(message: string, details?: unknown): ApiError {
        return new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details);
    }

    static authenticationError(message: string = 'Authentication required'): ApiError {
        return new ApiError(ErrorCode.AUTHENTICATION_ERROR, message, 401);
    }

    static authorizationError(message: string = 'Access denied'): ApiError {
        return new ApiError(ErrorCode.AUTHORIZATION_ERROR, message, 403);
    }

    static notFoundError(resource: string): ApiError {
        return new ApiError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
    }
}
```

### 3. Logging and Monitoring Integration

```typescript
export class BaseController {
    protected static logger = createLogger('BaseController');

    static handleError(error: unknown, action: string, context?: Record<string, unknown>): Response {
        // Log error with context
        this.logger.error(`Controller error in ${action}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            context
        });

        // Report to Sentry
        Sentry.captureException(error, {
            tags: { component: 'Controller', action },
            extra: context
        });

        // Return appropriate response
        if (error instanceof SecurityError) {
            return errorResponse(error.type, error.message, error.statusCode);
        }

        return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
}
```

## Real-time Communication Patterns

### 1. WebSocket Upgrade Pattern

```typescript
app.use('*', async (c, next) => {
    const upgradeHeader = c.req.header('upgrade');
    
    // Skip middlewares for WebSocket upgrades
    if (upgradeHeader?.toLowerCase() === 'websocket') {
        return next();
    }
    
    // Apply normal middleware chain
    return secureHeaders(getSecureHeadersConfig(env))(c, next);
});

// WebSocket route
app.get('/api/agent/:agentId/connect', setAuthLevel(AuthConfig.ownerOnly), 
    adaptController(CodingAgentController, CodingAgentController.connectToExistingAgent));
```

### 2. Streaming Response Pattern

```typescript
export class StreamingController extends BaseController {
    static async streamCodeGeneration(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const agentId = routeContext.pathParams.agentId;
        
        // Create readable stream
        const stream = new ReadableStream({
            start(controller) {
                // Initialize streaming
                this.setupStreamingHandlers(controller, agentId, env);
            },
            
            cancel() {
                // Cleanup on client disconnect
                this.cleanupStream(agentId);
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    private static setupStreamingHandlers(controller: ReadableStreamDefaultController, agentId: string, env: Env) {
        // Send periodic updates
        const intervalId = setInterval(() => {
            const data = JSON.stringify({ type: 'progress', agentId, timestamp: Date.now() });
            controller.enqueue(`data: ${data}\n\n`);
        }, 1000);

        // Store interval for cleanup
        this.activeStreams.set(agentId, intervalId);
    }
}
```

## Testing Patterns

### 1. Route Testing

```typescript
describe('App API Routes', () => {
    let app: Hono<AppEnv>;
    let env: Env;

    beforeEach(() => {
        env = createMockEnv();
        app = createApp(env);
    });

    it('should return public apps without authentication', async () => {
        const response = await app.request('/api/apps/public', {
            method: 'GET'
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    it('should require authentication for user apps', async () => {
        const response = await app.request('/api/apps', {
            method: 'GET'
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should allow authenticated user to access their apps', async () => {
        const authHeaders = await createAuthHeaders(env, testUser);
        
        const response = await app.request('/api/apps', {
            method: 'GET',
            headers: authHeaders
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
```

### 2. Authentication Testing

```typescript
describe('Authentication Middleware', () => {
    it('should enforce owner-only access for app modification', async () => {
        const app = createApp(env);
        const otherUser = await createTestUser(env, 'other@example.com');
        const authHeaders = await createAuthHeaders(env, otherUser);
        
        // Try to delete an app owned by different user
        const response = await app.request(`/api/apps/${testApp.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should allow app owner to modify their app', async () => {
        const app = createApp(env);
        const authHeaders = await createAuthHeaders(env, testApp.owner);
        
        const response = await app.request(`/api/apps/${testApp.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });

        expect(response.status).toBe(200);
    });
});
```

### 3. Integration Testing

```typescript
describe('API Integration Tests', () => {
    it('should complete full app creation flow', async () => {
        const app = createApp(env);
        const user = await createTestUser(env);
        const authHeaders = await createAuthHeaders(env, user);

        // 1. Create app
        const createResponse = await app.request('/api/apps', {
            method: 'POST',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Test App',
                description: 'A test application',
                framework: 'react'
            })
        });

        expect(createResponse.status).toBe(201);
        const createData = await createResponse.json();
        const appId = createData.data.id;

        // 2. Update app visibility
        const updateResponse = await app.request(`/api/apps/${appId}/visibility`, {
            method: 'PUT',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ visibility: 'public' })
        });

        expect(updateResponse.status).toBe(200);

        // 3. Verify app appears in public listing
        const publicResponse = await app.request('/api/apps/public');
        const publicData = await publicResponse.json();
        
        expect(publicData.data.some((app: any) => app.id === appId)).toBe(true);
    });
});
```

## Performance Optimization Patterns

### 1. Response Caching

```typescript
const CACHE_DURATIONS = {
    PUBLIC_APPS: 300, // 5 minutes
    APP_DETAILS: 60,  // 1 minute
    USER_PROFILE: 30  // 30 seconds
};

export class CachedController extends BaseController {
    static async getPublicApps(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const cacheKey = `public-apps:${new URL(request.url).search}`;
        
        // Try cache first
        const cached = await env.CACHE_KV.get(cacheKey);
        if (cached) {
            return new Response(cached, {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate response
        const appService = new AppService(env);
        const apps = await appService.getPublicApps(this.parseQueryParams(request));
        const response = this.createSuccessResponse(apps);

        // Cache response
        const responseText = await response.clone().text();
        await env.CACHE_KV.put(cacheKey, responseText, {
            expirationTtl: CACHE_DURATIONS.PUBLIC_APPS
        });

        return response;
    }
}
```

### 2. Request Deduplication

```typescript
const pendingRequests = new Map<string, Promise<Response>>();

export class DeduplicatedController extends BaseController {
    static async getAppDetails(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const appId = routeContext.pathParams.id;
        const cacheKey = `app-details:${appId}`;

        // Check if request is already pending
        if (pendingRequests.has(cacheKey)) {
            return pendingRequests.get(cacheKey)!;
        }

        // Create new request promise
        const requestPromise = this.fetchAppDetails(appId, env);
        pendingRequests.set(cacheKey, requestPromise);

        try {
            const response = await requestPromise;
            return response;
        } finally {
            // Clean up pending request
            pendingRequests.delete(cacheKey);
        }
    }

    private static async fetchAppDetails(appId: string, env: Env): Promise<Response> {
        const appService = new AppService(env);
        const app = await appService.getAppWithDetails(appId);
        return this.createSuccessResponse(app);
    }
}
```

### 3. Batch Processing

```typescript
export class BatchController extends BaseController {
    static async batchUpdateApps(request: Request, env: Env, ctx: ExecutionContext, routeContext: RouteContext): Promise<Response> {
        const { updates } = await request.json() as { updates: Array<{id: string, data: any}> };
        
        // Validate batch size
        if (updates.length > 100) {
            return errorResponse('BATCH_TOO_LARGE', 'Maximum 100 updates per batch', 400);
        }

        const appService = new AppService(env);
        const results = await Promise.allSettled(
            updates.map(update => 
                appService.updateApp(update.id, routeContext.user!.id, update.data)
            )
        );

        // Process results
        const successes = results
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value);

        const failures = results
            .map((result, index) => result.status === 'rejected' ? {
                index,
                error: result.reason.message
            } : null)
            .filter(Boolean);

        return this.createSuccessResponse({
            successes: successes.length,
            failures: failures.length,
            results: successes,
            errors: failures
        });
    }
}
```

## Development Rules and Best Practices

### ✅ API Design Do's

1. **Use consistent REST patterns** for resource operations
2. **Implement proper HTTP status codes** for different scenarios
3. **Provide standardized response formats** across all endpoints
4. **Use hierarchical authentication** (public → authenticated → owner-only)
5. **Implement comprehensive input validation** with Zod schemas
6. **Add rate limiting** to prevent abuse
7. **Use sub-routers** for logical grouping of related endpoints
8. **Implement proper error handling** with detailed error responses
9. **Add comprehensive logging** for debugging and monitoring
10. **Use type-safe routing** with TypeScript throughout

### ✅ Security Do's

1. **Apply security headers** to all responses
2. **Implement CSRF protection** for state-changing operations
3. **Use CORS properly** with appropriate origin restrictions
4. **Validate all inputs** at the API boundary
5. **Implement rate limiting** at multiple levels (global, user, endpoint)
6. **Use secure authentication** with JWT and proper session management
7. **Check resource ownership** before allowing modifications
8. **Log security events** for audit purposes
9. **Use HTTPS everywhere** in production
10. **Implement proper secret management** for API keys

### ✅ Performance Do's

1. **Use response caching** for frequently accessed data
2. **Implement request deduplication** for expensive operations
3. **Use database read replicas** for read-heavy workloads
4. **Add proper indexing** for database queries
5. **Implement pagination** for large result sets
6. **Use streaming responses** for long-running operations
7. **Optimize bundle size** by code splitting
8. **Use compression** for response data
9. **Implement graceful degradation** for service failures
10. **Monitor performance metrics** and optimize bottlenecks

### ❌ Common Pitfalls

1. **Don't expose internal errors** to client applications
2. **Don't skip authentication** on sensitive endpoints
3. **Don't ignore rate limiting** requirements
4. **Don't hardcode configuration** values in routes
5. **Don't mix business logic** with routing logic
6. **Don't ignore input validation** on any endpoint
7. **Don't use global state** in controllers
8. **Don't skip error logging** for debugging
9. **Don't ignore CORS** configuration for production
10. **Don't bypass middleware** for convenience

This API architecture provides a robust, secure, and scalable foundation for modern web applications with comprehensive type safety, authentication, and performance optimization.