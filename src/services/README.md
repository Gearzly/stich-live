# Services Architecture

This document outlines the reorganized service layer structure for better maintainability and separation of concerns.

## Folder Structure

```
src/services/
├── index.ts                    # Main exports (use this for imports)
├── core/                       # Base services and utilities
│   ├── index.ts               # Core service exports
│   └── BaseService.ts         # Abstract base service class
├── ai/                        # AI and code generation services
│   ├── index.ts               # AI service exports
│   ├── AIService.ts           # Multi-provider AI integration
│   ├── CodeGenerationService.ts  # AI-powered code generation
│   └── PromptTemplateService.ts   # Prompt template management
├── storage/                   # File and data storage services
│   ├── index.ts               # Storage service exports
│   └── StorageService.ts      # Firebase Storage operations
├── user/                      # User management services
│   ├── index.ts               # User service exports
│   └── UserService.ts         # User profile and auth operations
└── application/               # Application-specific services
    ├── index.ts               # Application service exports
    └── ApplicationService.ts  # App data management
```

## Service Categories

### 🔧 Core Services (`/core`)
- **BaseService**: Abstract base class with common Firebase operations
- Provides: Database operations, error handling, logging utilities

### 🤖 AI Services (`/ai`)
- **AIService**: Multi-provider AI integration (OpenAI, Anthropic, Google AI, Cerebras)
- **CodeGenerationService**: AI-powered code generation with multi-phase execution
- **PromptTemplateService**: Template management for consistent AI prompts
- Provides: Smart provider selection, cost optimization, code generation workflows

### 💾 Storage Services (`/storage`)
- **StorageService**: Firebase Storage operations
- Provides: File uploads, downloads, metadata management, organized storage

### 👤 User Services (`/user`)
- **UserService**: User profile and authentication operations
- Provides: Profile management, user preferences, authentication helpers

### 📱 Application Services (`/application`)
- **ApplicationService**: Application-specific data management
- Provides: App creation, management, search, and organization

## Usage

### Importing Services

Always import from the main services index for consistency:

```typescript
// ✅ Recommended - Main services index
import { 
  AIService, 
  UserService, 
  StorageService,
  type AIProvider,
  type UserProfile 
} from '@/services';

// ✅ Alternative - Category-specific index
import { AIService, type AIProvider } from '@/services/ai';
import { UserService, type UserProfile } from '@/services/user';

// ❌ Avoid - Direct file imports
import { AIService } from '@/services/ai/AIService';
```

### Service Instances

Pre-configured singleton instances are available:

```typescript
import { 
  aiService, 
  userService, 
  storageService,
  applicationService,
  codeGenerationService 
} from '@/services';

// Use directly
const response = await aiService.sendRequest({
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Custom Instances

Create custom instances when needed:

```typescript
import { AIService } from '@/services';

const customAI = new AIService();
// Configure as needed
```

## Benefits

1. **Separation of Concerns**: Services grouped by functionality
2. **Better Maintainability**: Clear organization and dependencies
3. **Cleaner Imports**: Consistent import patterns
4. **Type Safety**: Full TypeScript support with proper exports
5. **Modularity**: Easy to extend and modify specific service categories

## Dependencies

```
core/
  └── No dependencies (base for all services)

ai/
  └── core/BaseService

storage/
  └── core/BaseService

user/
  └── core/BaseService

application/
  └── core/BaseService
```

## Migration Guide

When moving from old structure:

1. Update imports to use main services index: `@/services`
2. Use singleton instances when possible: `aiService`, `userService`, etc.
3. Import types alongside services for better organization
4. Follow new folder structure for any new services

This structure provides a solid foundation for scaling the application while maintaining clean architecture principles.