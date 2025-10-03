# Database Patterns Analysis - Stich Production

## Overview

The Stich Production platform uses **Drizzle ORM** with **Cloudflare D1** (SQLite) for comprehensive data management. The implementation demonstrates advanced patterns for schema design, migrations, relationships, and performance optimization.

## Database Architecture

### 1. Core Database Service Pattern

```typescript
export class DatabaseService {
    public readonly db: DrizzleD1Database<typeof schema>;
    private readonly d1: D1Database;
    private readonly enableReplicas: boolean;

    constructor(env: Env) {
        // Sentry instrumentation for monitoring
        const instrumented = Sentry.instrumentD1WithSentry(env.DB);
        this.d1 = instrumented;
        this.db = drizzle(instrumented, { schema });
        this.enableReplicas = env.ENABLE_READ_REPLICAS === 'true';
    }

    // Read replica optimization
    public getReadDb(strategy: 'fast' | 'fresh' = 'fast'): DrizzleD1Database<typeof schema> {
        if (!this.enableReplicas) return this.db;
        
        return drizzle(this.d1.withSession({ strategy }), { schema });
    }
}
```

**Key Features:**
- **Sentry Integration**: Database monitoring and error tracking
- **Read Replicas**: Optimized for global performance
- **Type Safety**: Full TypeScript integration with schema
- **Session Strategy**: Configurable consistency levels

### 2. Service Layer Pattern

All database services extend from `BaseService`:

```typescript
export abstract class BaseService {
    protected logger = createLogger(this.constructor.name);
    protected db: DatabaseService;
    protected env: Env;
    
    constructor(env: Env) {
        this.db = createDatabaseService(env);
        this.env = env;
    }

    // Type-safe query building
    protected buildWhereConditions(conditions: (SQL<unknown> | undefined)[]): SQL<unknown> | undefined {
        const validConditions = conditions.filter((c): c is SQL<unknown> => c !== undefined);
        if (validConditions.length === 0) return undefined;
        if (validConditions.length === 1) return validConditions[0];
        return and(...validConditions);
    }

    // Standardized error handling
    protected handleDatabaseError(error: unknown, operation: string, context?: Record<string, unknown>): never {
        this.logger.error(`Database error in ${operation}`, { error, context });
        throw error;
    }
}
```

## Schema Design Patterns

### 1. Core Entity Design

#### Users Table
```typescript
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    
    // OAuth and Authentication
    provider: text('provider').notNull(), // 'github', 'google', 'email'
    providerId: text('provider_id').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    passwordHash: text('password_hash'),
    
    // Security enhancements
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp' }),
    passwordChangedAt: integer('password_changed_at', { mode: 'timestamp' }),
    
    // User Preferences
    preferences: text('preferences', { mode: 'json' }).default('{}'),
    theme: text('theme', { enum: ['light', 'dark', 'system'] }).default('system'),
    timezone: text('timezone').default('UTC'),
    
    // Account Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    isSuspended: integer('is_suspended', { mode: 'boolean' }).default(false),
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastActiveAt: integer('last_active_at', { mode: 'timestamp' }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete
}, (table) => ({
    // Performance indexes
    emailIdx: index('users_email_idx').on(table.email),
    providerIdx: uniqueIndex('users_provider_unique_idx').on(table.provider, table.providerId),
    usernameIdx: index('users_username_idx').on(table.username),
    failedLoginAttemptsIdx: index('users_failed_login_attempts_idx').on(table.failedLoginAttempts),
    lockedUntilIdx: index('users_locked_until_idx').on(table.lockedUntil),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
    lastActiveAtIdx: index('users_last_active_at_idx').on(table.lastActiveAt),
}));
```

**Design Patterns:**
- **Multi-Provider Auth**: Supports OAuth and email authentication
- **Security Fields**: Failed attempts, account locking, password history
- **JSON Preferences**: Flexible user settings storage
- **Soft Delete**: `deletedAt` for data recovery
- **Comprehensive Indexing**: Optimized query performance

