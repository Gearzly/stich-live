export const config = {
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    // AI Provider API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    // AI Generation Limits
    MAX_TOKENS_PER_REQUEST: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '4000'),
    MAX_FILES_PER_APP: parseInt(process.env.MAX_FILES_PER_APP || '50'),
    // File Upload Limits
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
    ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'js,ts,jsx,tsx,css,html,json,md').split(','),
    // CORS Origins
    FRONTEND_URLS: [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://stich-live.vercel.app',
        ...(process.env.ADDITIONAL_ORIGINS?.split(',') || []),
    ],
    // Database
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
// Validation helpers
export const isProduction = () => config.NODE_ENV === 'production';
export const isDevelopment = () => config.NODE_ENV === 'development';
export const isEmulated = () => !!config.FIRESTORE_EMULATOR_HOST;
//# sourceMappingURL=env.js.map