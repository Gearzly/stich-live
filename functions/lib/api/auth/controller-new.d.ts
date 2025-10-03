import { Context } from 'hono';
import { BaseService } from '../../services/BaseService';
/**
 * AuthenticationService following development rules
 * Extends BaseService for standardized patterns
 */
export declare class AuthenticationService extends BaseService {
    /**
     * Register a new user with Firebase Auth
     */
    register(userData: unknown): Promise<{
        uid: string;
    }>;
    /**
     * Validate login credentials (Firebase handles actual authentication client-side)
     */
    validateLogin(loginData: unknown): Promise<{
        message: string;
    }>;
    /**
     * Refresh an ID token
     */
    refreshToken(tokenData: unknown): Promise<{
        uid: string;
    }>;
    /**
     * Get user profile from Firebase Auth
     */
    getProfile(uid: string): Promise<any>;
    /**
     * Update user profile in Firebase Auth
     */
    updateProfile(uid: string, updateData: {
        displayName?: string;
        email?: string;
    }): Promise<{
        message: string;
    }>;
    /**
     * Logout user by revoking refresh tokens
     */
    logout(uid: string): Promise<{
        message: string;
    }>;
}
/**
 * AuthController following development rules
 * Uses dependency injection pattern with AuthenticationService
 */
export declare class AuthController {
    private authService;
    constructor();
    register(c: Context): Promise<Response>;
    login(c: Context): Promise<Response>;
    refreshToken(c: Context): Promise<Response>;
    getProfile(c: Context): Promise<Response>;
    updateProfile(c: Context): Promise<Response>;
    logout(c: Context): Promise<Response>;
    private handleControllerError;
}
//# sourceMappingURL=controller-new.d.ts.map