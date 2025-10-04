import { BaseService } from './BaseService';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// GitHub integration types
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
}

export interface GitHubToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_at?: Date;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GitHubApiResponse {
  [key: string]: any;
}

interface GitHubBranchData {
  object: {
    sha: string;
  };
}

interface GitHubCommitData {
  tree: {
    sha: string;
  };
  sha: string;
}

interface GitHubTreeData {
  sha: string;
}

/**
 * GitHub Service
 * Handles GitHub OAuth integration and repository operations
 */
export class GitHubService extends BaseService {
  protected db: any;
  private config: GitHubOAuthConfig;

  constructor() {
    super();
    this.db = getFirestore();
    this.config = {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: process.env.GITHUB_REDIRECT_URI || '',
    };
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  generateAuthUrl(userId: string, state?: string): string {
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
    } catch (error) {
      this.logger.error('Failed to generate auth URL', { userId, error });
      throw new Error('Failed to generate GitHub authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<{ token: GitHubToken; userId: string }> {
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

      const tokenData = await tokenResponse.json() as GitHubTokenResponse;
      
      if (tokenData.error) {
        throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
      }

      const token: GitHubToken = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      };

      // Store token securely
      await this.storeUserToken(state, token);

      this.logger.info('Successfully exchanged code for token', { userId: state });
      
      return { token, userId: state };
    } catch (error) {
      this.logger.error('Failed to exchange code for token', { code, state, error });
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Store GitHub token for user
   */
  async storeUserToken(userId: string, token: GitHubToken): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to store GitHub token', { userId, error });
      throw new Error('Failed to store GitHub token');
    }
  }

  /**
   * Get stored GitHub token for user
   */
  async getUserToken(userId: string): Promise<string | null> {
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
    } catch (error) {
      this.logger.error('Failed to get GitHub token', { userId, error });
      return null;
    }
  }

  /**
   * Get GitHub user info
   */
  async getGitHubUser(accessToken: string): Promise<GitHubUser> {
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

      const userData = await response.json() as GitHubUser;
      
      this.logger.info('Retrieved GitHub user info', { login: userData.login });
      return userData;
    } catch (error) {
      this.logger.error('Failed to get GitHub user', { error });
      throw new Error('Failed to get GitHub user information');
    }
  }

  /**
   * Get user's GitHub repositories
   */
  async getUserRepositories(accessToken: string, page: number = 1, perPage: number = 30): Promise<{
    repositories: GitHubRepository[];
    total: number;
    hasMore: boolean;
  }> {
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

      const repositories = await response.json() as GitHubRepository[];
      
      // Get total count from headers
      const linkHeader = response.headers.get('Link');
      const hasMore = linkHeader?.includes('rel="next"') || false;

      this.logger.info('Retrieved GitHub repositories', { count: repositories.length, page });
      
      return {
        repositories,
        total: repositories.length,
        hasMore,
      };
    } catch (error) {
      this.logger.error('Failed to get GitHub repositories', { error });
      throw new Error('Failed to get GitHub repositories');
    }
  }

  /**
   * Create a new GitHub repository
   */
  async createRepository(
    accessToken: string,
    name: string,
    description: string,
    isPrivate: boolean = false
  ): Promise<GitHubRepository> {
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
        const errorData = await response.json() as GitHubApiResponse;
        throw new Error(`GitHub API error: ${errorData.message}`);
      }

      const repository = await response.json() as GitHubRepository;
      
      this.logger.info('Created GitHub repository', { name, private: isPrivate });
      return repository;
    } catch (error) {
      this.logger.error('Failed to create GitHub repository', { name, error });
      throw new Error('Failed to create GitHub repository');
    }
  }

  /**
   * Push files to GitHub repository
   */
  async pushFiles(
    accessToken: string,
    repository: string,
    files: { path: string; content: string }[],
    commitMessage: string = 'Initial commit from Stich'
  ): Promise<void> {
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

      const repoData = await repoResponse.json() as GitHubApiResponse;
      const defaultBranch = repoData.default_branch;

      // Get the latest commit SHA
      const branchResponse = await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      let baseTreeSha: string;
      if (branchResponse.ok) {
        const branchData = await branchResponse.json() as GitHubBranchData;
        const commitResponse = await fetch(`https://api.github.com/repos/${repository}/git/commits/${branchData.object.sha}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        const commitData = await commitResponse.json() as GitHubCommitData;
        baseTreeSha = commitData.tree.sha;
      } else {
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

      const treeData = await treeResponse.json() as GitHubTreeData;

      // Create commit
      const commitPayload: any = {
        message: commitMessage,
        tree: treeData.sha,
      };

      if (baseTreeSha) {
        const branchData = await (await fetch(`https://api.github.com/repos/${repository}/git/refs/heads/${defaultBranch}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        })).json() as GitHubBranchData;
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

      const commitData = await commitResponse.json() as GitHubCommitData;

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
    } catch (error) {
      this.logger.error('Failed to push files to GitHub', { repository, error });
      throw new Error('Failed to push files to GitHub');
    }
  }

  /**
   * Disconnect GitHub integration for user
   */
  async disconnectGitHub(userId: string): Promise<void> {
    try {
      await this.db.collection('users')
        .doc(userId)
        .collection('integrations')
        .doc('github')
        .delete();

      this.logger.info('GitHub integration disconnected', { userId });
    } catch (error) {
      this.logger.error('Failed to disconnect GitHub', { userId, error });
      throw new Error('Failed to disconnect GitHub');
    }
  }

  /**
   * Simple token encryption (in production, use proper encryption)
   */
  private encryptToken(token: string): string {
    // In production, use proper encryption like AES
    return Buffer.from(token).toString('base64');
  }

  /**
   * Simple token decryption
   */
  private decryptToken(encryptedToken: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedToken, 'base64').toString();
  }
}