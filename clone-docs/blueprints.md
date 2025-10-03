# Reusable Application Blueprints

## Overview
Modular blueprints extracted from Stich Production platform analysis, providing ready-to-use templates and configurations for building scalable applications with Vercel, Firebase, and modern TypeScript patterns.

## Table of Contents
1. [Full Stack Blueprint](#full-stack-blueprint)
2. [Firebase Functions API Blueprint](#firebase-functions-api-blueprint)
3. [React Frontend Blueprint](#react-frontend-blueprint)
4. [Firebase Services Blueprint](#firebase-services-blueprint)
5. [Firestore Schema Blueprint](#firestore-schema-blueprint)
6. [Authentication Blueprint](#authentication-blueprint)
7. [Deployment Blueprint](#deployment-blueprint)
8. [Setup & Configuration](#setup--configuration)

---

## Full Stack Blueprint

### Project Structure Template
```
my-app/
├── package.json
├── vercel.json
├── firebase.json
├── tsconfig.json
├── vite.config.ts
├── firestore.rules
├── firestore.indexes.json
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── api/
│   │   │   ├── routes.ts
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   └── apps/
│   │   ├── services/
│   │   │   ├── base.ts
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   └── apps.ts
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   └── app.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── cors.ts
│   │   │   └── rate-limit.ts
│   │   ├── config/
│   │   │   ├── firebase.ts
│   │   │   └── env.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── helpers.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── contexts/
│   │   ├── auth-context.tsx
│   │   └── theme-context.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-api.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── api-client.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── favicon.ico
└── scripts/
    ├── deploy.ts
    └── setup.ts
```

### Package.json Template
```json
{
  "name": "my-firebase-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && vercel --prod",
    "functions:build": "cd functions && npm run build",
    "functions:deploy": "firebase deploy --only functions",
    "firestore:deploy": "firebase deploy --only firestore",
    "setup": "node scripts/setup.js"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "firebase": "^10.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-firebase-hooks": "^5.1.1",
    "react-router": "^7.0.2",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "firebase-tools": "^13.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.3",
    "vite": "^6.0.1"
  }
}
```

### Vercel Configuration Template
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id"
  },
  "functions": {
    "binding": "AI"
  },
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-db",
      "database_id": "YOUR_DATABASE_ID",
  "functions": {
    "source": "functions",
    "runtime": "nodejs18.x"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Firebase Configuration Template
```json
{
  "projects": {
    "default": "your-project-id"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Firebase Functions API Blueprint

### Core Functions Setup
```typescript
// functions/src/index.ts
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import cors from 'cors';
import { apiRoutes } from './api/routes';

// Initialize Firebase Admin
initializeApp();

const app = express();

// Global middleware
app.use(cors({ origin: true }));
app.use(express.json());

// API routes
app.use('/api/v1', apiRoutes);

// Export as Firebase Function
export const api = onRequest({
  cors: true,
  maxInstances: 100,
  timeoutSeconds: 60,
  memory: '512MiB'
}, app);
```

### Environment Configuration
```typescript
// functions/src/config/env.ts
export interface FunctionConfig {
  // Firebase services
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
  
  // Environment variables
  environment: 'development' | 'staging' | 'production';
  appName: string;
  
  // External APIs
  openaiApiKey?: string;
  anthropicApiKey?: string;
}
```

### Base Service Template
```typescript
// functions/src/services/base.ts
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from '../database';
import type { DrizzleDB } from '../database/types';

export abstract class BaseService {
  protected logger: ReturnType<typeof createObjectLogger>;
  protected db: DrizzleDB;

  constructor() {
    this.logger = createObjectLogger(this.constructor.name);
    this.db = getDatabase();
  }

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

### API Routes Template
```typescript
// worker/api/routes.ts
import { Hono } from 'hono';
import { authRoutes } from './auth/routes';
import { userRoutes } from './users/routes';
import { authenticationMiddleware } from '../middleware/auth';

const api = new Hono<{ Bindings: Env }>();

// Public routes
api.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auth routes (public)
api.route('/auth', authRoutes);

// Protected routes
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('*', authenticationMiddleware);
protectedRoutes.route('/users', userRoutes);

api.route('/protected', protectedRoutes);

export { api as apiRoutes };
```

---

## React Frontend Blueprint

### App.tsx Template
```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/auth-context';
import { ThemeProvider } from './contexts/theme-context';
import { AppLayout } from './components/layout/app-layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { ProtectedRoute } from './components/auth/protected-route';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    {/* Add more protected routes here */}
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Auth Context Template
```tsx
// src/contexts/auth-context.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password
      });

      if (response.ok && response.data) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
    } catch (error) {
      throw new Error('Login failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/v1/protected/users/me');
      if (response.ok && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### API Client Template
```typescript
// src/lib/api-client.ts
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T> & { ok: boolean }> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      return {
        ...data,
        ok: response.ok
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed'
        },
        ok: false
      };
    }
  }

  async get<T>(endpoint: string): Promise<APIResponse<T> & { ok: boolean }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<APIResponse<T> & { ok: boolean }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<APIResponse<T> & { ok: boolean }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T> & { ok: boolean }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

---

## Durable Objects Blueprint

### Rate Limiter Template
```typescript
// worker/durable-objects/rate-limiter.ts
import { DurableObject } from 'cloudflare:workers';

interface RateLimitBucket {
  count: number;
  timestamp: number;
}

interface RateLimitConfig {
  limit: number;
  period: number; // seconds
  burst?: number;
  burstWindow?: number; // seconds
}

export class RateLimiter extends DurableObject<Env> {
  private buckets = new Map<string, RateLimitBucket>();
  private lastCleanup = Date.now();

  async increment(key: string, config: RateLimitConfig): Promise<{
    success: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - (config.period * 1000);
    
    // Cleanup old buckets
    if (now - this.lastCleanup > 60000) { // Every minute
      this.cleanup(windowStart);
    }

    // Get current count in window
    const currentCount = this.getCountInWindow(key, windowStart);
    
    if (currentCount >= config.limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: windowStart + (config.period * 1000)
      };
    }

    // Add to current bucket
    const bucketKey = `${key}:${Math.floor(now / 10000) * 10000}`;
    const bucket = this.buckets.get(bucketKey) || { count: 0, timestamp: now };
    bucket.count++;
    this.buckets.set(bucketKey, bucket);

    // Persist to storage
    await this.ctx.storage.put(bucketKey, bucket);

    return {
      success: true,
      remaining: config.limit - (currentCount + 1),
      resetTime: windowStart + (config.period * 1000)
    };
  }

  private getCountInWindow(key: string, windowStart: number): number {
    let count = 0;
    for (const [bucketKey, bucket] of this.buckets) {
      if (bucketKey.startsWith(key + ':') && bucket.timestamp > windowStart) {
        count += bucket.count;
      }
    }
    return count;
  }

  private cleanup(cutoff: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.timestamp < cutoff) {
        this.buckets.delete(key);
        this.ctx.storage.delete(key);
      }
    }
    this.lastCleanup = Date.now();
  }
}
```

### Session Manager Template
```typescript
// worker/durable-objects/session-manager.ts
import { DurableObject } from 'cloudflare:workers';

interface SessionData {
  userId: string;
  createdAt: number;
  lastActivity: number;
  metadata: Record<string, any>;
}

export class SessionManager extends DurableObject<Env> {
  private sessions = new Map<string, SessionData>();
  private initialized = false;

  async getSession(sessionId: string): Promise<SessionData | null> {
    await this.ensureInitialized();
    return this.sessions.get(sessionId) || null;
  }

  async createSession(
    sessionId: string, 
    userId: string, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.ensureInitialized();
    
    const sessionData: SessionData = {
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata
    };

    this.sessions.set(sessionId, sessionData);
    await this.ctx.storage.put(`session:${sessionId}`, sessionData);
  }

  async updateActivity(sessionId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.lastActivity = Date.now();
    this.sessions.set(sessionId, session);
    await this.ctx.storage.put(`session:${sessionId}`, session);
    
    return true;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.ensureInitialized();
    
    this.sessions.delete(sessionId);
    await this.ctx.storage.delete(`session:${sessionId}`);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > maxAge) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.deleteSession(sessionId);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const stored = await this.ctx.storage.list<SessionData>();
    for (const [key, session] of stored) {
      if (typeof key === 'string' && key.startsWith('session:')) {
        const sessionId = key.replace('session:', '');
        this.sessions.set(sessionId, session);
      }
    }

    this.initialized = true;
  }
}
```

---

## Database Schema Blueprint

### Database Schema Template
```typescript
// worker/database/schema.ts
import { 
  pgTable, 
  varchar, 
  timestamp, 
  boolean, 
  text, 
  integer,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}));

// User profiles table
export const userProfilesTable = pgTable('user_profiles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  location: varchar('location', { length: 255 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('user_profiles_user_id_idx').on(table.userId),
}));

