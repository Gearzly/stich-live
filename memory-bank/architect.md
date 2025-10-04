# MemoriPilot: System Architect

## Overview
This file contains the architectural decisions and design patterns for the MemoriPilot project.

## Architectural Decisions

- Implement advanced features in 4 phases: MVP+, Growth, Scale, Enterprise
- Use Firebase-native patterns for real-time features instead of WebSockets where possible
- Implement role-based access control using Firebase Auth custom claims
- Use Firestore security rules for advanced permission management
- Encrypt sensitive data (secrets, API keys) using server-side encryption
- Leverage Firebase Analytics for comprehensive usage tracking
- Implement screenshot generation using cloud functions and storage



- Implement domain-driven service architecture with logical folder organization
- Use conditional spread operators for exactOptionalPropertyTypes compliance
- Maintain Firebase integration with proper configuration and type safety
- Implement comprehensive error handling with BaseService pattern
- Use systematic todo list approach for complex refactoring tasks



- Use Vercel for frontend hosting and deployment
- Use Firebase as primary backend platform
- Implement TypeScript strict mode across entire codebase
- Use React 19.1.1 with modern hooks and function components
- Adopt Firebase Functions with Hono.js for API layer
- Use Firestore for primary database with real-time listeners
- Implement Firebase Auth for authentication and authorization
- Use Firebase Storage for file management and CDN
- Adopt shadcn/ui for consistent design system
- Use Vite for fast development and optimized builds
- Implement multi-provider AI integration for reliability
- Use Firebase Realtime Database for live generation updates



- Chose Vercel over Cloudflare for simpler deployment and better React integration
- Selected Firebase for managed backend services and real-time capabilities
- Implemented multi-provider AI strategy for reliability and cost optimization
- Used TypeScript strict mode for better code quality and developer experience
- Adopted Firebase Auth for simplified authentication flow
- Implemented real-time updates using Firebase Realtime Database for better user experience



1. **Decision 1**: Description of the decision and its rationale.
2. **Decision 2**: Description of the decision and its rationale.
3. **Decision 3**: Description of the decision and its rationale.



## Design Considerations

- Firebase Functions have cold start latency for WebSocket alternatives
- Firestore has query limitations that may require denormalization for advanced search
- Firebase Storage pricing for screenshot and file management at scale
- Custom claims have a 1000 character limit for role data
- Real-time database vs Firestore trade-offs for chat features
- Security rule complexity for multi-tenant enterprise features
- Rate limiting implementation using Firebase Functions quotas



- TypeScript strict mode compatibility with exactOptionalPropertyTypes
- Service layer scalability and maintainability
- Firebase SDK integration and type safety
- Component library compatibility (shadcn/ui with Radix)
- Build optimization and bundle size management
- Developer experience with clear error messages and proper IDE support



- Serverless architecture requires stateless design patterns
- Firebase Firestore NoSQL database requires denormalized data modeling
- Real-time updates need careful listener management to avoid memory leaks
- Multi-provider AI integration requires robust error handling and fallback mechanisms
- Vercel deployment limits require optimization for build times and bundle sizes
- Firebase Functions cold starts need optimization for performance
- Security rules must be carefully designed for Firestore and Storage
- Cost optimization is critical for AI API usage
- TypeScript strict mode requires comprehensive type definitions
- Modern React patterns with hooks and function components only



- Scalability for concurrent AI generation sessions
- Security for user-generated code and data
- Performance optimization for real-time updates
- Error handling for AI provider failures
- Cost optimization for Firebase usage
- SEO and accessibility compliance
- Mobile responsiveness
- Offline capability considerations



## Components

### Advanced App Management

Enhanced CRUD operations with public/private visibility, favorites, starring, and forking capabilities

**Responsibilities:**

- Public app listing with filtering
- Favorites and starring system
- App forking and templating
- Visibility and permission controls

### Real-time Collaboration

WebSocket-like functionality using Firebase Realtime Database for live editing and chat

**Responsibilities:**

- Real-time code editing synchronization
- Live chat during generation
- Collaborative editing conflict resolution
- User presence and activity tracking

### Secrets Management

Secure storage and management of user API keys and environment variables

**Responsibilities:**

- Encrypted secret storage
- BYOK provider integration
- Secret templates and sharing
- Access control and audit logging

### Model Configuration

Per-user AI model settings and custom provider management

**Responsibilities:**

