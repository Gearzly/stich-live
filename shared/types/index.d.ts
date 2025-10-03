export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserData {
    email: string;
    name?: string;
    avatarUrl?: string;
    subscriptionTier?: 'free' | 'pro' | 'enterprise';
}
export interface UpdateUserData {
    name?: string;
    avatarUrl?: string;
    subscriptionTier?: 'free' | 'pro' | 'enterprise';
}
export interface App {
    id: string;
    userId: string;
    name: string;
    description?: string;
    templateId?: string;
    status: 'draft' | 'generating' | 'completed' | 'deployed' | 'failed';
    generatedCode?: GeneratedCode;
    deployedUrl?: string;
    previewUrl?: string;
    githubRepo?: string;
    settings: AppSettings;
    createdAt: Date;
    updatedAt: Date;
}
export interface AppSettings {
    framework?: string;
    styling?: string;
    database?: string;
    deployment?: string;
    features?: string[];
}
export interface GeneratedCode {
    files: GeneratedFile[];
    blueprint: Blueprint;
    dependencies: Record<string, string>;
}
export interface GeneratedFile {
    path: string;
    content: string;
    type: 'file' | 'directory';
    purpose?: string;
}
export interface Blueprint {
    title: string;
    description: string;
    features: string[];
    dependencies: Record<string, string>;
    frameworks: string[];
    architecture: ArchitectureInfo;
    initialPhase: Phase;
    implementationRoadmap: RoadmapItem[];
    colorPalette?: string[];
    pitfalls?: string[];
}
export interface ArchitectureInfo {
    pattern: string;
    components: string[];
    dataFlow: string;
}
export interface Phase {
    name: string;
    description: string;
    files: PhaseFile[];
    lastPhase: boolean;
}
export interface PhaseFile {
    path: string;
    purpose: string;
}
export interface RoadmapItem {
    phase: string;
    description: string;
}
export interface GenerationSession {
    id: string;
    appId: string;
    userId: string;
    status: 'planning' | 'generating' | 'reviewing' | 'completed' | 'failed';
    currentPhase?: string;
    progress: number;
    messages: GenerationMessage[];
    blueprint?: Blueprint;
    files: GeneratedFile[];
    errors?: GenerationError[];
    createdAt: Date;
    updatedAt: Date;
}
export interface GenerationMessage {
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface GenerationError {
    id: string;
    type: 'generation' | 'compilation' | 'deployment';
    message: string;
    stack?: string;
    timestamp: Date;
}
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cerebras';
export interface AIProviderConfig {
    provider: AIProvider;
    model: string;
    apiKey: string;
    baseURL?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface AIGenerationRequest {
    prompt: string;
    context?: string;
    provider?: AIProvider;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface AIGenerationResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed: number;
    responseTime: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface RealtimeUpdate {
    type: 'generation_progress' | 'file_update' | 'error' | 'completion';
    sessionId: string;
    payload: {
        message?: string;
        progress?: number;
        file?: GeneratedFile;
        error?: GenerationError;
    };
    timestamp: Date;
}
export interface Template {
    id: string;
    name: string;
    description: string;
    framework: string;
    features: string[];
    dependencies: Record<string, string>;
    files: TemplateFile[];
    previewUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TemplateFile {
    path: string;
    content: string;
    type: 'file' | 'directory';
}
export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    customClaims?: Record<string, any>;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterCredentials {
    email: string;
    password: string;
    name?: string;
}
export interface FileUpload {
    file: File;
    path: string;
    metadata?: Record<string, any>;
}
export interface StoredFile {
    path: string;
    url: string;
    size: number;
    contentType: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map