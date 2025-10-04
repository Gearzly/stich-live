export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language: string | null;
  default_branch: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    type: string;
  };
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface CreateRepositoryRequest {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}

export interface GitHubExportOptions {
  repositoryName: string;
  description?: string;
  isPrivate: boolean;
  includeReadme: boolean;
  license?: string;
  gitignore?: string;
  createNewRepo: boolean;
  existingRepoId?: number;
  commitMessage?: string;
  branchName?: string;
}

export interface ExportProgress {
  step: 'authenticating' | 'creating_repo' | 'uploading_files' | 'committing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  filesProcessed?: number;
  totalFiles?: number;
  error?: string;
}

export interface GitHubAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: Date;
  expires_at?: Date;
}

export interface FileUploadResult {
  file: string;
  status: 'success' | 'error';
  sha?: string;
  error?: string;
}