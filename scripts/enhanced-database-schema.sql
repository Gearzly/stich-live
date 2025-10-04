-- Stich Production Enhanced Database Schema
-- This schema provides comprehensive user management, app tracking, and analytics

-- =============================================
-- USERS AND AUTHENTICATION
-- =============================================

-- Enhanced Users table with additional profile information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    location VARCHAR(100),
    company VARCHAR(100),
    github_username VARCHAR(100),
    twitter_username VARCHAR(100),
    
    -- Authentication
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_hash VARCHAR(255), -- For email/password auth
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
    subscription_expires_at TIMESTAMP,
    
    -- Usage tracking
    total_apps_created INTEGER DEFAULT 0,
    total_generations INTEGER DEFAULT 0,
    monthly_generations INTEGER DEFAULT 0,
    monthly_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- User sessions for authentication tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth providers for social authentication
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- github, google, discord
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    scope TEXT,
    token_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- =============================================
-- APPLICATIONS AND PROJECTS
-- =============================================

-- Enhanced Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[], -- Array of tags for categorization
    
    -- Technical details
    framework VARCHAR(100), -- react, vue, angular, next, etc.
    language VARCHAR(50), -- typescript, javascript, python, etc.
    build_tool VARCHAR(50), -- vite, webpack, create-react-app, etc.
    deployment_platform VARCHAR(50), -- vercel, netlify, aws, etc.
    
    -- Generation details
    prompt TEXT NOT NULL, -- Original user prompt
    ai_provider VARCHAR(50), -- openai, anthropic, google, cerebras
    ai_model VARCHAR(100), -- gpt-4, claude-3, etc.
    generation_mode VARCHAR(20) DEFAULT 'smart', -- deterministic, smart
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft', -- draft, generating, completed, failed, deployed
    visibility VARCHAR(20) DEFAULT 'private', -- private, public, unlisted
    is_template BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- File information
    total_files INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,
    file_size_bytes BIGINT DEFAULT 0,
    
    -- Deployment
    deployed_url TEXT,
    github_repo_url TEXT,
    deployment_status VARCHAR(20), -- pending, deployed, failed
    last_deployed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Application files with versioning
CREATE TABLE application_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
    -- File information
    name VARCHAR(500) NOT NULL,
    path TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- file, folder
    content TEXT,
    language VARCHAR(50),
    
    -- Metadata
    size_bytes INTEGER DEFAULT 0,
    line_count INTEGER DEFAULT 0,
    parent_id UUID REFERENCES application_files(id),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application likes/favorites
CREATE TABLE application_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, application_id)
);

-- =============================================
-- CHAT AND CONVERSATIONS
-- =============================================

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Session details
    title VARCHAR(255),
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    agent_mode VARCHAR(20) DEFAULT 'smart',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, archived
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    -- Message details
    type VARCHAR(20) NOT NULL, -- user, ai, system
    content TEXT NOT NULL,
    
    -- AI details (for AI messages)
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    tokens_used INTEGER,
    cost DECIMAL(8,4),
    
    -- Generation details
    generation_phase VARCHAR(50), -- planning, coding, testing, deployment
    is_streaming BOOLEAN DEFAULT FALSE,
    parent_message_id UUID REFERENCES chat_messages(id),
    
    -- Metadata
    metadata JSONB,
    attachments JSONB, -- File attachments
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP
);

-- =============================================
-- GENERATION AND AI TRACKING
-- =============================================

-- AI Generation jobs with detailed tracking
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    
    -- Job details
    type VARCHAR(50) NOT NULL, -- full_app, component, blueprint, enhancement
    prompt TEXT NOT NULL,
    
    -- AI configuration
    ai_provider VARCHAR(50) NOT NULL,
    ai_model VARCHAR(100) NOT NULL,
    agent_mode VARCHAR(20) DEFAULT 'smart',
    max_tokens INTEGER,
    temperature DECIMAL(3,2),
    
    -- Status and progress
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    current_phase VARCHAR(50), -- planning, designing, coding, testing, reviewing
    current_step VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    
    -- Results
    files_generated INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generation phases for detailed progress tracking
CREATE TABLE generation_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    
    -- Phase details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    progress_percentage INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- API KEYS AND INTEGRATIONS
-- =============================================

-- User API keys (BYOK - Bring Your Own Key)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key details
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, google, cerebras
    name VARCHAR(255) NOT NULL,
    encrypted_key TEXT NOT NULL, -- Encrypted API key
    key_preview VARCHAR(20), -- First few characters for display
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_valid BOOLEAN DEFAULT FALSE,
    last_validated_at TIMESTAMP,
    validation_error TEXT,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitHub integrations
CREATE TABLE github_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- GitHub details
    github_user_id INTEGER NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted
    refresh_token TEXT,
    scope TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    
    -- Repositories
    repositories_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, github_user_id)
);