#### Apps Table
```typescript
export const apps = sqliteTable('apps', {
    id: text('id').primaryKey(),
    
    // App Identity
    title: text('title').notNull(),
    description: text('description'),
    iconUrl: text('icon_url'),
    
    // Generation Data
    originalPrompt: text('original_prompt').notNull(),
    finalPrompt: text('final_prompt'),
    blueprint: text('blueprint', { mode: 'json' }),
    
    // Technical Details
    framework: text('framework'),
    
    // Ownership
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sessionToken: text('session_token'), // Anonymous users
    
    // Visibility
    visibility: text('visibility', { enum: ['private', 'public'] }).notNull().default('private'),
    
    // Status
    status: text('status', { enum: ['draft', 'generating', 'ready', 'error', 'deployed'] }).notNull().default('draft'),
    
    // Deployment
    deploymentUrl: text('deployment_url'),
    deploymentStatus: text('deployment_status'),
    deploymentMetadata: text('deployment_metadata', { mode: 'json' }),
    
    // GitHub Integration
    githubRepositoryUrl: text('github_repository_url'),
    githubRepositoryVisibility: text('github_repository_visibility'),
    
    // Hierarchy
    parentAppId: text('parent_app_id').references(() => apps.id),
    version: integer('version').notNull().default(1),
    
    // Features
    isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
    isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
    
    // Screenshots
    screenshotUrl: text('screenshot_url'),
    screenshotCapturedAt: integer('screenshot_captured_at', { mode: 'timestamp' }),
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    lastDeployedAt: integer('last_deployed_at', { mode: 'timestamp' }),
}, (table) => ({
    userIdx: index('apps_user_idx').on(table.userId),
    statusIdx: index('apps_status_idx').on(table.status),
    visibilityIdx: index('apps_visibility_idx').on(table.visibility),
    sessionTokenIdx: index('apps_session_token_idx').on(table.sessionToken),
    parentAppIdx: index('apps_parent_app_idx').on(table.parentAppId),
    searchIdx: index('apps_search_idx').on(table.title, table.description),
    frameworkStatusIdx: index('apps_framework_status_idx').on(table.framework, table.status),
    createdAtIdx: index('apps_created_at_idx').on(table.createdAt),
    visibilityStatusIdx: index('apps_visibility_status_idx').on(table.visibility, table.status),
}));
```

**Advanced Patterns:**
- **Hybrid Ownership**: Supports both authenticated users and anonymous sessions
- **JSON Storage**: Complex metadata stored as JSON with type safety
- **Hierarchical Structure**: Parent-child relationships for app versions
- **Multi-State Status**: Complex deployment and generation states
- **Composite Indexes**: Optimized for common query patterns

### 2. Relationship Patterns

#### Many-to-Many with Metadata
```typescript
export const stars = sqliteTable('stars', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
    starredAt: integer('starred_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userAppIdx: uniqueIndex('stars_user_app_unique_idx').on(table.userId, table.appId),
    appIdx: index('stars_app_idx').on(table.appId),
    userIdx: index('stars_user_idx').on(table.userId),
    starredAtIdx: index('stars_starred_at_idx').on(table.starredAt),
}));
```

#### Audit Trail Pattern
```typescript
export const auditLogs = sqliteTable('audit_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    oldValues: text('old_values', { mode: 'json' }),
    newValues: text('new_values', { mode: 'json' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('audit_logs_user_idx').on(table.userId),
    resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
}));
```

### 3. Security and Analytics Patterns

#### Session Management
```typescript
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Token Management
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    
    // Security Metadata
    ipAddress: text('ip_address').notNull(),
    userAgent: text('user_agent').notNull(),
    deviceFingerprint: text('device_fingerprint'),
    
    // Device Information
    deviceName: text('device_name'),
    deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'
    osName: text('os_name'),
    browserName: text('browser_name'),
    
    // Location
    country: text('country'),
    city: text('city'),
    
    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    
    // Timestamps
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
    accessTokenIdx: uniqueIndex('sessions_access_token_idx').on(table.accessToken),
    refreshTokenIdx: uniqueIndex('sessions_refresh_token_idx').on(table.refreshToken),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
    isActiveIdx: index('sessions_is_active_idx').on(table.isActive),
    deviceFingerprintIdx: index('sessions_device_fingerprint_idx').on(table.deviceFingerprint),
}));
```

