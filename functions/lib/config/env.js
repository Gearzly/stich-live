"use strict";
/**
 * Environment configuration and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODELS = exports.AI_PROVIDERS = exports.env = void 0;
/**
 * Get environment variable with validation
 */
function getEnvVar(name, required = true) {
    const value = process.env[name];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || '';
}
/**
 * Application environment configuration
 */
exports.env = {
    openai: {
        apiKey: getEnvVar('OPENAI_API_KEY'),
    },
    anthropic: {
        apiKey: getEnvVar('ANTHROPIC_API_KEY'),
    },
    google: {
        apiKey: getEnvVar('GOOGLE_AI_API_KEY'),
    },
    cerebras: {
        apiKey: getEnvVar('CEREBRAS_API_KEY', false), // Optional
    },
    firebase: {
        projectId: getEnvVar('GCLOUD_PROJECT') || getEnvVar('FIREBASE_PROJECT_ID', false),
    },
};
/**
 * AI Provider configuration
 */
exports.AI_PROVIDERS = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    CEREBRAS: 'cerebras',
};
/**
 * Default AI models for each provider
 */
exports.DEFAULT_MODELS = {
    [exports.AI_PROVIDERS.OPENAI]: 'gpt-4o',
    [exports.AI_PROVIDERS.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
    [exports.AI_PROVIDERS.GOOGLE]: 'gemini-1.5-pro',
    [exports.AI_PROVIDERS.CEREBRAS]: 'llama3.1-70b',
};
//# sourceMappingURL=env.js.map