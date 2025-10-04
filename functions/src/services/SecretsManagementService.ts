import { BaseService } from './BaseService';
import { AnalyticsService } from './AnalyticsService';
import CryptoJS from 'crypto-js';

/**
 * Secret types supported by the platform
 */
export type SecretType = 
  | 'openai_api_key'
  | 'anthropic_api_key'
  | 'google_ai_key'
  | 'cerebras_api_key'
  | 'github_token'
  | 'custom_endpoint'
  | 'environment_variable'
  | 'database_url'
  | 'webhook_url'
  | 'other';

/**
 * Secret visibility and access levels
 */
export type SecretVisibility = 'private' | 'team' | 'organization';

/**
 * Secret interface
 */
export interface Secret {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: SecretType;
  visibility: SecretVisibility;
  encryptedValue: string;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  tags: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    provider?: string;
    endpoint?: string;
    region?: string;
    environment?: string;
    [key: string]: any;
  };
}

/**
 * Secret template for common configurations
 */
export interface SecretTemplate {
  id: string;
  name: string;
  description: string;
  type: SecretType;
  category: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: {
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    };
  }>;
  documentation?: string;
  isPopular: boolean;
}

/**
 * Secret access log for audit purposes
 */
export interface SecretAccessLog {
  id: string;
  secretId: string;
  userId: string;
  action: 'created' | 'read' | 'updated' | 'deleted' | 'used';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
}

/**
 * Secret usage statistics
 */
export interface SecretUsageStats {
  secretId: string;
  totalUses: number;
  lastUsed: Date;
  usageByDay: Array<{ date: string; count: number }>;
  usageByEndpoint: Array<{ endpoint: string; count: number }>;
  errorRate: number;
}

/**
 * Secrets Management Service
 * Handles secure storage, encryption, and management of user secrets
 */
export class SecretsManagementService extends BaseService {
  private analyticsService: AnalyticsService;
  private encryptionKey: string;

