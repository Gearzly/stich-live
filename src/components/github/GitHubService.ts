import type { 
  GitHubRepository, 
  GitHubUser, 
  CreateRepositoryRequest, 
  GitHubAuthToken,
  FileUploadResult 
} from './types';

export class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  constructor() {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    const stored = localStorage.getItem('github_token');
    if (stored) {
      try {
        const tokenData: GitHubAuthToken = JSON.parse(stored);
        // Check if token is expired
        if (tokenData.expires_at && new Date(tokenData.expires_at) > new Date()) {
          this.token = tokenData.access_token;
        } else {
          localStorage.removeItem('github_token');
        }
      } catch (error) {
        console.error('Failed to parse GitHub token:', error);
        localStorage.removeItem('github_token');
      }
    }
  }

  public saveToken(tokenData: GitHubAuthToken) {
    localStorage.setItem('github_token', JSON.stringify(tokenData));
    this.token = tokenData.access_token;
  }

  public clearToken() {
    localStorage.removeItem('github_token');
    this.token = null;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not available. Please authenticate first.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getCurrentUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    return this.makeRequest<GitHubRepository[]>('/user/repos?sort=updated&per_page=100');
  }

  async createRepository(data: CreateRepositoryRequest): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>('/user/repos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  async uploadFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<FileUploadResult> {
    try {
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      const data: any = {
        message,
        content: encodedContent,
        branch,
      };

      if (sha) {
        data.sha = sha;
      }

      const result = await this.makeRequest<any>(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return {
        file: path,
        status: 'success',
        sha: result.content?.sha,
      };
    } catch (error) {
      return {
        file: path,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const result = await this.makeRequest<any>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      if (result.content && result.encoding === 'base64') {
        return {
          content: atob(result.content),
          sha: result.sha,
        };
      }
      return null;
    } catch (error) {
      // File doesn't exist
      return null;
    }
  }

  async createBranch(
    owner: string,
    repo: string,
    newBranch: string,
    fromBranch: string = 'main'
  ): Promise<void> {
    // Get the SHA of the source branch
    const refData = await this.makeRequest<any>(`/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`);
    const sha = refData.object.sha;

    // Create new branch
    await this.makeRequest<any>(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha,
      }),
    });
  }

  async getBranches(owner: string, repo: string): Promise<string[]> {
    const branches = await this.makeRequest<any[]>(`/repos/${owner}/${repo}/branches`);
    return branches.map(branch => branch.name);
  }

  // OAuth authentication helper
  static getAuthUrl(clientId: string, scopes: string[] = ['repo', 'user']): string {
    const scopeString = scopes.join(' ');
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/github/callback');
    
    return `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${encodeURIComponent(scopeString)}&` +
      `state=${Math.random().toString(36).substring(2)}`;
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<GitHubAuthToken> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      created_at: new Date(),
    };
  }
}

export const githubService = new GitHubService();