// Apps table
export const appsTable = pgTable('apps', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: varchar('owner_id', { length: 36 })
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  framework: varchar('framework', { length: 100 }),
  visibility: varchar('visibility', { length: 20 }).default('private').notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  deploymentUrl: varchar('deployment_url', { length: 500 }),
  sourceCode: text('source_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  ownerIdIdx: index('apps_owner_id_idx').on(table.ownerId),
  statusIdx: index('apps_status_idx').on(table.status),
  visibilityIdx: index('apps_visibility_idx').on(table.visibility),
  createdAtIdx: index('apps_created_at_idx').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  profile: one(userProfilesTable, {
    fields: [usersTable.id],
    references: [userProfilesTable.userId],
  }),
  apps: many(appsTable),
}));

export const userProfilesRelations = relations(userProfilesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProfilesTable.userId],
    references: [usersTable.id],
  }),
}));

export const appsRelations = relations(appsTable, ({ one }) => ({
  owner: one(usersTable, {
    fields: [appsTable.ownerId],
    references: [usersTable.id],
  }),
}));
```

### Database Configuration
```typescript
// worker/database/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;

export function getDatabase() {
  if (!db) {
    // Will be injected by Cloudflare Workers
    const d1 = (globalThis as any).DB as D1Database;
    db = drizzle(d1, { schema });
  }
  return db;
}

