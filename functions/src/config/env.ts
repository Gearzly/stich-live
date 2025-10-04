/**
 * Environment configuration and validation
 */

interface EnvironmentConfig {
  openai: {
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
  };
  google: {
    apiKey: string;
  };
  cerebras: {
    apiKey: string;
  };
  firebase: {
    projectId: string;
  };
}

/**
 * Get environment variable with validation
 */
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}

/**
 * Application environment configuration
 */
export const env: EnvironmentConfig = {
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
  },
  anthropic: {
    apiKey: getEnvVar('ANTHROPIC_API_KEY'),
  },
  google: {
    apiKey: getEnvVar('GOOGLE_AI_API_KEY'),
  },
  cerebras: {
    apiKey: getEnvVar('CEREBRAS_API_KEY', false), // Optional
  },
  firebase: {
    projectId: getEnvVar('GCLOUD_PROJECT') || getEnvVar('FIREBASE_PROJECT_ID', false),
  },
};

/**
 * AI Provider configuration
 */
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic', 
  GOOGLE: 'google',
  CEREBRAS: 'cerebras',
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

/**
 * Default AI models for each provider
 */
export const DEFAULT_MODELS = {
  [AI_PROVIDERS.OPENAI]: 'gpt-4o',
  [AI_PROVIDERS.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
  [AI_PROVIDERS.GOOGLE]: 'gemini-1.5-pro',
  [AI_PROVIDERS.CEREBRAS]: 'llama3.1-70b',
} as const;
