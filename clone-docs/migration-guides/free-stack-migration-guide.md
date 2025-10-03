# Complete Migration Guide: Cloudflare → Free Stack

**Target:** Zero-cost development platform with enterprise scaling capabilities  
**Timeline:** 4-6 weeks for complete migration  
**Cost Savings:** ~$420/year (from $35/month to $0/month)

---

## 🎯 Migration Overview

### Current Stack vs Free Alternative

| Component | Current (Cloudflare) | Free Alternative | Migration Effort |
|-----------|---------------------|------------------|------------------|
| **Frontend Hosting** | Workers Static Assets | Vercel/Netlify | ⭐ Low |
| **Backend API** | Cloudflare Workers | Vercel Functions/Railway | ⭐⭐ Medium |
| **Database** | D1 (SQLite) | Supabase/Turso/Neon | ⭐⭐ Medium |
| **File Storage** | R2 | Supabase Storage | ⭐ Low |
| **Real-time** | Durable Objects | Socket.io + Supabase | ⭐⭐⭐ High |
| **AI Services** | Cloudflare AI | Ollama + Free APIs | ⭐⭐ Medium |
| **Code Execution** | Containers | WebContainers | ⭐⭐⭐ High |
| **Deployment** | Workers for Platforms | Vercel API | ⭐⭐ Medium |

---

## 📋 Pre-Migration Checklist

### Account Setup
- [ ] **Vercel Account** - Frontend hosting & serverless functions
- [ ] **Supabase Account** - Database, storage, auth, real-time
- [ ] **Railway/Render Account** - Backend hosting alternative
- [ ] **Hugging Face Account** - Free AI API access
- [ ] **GitHub Account** - Code storage & CI/CD

### Local Development Setup
```bash
# Install required tools
npm install -g @vercel/cli
npm install -g supabase
npm install -g ollama

# Set up Ollama for local AI
ollama pull codellama:7b
ollama pull starcoder:7b
ollama serve
```

---

## 🏗️ Phase 1: Infrastructure Foundation

### 1. Database Migration (D1 → Supabase)

**Step 1: Create Supabase Project**
```bash
# Initialize Supabase project
npx supabase init
npx supabase start
npx supabase gen types typescript --local > types/supabase.ts
```

**Step 2: Schema Migration**
```sql
-- migrations/001_initial_schema.sql
-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apps table
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'deployed', 'failed')),
  generated_code JSONB,
  deployed_url TEXT,
  preview_url TEXT,
  github_repo TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation logs table
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  message TEXT,
  progress INTEGER DEFAULT 0,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_generation_logs_app_id ON generation_logs(app_id);
CREATE INDEX idx_generation_logs_session_id ON generation_logs(session_id);
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own apps" ON apps FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own generation logs" ON generation_logs FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM apps WHERE apps.id = generation_logs.app_id)
);
CREATE POLICY "Users can view own analytics" ON analytics FOR ALL USING (auth.uid() = user_id);
```

**Step 3: Data Migration Script**
```typescript
// scripts/migrate-data.ts
import { createClient } from '@supabase/supabase-js'

interface CloudflareData {
  users: any[]
  apps: any[]
  analytics: any[]
}

async function migrateData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // 1. Export from Cloudflare D1
  const cloudflareData = await exportFromCloudflare()
  
  // 2. Transform data format
  const transformedData = transformData(cloudflareData)
  
  // 3. Import to Supabase
  await importToSupabase(supabase, transformedData)
  
  console.log('Migration completed successfully!')
}

async function exportFromCloudflare(): Promise<CloudflareData> {
  // Implement D1 data export
  // This would typically involve API calls to your existing Cloudflare setup
  return {
    users: [],
    apps: [],
    analytics: []
  }
}
```

### 2. Backend API Migration (Workers → Express/Hono)

