import { BaseService } from '../core/BaseService';

// AI Provider types
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cerebras';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface AIProviderConfig {
  name: AIProvider;
  models: string[];
  maxTokens: number;
  costPerToken: number;
  apiKey: string;
  baseUrl?: string;
  available: boolean;
}

// AI Service for multi-provider integration
export class AIService extends BaseService {
  private providers: Map<AIProvider, AIProviderConfig> = new Map();

  constructor() {
    super();
    this.initializeProviders();
  }

  // Initialize available AI providers
  private initializeProviders(): void {
    // OpenAI Configuration
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'openai',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
        maxTokens: 128000,
        costPerToken: 0.00001, // Approximate cost per token
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        available: true,
      });
    }

    // Anthropic Configuration
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'anthropic',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
        maxTokens: 200000,
        costPerToken: 0.000015,
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1',
        available: true,
      });
    }

    // Google AI Configuration
    if (import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      this.providers.set('google', {
        name: 'google',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        maxTokens: 1000000,
        costPerToken: 0.000005,
        apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        available: true,
      });
    }

    // Cerebras Configuration
    if (import.meta.env.VITE_CEREBRAS_API_KEY) {
      this.providers.set('cerebras', {
        name: 'cerebras',
        models: ['llama3.1-8b', 'llama3.1-70b'],
        maxTokens: 128000,
        costPerToken: 0.000001, // Very low cost
        apiKey: import.meta.env.VITE_CEREBRAS_API_KEY,
        baseUrl: 'https://api.cerebras.ai/v1',
        available: true,
      });
    }

    // Set default provider to first available (for future use)
    const availableProviders = Array.from(this.providers.keys());
    if (availableProviders.length === 0) {
      console.warn('No AI providers configured');
    }
  }

  // Get available providers
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys()).filter(provider => 
      this.providers.get(provider)?.available
    ) as AIProvider[];
  }

  // Get provider configuration
  getProviderConfig(provider: AIProvider): AIProviderConfig | undefined {
    return this.providers.get(provider);
  }

  // Smart provider selection based on requirements
  selectOptimalProvider(request: AIRequest): AIProvider {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // If provider specified and available, use it
    if (request.provider && availableProviders.includes(request.provider)) {
      return request.provider;
    }

    // Smart selection logic
    const messageLength = request.messages.reduce((total, msg) => total + msg.content.length, 0);
    const estimatedTokens = Math.ceil(messageLength / 4); // Rough estimation

    // For large context, prefer providers with higher token limits
    if (estimatedTokens > 50000) {
      const highCapacityProviders = availableProviders.filter(provider => {
        const config = this.providers.get(provider);
        return config && config.maxTokens >= 100000;
      });
      
      if (highCapacityProviders.length > 0) {
        // Choose the most cost-effective high-capacity provider
        const selected = highCapacityProviders.sort((a, b) => {
          const configA = this.providers.get(a)!;
          const configB = this.providers.get(b)!;
          return configA.costPerToken - configB.costPerToken;
        })[0];
        return selected as AIProvider;
      }
    }

    // For streaming, prefer fast providers
    if (request.stream) {
      const fastProviders = ['cerebras', 'openai'] as AIProvider[];
      const availableFastProviders = availableProviders.filter(p => fastProviders.includes(p));
      if (availableFastProviders.length > 0) {
        return availableFastProviders[0] as AIProvider;
      }
    }

    // Default to most cost-effective provider
    const selected = availableProviders.sort((a, b) => {
      const configA = this.providers.get(a)!;
      const configB = this.providers.get(b)!;
      return configA.costPerToken - configB.costPerToken;
    })[0];
    
    return selected as AIProvider;
  }

  // Get default model for provider
  getDefaultModel(provider: AIProvider): string {
    const config = this.providers.get(provider);
    if (!config || !config.models || config.models.length === 0) {
      throw new Error(`No models available for provider: ${provider}`);
    }
    const firstModel = config.models[0];
    if (!firstModel) {
      throw new Error(`No valid model found for provider: ${provider}`);
    }
    return firstModel;
  }

  // Calculate estimated cost
  calculateCost(provider: AIProvider, tokenCount: number): number {
    const config = this.providers.get(provider);
    return config ? config.costPerToken * tokenCount : 0;
  }

  // Send AI request with automatic provider selection
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const provider = this.selectOptimalProvider(request);
      const config = this.providers.get(provider);
      
      if (!config) {
        throw new Error(`Provider ${provider} not configured`);
      }

      const model = request.model || this.getDefaultModel(provider);
      
      // Call the appropriate provider API
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(request, config, model);
        case 'anthropic':
          return await this.callAnthropic(request, config, model);
        case 'google':
          return await this.callGoogle(request, config, model);
        case 'cerebras':
          return await this.callCerebras(request, config, model);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      return this.handleError(error, 'sendRequest') as never;
    }
  }

  // OpenAI API integration
  private async callOpenAI(
    request: AIRequest, 
    config: AIProviderConfig, 
    model: string
  ): Promise<AIResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      cost: this.calculateCost('openai', data.usage.total_tokens),
    };
  }

  // Anthropic API integration
  private async callAnthropic(
    request: AIRequest, 
    config: AIProviderConfig, 
    model: string
  ): Promise<AIResponse> {
    // Convert messages to Anthropic format
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages,
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      cost: this.calculateCost('anthropic', data.usage.input_tokens + data.usage.output_tokens),
    };
  }

  // Google AI API integration
  private async callGoogle(
    request: AIRequest, 
    config: AIProviderConfig, 
    model: string
  ): Promise<AIResponse> {
    // Convert messages to Google format
    const contents = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(`${config.baseUrl}/models/${model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: 'google',
      model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      cost: this.calculateCost('google', data.usageMetadata?.totalTokenCount || 0),
    };
  }

  // Cerebras API integration
  private async callCerebras(
    request: AIRequest, 
    config: AIProviderConfig, 
    model: string
  ): Promise<AIResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens,
        stream: request.stream || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cerebras API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'cerebras',
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      cost: this.calculateCost('cerebras', data.usage?.total_tokens || 0),
    };
  }

  // Test provider connectivity
  async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      const testRequest: AIRequest = {
        messages: [
          { role: 'user', content: 'Hello! Please respond with just "OK" to test connectivity.' }
        ],
        provider,
        maxTokens: 10,
      };

      const response = await this.sendRequest(testRequest);
      return response.content.toLowerCase().includes('ok');
    } catch (error) {
      console.warn(`Provider ${provider} test failed:`, error);
      return false;
    }
  }

  // Get provider status
  async getProviderStatus(): Promise<Record<AIProvider, boolean>> {
    const providers = this.getAvailableProviders();
    const status: Record<AIProvider, boolean> = {} as Record<AIProvider, boolean>;

    await Promise.all(
      providers.map(async (provider) => {
        status[provider] = await this.testProvider(provider);
      })
    );

    return status;
  }

  // Estimate request cost before sending
  estimateRequestCost(request: AIRequest): { provider: AIProvider; estimatedCost: number; model: string } {
    const provider = this.selectOptimalProvider(request);
    const model = request.model || this.getDefaultModel(provider);
    
    // Rough token estimation
    const messageLength = request.messages.reduce((total, msg) => total + msg.content.length, 0);
    const estimatedTokens = Math.ceil(messageLength / 4);
    
    return {
      provider,
      estimatedCost: this.calculateCost(provider, estimatedTokens),
      model,
    };
  }
}