#### User Secrets Management
```typescript
export const userSecrets = sqliteTable('user_secrets', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    // Secret Identity
    provider: text('provider').notNull(), // 'openai', 'anthropic', etc.
    secretType: text('secret_type').notNull(), // 'api_key', 'oauth_token'
    displayName: text('display_name').notNull(),
    
    // Encrypted Data
    encryptedValue: text('encrypted_value').notNull(),
    keyPreview: text('key_preview'), // First/last few chars for UI
    
    // Status
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    
    // Usage Tracking
    lastUsed: integer('last_used', { mode: 'timestamp' }),
    usageCount: integer('usage_count').default(0),
    
    // Metadata
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
}, (table) => ({
    userProviderIdx: index('user_secrets_user_provider_idx').on(table.userId, table.provider),
    providerIdx: index('user_secrets_provider_idx').on(table.provider),
    isActiveIdx: index('user_secrets_is_active_idx').on(table.isActive),
    lastUsedIdx: index('user_secrets_last_used_idx').on(table.lastUsed),
}));
```

## Query Patterns and Performance

### 1. Repository Pattern Implementation

```typescript
export class AppService extends BaseService {
    // Complex query with joins and aggregations
    async getPublicAppsWithStats(options: PublicAppQueryOptions): Promise<PaginatedResult<AppWithStats>> {
        const { limit = 20, offset = 0, orderBy = 'recent', framework, timePeriod } = options;

        // Build dynamic where conditions
        const conditions: (SQL<unknown> | undefined)[] = [
            eq(schema.apps.visibility, 'public'),
            eq(schema.apps.status, 'ready'),
            eq(schema.apps.isArchived, false)
        ];

        if (framework) {
            conditions.push(eq(schema.apps.framework, framework));
        }

        const whereCondition = this.buildWhereConditions(conditions);

        // Complex query with multiple CTEs and aggregations
        const query = this.database
            .select({
                app: schema.apps,
                userName: schema.users.displayName,
                userAvatar: schema.users.avatarUrl,
                viewCount: sql<number>`COALESCE(view_stats.total_views, 0)`,
                starCount: sql<number>`COALESCE(star_stats.total_stars, 0)`,
                recentViews: sql<number>`COALESCE(recent_view_stats.recent_views, 0)`,
                recentStars: sql<number>`COALESCE(recent_star_stats.recent_stars, 0)`,
            })
            .from(schema.apps)
            .leftJoin(schema.users, eq(schema.apps.userId, schema.users.id))
            .leftJoin(
                this.database
                    .select({
                        appId: schema.appViews.appId,
                        total_views: sql<number>`COUNT(*)`.as('total_views')
                    })
                    .from(schema.appViews)
                    .groupBy(schema.appViews.appId)
                    .as('view_stats'),
                eq(schema.apps.id, sql`view_stats.appId`)
            )
            .leftJoin(
                this.database
                    .select({
                        appId: schema.stars.appId,
                        total_stars: sql<number>`COUNT(*)`.as('total_stars')
                    })
                    .from(schema.stars)
                    .groupBy(schema.stars.appId)
                    .as('star_stats'),
                eq(schema.apps.id, sql`star_stats.appId`)
            );

        if (whereCondition) {
            query.where(whereCondition);
        }

        // Dynamic ordering
        switch (orderBy) {
            case 'popular':
                query.orderBy(desc(sql`COALESCE(star_stats.total_stars, 0)`));
                break;
            case 'viewed':
                query.orderBy(desc(sql`COALESCE(view_stats.total_views, 0)`));
                break;
            case 'recent':
            default:
                query.orderBy(desc(schema.apps.createdAt));
                break;
        }

        const results = await query.limit(limit).offset(offset);
        
        return {
            data: results,
            total: await this.countPublicApps({ framework }),
            hasMore: results.length === limit
        };
    }
}
```