- AI provider preference management
- Custom model parameter configuration
- Provider testing and validation
- Usage analytics and cost tracking

### GitHub Integration

OAuth-based repository export and code deployment to GitHub

**Responsibilities:**

- GitHub OAuth flow management
- Repository creation and code push
- Branch and commit automation
- Template repository integration

### Advanced Analytics

Comprehensive usage tracking, user statistics, and performance monitoring

**Responsibilities:**

- User activity timeline generation
- Usage metrics and billing data
- Performance analytics collection
- Custom dashboard creation

### Screenshot System

Automated app preview generation and image optimization

**Responsibilities:**

- Cloud function screenshot generation
- Image optimization and CDN serving
- Thumbnail creation for galleries
- Preview lifecycle management

### Enterprise Security

Role-based access control, audit logging, and compliance features

**Responsibilities:**

- Role and permission management
- Comprehensive audit trail
- Compliance reporting
- Data backup and recovery





### Core Services

BaseService foundation with common Firebase operations

**Responsibilities:**

- Database operations
- Authentication utilities
- Error handling
- Audit field management

### AI Services

Multi-provider AI integration services

**Responsibilities:**

- Code generation
- Provider management
- Request routing
- Cost estimation

### Storage Services

Firebase Storage operations and file management

**Responsibilities:**

- File upload/download
- Metadata management
- Progress tracking
- Asset organization

### User Services

User profile and authentication management

**Responsibilities:**

- Profile creation/updates
- Authentication flows
- User preferences
- Privacy settings

### Application Services

Application lifecycle and metadata management

**Responsibilities:**

- App creation/updates
- Deployment tracking
- Analytics
- Public app discovery





### Frontend Application

React 19.1.1 frontend application hosted on Vercel with Vite build system, TypeScript, Tailwind CSS, and shadcn/ui components

**Responsibilities:**

- User interface and experience
- Real-time updates display
- Authentication state management
- Route handling and navigation
- Responsive design implementation

### Firebase Functions API

Serverless backend API using Firebase Functions with Hono.js framework

**Responsibilities:**

- REST API endpoints
- Authentication middleware
- Business logic processing
- AI provider integration
- Error handling and logging

### Firestore Database

NoSQL database using Firebase Firestore for data persistence

**Responsibilities:**

- User data storage
- Application metadata
- Generation history
- Real-time data synchronization
- Query optimization

### Authentication Service

Authentication and authorization system using Firebase Auth

**Responsibilities:**

- User registration and login
- OAuth integration (Google, GitHub)
- Session management
- Role-based access control
- Security token management

### File Storage Service

File storage system using Firebase Storage for generated application assets

**Responsibilities:**

- Generated code storage
- Template management
- User asset uploads
- CDN distribution
- Access control and security

### Real-time Communication

Real-time communication using Firebase Realtime Database

**Responsibilities:**

- Live generation updates
- Progress tracking
- Collaborative features
- WebSocket-like functionality
- State synchronization

### AI Integration Service

Multi-provider AI integration system with smart routing and fallback mechanisms

**Responsibilities:**

- Provider selection logic
- Request routing
- Error handling and retries
- Cost optimization
- Response processing

### Smart Code Generator Agent

Stateful AI code generation agent with persistent state management

**Responsibilities:**

- Blueprint generation
- Phase-based implementation
- Code review and fixing
- State persistence
- Progress tracking





### Frontend Application

React frontend application with modern UI components, routing, and state management

**Responsibilities:**

- User interface rendering
- Real-time updates display
- Authentication flow
- Project management interface
- Code editor integration

### Backend API

Firebase Functions backend providing REST API endpoints and AI orchestration

**Responsibilities:**

- API endpoint handling
- Authentication middleware
- AI provider integration
- Code generation orchestration
- Database operations

### AI Generation Engine

AI code generation engine with multi-provider support and real-time streaming

**Responsibilities:**

- Natural language processing
- Code generation
- Error detection and correction
- Real-time progress streaming
- Multi-provider routing

### Database Layer

Firebase Firestore database with security rules and real-time synchronization

**Responsibilities:**

- Data persistence
- Real-time synchronization
- Security rule enforcement
- User data management
- Project metadata storage

### Authentication System

Firebase Auth system with OAuth providers and session management

**Responsibilities:**

- User authentication
- OAuth integration
- Session management
- Access control
- Security token handling



