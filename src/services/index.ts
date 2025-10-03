// Service layer exports
export { BaseService } from './BaseService';
export { UserService } from './UserService';
export { ApplicationService } from './ApplicationService';
export { StorageService } from './StorageService';

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

// Service instances (singleton pattern)
export const userService = new UserService();
export const applicationService = new ApplicationService();
export const storageService = new StorageService();