### 2. Transaction Patterns

```typescript
// Complex multi-table transaction
async transferAppOwnership(appId: string, fromUserId: string, toUserId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
        // 1. Verify current ownership
        const [app] = await tx
            .select({ userId: schema.apps.userId })
            .from(schema.apps)
            .where(and(
                eq(schema.apps.id, appId),
                eq(schema.apps.userId, fromUserId)
            ))
            .limit(1);

        if (!app) {
            throw new Error('App not found or access denied');
        }

        // 2. Transfer ownership
        await tx
            .update(schema.apps)
            .set({ 
                userId: toUserId, 
                updatedAt: new Date().toISOString() 
            })
            .where(eq(schema.apps.id, appId));

        // 3. Log the transfer in audit log
        await tx
            .insert(schema.auditLogs)
            .values({
                id: generateId(),
                userId: fromUserId,
                action: 'transfer_ownership',
                resourceType: 'app',
                resourceId: appId,
                oldValues: JSON.stringify({ userId: fromUserId }),
                newValues: JSON.stringify({ userId: toUserId }),
                timestamp: new Date().toISOString()
            });

        // 4. Update any related records
        await tx
            .update(schema.appViews)
            .set({ userId: toUserId })
            .where(and(
                eq(schema.appViews.appId, appId),
                eq(schema.appViews.userId, fromUserId)
            ));
    });
}
```

### 3. Analytics Query Patterns

```typescript
// Time-series analytics with window functions
async getAppAnalytics(appId: string, period: TimePeriod): Promise<AnalyticsData> {
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Views over time with daily aggregation
    const viewsOverTime = await this.database
        .select({
            date: sql<string>`DATE(viewed_at)`.as('date'),
            views: sql<number>`COUNT(*)`.as('views'),
            uniqueUsers: sql<number>`COUNT(DISTINCT user_id)`.as('unique_users')
        })
        .from(schema.appViews)
        .where(and(
            eq(schema.appViews.appId, appId),
            gte(schema.appViews.viewedAt, startDate.toISOString())
        ))
        .groupBy(sql`DATE(viewed_at)`)
        .orderBy(sql`date`);

    // Top referrers
    const topReferrers = await this.database
        .select({
            referrer: schema.appViews.referrer,
            views: sql<number>`COUNT(*)`.as('views')
        })
        .from(schema.appViews)
        .where(and(
            eq(schema.appViews.appId, appId),
            gte(schema.appViews.viewedAt, startDate.toISOString()),
            isNotNull(schema.appViews.referrer)
        ))
        .groupBy(schema.appViews.referrer)
        .orderBy(desc(sql`views`))
        .limit(10);

    // Device breakdown
    const deviceBreakdown = await this.database
        .select({
            deviceType: schema.appViews.deviceType,
            views: sql<number>`COUNT(*)`.as('views')
        })
        .from(schema.appViews)
        .where(and(
            eq(schema.appViews.appId, appId),
            gte(schema.appViews.viewedAt, startDate.toISOString()),
            isNotNull(schema.appViews.deviceType)
        ))
        .groupBy(schema.appViews.deviceType)
        .orderBy(desc(sql`views`));

    return {
        viewsOverTime,
        topReferrers,
        deviceBreakdown,
        totalViews: viewsOverTime.reduce((sum, day) => sum + day.views, 0),
        uniqueUsers: new Set(
            await this.database
                .select({ userId: schema.appViews.userId })
                .from(schema.appViews)
                .where(and(
                    eq(schema.appViews.appId, appId),
                    gte(schema.appViews.viewedAt, startDate.toISOString())
                ))
        ).size
    };
}
```

## Migration Patterns

### 1. Schema Evolution

