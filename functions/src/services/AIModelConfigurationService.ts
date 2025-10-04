import { BaseService } from './BaseService';
import { AnalyticsService } from './AnalyticsService';
import { SecretsManagementService } from './SecretsManagementService';

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cerebras' | 'custom';

/**
 * AI model configuration interface
 */
export interface AIModelConfig {
  id: string;
  userId: string;
  name: string;
  description?: string;
  provider: AIProvider;
  model: string;
  isDefault: boolean;
  isActive: boolean;
  
  // Model parameters
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    systemPrompt?: string;
    contextWindow?: number;
  };
  
  // Provider-specific settings
  providerSettings: {
    apiKeySecretId?: string;
    endpoint?: string;
    region?: string;
    version?: string;
    customHeaders?: Record<string, string>;
    timeout?: number;
    retries?: number;
  };
  
  // Fallback configuration
  fallbackConfig?: {
    enabled: boolean;
    fallbackProviders: string[];
    maxRetries: number;
    retryDelay: number;
  };
  
  // Usage tracking
  usage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    lastUsed?: Date;
    averageResponseTime: number;
    errorRate: number;
  };
  
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model testing result
 */
export interface ModelTestResult {
  success: boolean;
  responseTime: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  error?: string;
  response?: string;
}

/**
 * Provider capabilities and limits
 */
export interface ProviderCapabilities {
  provider: AIProvider;
  models: Array<{
    id: string;
    name: string;
    description: string;
    contextWindow: number;
    maxOutputTokens: number;
    inputCostPer1kTokens: number;
    outputCostPer1kTokens: number;
    features: string[];
  }>;
  supportedParameters: string[];
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    requestsPerDay?: number;
  };
  regions?: string[];
  documentation: string;
}

/**
 * AI Model Configuration Service
 * Manages AI provider settings, model parameters, and provider switching
 */
export class AIModelConfigurationService extends BaseService {
  private analyticsService: AnalyticsService;
  private secretsService: SecretsManagementService;

  constructor() {
    super();
    this.analyticsService = new AnalyticsService();
    this.secretsService = new SecretsManagementService();
  }

