import { BaseService } from './BaseService';
import { User, UserPreferences } from '../types/api';
/**
 * UserManagementService handles all user-related operations following development rules
 * Extends BaseService for standardized patterns
 */
export declare class UserManagementService extends BaseService {
    /**
     * Create a new user account with proper validation and error handling
     */
    createUser(userData: unknown): Promise<User>;
    /**
     * Find user by ID with proper error handling
     */
    findUserById(userId: string): Promise<User>;
    /**
     * Find user by email (internal method)
     */
    private findUserByEmail;
    /**
     * Update user profile with validation
     */
    updateUser(userId: string, updateData: unknown, requestingUserId: string, requestingUserRole?: string): Promise<User>;
    /**
     * Delete user with proper authorization
     */
    deleteUser(userId: string, requestingUserId: string, requestingUserRole?: string): Promise<void>;
    /**
     * Get user preferences with validation
     */
    getUserPreferences(userId: string, requestingUserId: string): Promise<UserPreferences>;
    /**
     * Update user preferences with validation
     */
    updateUserPreferences(userId: string, preferencesData: unknown, requestingUserId: string): Promise<UserPreferences>;
    /**
     * Get paginated list of users (admin only)
     */
    getUsers(page?: number, limit?: number, requestingUserRole?: string): Promise<{
        users: User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
//# sourceMappingURL=UserManagementService.d.ts.map