export type DrizzleDB = ReturnType<typeof getDatabase>;
```

### Drizzle Configuration
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './worker/database/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./local.db', // For local development
  },
} satisfies Config;
```

---

## Authentication Blueprint

### JWT Service Template
```typescript
// worker/services/auth.ts
import { BaseService } from './base';
import { sign, verify } from 'hono/jwt';
import { usersTable } from '../database/schema';
import { eq } from 'drizzle-orm';

export class AuthService extends BaseService {
  private readonly JWT_EXPIRES_IN = '24h';

  async authenticateUser(email: string, password: string): Promise<{
    user: User;
    token: string;
  }> {
    try {
      // Find user by email
      const users = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase()))
        .limit(1);

      const user = users[0];
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.hashedPassword);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update last login
      await this.db
        .update(usersTable)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(usersTable.id, user.id));

      // Generate JWT token
      const token = await this.generateToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      this.handleError(error, 'authenticateUser');
    }
  }

  async verifyToken(token: string, secret: string): Promise<JWTPayload> {
    try {
      const payload = await verify(token, secret);
      return payload as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  private async generateToken(payload: any): Promise<string> {
    return await sign(payload, process.env.JWT_SECRET!);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // Use bcrypt or similar in production
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === hashedPassword;
  }

  private sanitizeUser(user: any): User {
    const { hashedPassword, ...sanitized } = user;
    return sanitized;
  }
}
```

### Authentication Middleware
```typescript
// worker/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { AuthService } from '../services/auth';

export const authenticationMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        401
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const authService = new AuthService();
      const payload = await authService.verifyToken(token, c.env.JWT_SECRET);
      
      // Set user context
      c.set('user', payload);
      c.set('userId', payload.sub);
      
      await next();
    } catch (error) {
      return c.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        401
      );
    }
  }
);
```

---

## Deployment Blueprint

