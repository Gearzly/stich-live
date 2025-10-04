import { Hono } from 'hono';
import { Context } from 'hono';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { AIModelConfigurationService, AIProvider } from '../services/AIModelConfigurationService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from 'firebase-functions';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'cerebras', 'custom'] as const),
  model: z.string().min(1),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequences: z.array(z.string()).optional(),
    systemPrompt: z.string().optional(),
    contextWindow: z.number().min(1).optional(),
  }).optional(),
  providerSettings: z.object({
    apiKeySecretId: z.string().optional(),
    endpoint: z.string().url().optional(),
    region: z.string().optional(),
    version: z.string().optional(),
    customHeaders: z.record(z.string()).optional(),
    timeout: z.number().min(1000).optional(),
    retries: z.number().min(0).max(10).optional(),
  }).optional(),
  fallbackConfig: z.object({
    enabled: z.boolean().optional(),
    fallbackProviders: z.array(z.string()).optional(),
    maxRetries: z.number().min(0).max(5).optional(),
    retryDelay: z.number().min(100).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

const updateConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequences: z.array(z.string()).optional(),
    systemPrompt: z.string().optional(),
    contextWindow: z.number().min(1).optional(),
  }).optional(),
  providerSettings: z.object({
    apiKeySecretId: z.string().optional(),
    endpoint: z.string().url().optional(),
    region: z.string().optional(),
    version: z.string().optional(),
    customHeaders: z.record(z.string()).optional(),
    timeout: z.number().min(1000).optional(),
    retries: z.number().min(0).max(10).optional(),
  }).optional(),
  fallbackConfig: z.object({
    enabled: z.boolean().optional(),
    fallbackProviders: z.array(z.string()).optional(),
    maxRetries: z.number().min(0).max(5).optional(),
    retryDelay: z.number().min(100).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const testConfigSchema = z.object({
  prompt: z.string().max(1000).optional(),
});

/**
 * POST /model-configs
 * Create a new AI model configuration
 */
app.post('/', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = createConfigSchema.parse(body);
    const modelConfigService = new AIModelConfigurationService();

    const config = await modelConfigService.createModelConfig(user.uid, {
      name: validatedData.name,
      description: validatedData.description,
      provider: validatedData.provider,
      model: validatedData.model,
      parameters: validatedData.parameters,
      providerSettings: validatedData.providerSettings,
      fallbackConfig: validatedData.fallbackConfig,
      tags: validatedData.tags,
      isDefault: validatedData.isDefault,
    });

    return c.json(createSuccessResponse({
      config,
      message: 'AI model configuration created successfully',
    }));
  } catch (error) {
    logger.error('Create model config error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid configuration data'), 400);
    }
    
    if (error instanceof Error && error.message.includes('Unsupported provider')) {
      return c.json(createErrorResponse('INVALID_PROVIDER', error.message), 400);
    }
    
    if (error instanceof Error && error.message.includes('not found for provider')) {
      return c.json(createErrorResponse('INVALID_MODEL', error.message), 400);
    }
    
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to create model configuration'), 500);
  }
});

/**
 * GET /model-configs
 * List user's AI model configurations
 */
app.get('/', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    
    const options = {
      provider: query.provider as AIProvider | undefined,
      isActive: query.isActive ? query.isActive === 'true' : undefined,
      tags: query.tags ? query.tags.split(',') : undefined,
      page: query.page ? parseInt(query.page) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    };

    const modelConfigService = new AIModelConfigurationService();
    const result = await modelConfigService.getModelConfigs(user.uid, options);

    return c.json(createSuccessResponse({
      configs: result.configs,
      pagination: {
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
    }));
  } catch (error) {
    logger.error('List model configs error:', error);
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to list model configurations'), 500);
  }
});

/**
 * GET /model-configs/:id
 * Get a specific AI model configuration
 */
app.get('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    
    const modelConfigService = new AIModelConfigurationService();
    const config = await modelConfigService.getModelConfig(user.uid, configId);

    if (!config) {
      return c.json(createErrorResponse('NOT_FOUND', 'Model configuration not found'), 404);
    }

    return c.json(createSuccessResponse({
      config,
    }));
  } catch (error) {
    logger.error('Get model config error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to get model configuration'), 500);
  }
});

/**
 * PUT /model-configs/:id
 * Update an AI model configuration
 */
app.put('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    const body = await c.req.json();
    
    const validatedData = updateConfigSchema.parse(body);
    const modelConfigService = new AIModelConfigurationService();

    const config = await modelConfigService.updateModelConfig(user.uid, configId, validatedData);

    return c.json(createSuccessResponse({
      config,
      message: 'AI model configuration updated successfully',
    }));
  } catch (error) {
    logger.error('Update model config error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid update data'), 400);
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Model configuration not found'), 404);
    }
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to update model configuration'), 500);
  }
});

/**
 * DELETE /model-configs/:id
 * Delete an AI model configuration
 */
app.delete('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    
    const modelConfigService = new AIModelConfigurationService();
    await modelConfigService.deleteModelConfig(user.uid, configId);

    return c.json(createSuccessResponse({
      message: 'AI model configuration deleted successfully',
      deletedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Delete model config error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Model configuration not found'), 404);
    }
    
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return c.json(createErrorResponse('DELETION_NOT_ALLOWED', error.message), 400);
    }
    
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to delete model configuration'), 500);
  }
});

/**
 * POST /model-configs/:id/test
 * Test an AI model configuration
 */
app.post('/:id/test', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const configId = c.req.param('id');
    const body = await c.req.json();
    
    const validatedData = testConfigSchema.parse(body);
    const modelConfigService = new AIModelConfigurationService();

    const result = await modelConfigService.testModelConfig(
      user.uid, 
      configId, 
      validatedData.prompt
    );

    return c.json(createSuccessResponse({
      testResult: result,
      testedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Test model config error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid test data'), 400);
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Model configuration not found'), 404);
    }
    
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to test model configuration'), 500);
  }
});

/**
 * GET /model-configs/providers/capabilities
 * Get available AI provider capabilities
 */
app.get('/providers/capabilities', honoAuthMiddleware, async (c: Context) => {
  try {
    const modelConfigService = new AIModelConfigurationService();
    const capabilities = await modelConfigService.getProviderCapabilities();

    return c.json(createSuccessResponse({
      providers: capabilities,
      count: capabilities.length,
    }));
  } catch (error) {
    logger.error('Get provider capabilities error:', error);
    return c.json(createErrorResponse('MODEL_CONFIG_ERROR', 'Failed to get provider capabilities'), 500);
  }
});

export default app;