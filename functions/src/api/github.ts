import { Hono } from 'hono';
import { Context } from 'hono';
import { honoAuthMiddleware } from '../middleware/honoAuth';
import { GitHubService } from '../services/GitHubService';
import { GitHubExportService } from '../services/GitHubExportService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { logger } from 'firebase-functions';
import { z } from 'zod';

const app = new Hono();

// Validation schemas
const connectSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

const createRepoSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
});

const pushFilesSchema = z.object({
  repository: z.string().min(1),
  files: z.array(z.object({
    path: z.string().min(1),
    content: z.string(),
  })).min(1),
  commitMessage: z.string().max(500).optional(),
});

const exportAppSchema = z.object({
  appId: z.string().min(1),
  repositoryName: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_]+$/, 'Repository name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  includeAssets: z.boolean().default(true),
  customCommitMessage: z.string().max(500).optional(),
});

/**
 * GET /github/connect
 * Generate GitHub OAuth authorization URL
 */
app.get('/connect', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    
    const validatedData = connectSchema.parse({
      redirectUrl: query.redirectUrl,
    });

    const githubService = new GitHubService();
    const authUrl = githubService.generateAuthUrl(user.uid, validatedData.redirectUrl);

    logger.info('GitHub connect initiated', { userId: user.uid });

    return c.json(createSuccessResponse({
      authUrl,
      state: user.uid,
    }));
  } catch (error) {
    logger.error('GitHub connect error:', error);
    return c.json(createErrorResponse('GITHUB_CONNECT_ERROR', 'Failed to generate GitHub authorization URL'), 500);
  }
});

/**
 * POST /github/callback
 * Handle GitHub OAuth callback
 */
app.post('/callback', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { code, state } = body;

    if (!code || !state) {
      return c.json(createErrorResponse('INVALID_REQUEST', 'Missing code or state'), 400);
    }

    const githubService = new GitHubService();
    const { token, userId } = await githubService.exchangeCodeForToken(code, state);

    // Get GitHub user info
    const githubUser = await githubService.getGitHubUser(token.access_token);

    logger.info('GitHub OAuth callback completed', { userId, githubLogin: githubUser.login });

    return c.json(createSuccessResponse({
      connected: true,
      githubUser: {
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
      },
    }));
  } catch (error) {
    logger.error('GitHub callback error:', error);
    return c.json(createErrorResponse('GITHUB_CALLBACK_ERROR', 'Failed to complete GitHub OAuth'), 500);
  }
});

/**
 * GET /github/status
 * Check GitHub connection status
 */
app.get('/status', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const githubService = new GitHubService();
    
    const token = await githubService.getUserToken(user.uid);
    
    if (!token) {
      return c.json(createSuccessResponse({
        connected: false,
      }));
    }

    // Verify token is still valid by getting user info
    try {
      const githubUser = await githubService.getGitHubUser(token);
      
      return c.json(createSuccessResponse({
        connected: true,
        githubUser: {
          login: githubUser.login,
          name: githubUser.name,
          email: githubUser.email,
          avatar_url: githubUser.avatar_url,
        },
      }));
    } catch (tokenError) {
      // Token is invalid, disconnect
      await githubService.disconnectGitHub(user.uid);
      
      return c.json(createSuccessResponse({
        connected: false,
      }));
    }
  } catch (error) {
    logger.error('GitHub status check error:', error);
    return c.json(createErrorResponse('GITHUB_STATUS_ERROR', 'Failed to check GitHub status'), 500);
  }
});

/**
 * POST /github/export-app
 * Export Stich app to GitHub repository
 */
app.post('/export-app', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedData = exportAppSchema.parse(body);

    const exportService = new GitHubExportService();
    const result = await exportService.exportAppToGitHub(user.uid, {
      appId: validatedData.appId,
      repositoryName: validatedData.repositoryName,
      description: validatedData.description,
      isPrivate: validatedData.isPrivate,
      includeAssets: validatedData.includeAssets,
      customCommitMessage: validatedData.customCommitMessage,
    });

    if (!result.success) {
      return c.json(createErrorResponse('EXPORT_FAILED', result.error || 'Export failed'), 400);
    }

    logger.info('App exported to GitHub', { 
      userId: user.uid, 
      appId: validatedData.appId,
      repository: result.repository?.full_name 
    });

    return c.json(createSuccessResponse({
      exported: true,
      repository: result.repository,
      fileCount: result.fileCount,
    }));
  } catch (error) {
    logger.error('GitHub app export error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json(createErrorResponse('VALIDATION_ERROR', 'Invalid export configuration'), 400);
    }
    
    return c.json(createErrorResponse('GITHUB_EXPORT_ERROR', 'Failed to export app to GitHub'), 500);
  }
});

/**
 * GET /github/exports
 * Get user's GitHub export history
 */
app.get('/exports', honoAuthMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '10'), 50);

    const exportService = new GitHubExportService();
    const result = await exportService.getUserExports(user.uid, page, limit);

    logger.info('GitHub exports retrieved', { userId: user.uid, count: result.exports.length });

    return c.json(createSuccessResponse(result));
  } catch (error) {
    logger.error('GitHub exports error:', error);
    return c.json(createErrorResponse('GITHUB_EXPORTS_ERROR', 'Failed to get export history'), 500);
  }
});

export default app;

/**
 * Create GitHub app for Firebase Functions
 */
export const createGitHubApp = () => app;