### Deployment Script Template
```typescript
// scripts/deploy.ts
#!/usr/bin/env bun

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  customDomain?: string;
  databaseId?: string;
  kvNamespaceId?: string;
}

class Deployer {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy() {
    console.log(`🚀 Starting deployment to ${this.config.environment}...`);

    try {
      // Step 1: Build the application
      await this.build();

      // Step 2: Run database migrations
      await this.runMigrations();

      // Step 3: Update wrangler configuration
      await this.updateWranglerConfig();

      // Step 4: Deploy to Cloudflare
      await this.deployToCloudflare();

      console.log('✅ Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  private async build() {
    console.log('📦 Building application...');
    execSync('bun run build', { stdio: 'inherit' });
  }

  private async runMigrations() {
    console.log('🗄️ Running database migrations...');
    execSync('bun run db:migrate', { stdio: 'inherit' });
  }

  private async updateWranglerConfig() {
    console.log('⚙️ Updating wrangler configuration...');
    
    const wranglerPath = join(process.cwd(), 'wrangler.jsonc');
    const content = readFileSync(wranglerPath, 'utf-8');
    const config = JSON.parse(content);

    // Update environment-specific settings
    if (this.config.environment === 'production') {
      config.name = 'my-app-production';
      config.vars = {
        ...config.vars,
        ENVIRONMENT: 'production'
      };
      
      if (this.config.customDomain) {
        config.routes = [
          {
            pattern: this.config.customDomain,
            custom_domain: true
          }
        ];
        config.workers_dev = false;
      }
    } else {
      config.name = `my-app-${this.config.environment}`;
      config.vars = {
        ...config.vars,
        ENVIRONMENT: this.config.environment
      };
    }

    // Update database ID if provided
    if (this.config.databaseId) {
      config.d1_databases[0].database_id = this.config.databaseId;
    }

    // Update KV namespace ID if provided
    if (this.config.kvNamespaceId) {
      config.kv_namespaces[0].id = this.config.kvNamespaceId;
    }

    writeFileSync(wranglerPath, JSON.stringify(config, null, 2));
  }

  private async deployToCloudflare() {
    console.log('☁️ Deploying to Cloudflare...');
    execSync('bunx wrangler deploy', { stdio: 'inherit' });
  }
}

// Parse command line arguments
const environment = process.argv[2] as 'development' | 'staging' | 'production' || 'development';

const deployer = new Deployer({
  environment,
  customDomain: process.env.CUSTOM_DOMAIN,
  databaseId: process.env.DATABASE_ID,
  kvNamespaceId: process.env.KV_NAMESPACE_ID,
});

deployer.deploy();
```

### Environment Setup Script
```typescript
// scripts/setup.ts
#!/usr/bin/env bun

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

class ProjectSetup {
  async setup() {
    console.log('🛠️ Setting up project...');

    try {
      // Step 1: Install dependencies
      await this.installDependencies();

      // Step 2: Create D1 database
      await this.createDatabase();

      // Step 3: Create KV namespace
      await this.createKVNamespace();

      // Step 4: Generate Drizzle schema
      await this.generateSchema();

      // Step 5: Run initial migration
      await this.runInitialMigration();

      // Step 6: Create .env.example
      await this.createEnvExample();

      console.log('✅ Project setup completed!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Copy .env.example to .env.local and fill in your values');
      console.log('2. Run `bun dev` to start development server');
      console.log('3. Run `bun run deploy` to deploy to Cloudflare');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }

  private async installDependencies() {
    console.log('📦 Installing dependencies...');
    execSync('bun install', { stdio: 'inherit' });
  }

  private async createDatabase() {
    console.log('🗄️ Creating D1 database...');
    try {
      const result = execSync('bunx wrangler d1 create my-app-db', { encoding: 'utf-8' });
      console.log(result);
      
      // Extract database ID from output and update wrangler.jsonc
      const dbIdMatch = result.match(/database_id = "([^"]+)"/);
      if (dbIdMatch) {
        console.log(`Database ID: ${dbIdMatch[1]}`);
        console.log('Please update wrangler.jsonc with this database ID');
      }
    } catch (error) {
      console.log('Database might already exist, continuing...');
    }
  }

  private async createKVNamespace() {
    console.log('🗂️ Creating KV namespace...');
    try {
      const result = execSync('bunx wrangler kv:namespace create CACHE', { encoding: 'utf-8' });
      console.log(result);
      
      // Extract namespace ID from output
      const nsIdMatch = result.match(/id = "([^"]+)"/);
      if (nsIdMatch) {
        console.log(`KV Namespace ID: ${nsIdMatch[1]}`);
        console.log('Please update wrangler.jsonc with this namespace ID');
      }
    } catch (error) {
      console.log('KV namespace might already exist, continuing...');
    }
  }

  private async generateSchema() {
    console.log('📝 Generating database schema...');
    execSync('bun run db:generate', { stdio: 'inherit' });
  }

  private async runInitialMigration() {
    console.log('🔄 Running initial migration...');
    try {
      execSync('bun run db:migrate', { stdio: 'inherit' });
    } catch (error) {
      console.log('Migration will be run after deployment, continuing...');
    }
  }

  private async createEnvExample() {
    const envPath = join(process.cwd(), '.env.example');
    
    if (!existsSync(envPath)) {
      const envContent = `# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Application Secrets