  constructor() {
    super();
    this.analyticsService = new AnalyticsService();
    this.encryptionKey = process.env.SECRET_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Encrypt a secret value
   */
  private encryptValue(value: string): string {
    try {
      return CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
    } catch (error) {
      this.logger.error('Failed to encrypt secret value:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a secret value
   */
  private decryptValue(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedValue) {
        throw new Error('Decryption resulted in empty value');
      }
      
      return decryptedValue;
    } catch (error) {
      this.logger.error('Failed to decrypt secret value:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Create a new secret
   */
  async createSecret(userId: string, secretData: {
    name: string;
    description?: string;
    type: SecretType;
    value: string;
    visibility?: SecretVisibility;
    tags?: string[];
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }): Promise<Secret> {
    try {
      this.logger.info('Creating new secret', { userId, name: secretData.name, type: secretData.type });

      // Check if secret name already exists for user
      const existingSecrets = await this.db.collection('secrets')
        .where('userId', '==', userId)
        .where('name', '==', secretData.name)
        .where('isActive', '==', true)
        .get();

      if (!existingSecrets.empty) {
        throw new Error('Secret with this name already exists');
      }

      const secretId = this.generateId();
      const encryptedValue = this.encryptValue(secretData.value);

      const secret: Secret = {
        id: secretId,
        userId,
        name: secretData.name,
        description: secretData.description,
        type: secretData.type,
        visibility: secretData.visibility || 'private',
        encryptedValue,
        expiresAt: secretData.expiresAt,
        isActive: true,
        tags: secretData.tags || [],
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: secretData.metadata || {},
      };

      await this.db.collection('secrets').doc(secretId).set(secret);

      // Log the creation
      await this.logSecretAccess(secretId, userId, 'created', {
        secretType: secretData.type,
      });

      // Track analytics
      await this.analyticsService.trackEvent({
        userId,
        eventType: 'app_created', // We'll need to add secret_created to analytics
        eventData: {
          secretType: secretData.type,
          secretName: secretData.name,
        },
        metadata: {},
      });

      this.logger.info('Secret created successfully', { secretId, userId });
      return secret;
    } catch (error) {
      this.logger.error('Failed to create secret:', error);
      throw new Error('Failed to create secret');
    }
  }

  /**
   * Get a secret by ID (without decrypting the value)
   */
  async getSecret(userId: string, secretId: string): Promise<Secret | null> {
    try {
      const secretDoc = await this.db.collection('secrets').doc(secretId).get();

      if (!secretDoc.exists) {
        return null;
      }

      const secret = secretDoc.data() as Secret;

      // Verify ownership or access rights
      if (secret.userId !== userId && secret.visibility === 'private') {
        throw new Error('Access denied');
      }

      // Check if secret is expired
      if (secret.expiresAt && new Date() > secret.expiresAt) {
        throw new Error('Secret has expired');
      }

      return secret;
    } catch (error) {
      this.logger.error('Failed to get secret:', error);
      throw new Error('Failed to retrieve secret');
    }
  }

  /**
   * Get and decrypt a secret value for use
   */
  async getSecretValue(userId: string, secretId: string, context?: {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
  }): Promise<string> {
    try {
      const secret = await this.getSecret(userId, secretId);

      if (!secret) {
        throw new Error('Secret not found');
      }

      if (!secret.isActive) {
        throw new Error('Secret is inactive');
      }

      const decryptedValue = this.decryptValue(secret.encryptedValue);

      // Update last used timestamp
      await this.db.collection('secrets').doc(secretId).update({
        lastUsed: new Date(),
        updatedAt: new Date(),
      });

      // Log the access
      await this.logSecretAccess(secretId, userId, 'used', {
        endpoint: context?.endpoint,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });

      this.logger.info('Secret value accessed', { secretId, userId });
      return decryptedValue;
    } catch (error) {
      this.logger.error('Failed to get secret value:', error);
      throw new Error('Failed to retrieve secret value');
    }
  }

  /**
   * Update a secret
   */
  async updateSecret(userId: string, secretId: string, updates: {
    name?: string;
    description?: string;
    value?: string;
    tags?: string[];
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }): Promise<Secret> {
    try {
      const secret = await this.getSecret(userId, secretId);

      if (!secret) {
        throw new Error('Secret not found');
      }

      if (secret.userId !== userId) {
        throw new Error('Access denied');
      }

      const updateData: Partial<Secret> = {
        updatedAt: new Date(),
        version: secret.version + 1,
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
      if (updates.metadata) updateData.metadata = { ...secret.metadata, ...updates.metadata };
      
      // If value is being updated, encrypt it
      if (updates.value) {
        updateData.encryptedValue = this.encryptValue(updates.value);
      }

      await this.db.collection('secrets').doc(secretId).update(updateData);

      // Log the update
      await this.logSecretAccess(secretId, userId, 'updated', {
        updatedFields: Object.keys(updates),
      });

      const updatedSecret = { ...secret, ...updateData };
      this.logger.info('Secret updated successfully', { secretId, userId });
      return updatedSecret;
    } catch (error) {
      this.logger.error('Failed to update secret:', error);
      throw new Error('Failed to update secret');
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(userId: string, secretId: string): Promise<void> {
    try {
      const secret = await this.getSecret(userId, secretId);

      if (!secret) {
        throw new Error('Secret not found');
      }

      if (secret.userId !== userId) {
        throw new Error('Access denied');
      }

      // Soft delete by marking as inactive
      await this.db.collection('secrets').doc(secretId).update({
        isActive: false,
        updatedAt: new Date(),
      });

      // Log the deletion
      await this.logSecretAccess(secretId, userId, 'deleted', {});

      this.logger.info('Secret deleted successfully', { secretId, userId });
    } catch (error) {
      this.logger.error('Failed to delete secret:', error);
      throw new Error('Failed to delete secret');
    }
  }

  /**
   * List user's secrets
   */
  async listSecrets(userId: string, options: {
    type?: SecretType;
    tags?: string[];
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{
    secrets: Secret[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      let query = this.db.collection('secrets')
        .where('userId', '==', userId);

      if (!options.includeInactive) {
        query = query.where('isActive', '==', true);
      }

      if (options.type) {
        query = query.where('type', '==', options.type);
      }

      const snapshot = await query.get();
      let secrets = snapshot.docs.map(doc => doc.data() as Secret);

      // Apply client-side filters
      if (options.tags && options.tags.length > 0) {
        secrets = secrets.filter(secret =>
          secret.tags.some(tag => options.tags!.includes(tag))
        );
      }

      // Sort by creation date (newest first)
      secrets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const totalCount = secrets.length;

      // Apply pagination
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedSecrets = secrets.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      return {
        secrets: paginatedSecrets,
        totalCount,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to list secrets:', error);
      throw new Error('Failed to list secrets');
    }
  }

  /**
   * Get secret templates
   */
  async getSecretTemplates(): Promise<SecretTemplate[]> {
    try {
      const templates: SecretTemplate[] = [
        {
          id: 'openai-api-key',
          name: 'OpenAI API Key',
          description: 'API key for OpenAI services (GPT-4, GPT-3.5, etc.)',
          type: 'openai_api_key',
          category: 'AI Providers',
          isPopular: true,
          fields: [
            {
              name: 'apiKey',
              label: 'API Key',
              type: 'password',
              required: true,
              placeholder: 'sk-...',
              validation: {
                pattern: '^sk-[a-zA-Z0-9]{48}$',
                minLength: 51,
                maxLength: 51,
              },
            },
          ],
          documentation: 'Get your API key from https://platform.openai.com/api-keys',
        },
        {
          id: 'anthropic-api-key',
          name: 'Anthropic API Key',
          description: 'API key for Anthropic Claude models',
          type: 'anthropic_api_key',
          category: 'AI Providers',
          isPopular: true,
          fields: [
            {
              name: 'apiKey',
              label: 'API Key',
              type: 'password',
              required: true,
              placeholder: 'sk-ant-...',
            },
          ],
          documentation: 'Get your API key from https://console.anthropic.com/',
        },
        {
          id: 'github-token',
          name: 'GitHub Personal Access Token',
          description: 'Token for GitHub repository access and operations',
          type: 'github_token',
          category: 'Development Tools',
          isPopular: true,
          fields: [
            {
              name: 'token',
              label: 'Personal Access Token',
              type: 'password',
              required: true,
              placeholder: 'ghp_...',
            },
            {
              name: 'scope',
              label: 'Token Scope',
              type: 'select',
              required: true,
              options: ['repo', 'public_repo', 'admin:repo_hook'],
            },
          ],
          documentation: 'Create a token at https://github.com/settings/tokens',
        },
        {
          id: 'custom-endpoint',
          name: 'Custom API Endpoint',
          description: 'Custom API endpoint configuration',
          type: 'custom_endpoint',
          category: 'Custom',
          isPopular: false,
          fields: [
            {
              name: 'url',
              label: 'Endpoint URL',
              type: 'url',
              required: true,
              placeholder: 'https://api.example.com',
            },
            {
              name: 'apiKey',
              label: 'API Key',
              type: 'password',
              required: false,
              placeholder: 'Your API key',
            },
            {
              name: 'headers',
              label: 'Custom Headers (JSON)',
              type: 'text',
              required: false,
              placeholder: '{"Authorization": "Bearer token"}',
            },
          ],
        },
      ];

      return templates;
    } catch (error) {
      this.logger.error('Failed to get secret templates:', error);
      throw new Error('Failed to get secret templates');
    }
  }

  /**
   * Log secret access for audit purposes
   */
  private async logSecretAccess(
    secretId: string,
    userId: string,
    action: SecretAccessLog['action'],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const logEntry: SecretAccessLog = {
        id: this.generateId(),
        secretId,
        userId,
        action,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata,
      };

      await this.db.collection('secret_access_logs').add(logEntry);
    } catch (error) {
      this.logger.error('Failed to log secret access:', error);
      // Don't throw here as this is a non-critical operation
    }
  }

  /**
   * Get secret usage statistics
   */
  async getSecretUsageStats(userId: string, secretId: string): Promise<SecretUsageStats | null> {
    try {
      const secret = await this.getSecret(userId, secretId);

      if (!secret) {
        return null;
      }

      // Get access logs for this secret
      const logsSnapshot = await this.db.collection('secret_access_logs')
        .where('secretId', '==', secretId)
        .where('action', '==', 'used')
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get();

      const logs = logsSnapshot.docs.map(doc => doc.data() as SecretAccessLog);

      const totalUses = logs.length;
      const lastUsed = logs.length > 0 ? logs[0].timestamp : secret.createdAt;

      // Calculate usage by day (last 30 days)
      const usageByDay: Array<{ date: string; count: number }> = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = logs.filter(log => 
          log.timestamp.toISOString().split('T')[0] === dateStr
        ).length;
        usageByDay.push({ date: dateStr, count });
      }

      // Calculate usage by endpoint
      const endpointCounts: Record<string, number> = {};
      logs.forEach(log => {
        const endpoint = log.metadata.endpoint || 'unknown';
        endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
      });

      const usageByEndpoint = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate error rate (simplified - would need error tracking)
      const errorRate = 0; // Placeholder

      const stats: SecretUsageStats = {
        secretId,
        totalUses,
        lastUsed,
        usageByDay,
        usageByEndpoint,
        errorRate,
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to get secret usage stats:', error);
      throw new Error('Failed to get secret usage statistics');
    }
  }

  /**
   * Test a secret by making a validation request
   */
  async testSecret(userId: string, secretId: string): Promise<{
    isValid: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    try {
      const secret = await this.getSecret(userId, secretId);

      if (!secret) {
        return { isValid: false, message: 'Secret not found' };
      }

      const secretValue = await this.getSecretValue(userId, secretId);

      // Test based on secret type
      switch (secret.type) {
        case 'openai_api_key':
          return await this.testOpenAIKey(secretValue);
        case 'anthropic_api_key':
          return await this.testAnthropicKey(secretValue);
        case 'github_token':
          return await this.testGitHubToken(secretValue);
        default:
          return { isValid: true, message: 'Secret type not testable' };
      }
    } catch (error) {
      this.logger.error('Failed to test secret:', error);
      return { isValid: false, message: 'Failed to test secret' };
    }
  }

  /**
   * Test OpenAI API key
   */
  private async testOpenAIKey(apiKey: string): Promise<{
    isValid: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as { data?: any[] };
        return {
          isValid: true,
          message: 'API key is valid',
          details: {
            modelsAvailable: data.data?.length || 0,
          },
        };
      } else {
        return {
          isValid: false,
          message: 'Invalid API key',
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: 'Failed to validate API key',
      };
    }
  }

  /**
   * Test Anthropic API key
   */
  private async testAnthropicKey(apiKey: string): Promise<{
    isValid: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    try {
      // Anthropic doesn't have a simple validation endpoint, so we'll make a minimal request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.status === 401) {
        return { isValid: false, message: 'Invalid API key' };
      } else if (response.status === 400 || response.status === 200) {
        return { isValid: true, message: 'API key is valid' };
      } else {
        return {
          isValid: false,
          message: 'Unexpected response',
          details: { status: response.status },
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: 'Failed to validate API key',
      };
    }
  }

  /**
   * Test GitHub token
   */
  private async testGitHubToken(token: string): Promise<{
    isValid: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as { login?: string };
        return {
          isValid: true,
          message: 'GitHub token is valid',
          details: {
            username: data.login,
            scopes: response.headers.get('x-oauth-scopes')?.split(', ') || [],
          },
        };
      } else {
        return {
          isValid: false,
          message: 'Invalid GitHub token',
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: 'Failed to validate GitHub token',
      };
    }
  }
}