import { Hono } from 'hono';
import { Context } from 'hono';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { SecretsManagementService, SecretType, SecretVisibility } from '../services/SecretsManagementService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from 'firebase-functions';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const createSecretSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'openai_api_key',
    'anthropic_api_key', 
    'google_ai_key',
    'cerebras_api_key',
    'github_token',
    'custom_endpoint',
    'environment_variable',
    'database_url',
    'webhook_url',
    'other'
  ] as const),
  value: z.string().min(1),
  visibility: z.enum(['private', 'team', 'organization']).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateSecretSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  value: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const listSecretsSchema = z.object({
  type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  includeInactive: z.boolean().optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
});

/**
 * POST /secrets
 * Create a new secret
 */
app.post('/', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = createSecretSchema.parse(body);
    const secretsService = new SecretsManagementService();

    const secret = await secretsService.createSecret(user.uid, {
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      value: validatedData.value,
      visibility: validatedData.visibility,
      tags: validatedData.tags,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      metadata: validatedData.metadata,
    });

    // Don't return the encrypted value in the response
    const { encryptedValue, ...secretResponse } = secret;

    return c.json(createSuccessResponse({
      secret: secretResponse,
      message: 'Secret created successfully',
    }));
  } catch (error) {
    logger.error('Create secret error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid secret data'), 400);
    }
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return c.json(createErrorResponse('CONFLICT_ERROR', 'Secret with this name already exists'), 409);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to create secret'), 500);
  }
});

/**
 * GET /secrets
 * List user's secrets
 */
app.get('/', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    
    const options = listSecretsSchema.parse({
      type: query.type,
      tags: query.tags ? query.tags.split(',') : undefined,
      includeInactive: query.includeInactive === 'true',
      page: query.page ? parseInt(query.page) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    });

    const secretsService = new SecretsManagementService();
    const result = await secretsService.listSecrets(user.uid, {
      ...options,
      type: options.type as SecretType | undefined,
    });

    // Remove encrypted values from response
    const secrets = result.secrets.map(secret => {
      const { encryptedValue, ...secretResponse } = secret;
      return secretResponse;
    });

    return c.json(createSuccessResponse({
      secrets,
      pagination: {
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
    }));
  } catch (error) {
    logger.error('List secrets error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters'), 400);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to list secrets'), 500);
  }
});

/**
 * GET /secrets/:id
 * Get a specific secret (without value)
 */
app.get('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    
    const secretsService = new SecretsManagementService();
    const secret = await secretsService.getSecret(user.uid, secretId);

    if (!secret) {
      return c.json(createErrorResponse('NOT_FOUND', 'Secret not found'), 404);
    }

    // Don't return the encrypted value
    const { encryptedValue, ...secretResponse } = secret;

    return c.json(createSuccessResponse({
      secret: secretResponse,
    }));
  } catch (error) {
    logger.error('Get secret error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    if (error instanceof Error && error.message.includes('expired')) {
      return c.json(createErrorResponse('EXPIRED', 'Secret has expired'), 410);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to get secret'), 500);
  }
});

/**
 * GET /secrets/:id/value
 * Get decrypted secret value
 */
app.get('/:id/value', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    
    const secretsService = new SecretsManagementService();
    const value = await secretsService.getSecretValue(user.uid, secretId, {
      ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    return c.json(createSuccessResponse({
      value,
      accessedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Get secret value error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Secret not found'), 404);
    }
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    if (error instanceof Error && error.message.includes('expired')) {
      return c.json(createErrorResponse('EXPIRED', 'Secret has expired'), 410);
    }
    
    if (error instanceof Error && error.message.includes('inactive')) {
      return c.json(createErrorResponse('INACTIVE', 'Secret is inactive'), 410);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to get secret value'), 500);
  }
});

/**
 * PUT /secrets/:id
 * Update a secret
 */
app.put('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    const body = await c.req.json();
    
    const validatedData = updateSecretSchema.parse(body);
    const secretsService = new SecretsManagementService();

    const updates: any = {};
    if (validatedData.name) updates.name = validatedData.name;
    if (validatedData.description !== undefined) updates.description = validatedData.description;
    if (validatedData.value) updates.value = validatedData.value;
    if (validatedData.tags) updates.tags = validatedData.tags;
    if (validatedData.expiresAt !== undefined) {
      updates.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined;
    }
    if (validatedData.metadata) updates.metadata = validatedData.metadata;

    const secret = await secretsService.updateSecret(user.uid, secretId, updates);

    // Don't return the encrypted value
    const { encryptedValue, ...secretResponse } = secret;

    return c.json(createSuccessResponse({
      secret: secretResponse,
      message: 'Secret updated successfully',
    }));
  } catch (error) {
    logger.error('Update secret error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid update data'), 400);
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Secret not found'), 404);
    }
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to update secret'), 500);
  }
});

/**
 * DELETE /secrets/:id
 * Delete a secret
 */
app.delete('/:id', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    
    const secretsService = new SecretsManagementService();
    await secretsService.deleteSecret(user.uid, secretId);

    return c.json(createSuccessResponse({
      message: 'Secret deleted successfully',
      deletedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Delete secret error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json(createErrorResponse('NOT_FOUND', 'Secret not found'), 404);
    }
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return c.json(createErrorResponse('ACCESS_DENIED', 'Access denied'), 403);
    }
    
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to delete secret'), 500);
  }
});

/**
 * POST /secrets/:id/test
 * Test a secret to validate it works
 */
app.post('/:id/test', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    
    const secretsService = new SecretsManagementService();
    const result = await secretsService.testSecret(user.uid, secretId);

    return c.json(createSuccessResponse({
      testResult: result,
      testedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Test secret error:', error);
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to test secret'), 500);
  }
});

/**
 * GET /secrets/:id/stats
 * Get secret usage statistics
 */
app.get('/:id/stats', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const secretId = c.req.param('id');
    
    const secretsService = new SecretsManagementService();
    const stats = await secretsService.getSecretUsageStats(user.uid, secretId);

    if (!stats) {
      return c.json(createErrorResponse('NOT_FOUND', 'Secret not found'), 404);
    }

    return c.json(createSuccessResponse({
      stats,
      generatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    logger.error('Get secret stats error:', error);
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to get secret statistics'), 500);
  }
});

/**
 * GET /secrets/templates
 * Get available secret templates
 */
app.get('/templates', honoAuthMiddleware, async (c: Context) => {
  try {
    const secretsService = new SecretsManagementService();
    const templates = await secretsService.getSecretTemplates();

    return c.json(createSuccessResponse({
      templates,
      count: templates.length,
    }));
  } catch (error) {
    logger.error('Get secret templates error:', error);
    return c.json(createErrorResponse('SECRETS_ERROR', 'Failed to get secret templates'), 500);
  }
});

export default app;