JWT_SECRET=your_jwt_secret_here

# Optional: Custom Domain
CUSTOM_DOMAIN=yourdomain.com

# Database (update after creating D1 database)
DATABASE_ID=your_database_id_here

# KV Namespace (update after creating KV namespace)
KV_NAMESPACE_ID=your_kv_namespace_id_here
`;

      writeFileSync(envPath, envContent);
      console.log('📄 Created .env.example file');
    }
  }
}

const setup = new ProjectSetup();
setup.setup();
```

---

## Setup & Configuration

### Quick Start Guide

#### 1. Create New Project
```bash
# Clone the blueprint
git clone <blueprint-repo> my-new-app
cd my-new-app

# Run setup script
bun scripts/setup.ts

# Copy environment template
cp .env.example .env.local
```

#### 2. Configure Environment
Edit `.env.local` with your values:
```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
JWT_SECRET=your_secure_jwt_secret
DATABASE_ID=your_d1_database_id
KV_NAMESPACE_ID=your_kv_namespace_id
```

#### 3. Development Workflow
```bash
# Start development server
bun dev

# Generate database changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Open database studio
bun run db:studio
```

#### 4. Deployment
```bash
# Deploy to staging
bun scripts/deploy.ts staging

# Deploy to production
bun scripts/deploy.ts production
```

### Customization Checklist

- [ ] Update `package.json` name and version
- [ ] Replace placeholder names in `wrangler.jsonc`
- [ ] Configure your domain in deployment script
- [ ] Update database schema in `worker/database/schema.ts`
- [ ] Customize API routes in `worker/api/`
- [ ] Modify React components in `src/components/`
- [ ] Update styling in `src/styles/globals.css`
- [ ] Configure authentication providers
- [ ] Set up monitoring and error tracking
- [ ] Add custom business logic

### Advanced Configuration

#### Multi-Environment Setup
```typescript
// environments/staging.ts
export const stagingConfig = {
  name: 'my-app-staging',
  vars: {
    ENVIRONMENT: 'staging',
    API_BASE_URL: 'https://staging-api.example.com',
    MAX_RATE_LIMIT: '1000',
  },
  routes: [
    {
      pattern: 'staging.example.com',
      custom_domain: true
    }
  ]
};

// environments/production.ts
export const productionConfig = {
  name: 'my-app-production',
  vars: {
    ENVIRONMENT: 'production',
    API_BASE_URL: 'https://api.example.com',
    MAX_RATE_LIMIT: '10000',
  },
  routes: [
    {
      pattern: 'app.example.com',
      custom_domain: true
    }
  ]
};
```

#### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Build application
        run: bun run build
        
      - name: Deploy to Cloudflare
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            bun scripts/deploy.ts production
          else
            bun scripts/deploy.ts staging
          fi
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

These blueprints provide a complete foundation for building scalable applications using the patterns and architecture from the Stich Production platform. Each template is modular and can be customized based on specific requirements while maintaining the proven patterns for performance, security, and maintainability.