  /**
   * Create a new AI model configuration
   */
  async createModelConfig(userId: string, configData: {
    name: string;
    description?: string;
    provider: AIProvider;
    model: string;
    parameters?: Partial<AIModelConfig['parameters']>;
    providerSettings?: Partial<AIModelConfig['providerSettings']>;
    fallbackConfig?: Partial<AIModelConfig['fallbackConfig']>;
    tags?: string[];
    isDefault?: boolean;
  }): Promise<AIModelConfig> {
    try {
      this.logger.info('Creating AI model configuration', { userId, provider: configData.provider, model: configData.model });

      // Validate provider and model
      await this.validateProviderModel(configData.provider, configData.model);

      // If this is set as default, unset other defaults
      if (configData.isDefault) {
        await this.unsetDefaultConfigs(userId);
      }

      const configId = this.generateId();
      const config: AIModelConfig = {
        id: configId,
        userId,
        name: configData.name,
        description: configData.description,
        provider: configData.provider,
        model: configData.model,
        isDefault: configData.isDefault || false,
        isActive: true,
        parameters: this.getDefaultParameters(configData.provider, configData.parameters),
        providerSettings: {
          timeout: 30000,
          retries: 3,
          ...configData.providerSettings,
        },
        fallbackConfig: {
          enabled: false,
          fallbackProviders: [],
          maxRetries: 2,
          retryDelay: 1000,
          ...configData.fallbackConfig,
        },
        usage: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
        tags: configData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('ai_model_configs').doc(configId).set(config);

      // Track analytics
      await this.analyticsService.trackEvent({
        userId,
        eventType: 'app_created', // We'll need model_config_created
        eventData: {
          provider: configData.provider,
          model: configData.model,
          isDefault: configData.isDefault,
        },
        metadata: {},
      });

      this.logger.info('AI model configuration created successfully', { configId, userId });
      return config;
    } catch (error) {
      this.logger.error('Failed to create AI model configuration:', error);
      throw new Error('Failed to create AI model configuration');
    }
  }

  /**
   * Get user's model configurations
   */
  async getModelConfigs(userId: string, options: {
    provider?: AIProvider;
    isActive?: boolean;
    tags?: string[];
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    configs: AIModelConfig[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      let query = this.db.collection('ai_model_configs')
        .where('userId', '==', userId);

      if (options.provider) {
        query = query.where('provider', '==', options.provider);
      }

      if (options.isActive !== undefined) {
        query = query.where('isActive', '==', options.isActive);
      }

      const snapshot = await query.get();
      let configs = snapshot.docs.map(doc => doc.data() as AIModelConfig);

      // Apply client-side filters
      if (options.tags && options.tags.length > 0) {
        configs = configs.filter(config =>
          config.tags.some(tag => options.tags!.includes(tag))
        );
      }

      // Sort by default first, then by creation date
      configs.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const totalCount = configs.length;

      // Apply pagination
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedConfigs = configs.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      return {
        configs: paginatedConfigs,
        totalCount,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to get model configurations:', error);
      throw new Error('Failed to get model configurations');
    }
  }

  /**
   * Get a specific model configuration
   */
  async getModelConfig(userId: string, configId: string): Promise<AIModelConfig | null> {
    try {
      const configDoc = await this.db.collection('ai_model_configs').doc(configId).get();

      if (!configDoc.exists) {
        return null;
      }

      const config = configDoc.data() as AIModelConfig;

      // Verify ownership
      if (config.userId !== userId) {
        throw new Error('Access denied');
      }

      return config;
    } catch (error) {
      this.logger.error('Failed to get model configuration:', error);
      throw new Error('Failed to get model configuration');
    }
  }

  /**
   * Update a model configuration
   */
  async updateModelConfig(userId: string, configId: string, updates: {
    name?: string;
    description?: string;
    parameters?: Partial<AIModelConfig['parameters']>;
    providerSettings?: Partial<AIModelConfig['providerSettings']>;
    fallbackConfig?: Partial<AIModelConfig['fallbackConfig']>;
    tags?: string[];
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<AIModelConfig> {
    try {
      const config = await this.getModelConfig(userId, configId);

      if (!config) {
        throw new Error('Configuration not found');
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await this.unsetDefaultConfigs(userId, configId);
      }

      const updateData: Partial<AIModelConfig> = {
        updatedAt: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      if (updates.parameters) {
        updateData.parameters = { ...config.parameters, ...updates.parameters };
      }

      if (updates.providerSettings) {
        updateData.providerSettings = { ...config.providerSettings, ...updates.providerSettings };
      }

      if (updates.fallbackConfig) {
        updateData.fallbackConfig = { ...config.fallbackConfig, ...updates.fallbackConfig };
      }

      await this.db.collection('ai_model_configs').doc(configId).update(updateData);

      const updatedConfig = { ...config, ...updateData };
      this.logger.info('AI model configuration updated successfully', { configId, userId });
      return updatedConfig;
    } catch (error) {
      this.logger.error('Failed to update model configuration:', error);
      throw new Error('Failed to update model configuration');
    }
  }

  /**
   * Delete a model configuration
   */
  async deleteModelConfig(userId: string, configId: string): Promise<void> {
    try {
      const config = await this.getModelConfig(userId, configId);

      if (!config) {
        throw new Error('Configuration not found');
      }

      // Don't allow deletion of default config if it's the only one
      if (config.isDefault) {
        const { configs } = await this.getModelConfigs(userId, { isActive: true });
        if (configs.length === 1) {
          throw new Error('Cannot delete the only active configuration');
        }
      }

      await this.db.collection('ai_model_configs').doc(configId).delete();

      this.logger.info('AI model configuration deleted successfully', { configId, userId });
    } catch (error) {
      this.logger.error('Failed to delete model configuration:', error);
      throw new Error('Failed to delete model configuration');
    }
  }

  /**
   * Test a model configuration
   */
  async testModelConfig(userId: string, configId: string, testPrompt?: string): Promise<ModelTestResult> {
    try {
      const config = await this.getModelConfig(userId, configId);

      if (!config) {
        throw new Error('Configuration not found');
      }

      const prompt = testPrompt || 'Hello! This is a test message. Please respond with a simple greeting.';
      const startTime = Date.now();

      try {
        const response = await this.makeTestRequest(config, prompt);
        const responseTime = Date.now() - startTime;

        // Update usage statistics
        await this.updateUsageStats(configId, {
          success: true,
          responseTime,
          tokenUsage: response.tokenUsage,
        });

        return {
          success: true,
          responseTime,
          tokenUsage: response.tokenUsage,
          cost: response.cost,
          response: response.content,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // Update usage statistics
        await this.updateUsageStats(configId, {
          success: false,
          responseTime,
        });

        return {
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error('Failed to test model configuration:', error);
      throw new Error('Failed to test model configuration');
    }
  }

  /**
   * Get available provider capabilities
   */
  async getProviderCapabilities(): Promise<ProviderCapabilities[]> {
    try {
      const capabilities: ProviderCapabilities[] = [
        {
          provider: 'openai',
          models: [
            {
              id: 'gpt-4o',
              name: 'GPT-4o',
              description: 'Most advanced multimodal model',
              contextWindow: 128000,
              maxOutputTokens: 4096,
              inputCostPer1kTokens: 0.005,
              outputCostPer1kTokens: 0.015,
              features: ['text', 'images', 'function-calling'],
            },
            {
              id: 'gpt-4o-mini',
              name: 'GPT-4o Mini',
              description: 'Affordable and intelligent small model',
              contextWindow: 128000,
              maxOutputTokens: 16384,
              inputCostPer1kTokens: 0.00015,
              outputCostPer1kTokens: 0.0006,
              features: ['text', 'images', 'function-calling'],
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              description: 'Fast and cost-effective model',
              contextWindow: 16385,
              maxOutputTokens: 4096,
              inputCostPer1kTokens: 0.0005,
              outputCostPer1kTokens: 0.0015,
              features: ['text', 'function-calling'],
            },
          ],
          supportedParameters: ['temperature', 'maxTokens', 'topP', 'frequencyPenalty', 'presencePenalty', 'stopSequences'],
          rateLimits: {
            requestsPerMinute: 3500,
            tokensPerMinute: 90000,
          },
          documentation: 'https://platform.openai.com/docs',
        },
        {
          provider: 'anthropic',
          models: [
            {
              id: 'claude-3-5-sonnet-20241022',
              name: 'Claude 3.5 Sonnet',
              description: 'Most intelligent model with improved reasoning',
              contextWindow: 200000,
              maxOutputTokens: 8192,
              inputCostPer1kTokens: 0.003,
              outputCostPer1kTokens: 0.015,
              features: ['text', 'images', 'analysis'],
            },
            {
              id: 'claude-3-5-haiku-20241022',
              name: 'Claude 3.5 Haiku',
              description: 'Fastest model for quick tasks',
              contextWindow: 200000,
              maxOutputTokens: 8192,
              inputCostPer1kTokens: 0.00025,
              outputCostPer1kTokens: 0.00125,
              features: ['text', 'images'],
            },
          ],
          supportedParameters: ['temperature', 'maxTokens', 'topP', 'topK', 'stopSequences'],
          rateLimits: {
            requestsPerMinute: 1000,
            tokensPerMinute: 40000,
          },
          documentation: 'https://docs.anthropic.com',
        },
        {
          provider: 'google',
          models: [
            {
              id: 'gemini-pro',
              name: 'Gemini Pro',
              description: 'Google\'s most capable model',
              contextWindow: 32760,
              maxOutputTokens: 8192,
              inputCostPer1kTokens: 0.00125,
              outputCostPer1kTokens: 0.00375,
              features: ['text', 'images', 'code'],
            },
            {
              id: 'gemini-flash',
              name: 'Gemini Flash',
              description: 'Fast and efficient model',
              contextWindow: 32760,
              maxOutputTokens: 8192,
              inputCostPer1kTokens: 0.000075,
              outputCostPer1kTokens: 0.0003,
              features: ['text', 'images'],
            },
          ],
          supportedParameters: ['temperature', 'maxTokens', 'topP', 'topK'],
          rateLimits: {
            requestsPerMinute: 1500,
            tokensPerMinute: 32000,
          },
          documentation: 'https://ai.google.dev/docs',
        },
        {
          provider: 'cerebras',
          models: [
            {
              id: 'llama3.1-8b',
              name: 'Llama 3.1 8B',
              description: 'Fast inference with Cerebras hardware',
              contextWindow: 8192,
              maxOutputTokens: 8192,
              inputCostPer1kTokens: 0.0001,
              outputCostPer1kTokens: 0.0001,
              features: ['text', 'fast-inference'],
            },
          ],
          supportedParameters: ['temperature', 'maxTokens', 'topP'],
          rateLimits: {
            requestsPerMinute: 1000,
            tokensPerMinute: 50000,
          },
          documentation: 'https://inference-docs.cerebras.ai',
        },
      ];

      return capabilities;
    } catch (error) {
      this.logger.error('Failed to get provider capabilities:', error);
      throw new Error('Failed to get provider capabilities');
    }
  }

  /**
   * Get default parameters for a provider
   */
  private getDefaultParameters(provider: AIProvider, customParams?: Partial<AIModelConfig['parameters']>): AIModelConfig['parameters'] {
    const defaults: Record<AIProvider, AIModelConfig['parameters']> = {
      openai: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        contextWindow: 128000,
      },
      anthropic: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        topK: 40,
        contextWindow: 200000,
      },
      google: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        topK: 40,
        contextWindow: 32760,
      },
      cerebras: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        contextWindow: 8192,
      },
      custom: {
        temperature: 0.7,
        maxTokens: 4096,
        contextWindow: 4096,
      },
    };

    return { ...defaults[provider], ...customParams };
  }

  /**
   * Validate provider and model combination
   */
  private async validateProviderModel(provider: AIProvider, model: string): Promise<void> {
    const capabilities = await this.getProviderCapabilities();
    const providerCapability = capabilities.find(cap => cap.provider === provider);

    if (!providerCapability) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (provider !== 'custom') {
      const modelExists = providerCapability.models.some(m => m.id === model);
      if (!modelExists) {
        throw new Error(`Model ${model} not found for provider ${provider}`);
      }
    }
  }

  /**
   * Unset default flag from other configs
   */
  private async unsetDefaultConfigs(userId: string, excludeConfigId?: string): Promise<void> {
    const snapshot = await this.db.collection('ai_model_configs')
      .where('userId', '==', userId)
      .where('isDefault', '==', true)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      if (!excludeConfigId || doc.id !== excludeConfigId) {
        batch.update(doc.ref, { isDefault: false, updatedAt: new Date() });
      }
    });

    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  }

  /**
   * Make a test request to the AI provider
   */
  private async makeTestRequest(config: AIModelConfig, prompt: string): Promise<{
    content: string;
    tokenUsage?: { prompt: number; completion: number; total: number };
    cost?: number;
  }> {
    // Get API key from secrets
    let apiKey: string | undefined;
    if (config.providerSettings.apiKeySecretId) {
      apiKey = await this.secretsService.getSecretValue(config.userId, config.providerSettings.apiKeySecretId);
    }

    switch (config.provider) {
      case 'openai':
        return await this.testOpenAI(config, prompt, apiKey);
      case 'anthropic':
        return await this.testAnthropic(config, prompt, apiKey);
      case 'google':
        return await this.testGoogle(config, prompt, apiKey);
      case 'cerebras':
        return await this.testCerebras(config, prompt, apiKey);
      default:
        throw new Error(`Testing not supported for provider: ${config.provider}`);
    }
  }

  /**
   * Test OpenAI model
   */
  private async testOpenAI(config: AIModelConfig, prompt: string, apiKey?: string): Promise<{
    content: string;
    tokenUsage?: { prompt: number; completion: number; total: number };
    cost?: number;
  }> {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.parameters.temperature,
        max_tokens: Math.min(config.parameters.maxTokens || 150, 150), // Limit for testing
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      content: data.choices[0].message.content,
      tokenUsage: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Test Anthropic model
   */
  private async testAnthropic(config: AIModelConfig, prompt: string, apiKey?: string): Promise<{
    content: string;
    tokenUsage?: { prompt: number; completion: number; total: number };
  }> {
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.parameters.temperature,
        max_tokens: Math.min(config.parameters.maxTokens || 150, 150),
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return {
      content: data.content[0].text,
      tokenUsage: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Test Google model (placeholder)
   */
  private async testGoogle(config: AIModelConfig, prompt: string, apiKey?: string): Promise<{
    content: string;
  }> {
    // Placeholder implementation
    return {
      content: 'Test response from Google AI (placeholder implementation)',
    };
  }

  /**
   * Test Cerebras model (placeholder)
   */
  private async testCerebras(config: AIModelConfig, prompt: string, apiKey?: string): Promise<{
    content: string;
  }> {
    // Placeholder implementation
    return {
      content: 'Test response from Cerebras (placeholder implementation)',
    };
  }

  /**
   * Update usage statistics
   */
  private async updateUsageStats(configId: string, stats: {
    success: boolean;
    responseTime: number;
    tokenUsage?: { prompt: number; completion: number; total: number };
  }): Promise<void> {
    try {
      const configRef = this.db.collection('ai_model_configs').doc(configId);
      const configDoc = await configRef.get();

      if (!configDoc.exists) return;

      const config = configDoc.data() as AIModelConfig;
      const usage = config.usage;

      const newTotalRequests = usage.totalRequests + 1;
      const newAverageResponseTime = ((usage.averageResponseTime * usage.totalRequests) + stats.responseTime) / newTotalRequests;
      const newErrorRate = stats.success 
        ? (usage.errorRate * usage.totalRequests) / newTotalRequests
        : ((usage.errorRate * usage.totalRequests) + 1) / newTotalRequests;

      const updateData = {
        usage: {
          ...usage,
          totalRequests: newTotalRequests,
          averageResponseTime: newAverageResponseTime,
          errorRate: newErrorRate,
          lastUsed: new Date(),
          totalTokens: stats.tokenUsage ? usage.totalTokens + stats.tokenUsage.total : usage.totalTokens,
        },
        updatedAt: new Date(),
      };

      await configRef.update(updateData);
    } catch (error) {
      this.logger.error('Failed to update usage stats:', error);
      // Don't throw as this is non-critical
    }
  }
}