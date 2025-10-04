/**
 * Firestore Data Models
 * Type definitions for all Firestore collections
 */

// User Model
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  apiKeys?: Record<string, string>;
  isEmailVerified: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    security: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showActivity: boolean;
  };
}

// Application Model
export interface Application {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: 'react' | 'vue' | 'svelte' | 'vanilla' | 'node' | 'python' | 'other';
  status: 'draft' | 'generating' | 'building' | 'deployed' | 'failed';
  isPublic: boolean;
  isFavorite: boolean;
  tags: string[];
  
  // URLs and deployment info
  repositoryUrl?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  
  // Generation metadata
  generationSettings: GenerationSettings;
  
  // Files and structure
  files?: AppFile[];
  fileStructure?: FileNode[];
  
  // Analytics
  analytics: AppAnalytics;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface GenerationSettings {
  aiProvider: 'openai' | 'anthropic' | 'google' | 'cerebras';
  model: string;
  prompt: string;
  additionalInstructions?: string;
  reviewCycles?: number;
  agentMode?: 'deterministic' | 'smart';
}

export interface AppFile {
  id: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface AppAnalytics {
  views: number;
  likes: number;
  forks: number;
  shares: number;
  deployments: number;
}

// Generation Session Model
export interface GenerationSession {
  id: string;
  userId: string;
  applicationId?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  
  // Input
  prompt: string;
  generationSettings: GenerationSettings;
  
  // Progress
  currentPhase: 'blueprint' | 'files' | 'review' | 'deployment';
  progress: number; // 0-100
  phases: GenerationPhase[];
  
  // Output
  blueprint?: ProjectBlueprint;
  files?: GeneratedFile[];
  deploymentInfo?: DeploymentInfo;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Real-time updates
  socketId?: string;
  lastHeartbeat?: Date;
}

export interface GenerationPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  logs: string[];
  error?: string;
}

export interface ProjectBlueprint {
  name: string;
  description: string;
  framework: string;
  architecture: string;
  dependencies: string[];
  features: string[];
  fileStructure: FileNode[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  type: 'source' | 'config' | 'asset' | 'documentation';
  size: number;
  dependencies?: string[];
}

export interface DeploymentInfo {
  provider: 'firebase' | 'vercel' | 'netlify';
  url?: string;
  status: 'deploying' | 'deployed' | 'failed';
  logs: string[];
  error?: string;
}

// Chat Model
export interface Chat {
  id: string;
  userId: string;
  generationSessionId?: string;
  title: string;
  
  // Settings
  agentMode: 'deterministic' | 'smart';
  aiProvider: 'openai' | 'anthropic' | 'google' | 'cerebras';
  model: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  
  // Stats
  messageCount: number;
  totalTokens: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  
  // Metadata
  timestamp: Date;
  tokens?: number;
  model?: string;
  
  // AI response metadata
  reasoning?: string;
  confidence?: number;
  sources?: string[];
  
  // File attachments
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'file' | 'image' | 'url';
  url: string;
  size?: number;
  mimeType?: string;
}

// Analytics Model
export interface UserAnalytics {
  id: string;
  userId: string;
  date: Date; // Daily analytics
  
  // Usage metrics
  sessionsCount: number;
  messagesCount: number;
  tokensUsed: number;
  
  // Feature usage
  generationsStarted: number;
  generationsCompleted: number;
  deploymentsCreated: number;
  
  // Time metrics
  totalSessionTime: number; // milliseconds
  averageSessionTime: number;
  
  // AI provider usage
  providerUsage: Record<string, number>;
}

export interface SystemAnalytics {
  id: string;
  date: Date;
  
  // Global metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  
  // Usage metrics
  totalGenerations: number;
  totalMessages: number;
  totalTokens: number;
  
  // Performance metrics
  averageResponseTime: number;
  errorRate: number;
  
  // Resource usage
  functionInvocations: number;
  storageUsed: number; // bytes
  bandwidthUsed: number; // bytes
}

// Subscription Model
export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  
  // Billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  // Usage limits
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

export interface SubscriptionLimits {
  generationsPerMonth: number;
  tokensPerMonth: number;
  storageBytes: number;
  customDomains: number;
  teamMembers: number;
}

export interface SubscriptionUsage {
  generationsThisMonth: number;
  tokensThisMonth: number;
  storageUsed: number;
  customDomainsUsed: number;
  teamMembersUsed: number;
}

// Notification Model
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  
  // Metadata
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  
  // Timestamps
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// Activity Log Model
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  
  // Context
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  
  // Timestamps
  timestamp: Date;
}

// API Key Model (for BYOK)
export interface ApiKeyUsage {
  id: string;
  userId: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cerebras';
  
  // Usage tracking
  requestsCount: number;
  tokensUsed: number;
  successRate: number;
  averageLatency: number;
  
  // Time period
  date: Date; // Daily usage
  month: string; // YYYY-MM
  
  // Costs (estimated)
  estimatedCost: number;
  currency: string;
}

// Feedback Model
export interface Feedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  
  // Context
  page?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Status
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
}

// Export all interfaces and types for use throughout the application