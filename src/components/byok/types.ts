export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cerebras';

export interface APIKey {
  id: string;
  provider: AIProvider;
  name: string;
  keyPreview: string; // First 8 chars + '...'
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  isValid: boolean;
  validatedAt?: Date;
  errorMessage?: string;
}

export interface APIKeyValidationResult {
  isValid: boolean;
  provider: AIProvider;
  modelAccess?: string[];
  errorMessage?: string;
  quotaInfo?: {
    remaining?: number;
    limit?: number;
    resetDate?: Date;
  };
}

export interface ProviderConfig {
  provider: AIProvider;
  name: string;
  description: string;
  websiteUrl: string;
  apiDocsUrl: string;
  keyFormat: RegExp;
  keyExample: string;
  supportedModels: string[];
  icon: string;
  color: string;
}

export interface CreateAPIKeyRequest {
  provider: AIProvider;
  name: string;
  key: string;
}

export interface UpdateAPIKeyRequest {
  id: string;
  name?: string;
  isActive?: boolean;
}