**Step 1: Create Backend Structure**
```bash
mkdir stich-backend-free
cd stich-backend-free
npm init -y

# Install dependencies
npm install express cors helmet compression morgan
npm install @supabase/supabase-js socket.io ollama
npm install jsonwebtoken bcryptjs zod
npm install -D @types/node @types/express typescript tsx nodemon
```

**Step 2: Server Setup**
```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Routes
import authRoutes from './routes/auth'
import appsRoutes from './routes/apps'
import agentsRoutes from './routes/agents'
import analyticsRoutes from './routes/analytics'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/apps', appsRoutes)
app.use('/api/v1/agents', agentsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io, supabase }
```

**Step 3: Deploy to Railway/Vercel**

**Railway Deployment:**
```yaml
# railway.yml
build:
  builder: NIXPACKS
  buildCommand: npm run build
  startCommand: npm start

environment:
  NODE_ENV: production
```

**Vercel Deployment:**
```json
{
  "version": 2,
  "name": "stich-backend",
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🚀 Phase 2: Core Feature Migration

### 1. AI Service Migration (Cloudflare AI → Ollama + Free APIs)

**Step 1: Local AI Setup**
```typescript
// src/services/ai/ollama.service.ts
import { Ollama } from 'ollama'

export class OllamaService {
  private ollama: Ollama
  
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    })
  }
  
  async generateCode(prompt: string, model = 'codellama:7b'): Promise<string> {
    try {
      const response = await this.ollama.generate({
        model: model,
        prompt: this.buildCodePrompt(prompt),
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 4096
        }
      })
      
      return response.response
    } catch (error) {
      console.error('Ollama generation failed:', error)
      throw new Error('Local AI generation failed')
    }
  }
  
  private buildCodePrompt(userPrompt: string): string {
    return `You are an expert React developer. Generate clean, modern React code based on this request:

${userPrompt}

Requirements:
- Use TypeScript
- Use functional components with hooks
- Include proper error handling
- Add inline comments for complex logic
- Use Tailwind CSS for styling
- Return only the code, no explanations

Code:`
  }
}
```

**Step 2: Free API Fallback**
```typescript
// src/services/ai/huggingface.service.ts
export class HuggingFaceService {
  private apiKey: string
  
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY!
  }
  
  async generateCode(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/bigcode/starcoder',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 2048,
              temperature: 0.1,
              do_sample: true
            }
          })
        }
      )
      
      const result = await response.json()
      return result[0]?.generated_text || ''
    } catch (error) {
      console.error('HuggingFace generation failed:', error)
      throw new Error('Fallback AI generation failed')
    }
  }
}
```

**Step 3: AI Orchestrator**
```typescript
// src/services/ai/orchestrator.ts
import { OllamaService } from './ollama.service'
import { HuggingFaceService } from './huggingface.service'

export class AIOrchestrator {
  private ollama: OllamaService
  private huggingface: HuggingFaceService
  
  constructor() {
    this.ollama = new OllamaService()
    this.huggingface = new HuggingFaceService()
  }
  
  async generateCode(prompt: string): Promise<string> {
    // Try local Ollama first (completely free)
    try {
      return await this.ollama.generateCode(prompt)
    } catch (error) {
      console.warn('Local AI failed, trying HuggingFace...')
      
      // Fallback to HuggingFace (free tier)
      try {
        return await this.huggingface.generateCode(prompt)
      } catch (fallbackError) {
        console.error('All AI providers failed')
        throw new Error('Code generation temporarily unavailable')
      }
    }
  }
  
  async fixCode(code: string, errors: string[]): Promise<string> {
    const fixPrompt = `Fix the following TypeScript/React code errors:

Code:
${code}

Errors:
${errors.join('\n')}

Return the corrected code:`

    return this.generateCode(fixPrompt)
  }
}
```

### 2. Real-time Communication (Durable Objects → Socket.io)

```typescript
// src/services/realtime.service.ts
import { Server } from 'socket.io'
import { supabase } from '../index'