-- Exported repositories tracking
CREATE TABLE exported_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    github_integration_id UUID REFERENCES github_integrations(id) ON DELETE SET NULL,
    
    -- Repository details
    github_repo_id INTEGER NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_full_name VARCHAR(500) NOT NULL,
    repo_url TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Export details
    files_exported INTEGER DEFAULT 0,
    commit_sha VARCHAR(40),
    branch_name VARCHAR(255) DEFAULT 'main',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ANALYTICS AND TRACKING
-- =============================================

-- User activity tracking
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Activity details
    action VARCHAR(100) NOT NULL, -- login, logout, create_app, generate_code, etc.
    entity_type VARCHAR(50), -- application, chat_session, api_key, etc.
    entity_id UUID,
    
    -- Context
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage analytics by day
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    
    -- User metrics
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    
    -- Application metrics
    apps_created INTEGER DEFAULT 0,
    apps_deployed INTEGER DEFAULT 0,
    
    -- Generation metrics
    total_generations INTEGER DEFAULT 0,
    successful_generations INTEGER DEFAULT 0,
    failed_generations INTEGER DEFAULT 0,
    
    -- AI usage
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Provider breakdown
    openai_usage INTEGER DEFAULT 0,
    anthropic_usage INTEGER DEFAULT 0,
    google_usage INTEGER DEFAULT 0,
    cerebras_usage INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(date)
);

-- Feature usage tracking
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Feature details
    feature_name VARCHAR(100) NOT NULL, -- blueprint_visualization, github_export, etc.
    action VARCHAR(100) NOT NULL, -- view, create, export, etc.
    
    -- Context
    metadata JSONB,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TEMPLATES AND SHARING
-- =============================================

-- Application templates
CREATE TABLE app_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Template details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- frontend, fullstack, backend, mobile, etc.
    tags TEXT[],
    
    -- Technical details
    framework VARCHAR(100),
    language VARCHAR(50),
    difficulty VARCHAR(20), -- beginner, intermediate, advanced
    
    -- Template data
    prompt_template TEXT NOT NULL,
    file_structure JSONB,
    configuration JSONB,
    
    -- Status
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    usage_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SYSTEM CONFIGURATION
-- =============================================

-- System settings and configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether setting is visible to clients
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Application indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_visibility ON applications(visibility);
CREATE INDEX idx_applications_framework ON applications(framework);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_tags ON applications USING GIN(tags);

-- Chat indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_type ON chat_messages(type);

-- Generation indexes
CREATE INDEX idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_ai_provider ON generation_jobs(ai_provider);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at);

-- Analytics indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_action ON user_activities(action);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON generation_jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- SAMPLE DATA AND INITIAL SETUP
-- =============================================

-- Insert initial system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('app_name', '"Stich Production"', 'Application name', true),
('app_version', '"1.0.0"', 'Current application version', true),
('maintenance_mode', 'false', 'Whether the app is in maintenance mode', false),
('max_free_generations', '10', 'Maximum generations for free users per month', false),
('max_pro_generations', '1000', 'Maximum generations for pro users per month', false),
('supported_ai_providers', '["openai", "anthropic", "google", "cerebras"]', 'List of supported AI providers', true),
('default_ai_provider', '"openai"', 'Default AI provider for new users', true),
('github_oauth_enabled', 'true', 'Whether GitHub OAuth is enabled', true),
('google_oauth_enabled', 'true', 'Whether Google OAuth is enabled', true);

-- Insert sample app templates
INSERT INTO app_templates (name, description, category, framework, language, difficulty, prompt_template, file_structure, is_public, is_featured) VALUES
(
    'React Dashboard',
    'A modern React dashboard with charts and data visualization',
    'frontend',
    'react',
    'typescript',
    'intermediate',
    'Create a React dashboard application with {features} using TypeScript and modern UI components',
    '{"src": {"components": [], "pages": [], "hooks": [], "utils": []}}',
    true,
    true
),
(
    'Next.js Blog',
    'A full-stack blog application built with Next.js',
    'fullstack',
    'nextjs',
    'typescript',
    'beginner',
    'Build a blog application using Next.js with {features} and modern styling',
    '{"pages": [], "components": [], "styles": [], "lib": []}',
    true,
    true
),
(
    'Express API',
    'A RESTful API built with Express.js and TypeScript',
    'backend',
    'express',
    'typescript',
    'intermediate',
    'Create an Express.js API with {endpoints} using TypeScript and best practices',
    '{"src": {"routes": [], "controllers": [], "middleware": [], "models": []}}',
    true,
    false
);

-- Create initial admin user (password should be hashed in real implementation)
INSERT INTO users (email, username, display_name, is_active, subscription_tier, email_verified) VALUES
('admin@stich.production', 'admin', 'System Administrator', true, 'enterprise', true);