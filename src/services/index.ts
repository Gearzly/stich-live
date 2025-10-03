// Service layer exports - organized by category

// Core services
export { BaseService } from './core/BaseService';

// User management services
export { UserService } from './user/UserService';

// Application services
export { ApplicationService } from './application/ApplicationService';

// Storage services
export { StorageService } from './storage/StorageService';

// AI services
export { AIService } from './ai/AIService';
export { CodeGenerationService } from './ai/CodeGenerationService';
export { PromptTemplateService, promptTemplateService } from './ai/PromptTemplateService';

// Re-export types
export type {
  UserProfile,
  UpdateUserProfileData,
  UpdatePreferencesData,
  ChangePasswordData,
} from './user/UserService';

export type {
  Application,
  CreateApplicationData,
  UpdateApplicationData,
  ApplicationFilters,
  ApplicationSearchOptions,
} from './application/ApplicationService';

export type {
  FileUploadOptions,
  FileInfo,
  UploadProgress,
} from './storage/StorageService';

export type {
  AIProvider,
  AIMessage,
  AIRequest,
  AIResponse,
  AIProviderConfig,
} from './ai/AIService';

export type {
  CodeGenerationRequest,
  CodeGenerationResult,
  GenerationPhase,
  ProjectGenerationPlan,
} from './ai/CodeGenerationService';

export type {
  PromptTemplate,
} from './ai/PromptTemplateService';

// Import classes for service instances
import { UserService } from './user/UserService';
import { ApplicationService } from './application/ApplicationService';
import { StorageService } from './storage/StorageService';
import { AIService } from './ai/AIService';
import { CodeGenerationService } from './ai/CodeGenerationService';

// Service instances (singleton pattern)
export const userService = new UserService();
export const applicationService = new ApplicationService();
export const storageService = new StorageService();
export const aiService = new AIService();
export const codeGenerationService = new CodeGenerationService();