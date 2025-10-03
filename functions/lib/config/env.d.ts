export declare const config: {
    readonly NODE_ENV: string;
    readonly OPENAI_API_KEY: string | undefined;
    readonly ANTHROPIC_API_KEY: string | undefined;
    readonly GOOGLE_AI_API_KEY: string | undefined;
    readonly CEREBRAS_API_KEY: string | undefined;
    readonly RATE_LIMIT_WINDOW_MS: number;
    readonly RATE_LIMIT_MAX_REQUESTS: number;
    readonly MAX_TOKENS_PER_REQUEST: number;
    readonly MAX_FILES_PER_APP: number;
    readonly MAX_FILE_SIZE_MB: number;
    readonly ALLOWED_FILE_TYPES: string[];
    readonly FRONTEND_URLS: readonly ["http://localhost:5173", "http://localhost:4173", "https://stich-live.vercel.app", ...string[]];
    readonly FIRESTORE_EMULATOR_HOST: string | undefined;
    readonly LOG_LEVEL: string;
};
export declare const isProduction: () => boolean;
export declare const isDevelopment: () => boolean;
export declare const isEmulated: () => boolean;
//# sourceMappingURL=env.d.ts.map