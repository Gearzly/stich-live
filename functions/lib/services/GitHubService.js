"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const BaseService_1 = require("./BaseService");
const firestore_1 = require("firebase-admin/firestore");
/**
 * GitHub Service
 * Handles GitHub OAuth integration and repository operations
 */
class GitHubService extends BaseService_1.BaseService {
    constructor() {
        super();
        this.db = (0, firestore_1.getFirestore)();
        this.config = {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            redirectUri: process.env.GITHUB_REDIRECT_URI || '',
        };
    }
    /**
     * Generate GitHub OAuth authorization URL
     */
    generateAuthUrl(userId, state) {
        try {
            const params = new URLSearchParams({
                client_id: this.config.clientId,
                redirect_uri: this.config.redirectUri,
                scope: 'repo,user:email',
                state: state || userId,
                response_type: 'code',
            });
            const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
            this.logger.info('Generated GitHub auth URL', { userId });
            return authUrl;
        }
        catch (error) {
            this.logger.error('Failed to generate auth URL', { userId, error });
            throw new Error('Failed to generate GitHub authorization URL');
        }
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code, state) {
        try {
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    code,
                    redirect_uri: this.config.redirectUri,
                }),
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for token');
            }
            const tokenData = await tokenResponse.json();
            if (tokenData.error) {
                throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
            }
            const token = {
                access_token: tokenData.access_token,
                token_type: tokenData.token_type,
                scope: tokenData.scope,
            };
            // Store token securely
            await this.storeUserToken(state, token);
            this.logger.info('Successfully exchanged code for token', { userId: state });
            return { token, userId: state };
        }
        catch (error) {
            this.logger.error('Failed to exchange code for token', { code, state, error });
            throw new Error('Failed to exchange authorization code');
        }
    }
    /**
     * Store GitHub token for user
     */
    async storeUserToken(userId, token) {
        try {
            // Encrypt token before storing
            const encryptedToken = this.encryptToken(token.access_token);
            await this.db.collection('users').doc(userId).collection('integrations').doc('github').set({
                access_token: encryptedToken,
                token_type: token.token_type,
                scope: token.scope,
                connected_at: new Date(),
                last_used: new Date(),
            });
            this.logger.info('GitHub token stored', { userId });
        }
        catch (error) {
            this.logger.error('Failed to store GitHub token', { userId, error });
            throw new Error('Failed to store GitHub token');
        }
    }
    /**
     * Get stored GitHub token for user
     */
    async getUserToken(userId) {
        try {
            const tokenDoc = await this.db.collection('users')
                .doc(userId)
                .collection('integrations')
                .doc('github')
                .get();
            if (!tokenDoc.exists) {
                return null;
            }
            const tokenData = tokenDoc.data();
            const decryptedToken = this.decryptToken(tokenData.access_token);
            // Update last used timestamp
            await tokenDoc.ref.update({ last_used: new Date() });
            return decryptedToken;
        }
        catch (error) {
            this.logger.error('Failed to get GitHub token', { userId, error });
            return null;
        }
    }
    /**
     * Get GitHub user info
     */
    async getGitHubUser(accessToken) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            const userData = await response.json();
            this.logger.info('Retrieved GitHub user info', { login: userData.login });
            return userData;
        }
        catch (error) {
            this.logger.error('Failed to get GitHub user', { error });
            throw new Error('Failed to get GitHub user information');
        }
    }
    /**
     * Get user's GitHub repositories
     */
    async getUserRepositories(accessToken, page = 1, perPage = 30) {
        try {
            const response = await fetch(`https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=updated`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            const repositories = await response.json();
            // Get total count from headers
            const linkHeader = response.headers.get('Link');
            const hasMore = (linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader.includes('rel="next"')) || false;
            this.logger.info('Retrieved GitHub repositories', { count: repositories.length, page });
            return {
                repositories,
                total: repositories.length,
                hasMore,
            };
        }
        catch (error) {
            this.logger.error('Failed to get GitHub repositories', { error });
            throw new Error('Failed to get GitHub repositories');
        }
    }
    /**
     * Create a new GitHub repository
     */
    async createRepository(accessToken, name, description, isPrivate = false) {
        try {
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    private: isPrivate,
                    auto_init: true,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API error: ${errorData.message}`);
            }
            const repository = await response.json();
            this.logger.info('Created GitHub repository', { name, private: isPrivate });
            return repository;
        }
        catch (error) {
            this.logger.error('Failed to create GitHub repository', { name, error });
            throw new Error('Failed to create GitHub repository');
        }
    }
    /**
     * Push files to GitHub repository
     */
    async pushFiles(accessToken, repository, files, commitMessage = 'Initial commit from Stich') {
        try {
            // Get repository info
            const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            if (!repoResponse.ok) {
                throw new Error('Repository not found');
            }
            const repoData = await repoResponse.json();
            const defaultBranch = repoData.default_branch;
            // Get the latest commit SHA
            const branchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            let baseTreeSha;
            if (branchResponse.ok) {
                const branchData = await branchResponse.json();
                const commitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${branchData.object.sha}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                });
                const commitData = await commitResponse.json();
                baseTreeSha = commitData.tree.sha;
            }
            else {
                // Empty repository
                baseTreeSha = '';
            }
            // Create tree with files
            const tree = files.map(file => ({
                path: file.path,
                mode: '100644',
                type: 'blob',
                content: file.content,
            }));
            const treeResponse = await fetch(`https://api.github.com/repos/${repository}/git/trees`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tree,
                    base_tree: baseTreeSha || undefined,
                }),
            });
            if (!treeResponse.ok) {
                throw new Error('Failed to create tree');
            }
            const treeData = await treeResponse.json();
            // Create commit
            const commitPayload = {
                message: commitMessage,
                tree: treeData.sha,
            };
            if (baseTreeSha) {
                const branchData = await (await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                })).json();
                commitPayload.parents = [branchData.object.sha];
            }
            const commitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commitPayload),
            });
            if (!commitResponse.ok) {
                throw new Error('Failed to create commit');
            }
            const commitData = await commitResponse.json();
            // Update branch reference
            await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sha: commitData.sha,
                }),
            });
            this.logger.info('Files pushed to GitHub', { repository, fileCount: files.length });
        }
        catch (error) {
            this.logger.error('Failed to push files to GitHub', { repository, error });
            throw new Error('Failed to push files to GitHub');
        }
    }
    /**
     * Disconnect GitHub integration for user
     */
    async disconnectGitHub(userId) {
        try {
            await this.db.collection('users')
                .doc(userId)
                .collection('integrations')
                .doc('github')
                .delete();
            this.logger.info('GitHub integration disconnected', { userId });
        }
        catch (error) {
            this.logger.error('Failed to disconnect GitHub', { userId, error });
            throw new Error('Failed to disconnect GitHub');
        }
    }
    /**
     * Simple token encryption (in production, use proper encryption)
     */
    encryptToken(token) {
        // In production, use proper encryption like AES
        return Buffer.from(token).toString('base64');
    }
    /**
     * Simple token decryption
     */
    decryptToken(encryptedToken) {
        // In production, use proper decryption
        return Buffer.from(encryptedToken, 'base64').toString();
    }
}
exports.GitHubService = GitHubService;
//# sourceMappingURL=GitHubService.js.map