export interface AuthUser {
    uid: string;
    email: string | undefined;
    emailVerified: boolean;
    role?: string;
    customClaims?: Record<string, any>;
}
declare module 'hono' {
    interface ContextVariableMap {
        user: AuthUser;
    }
}
export declare const authMiddleware: import("hono").MiddlewareHandler<any, string, {}>;
export declare const optionalAuthMiddleware: import("hono").MiddlewareHandler<any, string, {}>;
export declare const adminMiddleware: import("hono").MiddlewareHandler<any, string, {}>;
//# sourceMappingURL=auth.d.ts.map