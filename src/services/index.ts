// Service layer exports
export { BaseService } from './BaseService';
export { UserService } from './UserService';
export { ApplicationService } from './ApplicationService';
export { StorageService } from './StorageService';
export { AIService } from './AIService';
export { CodeGenerationService } from './CodeGenerationService';
export { PromptTemplateService, promptTemplateService } from './PromptTemplateService';

// Re-export types
export type {
  UserProfile,
  UpdateUserProfileData,
  UpdatePreferencesData,
  ChangePasswordData,
} from './UserService';

export type {
  Application,
  CreateApplicationData,
  UpdateApplicationData,
  ApplicationFilters,
  ApplicationSearchOptions,
} from './ApplicationService';

export type {
  FileUploadOptions,
  FileInfo,
  UploadProgress,
} from './StorageService';

export type {
  AIProvider,
  AIMessage,
  AIRequest,
  AIResponse,
  AIProviderConfig,
} from './AIService';

export type {
  CodeGenerationRequest,
  CodeGenerationResult,
  GenerationPhase,
  ProjectGenerationPlan,
} from './CodeGenerationService';

export type {
  PromptTemplate,
} from './PromptTemplateService';

// Import classes for service instances
import { UserService } from './UserService';
import { ApplicationService } from './ApplicationService';
import { StorageService } from './StorageService';
import { AIService } from './AIService';
import { CodeGenerationService } from './CodeGenerationService';

// Service instances (singleton pattern)
export const userService = new UserService();
export const applicationService = new ApplicationService();
export const storageService = new StorageService();
export const aiService = new AIService();
export const codeGenerationService = new CodeGenerationService();