```typescript
// Drizzle configuration for migrations
export default defineConfig({
    schema: './worker/database/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    verbose: true,
    strict: true,
});
```

### 2. Migration Commands

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply --local",
    "db:migrate:remote": "wrangler d1 migrations apply",
    "db:studio": "drizzle-kit studio"
  }
}
```

### 3. Safe Migration Patterns

```sql
-- Migration example: Adding new column with default
ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;

-- Create index concurrently (SQLite doesn't support CONCURRENTLY, but pattern shown)
CREATE INDEX IF NOT EXISTS users_two_factor_enabled_idx ON users(two_factor_enabled);

-- Backfill data safely
UPDATE users SET two_factor_enabled = 0 WHERE two_factor_enabled IS NULL;
```

## Performance Optimization Patterns

### 1. Indexing Strategy

```typescript
// Composite indexes for common query patterns
export const apps = sqliteTable('apps', {
    // ... columns
}, (table) => ({
    // Single column indexes
    userIdx: index('apps_user_idx').on(table.userId),
    statusIdx: index('apps_status_idx').on(table.status),
    
    // Composite indexes for common queries
    visibilityStatusIdx: index('apps_visibility_status_idx').on(table.visibility, table.status),
    userStatusIdx: index('apps_user_status_idx').on(table.userId, table.status),
    frameworkStatusIdx: index('apps_framework_status_idx').on(table.framework, table.status),
    
    // Search optimization
    searchIdx: index('apps_search_idx').on(table.title, table.description),
    
    // Time-based queries
    createdAtIdx: index('apps_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('apps_updated_at_idx').on(table.updatedAt),
}));
```

### 2. Read Replica Strategy

```typescript
export class OptimizedService extends BaseService {
    async getPublicData(id: string): Promise<PublicData> {
        // Use read replica for public queries
        const readDb = this.db.getReadDb('fast');
        
        return await readDb
            .select()
            .from(schema.apps)
            .where(and(
                eq(schema.apps.id, id),
                eq(schema.apps.visibility, 'public')
            ))
            .limit(1);
    }

    async createApp(data: NewApp): Promise<App> {
        // Use primary database for writes
        const [app] = await this.database
            .insert(schema.apps)
            .values(data)
            .returning();
        
        return app;
    }
}
```

### 3. Query Optimization Patterns

```typescript
// Batch operations for efficiency
async bulkUpdateAppStatuses(updates: Array<{id: string, status: string}>): Promise<void> {
    if (updates.length === 0) return;

    await this.database.transaction(async (tx) => {
        // Batch updates in single transaction
        for (const update of updates) {
            await tx
                .update(schema.apps)
                .set({ 
                    status: update.status,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(schema.apps.id, update.id));
        }
    });
}

// Efficient pagination with cursor-based approach
async getPaginatedApps(cursor?: string, limit: number = 20): Promise<PaginatedApps> {
    const conditions: SQL[] = [
        eq(schema.apps.visibility, 'public'),
        eq(schema.apps.status, 'ready')
    ];

    if (cursor) {
        conditions.push(lt(schema.apps.createdAt, cursor));
    }

    const apps = await this.database
        .select()
        .from(schema.apps)
        .where(and(...conditions))
        .orderBy(desc(schema.apps.createdAt))
        .limit(limit + 1); // Get one extra to check if there are more

    const hasMore = apps.length > limit;
    const data = hasMore ? apps.slice(0, -1) : apps;
    const nextCursor = hasMore ? data[data.length - 1].createdAt : null;

    return { data, nextCursor, hasMore };
}
```

## Type Safety Patterns

### 1. Schema Type Generation

```typescript
// Automatic type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;

// Partial types for updates
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;
export type AppUpdate = Partial<Omit<App, 'id' | 'createdAt'>>;
```

### 2. Validation Patterns

```typescript
import { z } from 'zod';

// Runtime validation schemas
export const createUserSchema = z.object({
    email: z.string().email().max(255),
    displayName: z.string().min(1).max(100),
    provider: z.enum(['github', 'google', 'email']),
    providerId: z.string().min(1),
});

export const updateAppSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    visibility: z.enum(['private', 'public']).optional(),
});

// Service method with validation
async createUser(data: unknown): Promise<User> {
    const validatedData = createUserSchema.parse(data);
    
    const [user] = await this.database
        .insert(schema.users)
        .values({
            ...validatedData,
            id: generateId(),
            createdAt: new Date().toISOString(),
        })
        .returning();
    
    return user;
}
```

### 3. Query Builder Patterns

```typescript
// Reusable query builders
class AppQueryBuilder {
    private conditions: SQL[] = [];
    private orderByClause: SQL | undefined;
    private limitValue: number | undefined;

    whereVisible(userId?: string): this {
        if (userId) {
            this.conditions.push(
                or(
                    eq(schema.apps.visibility, 'public'),
                    eq(schema.apps.userId, userId)
                )
            );
        } else {
            this.conditions.push(eq(schema.apps.visibility, 'public'));
        }
        return this;
    }

    whereStatus(status: string): this {
        this.conditions.push(eq(schema.apps.status, status));
        return this;
    }

    orderBy(column: keyof App, direction: 'asc' | 'desc' = 'desc'): this {
        this.orderByClause = direction === 'desc' 
            ? desc(schema.apps[column]) 
            : asc(schema.apps[column]);
        return this;
    }

    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    build(db: DrizzleD1Database) {
        let query = db.select().from(schema.apps);
        
        if (this.conditions.length > 0) {
            query = query.where(and(...this.conditions));
        }
        
        if (this.orderByClause) {
            query = query.orderBy(this.orderByClause);
        }
        
        if (this.limitValue) {
            query = query.limit(this.limitValue);
        }
        
        return query;
    }
}

// Usage
const apps = await new AppQueryBuilder()
    .whereVisible(user?.id)
    .whereStatus('ready')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .build(this.database);
```

## Security Patterns

### 1. Row-Level Security Simulation

```typescript
// Service-level security enforcement
export class SecureAppService extends BaseService {
    private async enforceOwnership(appId: string, userId: string): Promise<void> {
        const [app] = await this.database
            .select({ userId: schema.apps.userId })
            .from(schema.apps)
            .where(eq(schema.apps.id, appId))
            .limit(1);

        if (!app || app.userId !== userId) {
            throw new Error('Access denied');
        }
    }

    async updateApp(appId: string, userId: string, data: AppUpdate): Promise<App> {
        await this.enforceOwnership(appId, userId);
        
        const [updated] = await this.database
            .update(schema.apps)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(schema.apps.id, appId))
            .returning();
        
        return updated;
    }

    async deleteApp(appId: string, userId: string): Promise<void> {
        await this.enforceOwnership(appId, userId);
        
        // Soft delete
        await this.database
            .update(schema.apps)
            .set({ 
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .where(eq(schema.apps.id, appId));
    }
}
```

### 2. Data Encryption Patterns

```typescript
// Encrypted fields pattern
export class SecretsService extends BaseService {
    async storeSecret(userId: string, provider: string, value: string): Promise<UserSecret> {
        const encryptedValue = await this.encryptValue(value);
        const keyPreview = this.createKeyPreview(value);
        
        const [secret] = await this.database
            .insert(schema.userSecrets)
            .values({
                id: generateId(),
                userId,
                provider,
                encryptedValue,
                keyPreview,
                secretType: 'api_key',
                displayName: `${provider} API Key`,
                createdAt: new Date().toISOString(),
            })
            .returning();
        
        return secret;
    }

    async getDecryptedSecret(userId: string, secretId: string): Promise<string> {
        const [secret] = await this.database
            .select()
            .from(schema.userSecrets)
            .where(and(
                eq(schema.userSecrets.id, secretId),
                eq(schema.userSecrets.userId, userId),
                eq(schema.userSecrets.isActive, true)
            ))
            .limit(1);

        if (!secret) {
            throw new Error('Secret not found');
        }

        return await this.decryptValue(secret.encryptedValue);
    }

    private async encryptValue(value: string): Promise<string> {
        // Implementation using WebCrypto API
        const key = await this.getEncryptionKey();
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const encrypted = await crypto.subtle.encrypt('AES-GCM', key, data);
        return Buffer.from(encrypted).toString('base64');
    }

    private createKeyPreview(value: string): string {
        if (value.length <= 8) return '*'.repeat(value.length);
        return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
    }
}
```

## Testing Patterns

### 1. Database Testing Setup

```typescript
// Test database setup
export function createTestDatabase(): DrizzleD1Database {
    const db = new Database(':memory:');
    return drizzle(db, { schema });
}

// Test fixtures
export const testFixtures = {
    user: {
        id: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'email',
        providerId: 'test@example.com',
        createdAt: new Date().toISOString(),
    },
    app: {
        id: 'test-app-1',
        title: 'Test App',
        description: 'A test application',
        originalPrompt: 'Create a test app',
        status: 'ready',
        visibility: 'public',
        createdAt: new Date().toISOString(),
    }
};

// Test helper functions
export async function seedTestData(db: DrizzleD1Database) {
    await db.insert(schema.users).values(testFixtures.user);
    await db.insert(schema.apps).values({
        ...testFixtures.app,
        userId: testFixtures.user.id,
    });
}
```

### 2. Service Testing

```typescript
describe('AppService', () => {
    let db: DrizzleD1Database;
    let appService: AppService;
    let mockEnv: Env;

    beforeEach(async () => {
        db = createTestDatabase();
        mockEnv = createMockEnv({ DB: db });
        appService = new AppService(mockEnv);
        await seedTestData(db);
    });

    it('should create app successfully', async () => {
        const appData = {
            title: 'New App',
            description: 'Test description',
            originalPrompt: 'Create a new app',
            userId: testFixtures.user.id,
        };

        const app = await appService.createApp(appData);
        
        expect(app.title).toBe(appData.title);
        expect(app.userId).toBe(appData.userId);
        expect(app.id).toBeDefined();
    });

    it('should enforce visibility rules', async () => {
        const publicApps = await appService.getPublicApps({});
        expect(publicApps.data).toHaveLength(1);
        
        // Create private app
        await appService.createApp({
            title: 'Private App',
            visibility: 'private',
            userId: testFixtures.user.id,
        });
        
        const publicAppsAfter = await appService.getPublicApps({});
        expect(publicAppsAfter.data).toHaveLength(1); // Still only 1 public app
    });
});
```

## Best Practices Summary

### ✅ Schema Design Do's

1. **Use consistent naming conventions** (snake_case for columns)
2. **Add comprehensive indexes** for common query patterns
3. **Use timestamp columns** for audit trails and analytics
4. **Implement soft deletes** where data recovery is important
5. **Use JSON columns** for flexible, evolving data structures
6. **Add foreign key constraints** with appropriate cascade behavior
7. **Use composite indexes** for multi-column queries
8. **Include metadata fields** (created_at, updated_at, version)

### ✅ Query Do's

1. **Use transactions** for multi-table operations
2. **Implement proper pagination** with cursor-based approaches
3. **Use read replicas** for read-heavy workloads
4. **Build reusable query patterns** and builders
5. **Add proper error handling** and logging
6. **Validate inputs** at the service layer
7. **Use type-safe queries** with Drizzle ORM
8. **Optimize with appropriate indexes**

### ❌ Common Pitfalls

1. **Don't use SELECT *** in production queries
2. **Don't ignore index performance** impacts
3. **Don't store sensitive data unencrypted**
4. **Don't mix business logic** with database queries
5. **Don't ignore transaction boundaries**
6. **Don't skip input validation**
7. **Don't use string concatenation** for dynamic queries
8. **Don't ignore database connection limits**

This database architecture provides a solid foundation for scalable, secure, and maintainable data management with modern TypeScript tooling and best practices.