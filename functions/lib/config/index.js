"use strict";
/**
 * Firebase Functions Configuration
 * Central configuration management for the Stich backend
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectId = exports.getRegion = exports.isDevelopment = exports.isProduction = exports.messaging = exports.storage = exports.auth = exports.db = exports.collections = exports.validateConfig = exports.config = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
// Environment configuration
exports.config = {
    // Firebase
    projectId: process.env.GCLOUD_PROJECT || 'stich-production',
    // API Keys
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID,
        maxTokens: 4000,
        model: 'gpt-4o'
    },
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        maxTokens: 4000,
        model: 'claude-3-5-sonnet-20241022'
    },
    google: {
        apiKey: process.env.GOOGLE_AI_API_KEY,
        model: 'gemini-1.5-pro'
    },
    cerebras: {
        apiKey: process.env.CEREBRAS_API_KEY,
        baseUrl: 'https://api.cerebras.ai/v1',
        model: 'llama3.1-70b'
    },
    // Security
    jwt: {
        secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
        expiresIn: '24h',
        refreshExpiresIn: '7d'
    },
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
        skipSuccessfulRequests: false
    },
    // File upload limits
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 20,
        allowedExtensions: [
            '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
            '.css', '.scss', '.sass', '.less',
            '.html', '.htm', '.xml',
            '.json', '.yaml', '.yml', '.toml',
            '.md', '.mdx', '.txt',
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
            '.zip', '.tar', '.gz'
        ]
    },
    // Generation settings
    generation: {
        maxRetries: 3,
        timeoutMs: 300000, // 5 minutes
        queueConcurrency: 5,
        reviewCycles: 3
    },
    // Deployment settings
    deployment: {
        providers: {
            vercel: {
                apiKey: process.env.VERCEL_API_KEY,
                teamId: process.env.VERCEL_TEAM_ID
            },
            netlify: {
                apiKey: process.env.NETLIFY_API_KEY
            },
            firebase: {
                hosting: true
            }
        },
        timeout: 300000 // 5 minutes
    },
    // Analytics
    analytics: {
        retentionDays: 90,
        aggregationInterval: 3600000, // 1 hour
        enableDetailedLogging: process.env.NODE_ENV === 'development'
    },
    // Monitoring
    monitoring: {
        errorReporting: true,
        performanceTracking: true,
        healthCheckInterval: 300000, // 5 minutes
        alertThresholds: {
            errorRate: 0.05, // 5%
            responseTime: 5000 // 5 seconds
        }
    },
    // CORS settings
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://stich.app', 'https://www.stich.app']
            : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
        credentials: true,
        optionsSuccessStatus: 200
    },
    // WebSocket settings
    websocket: {
        pingInterval: 30000,
        pingTimeout: 5000,
        maxConnections: 1000
    }
};
// Validate required environment variables
const validateConfig = () => {
    const required = [
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'GOOGLE_AI_API_KEY'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        firebase_functions_1.logger.error('Missing required environment variables:', missing);
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    firebase_functions_1.logger.info('Configuration validated successfully');
};
exports.validateConfig = validateConfig;
// Database collections
exports.collections = {
    users: 'users',
    applications: 'applications',
    generations: 'generations',
    deployments: 'deployments',
    analytics: 'analytics',
    subscriptions: 'subscriptions',
    apiKeys: 'apiKeys',
    templates: 'templates',
    feedback: 'feedback',
    notifications: 'notifications'
};
// Firebase services
exports.db = admin.firestore();
exports.auth = admin.auth();
exports.storage = admin.storage();
exports.messaging = admin.messaging();
// Helper functions
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const getRegion = () => {
    return process.env.FUNCTIONS_REGION || 'us-central1';
};
exports.getRegion = getRegion;
const getProjectId = () => {
    return exports.config.projectId;
};
exports.getProjectId = getProjectId;
// Initialize configuration validation
if (process.env.NODE_ENV !== 'test') {
    (0, exports.validateConfig)();
}
//# sourceMappingURL=index.js.map