import type { ProviderConfig, AIProvider } from './types';

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT models including GPT-4, GPT-3.5, and DALL-E',
    websiteUrl: 'https://openai.com',
    apiDocsUrl: 'https://platform.openai.com/docs',
    keyFormat: /^sk-[a-zA-Z0-9]{48,}$/,
    keyExample: 'sk-...',
    supportedModels: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'dall-e-3', 'whisper-1'],
    icon: '🤖',
    color: '#00A67E'
  },
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for advanced reasoning and coding',
    websiteUrl: 'https://anthropic.com',
    apiDocsUrl: 'https://docs.anthropic.com',
    keyFormat: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
    keyExample: 'sk-ant-...',
    supportedModels: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    icon: '🧠',
    color: '#FF6B35'
  },
  google: {
    provider: 'google',
    name: 'Google AI',
    description: 'Gemini models for multimodal AI capabilities',
    websiteUrl: 'https://ai.google',
    apiDocsUrl: 'https://ai.google.dev/docs',
    keyFormat: /^[a-zA-Z0-9\-_]{39}$/,
    keyExample: 'AIza...',
    supportedModels: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
    icon: '🔍',
    color: '#4285F4'
  },
  cerebras: {
    provider: 'cerebras',
    name: 'Cerebras',
    description: 'High-performance inference for fast AI responses',
    websiteUrl: 'https://cerebras.net',
    apiDocsUrl: 'https://docs.cerebras.net',
    keyFormat: /^[a-zA-Z0-9\-_]{32,}$/,
    keyExample: 'csk-...',
    supportedModels: ['llama3.1-8b', 'llama3.1-70b'],
    icon: '⚡',
    color: '#6366F1'
  }
};

export const validateAPIKeyFormat = (provider: AIProvider, key: string): boolean => {
  const config = PROVIDER_CONFIGS[provider];
  return config.keyFormat.test(key);
};

export const getKeyPreview = (key: string): string => {
  if (key.length <= 8) return key;
  return `${key.substring(0, 8)}...`;
};

export const generateKeyId = (): string => {
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};