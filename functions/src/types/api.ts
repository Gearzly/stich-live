import { DecodedIdToken } from 'firebase-admin/auth';

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Authentication types
export interface AuthUser extends DecodedIdToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: 'user' | 'admin';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// Request/Response types
export interface CreateUserRequest {
  email: string;
  password: string;
  displayName?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  role?: 'user' | 'admin';
}

// App types
export interface App {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'draft' | 'generating' | 'ready' | 'deployed' | 'error';
  createdAt: Date;
  updatedAt: Date;
  config: AppConfig;
  metadata?: AppMetadata;
}

export interface AppConfig {
  framework: 'react' | 'vue' | 'angular' | 'vanilla';
  styling: 'tailwind' | 'css' | 'styled-components';
  features: string[];
  deployment?: DeploymentConfig;
}

export interface AppMetadata {
  generatedFiles: number;
  deploymentUrl?: string;
  lastDeployedAt?: Date;
  buildLogs?: string[];
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'github-pages';
  domain?: string;
  environmentVars?: Record<string, string>;
}

// Generation types
export interface GenerationSession {
  id: string;
  userId: string;
  appId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string;
  provider: AIProviderName;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  generatedFiles: Array<{ path: string; content: string; type: string }>;
  result?: GenerationResult;
  error?: string;
  metadata?: {
    startTime?: number;
    endTime?: number;
    duration?: number;
    estimatedDuration?: number;
    [key: string]: any;
  };
}

export interface GenerationResult {
  files: GeneratedFile[];
  structure: FileStructure;
  instructions: string[];
  estimatedTokens: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface FileStructure {
  name: string;
  type: 'file' | 'directory';
  children?: FileStructure[];
}

// AI Provider types
export type AIProviderName = 'openai' | 'anthropic' | 'google' | 'cerebras';

export interface AIProvider {
  name: AIProviderName;
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

// Request/Response types
export interface CreateAppRequest {
  name: string;
  description: string;
  config: AppConfig;
}

export interface UpdateAppRequest {
  name?: string;
  description?: string;
  config?: Partial<AppConfig>;
}

export interface GenerateCodeRequest {
  appId: string;
  prompt: string;
  provider?: AIProvider;
}

// Error types
export interface AppError extends Error {
  code: string;
  status: number;
  details?: any;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}