export class RealtimeService {
  constructor(private io: Server) {}
  
  async broadcastProgress(sessionId: string, progress: any) {
    // Emit to connected clients
    this.io.to(sessionId).emit('generation_progress', progress)
    
    // Store in database for persistence
    await supabase
      .from('generation_logs')
      .insert({
        session_id: sessionId,
        phase: progress.phase,
        message: progress.message,
        progress: progress.percentage,
        data: progress
      })
  }
  
  async broadcastFileUpdate(sessionId: string, file: any) {
    this.io.to(sessionId).emit('file_update', file)
  }
  
  async broadcastError(sessionId: string, error: any) {
    this.io.to(sessionId).emit('generation_error', error)
  }
  
  async broadcastCompletion(sessionId: string, result: any) {
    this.io.to(sessionId).emit('generation_complete', result)
  }
}
```

### 3. Code Execution (Containers → WebContainers)

```typescript
// src/services/execution.service.ts
import { WebContainer } from '@webcontainer/api'

export class ExecutionService {
  private containers: Map<string, WebContainer> = new Map()
  
  async createExecution(sessionId: string, files: Record<string, string>): Promise<string> {
    try {
      // Create new WebContainer instance
      const container = await WebContainer.boot()
      this.containers.set(sessionId, container)
      
      // Mount files
      await container.mount(this.formatFiles(files))
      
      // Install dependencies
      const installProcess = await container.spawn('npm', ['install'])
      const installExitCode = await installProcess.exit
      
      if (installExitCode !== 0) {
        throw new Error('Failed to install dependencies')
      }
      
      // Start development server
      const serverProcess = await container.spawn('npm', ['run', 'dev'])
      
      // Wait for server to be ready
      await this.waitForServer(container)
      
      return `https://${container.getHost()}`
    } catch (error) {
      console.error('Execution setup failed:', error)
      throw new Error('Failed to start code execution environment')
    }
  }
  
  async updateFiles(sessionId: string, files: Record<string, string>) {
    const container = this.containers.get(sessionId)
    if (!container) throw new Error('Container not found')
    
    await container.mount(this.formatFiles(files))
  }
  
  async destroyExecution(sessionId: string) {
    const container = this.containers.get(sessionId)
    if (container) {
      await container.teardown()
      this.containers.delete(sessionId)
    }
  }
  
  private formatFiles(files: Record<string, string>) {
    const fileTree: any = {}
    
    for (const [path, content] of Object.entries(files)) {
      const parts = path.split('/')
      let current = fileTree
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { directory: {} }
        }
        current = current[parts[i]].directory
      }
      
      current[parts[parts.length - 1]] = {
        file: { contents: content }
      }
    }
    
    return fileTree
  }
  
  private async waitForServer(container: WebContainer): Promise<void> {
    return new Promise((resolve) => {
      container.on('server-ready', (port, url) => {
        resolve()
      })
    })
  }
}
```

---

## 📊 Monitoring & Analytics

### Usage Tracking
```typescript
// src/services/analytics.service.ts
export class AnalyticsService {
  async trackUsage(userId: string, eventType: string, metadata?: any) {
    await supabase
      .from('analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: metadata
      })
  }
  
  async checkUsageLimits(userId: string): Promise<boolean> {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier, usage_count')
      .eq('id', userId)
      .single()
    
    if (!user) return false
    
    const limits = {
      free: 10,
      pro: 100,
      enterprise: -1 // unlimited
    }
    
    const limit = limits[user.subscription_tier]
    return limit === -1 || user.usage_count < limit
  }
}
```

---

## 🔄 Deployment Pipeline

### GitHub Actions for Continuous Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Free Stack

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID}}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
          working-directory: ./

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway up
```

This migration guide provides a complete path from the current Cloudflare setup to a fully free alternative that can scale. The total migration effort is estimated at 4-6 weeks with significant cost savings of approximately $420/year.