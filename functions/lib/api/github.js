"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGitHubApp = void 0;
const hono_1 = require("hono");
const honoAuth_1 = require("../middleware/honoAuth");
const GitHubService_1 = require("../services/GitHubService");
const GitHubExportService_1 = require("../services/GitHubExportService");
const response_1 = require("../utils/response");
const firebase_functions_1 = require("firebase-functions");
const zod_1 = require("zod");
const app = new hono_1.Hono();
// Validation schemas
const connectSchema = zod_1.z.object({
    redirectUrl: zod_1.z.string().url().optional(),
});
const createRepoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    isPrivate: zod_1.z.boolean().default(false),
});
const pushFilesSchema = zod_1.z.object({
    repository: zod_1.z.string().min(1),
    files: zod_1.z.array(zod_1.z.object({
        path: zod_1.z.string().min(1),
        content: zod_1.z.string(),
    })).min(1),
    commitMessage: zod_1.z.string().max(500).optional(),
});
const exportAppSchema = zod_1.z.object({
    appId: zod_1.z.string().min(1),
    repositoryName: zod_1.z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_]+$/, 'Repository name can only contain letters, numbers, hyphens, and underscores'),
    description: zod_1.z.string().max(500).optional(),
    isPrivate: zod_1.z.boolean().default(false),
    includeAssets: zod_1.z.boolean().default(true),
    customCommitMessage: zod_1.z.string().max(500).optional(),
});
/**
 * GET /github/connect
 * Generate GitHub OAuth authorization URL
 */
app.get('/connect', honoAuth_1.honoAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const query = c.req.query();
        const validatedData = connectSchema.parse({
            redirectUrl: query.redirectUrl,
        });
        const githubService = new GitHubService_1.GitHubService();
        const authUrl = githubService.generateAuthUrl(user.uid, validatedData.redirectUrl);
        firebase_functions_1.logger.info('GitHub connect initiated', { userId: user.uid });
        return c.json((0, response_1.createSuccessResponse)({
            authUrl,
            state: user.uid,
        }));
    }
    catch (error) {
        firebase_functions_1.logger.error('GitHub connect error:', error);
        return c.json((0, response_1.createErrorResponse)('GITHUB_CONNECT_ERROR', 'Failed to generate GitHub authorization URL'), 500);
    }
});
/**
 * POST /github/callback
 * Handle GitHub OAuth callback
 */
app.post('/callback', async (c) => {
    try {
        const body = await c.req.json();
        const { code, state } = body;
        if (!code || !state) {
            return c.json((0, response_1.createErrorResponse)('INVALID_REQUEST', 'Missing code or state'), 400);
        }
        const githubService = new GitHubService_1.GitHubService();
        const { token, userId } = await githubService.exchangeCodeForToken(code, state);
        // Get GitHub user info
        const githubUser = await githubService.getGitHubUser(token.access_token);
        firebase_functions_1.logger.info('GitHub OAuth callback completed', { userId, githubLogin: githubUser.login });
        return c.json((0, response_1.createSuccessResponse)({
            connected: true,
            githubUser: {
                login: githubUser.login,
                name: githubUser.name,
                email: githubUser.email,
                avatar_url: githubUser.avatar_url,
            },
        }));
    }
    catch (error) {
        firebase_functions_1.logger.error('GitHub callback error:', error);
        return c.json((0, response_1.createErrorResponse)('GITHUB_CALLBACK_ERROR', 'Failed to complete GitHub OAuth'), 500);
    }
});
/**
 * GET /github/status
 * Check GitHub connection status
 */
app.get('/status', honoAuth_1.honoAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const githubService = new GitHubService_1.GitHubService();
        const token = await githubService.getUserToken(user.uid);
        if (!token) {
            return c.json((0, response_1.createSuccessResponse)({
                connected: false,
            }));
        }
        // Verify token is still valid by getting user info
        try {
            const githubUser = await githubService.getGitHubUser(token);
            return c.json((0, response_1.createSuccessResponse)({
                connected: true,
                githubUser: {
                    login: githubUser.login,
                    name: githubUser.name,
                    email: githubUser.email,
                    avatar_url: githubUser.avatar_url,
                },
            }));
        }
        catch (tokenError) {
            // Token is invalid, disconnect
            await githubService.disconnectGitHub(user.uid);
            return c.json((0, response_1.createSuccessResponse)({
                connected: false,
            }));
        }
    }
    catch (error) {
        firebase_functions_1.logger.error('GitHub status check error:', error);
        return c.json((0, response_1.createErrorResponse)('GITHUB_STATUS_ERROR', 'Failed to check GitHub status'), 500);
    }
});
/**
 * POST /github/export-app
 * Export Stich app to GitHub repository
 */
app.post('/export-app', honoAuth_1.honoAuthMiddleware, async (c) => {
    var _a;
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const validatedData = exportAppSchema.parse(body);
        const exportService = new GitHubExportService_1.GitHubExportService();
        const result = await exportService.exportAppToGitHub(user.uid, {
            appId: validatedData.appId,
            repositoryName: validatedData.repositoryName,
            description: validatedData.description,
            isPrivate: validatedData.isPrivate,
            includeAssets: validatedData.includeAssets,
            customCommitMessage: validatedData.customCommitMessage,
        });
        if (!result.success) {
            return c.json((0, response_1.createErrorResponse)('EXPORT_FAILED', result.error || 'Export failed'), 400);
        }
        firebase_functions_1.logger.info('App exported to GitHub', {
            userId: user.uid,
            appId: validatedData.appId,
            repository: (_a = result.repository) === null || _a === void 0 ? void 0 : _a.full_name
        });
        return c.json((0, response_1.createSuccessResponse)({
            exported: true,
            repository: result.repository,
            fileCount: result.fileCount,
        }));
    }
    catch (error) {
        firebase_functions_1.logger.error('GitHub app export error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json((0, response_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid export configuration'), 400);
        }
        return c.json((0, response_1.createErrorResponse)('GITHUB_EXPORT_ERROR', 'Failed to export app to GitHub'), 500);
    }
});
/**
 * GET /github/exports
 * Get user's GitHub export history
 */
app.get('/exports', honoAuth_1.honoAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const query = c.req.query();
        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '10'), 50);
        const exportService = new GitHubExportService_1.GitHubExportService();
        const result = await exportService.getUserExports(user.uid, page, limit);
        firebase_functions_1.logger.info('GitHub exports retrieved', { userId: user.uid, count: result.exports.length });
        return c.json((0, response_1.createSuccessResponse)(result));
    }
    catch (error) {
        firebase_functions_1.logger.error('GitHub exports error:', error);
        return c.json((0, response_1.createErrorResponse)('GITHUB_EXPORTS_ERROR', 'Failed to get export history'), 500);
    }
});
exports.default = app;
/**
 * Create GitHub app for Firebase Functions
 */
const createGitHubApp = () => app;
exports.createGitHubApp = createGitHubApp;
//# sourceMappingURL=github.js.map